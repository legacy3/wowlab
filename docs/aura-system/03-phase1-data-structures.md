# Phase 1: Data Structures

## Goal

Create the core data structures needed for the aura system, following the established `SpellDataFlat` / `ItemDataFlat` pattern.

## Prerequisites

- Read `00-overview.md` to understand the problem
- Read `02-reference-spell-data.md` to understand spell attributes

## Architecture

**Pattern:** Follow the existing flat schema pattern used by `SpellDataFlat` and `ItemDataFlat`.

**Data separation:**

1. `AuraDataFlat` (wowlab-core) - Static aura definition from DBC tables
2. Runtime aura state lives on the `Aura` entity in `GameState`

## Tasks

### 1. Create AuraDataFlat Schema

**File:** `packages/wowlab-core/src/internal/schemas/Aura.ts`

Add `AuraDataFlatSchema` alongside the existing `AuraSchema`:

```typescript
import * as Schema from "effect/Schema";
import * as Branded from "./Branded.js";

// Runtime aura state (CLEU-observable fields only per 00-data-flow.md)
// Timing (expiresAt, nextTickAt) lives in the scheduler, not on the entity
export const AuraSchema = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
});
export type Aura = Schema.Schema.Type<typeof AuraSchema>;

// Refresh behavior for aura reapplication
export const RefreshBehaviorSchema = Schema.Literal(
  "disabled", // No refresh allowed
  "duration", // Replace duration entirely (non-periodic default)
  "pandemic", // 30% carryover cap (periodic default)
  "extend", // Add full duration to remaining
  "tick", // Carry residual tick fraction
  "max", // Keep maximum of remaining vs new
);
export type RefreshBehavior = Schema.Schema.Type<typeof RefreshBehaviorSchema>;

// Periodic effect type
export const PeriodicTypeSchema = Schema.Literal(
  "damage",
  "heal",
  "trigger",
  "energize",
);
export type PeriodicType = Schema.Schema.Type<typeof PeriodicTypeSchema>;

// Flat aura definition - mirrors SpellDataFlat pattern
export const AuraDataFlatSchema = Schema.Struct({
  // Core
  spellId: Branded.SpellIDSchema,

  // Duration (from spell_duration via spell_misc.DurationIndex)
  baseDurationMs: Schema.Number,
  maxDurationMs: Schema.Number,

  // Stacking (from spell_aura_options.CumulativeAura)
  maxStacks: Schema.Number, // 0 or 1 means no stacking

  // Periodic (from spell_effect where EffectAura is periodic type)
  periodicType: Schema.NullOr(PeriodicTypeSchema), // null if not periodic
  tickPeriodMs: Schema.Number, // 0 if not periodic

  // Refresh behavior (derived from attributes + periodic status)
  refreshBehavior: RefreshBehaviorSchema,

  // Behavior flags (flattened from spell_misc.Attributes_*)
  durationHasted: Schema.Boolean, // SX_DURATION_HASTED (273)
  hastedTicks: Schema.Boolean, // SX_DOT_HASTED (173)
  pandemicRefresh: Schema.Boolean, // SX_REFRESH_EXTENDS_DURATION (436)
  rollingPeriodic: Schema.Boolean, // SX_ROLLING_PERIODIC (334)
  tickMayCrit: Schema.Boolean, // SX_TICK_MAY_CRIT (265)
  tickOnApplication: Schema.Boolean, // SX_TICK_ON_APPLICATION (169)
});

export type AuraDataFlat = Schema.Schema.Type<typeof AuraDataFlatSchema>;
```

### 2. Create Spell Attribute Constants

**File:** `packages/wowlab-core/src/internal/constants/SpellAttributes.ts`

```typescript
// Aura Refresh & Duration
export const SX_REFRESH_EXTENDS_DURATION = 436;
export const SX_ROLLING_PERIODIC = 334;
export const SX_DURATION_HASTED = 273;

// Tick Behavior
export const SX_TICK_ON_APPLICATION = 169;
export const SX_DOT_HASTED = 173;
export const SX_DOT_HASTED_MELEE = 278;
export const SX_TICK_MAY_CRIT = 265;
export const SX_TREAT_AS_PERIODIC = 121;

// Proc Behavior
export const SX_NOT_A_PROC = 105;
export const SX_CAN_PROC_FROM_PROCS = 122;
export const SX_SUPPRESS_CASTER_PROCS = 112;
export const SX_SUPPRESS_TARGET_PROCS = 113;

// Combat Flags
export const SX_PASSIVE = 6;
export const SX_HIDDEN = 7;
export const SX_CHANNELED = 34;
export const SX_CANNOT_CRIT = 93;
export const SX_ALWAYS_HIT = 114;
export const SX_NO_THREAT = 42;

/**
 * Check if a spell has a specific attribute.
 * Attributes are stored as bitmasks in Attributes_0 through Attributes_15.
 */
export function hasSpellAttribute(
  attributes: Record<string, number>,
  attribute: number,
): boolean {
  const column = Math.floor(attribute / 32);
  const bit = attribute % 32;
  const mask = 1 << bit;
  const attrValue = attributes[`Attributes_${column}`] ?? 0;

  return (attrValue & mask) !== 0;
}
```

### 3. Export from wowlab-core

Update exports to include the new types:

- `AuraDataFlat`, `AuraDataFlatSchema`
- `RefreshBehavior`, `RefreshBehaviorSchema`
- `PeriodicType`, `PeriodicTypeSchema`
- `hasSpellAttribute` and spell attribute constants

## Verification

```bash
pnpm build
```

## Next Phase

Proceed to `04-phase2-transformer.md` to implement the DBC transformer.
