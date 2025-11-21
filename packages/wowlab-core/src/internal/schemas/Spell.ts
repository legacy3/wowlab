import * as Schema from "effect/Schema";

import * as Branded from "./Branded.js";

export const SpellDataFlatSchema = Schema.Struct({
  // Core
  iconName: Schema.String,
  id: Branded.SpellIDSchema,
  name: Schema.String,
  description: Schema.String,
  auraDescription: Schema.String,

  // Timing
  castTime: Schema.Number,
  recoveryTime: Schema.Number,
  startRecoveryTime: Schema.Number,

  // Resources
  manaCost: Schema.Number,
  powerType: Schema.Number,
  powerCost: Schema.Number,
  powerCostPct: Schema.Number,

  // Charges (flattened from charges.maxCharges, charges.rechargeTime)
  maxCharges: Schema.Number,
  chargeRecoveryTime: Schema.Number,

  // Range (flattened from range.ally.*, range.enemy.*)
  rangeMax1: Schema.Number,
  rangeMin1: Schema.Number,
  rangeMax0: Schema.Number,
  rangeMin0: Schema.Number,

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
  spellClassSet: Schema.Number,
  spellClassMask1: Schema.Number,
  spellClassMask2: Schema.Number,
  spellClassMask3: Schema.Number,
  spellClassMask4: Schema.Number,

  // Arrays (already flat)
  attributes: Schema.Array(Schema.Number),
  implicitTarget: Schema.Array(Schema.Number),
  effectTriggerSpell: Schema.Array(Schema.Number),
});

export type SpellDataFlat = Schema.Schema.Type<typeof SpellDataFlatSchema>;
