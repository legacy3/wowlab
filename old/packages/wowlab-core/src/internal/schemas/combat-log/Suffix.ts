/**
 * Combat Log Suffix Schemas
 *
 * Event suffixes describe the effect type.
 * Reference: https://warcraft.wiki.gg/wiki/COMBAT_LOG_EVENT
 */
import * as Schema from "effect/Schema";

import { AuraType, MissType } from "../Enums.js";

/**
 * _AURA_APPLIED, _AURA_REMOVED, _AURA_APPLIED_DOSE, _AURA_REMOVED_DOSE suffix fields.
 */
export class AuraSuffix extends Schema.Class<AuraSuffix>("AuraSuffix")({
  /** BUFF or DEBUFF */
  auraType: AuraType,
  /** Stack count (for dose events) or null */
  amount: Schema.NullOr(Schema.Number),
}) {}

/**
 * _DAMAGE suffix fields.
 * Used by SPELL_DAMAGE, SPELL_PERIODIC_DAMAGE, SWING_DAMAGE, etc.
 */
export class DamageSuffix extends Schema.Class<DamageSuffix>("DamageSuffix")({
  /** Damage amount */
  amount: Schema.Number,
  /** Overkill amount (-1 if target didn't die) */
  overkill: Schema.Number,
  /** Damage school bitmask */
  school: Schema.Number,
  /** Amount resisted */
  resisted: Schema.NullOr(Schema.Number),
  /** Amount blocked */
  blocked: Schema.NullOr(Schema.Number),
  /** Amount absorbed */
  absorbed: Schema.NullOr(Schema.Number),
  /** Was a critical hit */
  critical: Schema.Boolean,
  /** Was a glancing blow */
  glancing: Schema.Boolean,
  /** Was a crushing blow */
  crushing: Schema.Boolean,
  /** Was from offhand weapon */
  isOffHand: Schema.Boolean,
}) {}

/**
 * _DISPEL, _STOLEN suffix fields.
 */
export class DispelSuffix extends Schema.Class<DispelSuffix>("DispelSuffix")({
  /** Aura ID that was dispelled/stolen */
  extraSpellId: Schema.Number,
  /** Aura name that was dispelled/stolen */
  extraSpellName: Schema.String,
  /** School of dispelled aura */
  extraSchool: Schema.Number,
  /** BUFF or DEBUFF */
  auraType: AuraType,
}) {}

/**
 * _DRAIN suffix fields.
 * Used by SPELL_DRAIN, SPELL_PERIODIC_DRAIN.
 */
export class DrainSuffix extends Schema.Class<DrainSuffix>("DrainSuffix")({
  /** Amount drained */
  amount: Schema.Number,
  /** Power type drained */
  powerType: Schema.Number,
  /** Extra amount (returned to drainer) */
  extraAmount: Schema.Number,
}) {}

/**
 * _ENERGIZE suffix fields.
 * Used by SPELL_ENERGIZE, SPELL_PERIODIC_ENERGIZE.
 */
export class EnergizeSuffix extends Schema.Class<EnergizeSuffix>(
  "EnergizeSuffix",
)({
  /** Amount of power gained */
  amount: Schema.Number,
  /** Amount wasted due to being at cap */
  overEnergize: Schema.Number,
  /** Power type (mana, rage, focus, etc.) */
  powerType: Schema.Number,
}) {}

/**
 * _HEAL suffix fields.
 * Used by SPELL_HEAL, SPELL_PERIODIC_HEAL.
 */
export class HealSuffix extends Schema.Class<HealSuffix>("HealSuffix")({
  /** Heal amount */
  amount: Schema.Number,
  /** Overhealing amount */
  overhealing: Schema.Number,
  /** Amount absorbed (e.g., by absorb auras) */
  absorbed: Schema.Number,
  /** Was a critical heal */
  critical: Schema.Boolean,
}) {}

/**
 * _INTERRUPT suffix fields.
 * Used by SPELL_INTERRUPT.
 */
export class InterruptSuffix extends Schema.Class<InterruptSuffix>(
  "InterruptSuffix",
)({
  /** Spell ID that was interrupted */
  extraSpellId: Schema.Number,
  /** Spell name that was interrupted */
  extraSpellName: Schema.String,
  /** School of interrupted spell */
  extraSchool: Schema.Number,
}) {}

/**
 * _MISSED suffix fields.
 * Used by SPELL_MISSED, SWING_MISSED.
 */
export class MissedSuffix extends Schema.Class<MissedSuffix>("MissedSuffix")({
  /** Type of miss */
  missType: MissType,
  /** Was from offhand weapon */
  isOffHand: Schema.Boolean,
  /** Amount that would have been dealt (for partial resists) */
  amountMissed: Schema.NullOr(Schema.Number),
  /** Would have been critical */
  critical: Schema.Boolean,
}) {}
