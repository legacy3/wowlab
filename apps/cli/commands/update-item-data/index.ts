import * as Effect from "effect/Effect";
import { createCache } from "@wowlab/services/Data";
import { transformItem } from "./transform.js";
import { executeSupabaseQuery } from "../shared/supabase.js";
import { createDataUpdateCommand } from "../shared/data-updater.js";
import { ITEM_TABLES } from "../shared/dbc-config.js";
import { ItemDataFlat } from "./types.js";

export const updateItemDataCommand = createDataUpdateCommand({
  name: "update-item-data",
  entityName: "items",
  tables: ITEM_TABLES,
  createCache: (rawData) =>
    createCache({
      ...(rawData as any),
      spell: [],
      spellEffect: [],
      spellMisc: [],
      spellName: [],
      spellCastTimes: [],
      spellCooldowns: [],
      spellDuration: [],
      spellRadius: [],
      spellRange: [],
      spellCategories: [],
      spellCategory: [],
    }),
  getAllIds: (cache) => Array.from(cache.item.keys()),
  transform: (id, cache) =>
    transformItem(id, cache).pipe(
      Effect.catchTag("ItemNotFoundError", () => Effect.succeed(null)),
    ),
  clearData: (supabase) =>
    Effect.gen(function* () {
      yield* Effect.logWarning("Clearing all existing item data...");
      yield* executeSupabaseQuery(
        "clear item_data",
        async () => await supabase.from("item_data").delete().neq("id", -1),
      );
      yield* Effect.logInfo("✓ Cleared all item data");
    }),
  insertBatch: (supabase, batch: ItemDataFlat[]) =>
    Effect.gen(function* () {
      yield* executeSupabaseQuery(
        "upsert item_data batch",
        async () => await supabase.from("item_data").upsert(batch),
      );

      return batch.length;
    }),
});
