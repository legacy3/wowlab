import { Item } from "@wowlab/core/Schemas";
import { createCache, transformItem } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";

import { createDataUpdateCommand } from "../shared/data-updater.js";
import { ITEM_TABLES } from "../shared/dbc-config.js";
import { executeSupabaseQuery } from "../shared/supabase.js";

export const updateItemDataCommand = createDataUpdateCommand({
  clearData: (supabase) =>
    Effect.gen(function* () {
      yield* Effect.logWarning("Clearing all existing item data...");
      yield* executeSupabaseQuery(
        "clear item_data",
        async () => await supabase.from("item_data").delete().neq("id", -1),
      );
      yield* Effect.logInfo("✓ Cleared all item data");
    }),
  createCache: (rawData) =>
    createCache({
      ...(rawData as any),
      spell: [],
      spellCastTimes: [],
      spellCategories: [],
      spellCategory: [],
      spellClassOptions: [],
      spellCooldowns: [],
      spellDuration: [],
      spellEffect: [],
      spellMisc: [],
      spellName: [],
      spellPower: [],
      spellRadius: [],
      spellRange: [],
    }),
  entityName: "items",
  getAllIds: (cache) => Array.from(cache.item.keys()),
  insertBatch: (supabase, batch: Item.ItemDataFlat[]) =>
    Effect.gen(function* () {
      yield* executeSupabaseQuery(
        "upsert item_data batch",
        async () => await supabase.from("item_data").upsert(batch),
      );

      return batch.length;
    }),
  name: "update-item-data",
  tables: ITEM_TABLES,
  transform: (id, cache) =>
    transformItem(id, cache).pipe(
      Effect.catchTag("ItemNotFound", () => Effect.succeed(null)),
    ),
});
