import { DbcError } from "@wowlab/core/Errors";
import * as Errors from "@wowlab/core/Errors";
import { Item } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

import { DbcService } from "../dbc/DbcService.js";

// Static lookup maps
const EXPANSION_NAMES: Record<number, string> = {
  0: "Classic",
  1: "The Burning Crusade",
  10: "The War Within",
  2: "Wrath of the Lich King",
  3: "Cataclysm",
  4: "Mists of Pandaria",
  5: "Warlords of Draenor",
  6: "Legion",
  7: "Battle for Azeroth",
  8: "Shadowlands",
  9: "Dragonflight",
};

const INVENTORY_TYPE_NAMES: Record<number, string> = {
  0: "Non-equippable",
  1: "Head",
  10: "Hands",
  11: "Finger",
  12: "Trinket",
  13: "One-Hand",
  14: "Shield",
  15: "Ranged",
  16: "Back",
  17: "Two-Hand",
  18: "Bag",
  19: "Tabard",
  2: "Neck",
  20: "Robe",
  21: "Main Hand",
  22: "Off Hand",
  23: "Held In Off-Hand",
  24: "Ammo",
  25: "Thrown",
  26: "Ranged Right",
  28: "Relic",
  3: "Shoulder",
  4: "Shirt",
  5: "Chest",
  6: "Waist",
  7: "Legs",
  8: "Feet",
  9: "Wrist",
};

export const transformItem = (
  itemId: number,
): Effect.Effect<
  Item.ItemDataFlat,
  Errors.ItemNotFound | DbcError,
  DbcService
> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;

    const [item, sparse, effectLinks, journalEncounterItems] =
      yield* Effect.all(
        [
          dbc.getById("item", itemId),
          dbc.getById("item_sparse", itemId),
          dbc.getManyByFk("item_x_item_effect", "ItemID", itemId),
          dbc.getManyByFk("journal_encounter_item", "ItemID", itemId),
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
      const modifiedAppearance = yield* dbc.getOneByFk(
        "item_modified_appearance",
        "ItemID",
        itemId,
      );

      if (modifiedAppearance) {
        const appearance = yield* dbc.getById(
          "item_appearance",
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
            yield* dbc.getById("manifest_interface_data", iconFileDataId),
          )
        : Option.none();

    const fileName = pipe(
      iconRow,
      Option.map((row) => row.FileName.toLowerCase().split(".")[0]),
      Option.getOrElse(() => "inv_misc_questionmark"),
    );

    const effectResults = yield* Effect.forEach(
      effectLinks,
      (link) => dbc.getById("item_effect", link.ItemEffectID),
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
      const sparseAny = sparse as unknown as Record<string, number>;
      for (let i = 0; i < 10; i++) {
        const type = sparseAny[`StatModifier_bonusStat_${i}`];
        const value = sparseAny[`StatPercentEditor_${i}`];

        if (type !== -1 && type !== 0) {
          stats.push({ type, value: value || 0 });
        }
      }
    }

    // Resolve Classification
    // Note: item_class.ID != item_class.ClassID, so we must lookup by ClassID field
    // Similarly, item_sub_class requires matching both ClassID and SubClassID
    const [itemClasses, itemSubClasses] = yield* Effect.all(
      [
        dbc.getManyByFk("item_class", "ClassID", item.ClassID),
        dbc.getManyByFk("item_sub_class", "ClassID", item.ClassID),
      ],
      { batching: true },
    );

    const itemClass = itemClasses[0];
    const itemSubClass = itemSubClasses.find(
      (sc) => sc.SubClassID === item.SubclassID,
    );

    const expansionId = sparse?.ExpansionID ?? 0;
    const classification: Item.ItemDataFlat["classification"] = {
      classId: item.ClassID,
      className: itemClass?.ClassName_lang || "Unknown",
      expansionId,
      expansionName: EXPANSION_NAMES[expansionId] || "Unknown",
      inventoryType: item.InventoryType,
      inventoryTypeName: INVENTORY_TYPE_NAMES[item.InventoryType] || "Unknown",
      subclassId: item.SubclassID,
      subclassName: itemSubClass?.DisplayName_lang || "Unknown",
    };

    // Resolve Sockets
    const sockets: number[] = [];
    if (sparse) {
      const sparseAny = sparse as unknown as Record<string, number>;
      for (let i = 0; i < 3; i++) {
        const socketType = sparseAny[`SocketType_${i}`];
        if (socketType && socketType > 0) {
          sockets.push(socketType);
        }
      }
    }

    // Resolve Flags
    const flags: number[] = [];
    if (sparse) {
      const sparseAny = sparse as unknown as Record<string, number>;
      for (let i = 0; i < 5; i++) {
        const flagValue = sparseAny[`Flags_${i}`];
        flags.push(flagValue ?? 0);
      }
    }

    // Resolve Set Info
    const itemSetId = sparse?.ItemSet || 0;
    let setInfo: Item.ItemDataFlat["setInfo"] = null;

    if (itemSetId > 0) {
      const [itemSet, setSpells] = yield* Effect.all(
        [
          dbc.getById("item_set", itemSetId),
          dbc.getManyByFk("item_set_spell", "ItemSetID", itemSetId),
        ],
        { batching: true },
      );

      if (itemSet) {
        // Collect all item IDs from ItemID_0 through ItemID_16
        const itemIds: number[] = [];
        const itemSetAny = itemSet as unknown as Record<string, number>;
        for (let i = 0; i <= 16; i++) {
          const setItemId = itemSetAny[`ItemID_${i}`];
          if (setItemId && setItemId > 0) {
            itemIds.push(setItemId);
          }
        }

        setInfo = {
          bonuses: setSpells.map((spell) => ({
            specId: spell.ChrSpecID,
            spellId: spell.SpellID,
            threshold: spell.Threshold,
          })),
          itemIds,
          setId: itemSetId,
          setName: itemSet.Name_lang || "Unknown Set",
        };
      }
    }

    // Resolve Drop Sources
    const dropSources: Array<{
      encounterId: number;
      encounterName: string;
      instanceId: number;
      instanceName: string;
      difficultyMask: number;
    }> = [];
    if (journalEncounterItems.length > 0) {
      const encounterIds = [
        ...new Set(journalEncounterItems.map((j) => j.JournalEncounterID)),
      ];
      const encounters = yield* Effect.forEach(
        encounterIds,
        (id) => dbc.getById("journal_encounter", id),
        { batching: true },
      );

      const instanceIds = [
        ...new Set(
          encounters
            .filter((e): e is NonNullable<typeof e> => e != null)
            .map((e) => e.JournalInstanceID),
        ),
      ];
      const instances = yield* Effect.forEach(
        instanceIds,
        (id) => dbc.getById("journal_instance", id),
        { batching: true },
      );

      const instanceMap = new Map(
        instances
          .filter((i): i is NonNullable<typeof i> => i != null)
          .map((i) => [i.ID, i]),
      );

      for (const encounterItem of journalEncounterItems) {
        const encounter = encounters.find(
          (e) => e?.ID === encounterItem.JournalEncounterID,
        );
        if (encounter) {
          const instance = instanceMap.get(encounter.JournalInstanceID);
          dropSources.push({
            difficultyMask: encounterItem.DifficultyMask,
            encounterId: encounter.ID,
            encounterName: encounter.Name_lang || "Unknown",
            instanceId: instance?.ID || 0,
            instanceName: instance?.Name_lang || "Unknown",
          });
        }
      }
    }

    return {
      // Basic info
      binding: sparse?.Bonding || 0,
      buyPrice: sparse?.BuyPrice || 0,
      description: sparse?.Description_lang || "",
      fileName,
      id: itemId,
      itemLevel: sparse?.ItemLevel || 0,
      maxCount: sparse?.MaxCount || 0,
      name: sparse?.Display_lang || "",
      quality: sparse?.OverallQualityID || 0,
      requiredLevel: sparse?.RequiredLevel || 0,
      sellPrice: sparse?.SellPrice || 0,
      speed: sparse?.ItemDelay || 0,
      stackable: sparse?.Stackable || 1,

      // Classification
      classId: item.ClassID,
      classification,
      inventoryType: item.InventoryType,
      subclassId: item.SubclassID,

      // Stats & Effects
      effects,
      stats,

      // Sockets
      socketBonusEnchantId: sparse?.Socket_match_enchantment_ID || 0,
      sockets,

      // Flags
      flags,

      // Class/Race restrictions
      allowableClass: sparse?.AllowableClass ?? -1,
      allowableRace: sparse?.AllowableRace ?? -1,

      // Expansion & Set
      expansionId,
      itemSetId,
      setInfo,

      // Drop sources
      dropSources,

      // Gem/Crafting
      dmgVariance: sparse?.DmgVariance || 0,
      gemProperties: sparse?.Gem_properties || 0,
      modifiedCraftingReagentItemId: sparse?.ModifiedCraftingReagentItemID || 0,
    };
  });
