import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";

import type { SpellDataFlat } from "./types";

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

export const clearAllSpells = (supabase: SupabaseClient) =>
  Effect.gen(function* () {
    yield* Effect.logWarning("Clearing all existing spell data...");

    yield* executeSupabaseQuery(
      "clear spell_data",
      async () => await supabase.from("spell_data").delete().neq("id", 0),
    );

    yield* Effect.logInfo("✓ Cleared all spell data");
  });

export const insertSpellBatch = (
  supabase: SupabaseClient,
  spells: SpellDataFlat[],
) =>
  Effect.gen(function* () {
    const spellIds = spells.map((s) => s.id).join(", ");
    yield* Effect.logDebug(`Inserting batch: [${spellIds}]`);

    yield* executeSupabaseQuery(
      "upsert spell_data batch",
      async () => await supabase.from("spell_data").upsert(spells),
    );

    yield* Effect.logDebug(`✓ Inserted ${spells.length} spells`);

    return spells.length;
  });

export const insertSpellsInBatches = (
  supabase: SupabaseClient,
  spells: SpellDataFlat[],
  batchSize: number,
) =>
  Effect.gen(function* () {
    const batches: SpellDataFlat[][] = [];
    for (let i = 0; i < spells.length; i += batchSize) {
      batches.push(spells.slice(i, i + batchSize));
    }

    const totalBatches = batches.length;
    const completedRef = yield* Ref.make(0);

    const counts = yield* Effect.forEach(
      batches,
      (batch) =>
        Effect.gen(function* () {
          const count = yield* insertSpellBatch(supabase, batch);
          const completed = yield* Ref.updateAndGet(completedRef, (n) => n + 1);
          const totalProcessed = completed * batchSize;
          const percentage = ((completed / totalBatches) * 100).toFixed(1);

          yield* Effect.logInfo(
            `Progress: ${completed}/${totalBatches} batches (${percentage}%) - ${totalProcessed}/${spells.length} spells`,
          );

          return count;
        }),
      { concurrency: 5 },
    );

    return counts.reduce((sum, count) => sum + count, 0);
  });
