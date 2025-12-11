import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Item } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";

export const transformItem = (
  itemId: number,
): Effect.Effect<
  Item.ItemDataFlat,
  Errors.ItemNotFound | DbcError,
  DbcService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;

    const [item, sparse, effectLinks] = yield* Effect.all(
      [
        dbc.getItem(itemId),
        dbc.getItemSparse(itemId),
        dbc.getItemXItemEffects(itemId),
      ],
      { batching: true },
    );

    if (!item) {
      return yield* Effect.fail(
        new Errors.ItemNotFound({
          itemId,
          message: `Item ${itemId} not found in DBC cache`,
        }),
      );
    }

    // Resolve File Name - first try Item.IconFileDataID, then fallback to appearance
    let iconFileDataId = item.IconFileDataID;

    if (iconFileDataId === 0) {
      const modifiedAppearance = yield* dbc.getItemModifiedAppearance(itemId);

      if (modifiedAppearance) {
        const appearance = yield* dbc.getItemAppearance(
          modifiedAppearance.ItemAppearanceID,
        );

        if (appearance && appearance.DefaultIconFileDataID > 0) {
          iconFileDataId = appearance.DefaultIconFileDataID;
        }
      }
    }

    const iconRow =
      iconFileDataId > 0
        ? Option.fromNullable(
            yield* dbc.getManifestInterfaceData(iconFileDataId),
          )
        : Option.none();

    const fileName = pipe(
      iconRow,
      Option.map((row) => row.FileName.toLowerCase().split(".")[0]),
      Option.getOrElse(() => "inv_misc_questionmark"),
    );

    const effectResults = yield* Effect.forEach(
      effectLinks,
      (link) => dbc.getItemEffect(link.ItemEffectID),
      { batching: true },
    );

    const effects = effectResults
      .filter((e): e is NonNullable<typeof e> => e != null)
      .map((effect) => ({
        categoryCooldown: effect.CategoryCoolDownMSec,
        charges: effect.Charges,
        cooldown: effect.CoolDownMSec,
        spellId: effect.SpellID,
        triggerType: effect.TriggerType,
      }));

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
