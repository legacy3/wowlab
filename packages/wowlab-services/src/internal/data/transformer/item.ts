import * as Errors from "@wowlab/core/Errors";
import { Item } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import type { DbcCache } from "../DbcCache.js";

export const transformItem = (
  itemId: number,
  cache: DbcCache,
): Effect.Effect<Item.ItemDataFlat, Errors.ItemNotFound> =>
  Effect.gen(function* () {
    const item = cache.item.get(itemId);
    if (!item) {
      return yield* Effect.fail(
        new Errors.ItemNotFound({
          itemId,
          message: `Item ${itemId} not found in DBC cache`,
        }),
      );
    }

    const sparse = cache.itemSparse.get(itemId);

    // Resolve File Name
    const fileName = pipe(
      Option.fromNullable(cache.manifestInterfaceData.get(item.IconFileDataID)),
      Option.map((row) => row.FileName.toLowerCase().split(".")[0]),
      Option.getOrElse(() => "inv_misc_questionmark"),
    );

    // Resolve Effects
    const effectLinks = cache.itemXItemEffect.get(itemId) || [];
    const effects = effectLinks
      .map((link) => {
        const effect = cache.itemEffect.get(link.ItemEffectID);
        if (!effect) {
          return null;
        }

        return {
          categoryCooldown: effect.CategoryCoolDownMSec,
          charges: effect.Charges,
          cooldown: effect.CoolDownMSec,
          spellId: effect.SpellID,
          triggerType: effect.TriggerType,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // Resolve Stats (Basic mapping from Sparse)
    const stats: { type: number; value: number }[] = [];

    if (sparse) {
      for (let i = 0; i < 10; i++) {
        const type = (sparse as any)[`StatModifier_bonusStat_${i}`];
        const value = (sparse as any)[`StatPercentEditor_${i}`];

        if (type !== -1 && type !== 0) {
          stats.push({ type, value: value || 0 });
        }
      }
    }

    return {
      binding: sparse?.Bonding || 0,
      buyPrice: sparse?.BuyPrice || 0,
      classId: item.ClassID,
      description: sparse?.Description_lang || "",
      effects,
      fileName,
      id: itemId,
      inventoryType: item.InventoryType,
      itemLevel: sparse?.ItemLevel || 0,
      maxCount: sparse?.MaxCount || 0,
      name: sparse?.Display_lang || "",
      quality: sparse?.OverallQualityID || 0,
      requiredLevel: sparse?.RequiredLevel || 0,
      sellPrice: sparse?.SellPrice || 0,
      speed: sparse?.ItemDelay || 0,
      stackable: sparse?.Stackable || 1,
      stats,
      subclassId: item.SubclassID,
    };
  });
