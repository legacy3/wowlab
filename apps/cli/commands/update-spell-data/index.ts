import * as Effect from "effect/Effect";
import { createCache } from "@wowlab/services/Data";
import { transformSpell } from "./transform.js";
import { executeSupabaseQuery } from "../shared/supabase.js";
import { createDataUpdateCommand } from "../shared/data-updater.js";
import { SPELL_TABLES } from "../shared/dbc-config.js";
import { SpellDataFlat } from "./types.js";

export const updateSpellDataCommand = createDataUpdateCommand({
  name: "update-spell-data",
  entityName: "spells",
  tables: SPELL_TABLES,
  createCache: (rawData) =>
    createCache({
      ...(rawData as any),
      item: [],
      itemEffect: [],
      itemSparse: [],
    }),
  getAllIds: (cache) => Array.from(cache.spellMisc.keys()),
  transform: (id, cache) =>
    transformSpell(id, cache).pipe(
      Effect.catchTag("SpellNotFoundError", () => Effect.succeed(null)),
    ),
  clearData: (supabase) =>
    Effect.gen(function* () {
      yield* Effect.logWarning("Clearing all existing spell data...");
      yield* executeSupabaseQuery(
        "clear spell_data",
        async () => await supabase.from("spell_data").delete().neq("id", 0),
      );
      yield* Effect.logInfo("✓ Cleared all spell data");
    }),
  insertBatch: (supabase, batch: SpellDataFlat[]) =>
    Effect.gen(function* () {
      yield* executeSupabaseQuery(
        "upsert spell_data batch",
        async () => await supabase.from("spell_data").upsert(batch),
      );
      return batch.length;
    }),
});
