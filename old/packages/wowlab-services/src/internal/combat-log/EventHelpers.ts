/**
 * Minimal utilities for creating combat log events from triggers.
 */
import type { CombatLog } from "@wowlab/core/Schemas";

interface FromTriggerOptions {
  toSelf?: boolean;
}

type SpellEvent = CombatLog.SpellCastSuccess;

/**
 * Extract base fields from a trigger event.
 * Use `{ toSelf: true }` for self-buffs.
 */
export const fromTrigger = (event: SpellEvent, opts?: FromTriggerOptions) => ({
  destFlags: opts?.toSelf ? event.sourceFlags : event.destFlags,
  destGUID: opts?.toSelf ? event.sourceGUID : event.destGUID,
  destName: opts?.toSelf ? event.sourceName : event.destName,
  destRaidFlags: opts?.toSelf ? event.sourceRaidFlags : event.destRaidFlags,
  hideCaster: false,
  sourceFlags: event.sourceFlags,
  sourceGUID: event.sourceGUID,
  sourceName: event.sourceName,
  sourceRaidFlags: event.sourceRaidFlags,
  timestamp: event.timestamp,
});

export const DAMAGE_DEFAULTS = {
  absorbed: null,
  amount: 0,
  blocked: null,
  critical: false,
  crushing: false,
  glancing: false,
  isOffHand: false,
  overkill: -1,
  resisted: null,
} as const;

export const AURA_DEFAULTS = {
  amount: null,
} as const;

export const ENERGIZE_DEFAULTS = {
  overEnergize: 0,
} as const;
