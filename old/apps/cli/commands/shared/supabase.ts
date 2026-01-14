import { createClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

export class MissingEnvironmentError extends Error {
  readonly _tag = "MissingEnvironmentError";
  constructor(public readonly variables: string[]) {
    super(`Missing environment variables: ${variables.join(", ")}`);
  }
}

export class SupabaseError extends Error {
  readonly _tag = "SupabaseError";
  constructor(public readonly details: { message: string; operation: string }) {
    super(`Supabase error during ${details.operation}: ${details.message}`);
  }
}

export const getSupabaseCredentials = () =>
  Effect.gen(function* () {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing: string[] = [];
    if (!url) {
      missing.push("SUPABASE_URL");
    }

    if (!serviceKey) {
      missing.push("SUPABASE_SERVICE_ROLE_KEY");
    }

    if (missing.length > 0) {
      return yield* Effect.fail(new MissingEnvironmentError(missing));
    }

    return { serviceKey: serviceKey!, url: url! };
  });

export const createSupabaseClient = () =>
  Effect.gen(function* () {
    const { serviceKey, url } = yield* getSupabaseCredentials();
    yield* Effect.logInfo(`Connected to Supabase at ${url}`);
    return createClient(url, serviceKey);
  });

export const executeSupabaseQuery = <T = unknown>(
  operation: string,
  query: () => Promise<{ data: T | null; error: { message: string } | null }>,
) =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new SupabaseError({ message: String(cause), operation }),
      try: query,
    });

    if (result.error) {
      return yield* Effect.fail(
        new SupabaseError({ message: result.error.message, operation }),
      );
    }

    return result.data;
  });

export const insertInBatches = <T>(
  items: T[],
  batchSize: number,
  insertBatch: (batch: T[]) => Effect.Effect<number, SupabaseError>,
  entityName: string,
) =>
  Effect.gen(function* () {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const totalBatches = batches.length;
    const completedRef = yield* Ref.make(0);

    const counts = yield* Effect.forEach(
      batches,
      (batch) =>
        Effect.gen(function* () {
          const count = yield* insertBatch(batch);
          const completed = yield* Ref.updateAndGet(completedRef, (n) => n + 1);
          const totalProcessed = Math.min(completed * batchSize, items.length);
          const percentage = ((completed / totalBatches) * 100).toFixed(1);

          yield* Effect.logInfo(
            `Progress: ${completed}/${totalBatches} batches (${percentage}%) - ${totalProcessed}/${items.length} ${entityName}`,
          );

          return count;
        }),
      { concurrency: 5 },
    );

    return counts.reduce((sum, count) => sum + count, 0);
  });
