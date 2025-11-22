import { Spell } from "@wowlab/core/Schemas";
import { createCache, transformSpell } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";

import { createDataUpdateCommand } from "../shared/data-updater.js";
import { SPELL_TABLES } from "../shared/dbc-config.js";
import { executeSupabaseQuery } from "../shared/supabase.js";

export const updateSpellDataCommand = createDataUpdateCommand({
  clearData: (supabase) =>
    Effect.gen(function* () {
      yield* Effect.logWarning("Clearing all existing spell data...");
      yield* executeSupabaseQuery(
        "clear spell_data",
        async () => await supabase.from("spell_data").delete().neq("id", 0),
      );
      yield* Effect.logInfo("✓ Cleared all spell data");
    }),
  createCache: (rawData) =>
    createCache({
      ...(rawData as any),
      item: [],
      itemEffect: [],
      itemSparse: [],
      itemXItemEffect: [],
    }),
  entityName: "spells",
  getAllIds: (cache) => Array.from(cache.spellMisc.keys()),
  insertBatch: (supabase, batch: Spell.SpellDataFlat[]) =>
    Effect.gen(function* () {
      yield* executeSupabaseQuery(
        "upsert spell_data batch",
        async () => await supabase.from("spell_data").upsert(batch),
      );

      return batch.length;
    }),
  name: "update-spell-data",
  tables: SPELL_TABLES,
  transform: (id, cache) =>
    transformSpell(id, cache).pipe(
      Effect.catchTag("SpellInfoNotFound", () => Effect.succeed(null)),
    ),
});
