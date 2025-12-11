import * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";

type PendingRequest<T> = {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

type BatchResult<T> =
  | { _tag: "success"; id: number; value: T }
  | { _tag: "failure"; id: number; error: unknown };

interface EntityBatcherOptions<T> {
  readonly type: string;
  readonly transform: (id: number) => Effect.Effect<T, unknown, unknown>;
  readonly createLayer: () => Layer.Layer<any, any, any>;
}

export class EntityBatcher<T> {
  private scheduled = false;

  private queue = new Map<number, PendingRequest<T>[]>();

  constructor(private readonly options: EntityBatcherOptions<T>) {
    //
  }

  load(id: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const current = this.queue.get(id) ?? [];
      current.push({ resolve, reject });

      this.queue.set(id, current);
      this.scheduleFlush();
    });
  }

  private scheduleFlush() {
    if (this.scheduled) {
      return;
    }

    this.scheduled = true;

    queueMicrotask(() => this.flushQueue());
  }

  private async flushQueue() {
    this.scheduled = false;
    const entries = Array.from(this.queue.entries());
    this.queue.clear();

    const ids = entries.map(([id]) => id);
    if (ids.length === 0) {
      return;
    }

    try {
      const results = await this.runBatch(ids);
      const resultMap = new Map(results.map((result) => [result.id, result]));

      for (const [id, requests] of entries) {
        const result = resultMap.get(id);

        if (!result) {
          const error = new Error(
            `[${this.options.type}] Missing result for ID ${id}`,
          );

          requests.forEach((request) => request.reject(error));

          continue;
        }

        if (result._tag === "success") {
          requests.forEach((request) => request.resolve(result.value));
        } else {
          requests.forEach((request) => request.reject(result.error));
        }
      }
    } catch (error) {
      for (const requests of entries.map(([, value]) => value)) {
        requests.forEach((request) => request.reject(error));
      }
    }
  }

  private runBatch(ids: number[]): Promise<BatchResult<T>[]> {
    const effect = Effect.forEach(
      ids,
      (entityId) =>
        this.options.transform(entityId).pipe(
          Effect.match({
            onFailure: (error) => ({
              _tag: "failure" as const,
              error,
              id: entityId,
            }),
            onSuccess: (value) => ({
              _tag: "success" as const,
              id: entityId,
              value,
            }),
          }),
        ),
      { batching: true, concurrency: "unbounded" },
    ).pipe(Effect.provide(this.options.createLayer())) as Effect.Effect<
      BatchResult<T>[]
    >;

    return Effect.runPromise(effect);
  }
}
