import * as Effect from "effect/Effect";
import * as Data from "effect/Data";
import { DbcCache } from "@wowlab/services/Data";

export class ItemNotFoundError extends Data.TaggedError("ItemNotFoundError")<{
  itemId: number;
}> {}

export interface ItemDataFlat {
  id: number;
  name: string;
  quality: number;
  inventoryType: number;
  itemLevel: number;
  requiredLevel: number;
  classId: number;
  subclassId: number;
}

export const transformItem = (
  itemId: number,
  cache: DbcCache,
): Effect.Effect<ItemDataFlat, ItemNotFoundError> =>
  Effect.gen(function* () {
    const item = cache.item.get(itemId);
    if (!item) {
      return yield* Effect.fail(new ItemNotFoundError({ itemId }));
    }

    const sparse = cache.itemSparse.get(itemId);

    return {
      id: itemId,
      name: sparse?.Display_lang || "",
      quality: sparse?.OverallQualityID || 0,
      inventoryType: item.InventoryType,
      itemLevel: sparse?.ItemLevel || 0,
      requiredLevel: sparse?.RequiredLevel || 0,
      classId: item.ClassID,
      subclassId: item.SubclassID,
    };
  });
