import * as Branded from "@packages/innocent-schemas/Branded";
import * as Item from "@packages/innocent-schemas/Item";
import * as Spell from "@packages/innocent-schemas/Spell";
import * as Metadata from "@packages/innocent-services/Metadata";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export const StandaloneMetadataServiceLayer = Layer.succeed(
  Metadata.MetadataService,
  {
    loadItem: (itemId: number) =>
      Effect.succeed<Item.ItemDataFlat>({
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
      Effect.succeed<Spell.SpellDataFlat>({
        // Core
        iconName: `spell_${spellId}`,
        id: Branded.SpellID(spellId),
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
        schoolMask: 4, // Fire
        // Scaling
        scalingAttackPower: 0,
        scalingSpellPower: 1,
        // Interrupts
        interruptAura0: 0,
        interruptAura1: 0,
        interruptChannel0: 0,
        interruptChannel1: 0,
        interruptFlags: 0,
        // Duration
        duration: 0,
        durationMax: 0,
        // Empower
        canEmpower: false,
        empowerStages: [],
        // Mechanics
        dispelType: 0,
        facingFlags: 0,
        missileSpeed: 0,
        // Arrays
        attributes: [],
        targeting: [],
        triggers: [],
      }),
  },
);
