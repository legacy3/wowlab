import * as Schema from "effect/Schema";

import * as Branded from "./Branded.js";

/**
 * Periodic aura type - matches the EffectAura values
 */
export const PeriodicType = Schema.Literal(
  "damage",
  "heal",
  "leech",
  "energize",
  "trigger_spell",
);
export type PeriodicType = Schema.Schema.Type<typeof PeriodicType>;

/**
 * Refresh behavior for auras
 */
export const RefreshBehavior = Schema.Literal("pandemic", "duration");
export type RefreshBehavior = Schema.Schema.Type<typeof RefreshBehavior>;

/**
 * AuraDataFlat - Static config for aura behavior.
 * Loaded from DBC at simulation setup, immutable during runtime.
 * Matches SpellDataFlat/ItemDataFlat pattern.
 */
export const AuraDataFlatSchema = Schema.Struct({
  /** Spell ID of the aura */
  spellId: Branded.SpellIDSchema,

  /** Base duration in milliseconds */
  baseDurationMs: Schema.Number,

  /** Maximum duration in milliseconds (for pandemic cap) */
  maxDurationMs: Schema.Number,

  /** Maximum stacks (defaults to 1 if 0 in DBC) */
  maxStacks: Schema.Number,

  /** Periodic type if this is a periodic aura, null otherwise */
  periodicType: Schema.NullOr(PeriodicType),

  /** Tick period in milliseconds (only for periodic auras) */
  tickPeriodMs: Schema.Number,

  /** How the aura refreshes: "pandemic" adds remaining (capped), "duration" replaces */
  refreshBehavior: RefreshBehavior,

  /** Whether aura duration scales with haste (Attributes_8 bit 17 / attr 273) */
  durationHasted: Schema.Boolean,

  /** Whether tick period scales with haste (Attributes_5 bit 13 / attr 173) */
  hastedTicks: Schema.Boolean,

  /** Whether this aura uses pandemic refresh (Attributes_13 bit 20 / attr 436) */
  pandemicRefresh: Schema.Boolean,

  /** Whether periodic damage rolls over on refresh (Attributes_10 bit 14 / attr 334) */
  rollingPeriodic: Schema.Boolean,

  /** Whether periodic ticks can crit (Attributes_8 bit 9 / attr 265) */
  tickMayCrit: Schema.Boolean,

  /** Whether first tick fires immediately on application (Attributes_5 bit 9 / attr 169) */
  tickOnApplication: Schema.Boolean,
});

export type AuraDataFlat = Schema.Schema.Type<typeof AuraDataFlatSchema>;

/**
 * Runtime Aura entity - CLEU-observable fields only.
 * Per docs/wowlab/00-data-flow.md: timing lives in scheduler, not on entities.
 */
export const AuraSchema = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
});

export type Aura = Schema.Schema.Type<typeof AuraSchema>;
