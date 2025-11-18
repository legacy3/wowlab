import type * as Dbc from "@packages/innocent-schemas/Dbc";

import { bigIntToHex } from "@packages/innocent-schemas/Item";
import * as Effect from "effect/Effect";
import { Map } from "immutable";

import type { RawItemDBCData } from "./dbc-loader";
import type { ItemDataFlat } from "./types";

interface ItemCache {
  fileData: Map<number, Dbc.FileDataRow>;
  item: Map<number, Dbc.ItemRow>;
  itemSparse: Map<number, Dbc.ItemSparseRow>;
}

const createCache = (data: RawItemDBCData): ItemCache => ({
  fileData: Map(data.fileData.map((row) => [row.ID, row])),
  item: Map(data.item.map((row) => [row.ID, row])),
  itemSparse: Map(data.itemSparse.map((row) => [row.ID, row])),
});

const transformItem = (
  itemId: number,
  cache: ItemCache,
): ItemDataFlat | null => {
  const item = cache.item.get(itemId);
  const itemSparse = cache.itemSparse.get(itemId);

  if (!item || !itemSparse) {
    return null;
  }

  const iconFileData = cache.fileData.get(item.IconFileDataID);
  const iconName = iconFileData
    ? iconFileData.FileName.replace(".blp", "")
    : "inv_misc_questionmark";

  return {
    // Core
    iconName,
    id: itemId,
    name: itemSparse.Display,

    // Classification
    classId: item.ClassID,
    inventoryType: item.InventoryType,
    itemLevel: itemSparse.ItemLevel,
    quality: itemSparse.OverallQualityID,
    subclassId: item.SubclassID,

    // Requirements
    allowableClass: bigIntToHex(itemSparse.AllowableClass),
    allowableRace: bigIntToHex(itemSparse.AllowableRace),
    requiredLevel: itemSparse.RequiredLevel,

    // Description
    description: itemSparse.Description,
  };
};

export const parseItemIds = (input: string, cache: ItemCache): number[] =>
  input === "all"
    ? Array.from(cache.item.keys())
    : input.split(",").map((id) => parseInt(id.trim(), 10));

export const transformItems = (itemIds: number[], rawData: RawItemDBCData) =>
  Effect.gen(function* () {
    const cache = createCache(rawData);

    const results = yield* Effect.forEach(
      itemIds,
      (itemId) =>
        Effect.gen(function* () {
          const result = transformItem(itemId, cache);

          if (result === null) {
            yield* Effect.logDebug(`⚠️  Item ${itemId} not found, skipping`);
            return null;
          }

          return result;
        }),
      { concurrency: "unbounded" },
    );

    return results.filter((item): item is ItemDataFlat => item !== null);
  });
