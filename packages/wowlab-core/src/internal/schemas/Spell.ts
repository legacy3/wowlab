import * as Schema from "effect/Schema";

import * as Branded from "./Branded.js";

export const KnowledgeSourceSchema = Schema.Union(
  Schema.Struct({
    source: Schema.Literal("talent"),
    traitDefinitionId: Schema.Number,
  }),
  Schema.Struct({
    source: Schema.Literal("spec"),
    specId: Schema.Number,
  }),
  Schema.Struct({
    source: Schema.Literal("class"),
    classId: Schema.Number,
  }),
  Schema.Struct({
    source: Schema.Literal("unknown"),
  }),
);

export type KnowledgeSource = Schema.Schema.Type<typeof KnowledgeSourceSchema>;

export const SpellDataFlatSchema = Schema.Struct({
  // Core
  auraDescription: Schema.String,
  description: Schema.String,
  descriptionVariables: Schema.String,
  fileName: Schema.String,
  id: Branded.SpellIDSchema,
  isPassive: Schema.Boolean,
  knowledgeSource: KnowledgeSourceSchema,
  name: Schema.String,

  // Timing
  castTime: Schema.Number,
  recoveryTime: Schema.Number,
  startRecoveryTime: Schema.Number,

  // Resources
  manaCost: Schema.Number,
  powerCost: Schema.Number,
  powerCostPct: Schema.Number,
  powerType: Schema.Number,

  // Charges (flattened from charges.maxCharges, charges.rechargeTime)
  chargeRecoveryTime: Schema.Number,
  maxCharges: Schema.Number,

  // Range (flattened from range.ally.*, range.enemy.*)
  rangeMax0: Schema.Number,
  rangeMax1: Schema.Number,
  rangeMin0: Schema.Number,
  rangeMin1: Schema.Number,

  // Geometry (flattened from cone.degrees)
  coneDegrees: Schema.Number,
  radiusMax: Schema.Number,
  radiusMin: Schema.Number,

  // Damage/Defense (flattened from damage.schoolMask, defense.defenseType)
  defenseType: Schema.Number,
  schoolMask: Schema.Number,

  // Scaling (flattened from scaling.spellPower, scaling.attackPower)
  bonusCoefficientFromAP: Schema.Number,
  effectBonusCoefficient: Schema.Number,

  // Interrupts (flattened from interrupts.*)
  interruptAura0: Schema.Number,
  interruptAura1: Schema.Number,
  interruptChannel0: Schema.Number,
  interruptChannel1: Schema.Number,
  interruptFlags: Schema.Number,

  // Duration (flattened from duration.duration, duration.max)
  duration: Schema.Number,
  maxDuration: Schema.Number,

  // Empower (flattened from empower.*)
  canEmpower: Schema.Boolean,
  empowerStages: Schema.Unknown, // TODO Check how to flatten this

  // Mechanics (flattened from missile.speed, facing.facingFlags, dispel.dispelType)
  dispelType: Schema.Number,
  facingCasterFlags: Schema.Number,
  speed: Schema.Number,
  spellClassMask1: Schema.Number,
  spellClassMask2: Schema.Number,
  spellClassMask3: Schema.Number,
  spellClassMask4: Schema.Number,
  spellClassSet: Schema.Number,

  // Levels (from spell_levels)
  baseLevel: Schema.Number,
  maxLevel: Schema.Number,
  maxPassiveAuraLevel: Schema.Number,
  spellLevel: Schema.Number,

  // Aura Restrictions (from spell_aura_restrictions)
  casterAuraSpell: Schema.Number,
  casterAuraState: Schema.Number,
  excludeCasterAuraSpell: Schema.Number,
  excludeCasterAuraState: Schema.Number,
  excludeTargetAuraSpell: Schema.Number,
  excludeTargetAuraState: Schema.Number,
  targetAuraSpell: Schema.Number,
  targetAuraState: Schema.Number,

  // Replacement (from spell_replacement)
  replacementSpellId: Schema.Number,

  // Shapeshift (from spell_shapeshift)
  shapeshiftExclude0: Schema.Number,
  shapeshiftExclude1: Schema.Number,
  shapeshiftMask0: Schema.Number,
  shapeshiftMask1: Schema.Number,
  stanceBarOrder: Schema.Number,

  // Totems (from spell_totems)
  requiredTotemCategory0: Schema.Number,
  requiredTotemCategory1: Schema.Number,
  totem0: Schema.Number,
  totem1: Schema.Number,

  // Arrays (already flat)
  attributes: Schema.Array(Schema.Number),
  effectTriggerSpell: Schema.Array(Schema.Number),
  implicitTarget: Schema.Array(Schema.Number),
  learnSpells: Schema.Array(
    Schema.Struct({
      learnSpellId: Schema.Number,
      overridesSpellId: Schema.Number,
    }),
  ),
});

export type SpellDataFlat = Schema.Schema.Type<typeof SpellDataFlatSchema>;
