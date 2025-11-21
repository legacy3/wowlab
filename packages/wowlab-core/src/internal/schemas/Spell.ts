import * as Schema from "effect/Schema";

import * as Branded from "./Branded.js";

export const SpellDataFlatSchema = Schema.Struct({
  // Core
  iconName: Schema.String,
  id: Branded.SpellIDSchema,
  name: Schema.String,

  // Timing
  castTime: Schema.Number,
  cooldown: Schema.Number,
  gcd: Schema.Number,

  // Resources
  manaCost: Schema.Number,

  // Charges (flattened from charges.maxCharges, charges.rechargeTime)
  maxCharges: Schema.Number,
  rechargeTime: Schema.Number,

  // Range (flattened from range.ally.*, range.enemy.*)
  rangeAllyMax: Schema.Number,
  rangeAllyMin: Schema.Number,
  rangeEnemyMax: Schema.Number,
  rangeEnemyMin: Schema.Number,

  // Geometry (flattened from cone.degrees)
  coneDegrees: Schema.Number,
  radiusMax: Schema.Number,
  radiusMin: Schema.Number,

  // Damage/Defense (flattened from damage.schoolMask, defense.defenseType)
  defenseType: Schema.Number,
  schoolMask: Schema.Number,

  // Scaling (flattened from scaling.spellPower, scaling.attackPower)
  scalingAttackPower: Schema.Number,
  scalingSpellPower: Schema.Number,

  // Interrupts (flattened from interrupts.*)
  interruptAura0: Schema.Number,
  interruptAura1: Schema.Number,
  interruptChannel0: Schema.Number,
  interruptChannel1: Schema.Number,
  interruptFlags: Schema.Number,

  // Duration (flattened from duration.duration, duration.max)
  duration: Schema.Number,
  durationMax: Schema.Number,

  // Empower (flattened from empower.*)
  canEmpower: Schema.Boolean,
  empowerStages: Schema.Unknown, // TODO Check how to flatten this

  // Mechanics (flattened from missile.speed, facing.facingFlags, dispel.dispelType)
  dispelType: Schema.Number,
  facingFlags: Schema.Number,
  missileSpeed: Schema.Number,

  // Arrays (already flat)
  attributes: Schema.Array(Schema.Number),
  targeting: Schema.Array(Schema.Number),
  triggers: Schema.Array(Schema.Number),
});

export type SpellDataFlat = Schema.Schema.Type<typeof SpellDataFlatSchema>;
