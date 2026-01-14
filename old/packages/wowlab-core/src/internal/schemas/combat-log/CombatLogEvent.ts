/**
 * Combat Log Event Union
 *
 * Union of all combat log events with type guards.
 */
import * as Schema from "effect/Schema";

import type { AuraType } from "../Enums.js";

import {
  EncounterEnd,
  EncounterStart,
  EnvironmentalDamage,
  PartyKill,
  RangeDamage,
  RangeMissed,
  SpellAuraApplied,
  SpellAuraAppliedDose,
  SpellAuraBroken,
  SpellAuraBrokenSpell,
  SpellAuraRefresh,
  SpellAuraRemoved,
  SpellAuraRemovedDose,
  SpellCastFailed,
  SpellCastStart,
  SpellCastSuccess,
  SpellCreate,
  SpellDamage,
  SpellDispel,
  SpellDrain,
  SpellEnergize,
  SpellExtraAttacks,
  SpellHeal,
  SpellInstakill,
  SpellInterrupt,
  SpellMissed,
  SpellPeriodicDamage,
  SpellPeriodicDrain,
  SpellPeriodicEnergize,
  SpellPeriodicHeal,
  SpellStolen,
  SpellSummon,
  SwingDamage,
  SwingMissed,
  UnitDestroyed,
  UnitDied,
} from "./Events.js";

/**
 * Union of all combat log events.
 * Use the _tag field to discriminate between event types.
 */
export const CombatLogEvent = Schema.Union(
  // Spell events
  SpellCastStart,
  SpellCastSuccess,
  SpellCastFailed,
  SpellDamage,
  SpellPeriodicDamage,
  SpellHeal,
  SpellPeriodicHeal,
  SpellEnergize,
  SpellPeriodicEnergize,
  SpellDrain,
  SpellPeriodicDrain,
  SpellAuraApplied,
  SpellAuraRemoved,
  SpellAuraAppliedDose,
  SpellAuraRemovedDose,
  SpellAuraRefresh,
  SpellAuraBroken,
  SpellAuraBrokenSpell,
  SpellMissed,
  SpellInterrupt,
  SpellDispel,
  SpellStolen,
  SpellSummon,
  SpellCreate,
  SpellInstakill,
  SpellExtraAttacks,
  // Range events
  RangeDamage,
  RangeMissed,
  // Swing events
  SwingDamage,
  SwingMissed,
  // Environmental events
  EnvironmentalDamage,
  // Special events
  UnitDied,
  UnitDestroyed,
  PartyKill,
  EncounterStart,
  EncounterEnd,
);

/**
 * Extract aura events
 */
export type AuraEvent = Extract<CombatLogEvent, { auraType: AuraType }>;

export type CombatLogEvent = Schema.Schema.Type<typeof CombatLogEvent>;

export type DamageEvent = Extract<
  CombatLogEvent,
  { amount: number; overkill: number }
>;

/**
 * Extract drain events
 */
export type DrainEvent = Extract<
  CombatLogEvent,
  { amount: number; powerType: number; extraAmount: number }
>;

/**
 * Extract energize events
 */
export type EnergizeEvent = Extract<
  CombatLogEvent,
  { amount: number; powerType: number; overEnergize: number }
>;

/**
 * Extract heal events
 */
export type HealEvent = Extract<
  CombatLogEvent,
  { amount: number; overhealing: number }
>;

/**
 * Extract events that have spell info (spellId, spellName, spellSchool)
 */
export type SpellEvent = Extract<CombatLogEvent, { spellId: number }>;

/**
 * The _tag literal type (subevent name)
 */
export type Subevent = CombatLogEvent["_tag"];

export const isSpellEvent = (event: CombatLogEvent): event is SpellEvent =>
  "spellId" in event;

/**
 * Check if event is a damage event
 */
export const isDamageEvent = (event: CombatLogEvent): event is DamageEvent =>
  "amount" in event && "overkill" in event;

/**
 * Check if event is a heal event
 */
export const isHealEvent = (event: CombatLogEvent): event is HealEvent =>
  "amount" in event && "overhealing" in event;

/**
 * Check if event is an aura event
 */
export const isAuraEvent = (event: CombatLogEvent): event is AuraEvent =>
  "auraType" in event;

/**
 * Check if event is an energize event
 */
export const isEnergizeEvent = (
  event: CombatLogEvent,
): event is EnergizeEvent =>
  "amount" in event && "powerType" in event && !("overkill" in event);

/**
 * Check if event is a cast event (start, success, or failed)
 */
export const isCastEvent = (
  event: CombatLogEvent,
): event is SpellCastStart | SpellCastSuccess | SpellCastFailed =>
  event._tag === "SPELL_CAST_START" ||
  event._tag === "SPELL_CAST_SUCCESS" ||
  event._tag === "SPELL_CAST_FAILED";

/**
 * Check if event has source and dest info (most events)
 */
export const hasSourceAndDest = (
  event: CombatLogEvent,
): event is { sourceGUID: string; destGUID: string } & CombatLogEvent =>
  "sourceGUID" in event && "destGUID" in event;
