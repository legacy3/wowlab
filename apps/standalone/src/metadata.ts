import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Metadata from "@wowlab/services/Metadata";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const StandaloneMetadataServiceLayer = Layer.succeed(
  Metadata.MetadataService,
  Metadata.MetadataService.of({
    loadItem: (itemId: number) =>
      Effect.succeed<Schemas.Item.ItemDataFlat>({
        // Core
        iconName: `item_${itemId}`,
        id: itemId,
        name: `Item ${itemId}`,
        // Classification
        classId: 0,
        inventoryType: 0,
        itemLevel: 0,
        quality: 0,
        subclassId: 0,
        // Requirements
        allowableClass: "",
        allowableRace: "",
        requiredLevel: 0,
        // Description
        description: `Standalone item ${itemId}`,
      }),
    loadSpell: (spellId: number) =>
      Effect.succeed(
        Entities.Spell.SpellInfo.create({
          // Core
          iconName: `spell_${spellId}`,
          id: Schemas.Branded.SpellID(spellId),
          name: `Spell ${spellId}`,
          // Timing
          castTime: 0,
          cooldown: 0,
          gcd: 1500,
          // Resources
          manaCost: 0,
          // Charges
          maxCharges: 0,
          rechargeTime: 0,
          // Range
          rangeAllyMax: 0,
          rangeAllyMin: 0,
          rangeEnemyMax: 40,
          rangeEnemyMin: 0,
          // Geometry
          coneDegrees: 0,
          radius: [],
          // Damage/Defense
          defenseType: 0,
          schoolMask: 0,
          // Scaling
          scalingAttackPower: 0,
          scalingSpellPower: 0,
          // Modifiers
          modifiers: [],
        }),
      ),
  }),
);
