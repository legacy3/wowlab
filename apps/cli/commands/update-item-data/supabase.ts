import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

import type { ItemDataFlat } from "./types";

import { MissingEnvironmentError, SupabaseError } from "./errors";

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
      return yield* Effect.fail(
        new MissingEnvironmentError({ variables: missing }),
      );
    }

    return { serviceKey: serviceKey!, url: url! };
  });

export const createSupabaseClient = () =>
  Effect.gen(function* () {
    const { serviceKey, url } = yield* getSupabaseCredentials();
    yield* Effect.logInfo(`Connected to Supabase at ${url}`);
    return createClient(url, serviceKey);
  });

const executeSupabaseQuery = <T = unknown>(
  operation: string,
  query: () => Promise<{ data: T | null; error: { message: string } | null }>,
) =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      catch: (cause) =>
        new SupabaseError({ errorMessage: String(cause), operation }),
      try: query,
    });

    if (result.error) {
      return yield* Effect.fail(
        new SupabaseError({
          errorMessage: result.error.message,
          operation,
        }),
      );
    }

    return result.data;
  });

export const clearAllItems = (supabase: SupabaseClient) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Clearing all existing item data...");

    yield* executeSupabaseQuery(
      "delete all items",
      async () => await supabase.from("item_data").delete().neq("id", -1),
    );

    yield* Effect.logInfo("✓ All item data cleared");
  });

export const insertItemBatch = (
  supabase: SupabaseClient,
  items: ItemDataFlat[],
) =>
  Effect.gen(function* () {
    const itemIds = items.map((i) => i.id).join(", ");
    yield* Effect.logDebug(`Inserting batch: [${itemIds}]`);

    yield* executeSupabaseQuery(
      "upsert item_data batch",
      async () => await supabase.from("item_data").upsert(items),
    );

    yield* Effect.logDebug(`✓ Inserted ${items.length} items`);

    return items.length;
  });

export const insertItemsInBatches = (
  supabase: SupabaseClient,
  items: ItemDataFlat[],
  batchSize: number,
) =>
  Effect.gen(function* () {
    const batches: ItemDataFlat[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    const totalBatches = batches.length;
    const completedRef = yield* Ref.make(0);

    const counts = yield* Effect.forEach(
      batches,
      (batch) =>
        Effect.gen(function* () {
          const count = yield* insertItemBatch(supabase, batch);
          const completed = yield* Ref.updateAndGet(completedRef, (n) => n + 1);
          const totalProcessed = completed * batchSize;
          const percentage = ((completed / totalBatches) * 100).toFixed(1);

          yield* Effect.logInfo(
            `Progress: ${completed}/${totalBatches} batches (${percentage}%) - ${totalProcessed}/${items.length} items`,
          );

          return count;
        }),
      { concurrency: 5 },
    );

    return counts.reduce((sum, count) => sum + count, 0);
  });
