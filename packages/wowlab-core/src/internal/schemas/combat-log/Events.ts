/**
 * Combat Log Events
 *
 * Complete event schemas using TaggedClass.
 * Each event has a _tag field matching the subevent name.
 * Reference: https://warcraft.wiki.gg/wiki/COMBAT_LOG_EVENT
 */
import * as Schema from "effect/Schema";

import { AuraType, CastFailedType } from "../Enums.js";
import { CombatLogEventBase } from "./Base.js";
import { EnvironmentalPrefix, SpellPrefix } from "./Prefix.js";
import {
  AuraSuffix,
  DamageSuffix,
  DispelSuffix,
  DrainSuffix,
  EnergizeSuffix,
  HealSuffix,
  InterruptSuffix,
  MissedSuffix,
} from "./Suffix.js";

// ============================================================================
// SPELL Events (Base + SpellPrefix + optional suffix)
// ============================================================================

/**
 * ENCOUNTER_END - Boss encounter ended
 */
export class EncounterEnd extends Schema.TaggedClass<EncounterEnd>()(
  "ENCOUNTER_END",
  {
    difficultyId: Schema.Number,
    encounterId: Schema.Number,
    encounterName: Schema.String,
    fightTime: Schema.Number,
    groupSize: Schema.Number,
    success: Schema.Boolean,
    timestamp: Schema.Number,
  },
) {}

/**
 * ENCOUNTER_START - Boss encounter started
 */
export class EncounterStart extends Schema.TaggedClass<EncounterStart>()(
  "ENCOUNTER_START",
  {
    difficultyId: Schema.Number,
    encounterId: Schema.Number,
    encounterName: Schema.String,
    groupSize: Schema.Number,
    timestamp: Schema.Number,
  },
) {}

/**
 * ENVIRONMENTAL_DAMAGE - Damage from environment
 */
export class EnvironmentalDamage extends Schema.TaggedClass<EnvironmentalDamage>()(
  "ENVIRONMENTAL_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...EnvironmentalPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

/**
 * PARTY_KILL - Party member got killing blow
 */
export class PartyKill extends Schema.TaggedClass<PartyKill>()("PARTY_KILL", {
  ...CombatLogEventBase.fields,
}) {}

/**
 * RANGE_DAMAGE - Ranged auto-attack damage
 */
export class RangeDamage extends Schema.TaggedClass<RangeDamage>()(
  "RANGE_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

/**
 * RANGE_MISSED - Ranged auto-attack missed
 */
export class RangeMissed extends Schema.TaggedClass<RangeMissed>()(
  "RANGE_MISSED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...MissedSuffix.fields,
  },
) {}

/**
 * SPELL_AURA_APPLIED - Aura applied to target
 */
export class SpellAuraApplied extends Schema.TaggedClass<SpellAuraApplied>()(
  "SPELL_AURA_APPLIED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

/**
 * SPELL_AURA_APPLIED_DOSE - Aura stack added
 */
export class SpellAuraAppliedDose extends Schema.TaggedClass<SpellAuraAppliedDose>()(
  "SPELL_AURA_APPLIED_DOSE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

/**
 * SPELL_AURA_BROKEN - Aura broken by damage
 */
export class SpellAuraBroken extends Schema.TaggedClass<SpellAuraBroken>()(
  "SPELL_AURA_BROKEN",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    auraType: AuraType,
  },
) {}

/**
 * SPELL_AURA_BROKEN_SPELL - Aura broken by a spell
 */
export class SpellAuraBrokenSpell extends Schema.TaggedClass<SpellAuraBrokenSpell>()(
  "SPELL_AURA_BROKEN_SPELL",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    auraType: AuraType,
    extraSchool: Schema.Number,
    extraSpellId: Schema.Number,
    extraSpellName: Schema.String,
  },
) {}

/**
 * SPELL_AURA_REFRESH - Aura duration refreshed
 */
export class SpellAuraRefresh extends Schema.TaggedClass<SpellAuraRefresh>()(
  "SPELL_AURA_REFRESH",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    amount: Schema.NullOr(Schema.Number),
    auraType: AuraType,
  },
) {}

/**
 * SPELL_AURA_REMOVED - Aura removed from target
 */
export class SpellAuraRemoved extends Schema.TaggedClass<SpellAuraRemoved>()(
  "SPELL_AURA_REMOVED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

/**
 * SPELL_AURA_REMOVED_DOSE - Aura stack removed
 */
export class SpellAuraRemovedDose extends Schema.TaggedClass<SpellAuraRemovedDose>()(
  "SPELL_AURA_REMOVED_DOSE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...AuraSuffix.fields,
  },
) {}

/**
 * SPELL_CAST_FAILED - Spell cast failed
 */
export class SpellCastFailed extends Schema.TaggedClass<SpellCastFailed>()(
  "SPELL_CAST_FAILED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    failedType: CastFailedType,
  },
) {}

/**
 * SPELL_CAST_START - Spell cast begins
 */
export class SpellCastStart extends Schema.TaggedClass<SpellCastStart>()(
  "SPELL_CAST_START",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

/**
 * SPELL_CAST_SUCCESS - Spell cast completes successfully
 */
export class SpellCastSuccess extends Schema.TaggedClass<SpellCastSuccess>()(
  "SPELL_CAST_SUCCESS",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

/**
 * SPELL_CREATE - Object created (e.g., totem)
 */
export class SpellCreate extends Schema.TaggedClass<SpellCreate>()(
  "SPELL_CREATE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

/**
 * SPELL_DAMAGE - Direct spell damage
 */
export class SpellDamage extends Schema.TaggedClass<SpellDamage>()(
  "SPELL_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

/**
 * SPELL_DISPEL - Aura dispelled
 */
export class SpellDispel extends Schema.TaggedClass<SpellDispel>()(
  "SPELL_DISPEL",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DispelSuffix.fields,
  },
) {}

/**
 * SPELL_DRAIN - Power drain
 */
export class SpellDrain extends Schema.TaggedClass<SpellDrain>()(
  "SPELL_DRAIN",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DrainSuffix.fields,
  },
) {}

/**
 * SPELL_ENERGIZE - Power gain from spell
 */
export class SpellEnergize extends Schema.TaggedClass<SpellEnergize>()(
  "SPELL_ENERGIZE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...EnergizeSuffix.fields,
  },
) {}

/**
 * SPELL_EXTRA_ATTACKS - Extra attacks granted (e.g., Windfury)
 */
export class SpellExtraAttacks extends Schema.TaggedClass<SpellExtraAttacks>()(
  "SPELL_EXTRA_ATTACKS",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    amount: Schema.Number,
  },
) {}

/**
 * SPELL_HEAL - Direct spell heal
 */
export class SpellHeal extends Schema.TaggedClass<SpellHeal>()("SPELL_HEAL", {
  ...CombatLogEventBase.fields,
  ...SpellPrefix.fields,
  ...HealSuffix.fields,
}) {}

/**
 * SPELL_INSTAKILL - Instant kill effect
 */
export class SpellInstakill extends Schema.TaggedClass<SpellInstakill>()(
  "SPELL_INSTAKILL",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    unconsciousOnDeath: Schema.NullOr(Schema.Boolean),
  },
) {}

/**
 * SPELL_INTERRUPT - Spell interrupted
 */
export class SpellInterrupt extends Schema.TaggedClass<SpellInterrupt>()(
  "SPELL_INTERRUPT",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...InterruptSuffix.fields,
  },
) {}

/**
 * SPELL_MISSED - Spell missed/dodged/etc
 */
export class SpellMissed extends Schema.TaggedClass<SpellMissed>()(
  "SPELL_MISSED",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...MissedSuffix.fields,
  },
) {}

// ============================================================================
// RANGE Events (Base + SpellPrefix + optional suffix)
// ============================================================================

/**
 * SPELL_PERIODIC_DAMAGE - DoT tick damage
 */
export class SpellPeriodicDamage extends Schema.TaggedClass<SpellPeriodicDamage>()(
  "SPELL_PERIODIC_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DamageSuffix.fields,
  },
) {}

/**
 * SPELL_PERIODIC_DRAIN - Periodic power drain
 */
export class SpellPeriodicDrain extends Schema.TaggedClass<SpellPeriodicDrain>()(
  "SPELL_PERIODIC_DRAIN",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DrainSuffix.fields,
  },
) {}

// ============================================================================
// SWING Events (Base + optional suffix, no spell prefix)
// ============================================================================

/**
 * SPELL_PERIODIC_ENERGIZE - Periodic power gain
 */
export class SpellPeriodicEnergize extends Schema.TaggedClass<SpellPeriodicEnergize>()(
  "SPELL_PERIODIC_ENERGIZE",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...EnergizeSuffix.fields,
  },
) {}

/**
 * SPELL_PERIODIC_HEAL - HoT tick heal
 */
export class SpellPeriodicHeal extends Schema.TaggedClass<SpellPeriodicHeal>()(
  "SPELL_PERIODIC_HEAL",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...HealSuffix.fields,
  },
) {}

// ============================================================================
// ENVIRONMENTAL Events (Base + EnvironmentalPrefix + DamageSuffix)
// ============================================================================

/**
 * SPELL_STOLEN - Aura stolen (e.g., Spellsteal)
 */
export class SpellStolen extends Schema.TaggedClass<SpellStolen>()(
  "SPELL_STOLEN",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
    ...DispelSuffix.fields,
  },
) {}

// ============================================================================
// Special Events
// ============================================================================

/**
 * SPELL_SUMMON - Summon created
 */
export class SpellSummon extends Schema.TaggedClass<SpellSummon>()(
  "SPELL_SUMMON",
  {
    ...CombatLogEventBase.fields,
    ...SpellPrefix.fields,
  },
) {}

/**
 * SWING_DAMAGE - Melee auto-attack damage
 */
export class SwingDamage extends Schema.TaggedClass<SwingDamage>()(
  "SWING_DAMAGE",
  {
    ...CombatLogEventBase.fields,
    ...DamageSuffix.fields,
  },
) {}

/**
 * SWING_MISSED - Melee auto-attack missed
 */
export class SwingMissed extends Schema.TaggedClass<SwingMissed>()(
  "SWING_MISSED",
  {
    ...CombatLogEventBase.fields,
    ...MissedSuffix.fields,
  },
) {}

/**
 * UNIT_DESTROYED - Object destroyed (e.g., totem)
 */
export class UnitDestroyed extends Schema.TaggedClass<UnitDestroyed>()(
  "UNIT_DESTROYED",
  {
    ...CombatLogEventBase.fields,
    recapID: Schema.NullOr(Schema.Number),
    unconsciousOnDeath: Schema.NullOr(Schema.Boolean),
  },
) {}

/**
 * UNIT_DIED - Unit died
 */
export class UnitDied extends Schema.TaggedClass<UnitDied>()("UNIT_DIED", {
  ...CombatLogEventBase.fields,
  recapID: Schema.NullOr(Schema.Number),
  unconsciousOnDeath: Schema.NullOr(Schema.Boolean),
}) {}
