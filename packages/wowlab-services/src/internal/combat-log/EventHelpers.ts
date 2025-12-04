/**
 * Minimal utilities for creating combat log events from triggers.
 */
import type { CombatLog } from "@wowlab/core/Schemas";

type SpellEvent = CombatLog.SpellCastSuccess;

interface FromTriggerOptions {
  toSelf?: boolean;
}

/**
 * Extract base fields from a trigger event.
 * Use `{ toSelf: true }` for self-buffs.
 */
export const fromTrigger = (event: SpellEvent, opts?: FromTriggerOptions) => ({
  timestamp: event.timestamp,
  hideCaster: false,
  sourceGUID: event.sourceGUID,
  sourceName: event.sourceName,
  sourceFlags: event.sourceFlags,
  sourceRaidFlags: event.sourceRaidFlags,
  destGUID: opts?.toSelf ? event.sourceGUID : event.destGUID,
  destName: opts?.toSelf ? event.sourceName : event.destName,
  destFlags: opts?.toSelf ? event.sourceFlags : event.destFlags,
  destRaidFlags: opts?.toSelf ? event.sourceRaidFlags : event.destRaidFlags,
});

export const DAMAGE_DEFAULTS = {
  amount: 0,
  overkill: -1,
  critical: false,
  absorbed: null,
  blocked: null,
  resisted: null,
  glancing: false,
  crushing: false,
  isOffHand: false,
} as const;

export const AURA_DEFAULTS = {
  amount: null,
} as const;

export const ENERGIZE_DEFAULTS = {
  overEnergize: 0,
} as const;
