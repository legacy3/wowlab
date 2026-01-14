import type * as ManagedRuntime from "effect/ManagedRuntime";

import * as Effect from "effect/Effect";

interface BatcherOptions<T, R> {
  readonly runtime: ManagedRuntime.ManagedRuntime<R, unknown>;
  readonly transform: (id: number) => Effect.Effect<T, unknown, R>;
  readonly type: string;
}

type BatchResult<T> =
  | { _tag: "success"; id: number; value: T }
  | { _tag: "failure"; id: number; error: unknown };

type PendingRequest<T> = {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

export class EntityBatcher<T, R> {
  private queue = new Map<number, PendingRequest<T>[]>();
  private scheduled = false;

  constructor(private readonly options: BatcherOptions<T, R>) {
    //
  }

  load(id: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const pending = this.queue.get(id) ?? [];
      pending.push({ reject, resolve });

      this.queue.set(id, pending);
      this.scheduleFlush();
    });
  }

  private async flushQueue() {
    this.scheduled = false;
    const pending = Array.from(this.queue.entries());
    this.queue.clear();

    if (pending.length === 0) {
      return;
    }

    try {
      const results = await this.runBatch(pending.map(([id]) => id));
      const byId = new Map(results.map((r) => [r.id, r]));

      for (const [id, requests] of pending) {
        const result = byId.get(id);

        if (!result) {
          const err = new Error(
            `[${this.options.type}] Missing result for ID ${id}`,
          );
          requests.forEach((r) => r.reject(err));
        } else if (result._tag === "success") {
          requests.forEach((r) => r.resolve(result.value));
        } else {
          requests.forEach((r) => r.reject(result.error));
        }
      }
    } catch (error) {
      pending.forEach(([, requests]) =>
        requests.forEach((r) => r.reject(error)),
      );
    }
  }

  private runBatch(ids: number[]): Promise<BatchResult<T>[]> {
    const effect = Effect.forEach(
      ids,
      (id) =>
        this.options.transform(id).pipe(
          Effect.match({
            onFailure: (error) => ({ _tag: "failure" as const, error, id }),
            onSuccess: (value) => ({ _tag: "success" as const, id, value }),
          }),
        ),
      { batching: true, concurrency: "unbounded" },
    );

    return this.options.runtime.runPromise(effect);
  }

  private scheduleFlush() {
    if (this.scheduled) {
      return;
    }

    this.scheduled = true;
    queueMicrotask(() => this.flushQueue());
  }
}
