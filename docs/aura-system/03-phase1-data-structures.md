# Phase 1: Data Structures

## Goal

Create the core data structures needed for the aura scheduling system, following the established `SpellDataFlat` / `ItemDataFlat` pattern.

## Prerequisites

- Read `00-overview.md` to understand the problem
- Read `02-reference-spell-data.md` to understand spell attributes

## Architecture Decision

**Pattern:** Follow the existing flat schema pattern used by `SpellDataFlat` and `ItemDataFlat`.

**Why not nested Schema.Class?**

- Consistency with existing data layer
- Simpler serialization/caching
- Mechanical transforms from DBC tables
- Separates static definition data from runtime scheduling state

**Data separation:**

1. `AuraDataFlat` (wowlab-core) - Static aura definition from DBC tables
2. `AuraScheduleState` (wowlab-services) - Runtime scheduling state for simulation

## Tasks

### 1. Create AuraDataFlat Schema

**File:** `packages/wowlab-core/src/internal/schemas/Aura.ts`

Add `AuraDataFlat` alongside the existing `Aura` schema:

```typescript
import * as Schema from "effect/Schema";
import * as Branded from "./Branded.js";

// Existing transient aura state (keep as-is)
export const Aura = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  expiresAt: Schema.Number,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
});
export type Aura = Schema.Schema.Type<typeof Aura>;

// Refresh behavior for aura reapplication
export const RefreshBehavior = Schema.Literal(
  "disabled", // No refresh allowed
  "duration", // Replace duration entirely (non-periodic default)
  "pandemic", // 30% carryover cap (periodic default)
  "extend", // Add full duration to remaining
  "tick", // Carry residual tick fraction
  "max", // Keep maximum of remaining vs new
);
export type RefreshBehavior = Schema.Schema.Type<typeof RefreshBehavior>;

// Periodic effect type
export const PeriodicType = Schema.Literal(
  "damage",
  "heal",
  "trigger",
  "energize",
);
export type PeriodicType = Schema.Schema.Type<typeof PeriodicType>;

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
  tickPeriodMs: Schema.Number, // 0 if not periodic
  periodicType: Schema.NullOr(PeriodicType), // null if not periodic

  // Refresh behavior (derived from attributes + periodic status)
  refreshBehavior: RefreshBehavior,

  // Behavior flags (flattened from spell_misc.Attributes_*)
  pandemicRefresh: Schema.Boolean, // SX_REFRESH_EXTENDS_DURATION (436)
  hastedTicks: Schema.Boolean, // SX_DOT_HASTED (173)
  tickOnApplication: Schema.Boolean, // SX_TICK_ON_APPLICATION (169)
  durationHasted: Schema.Boolean, // SX_DURATION_HASTED (273)
  rollingPeriodic: Schema.Boolean, // SX_ROLLING_PERIODIC (334)
  tickMayCrit: Schema.Boolean, // SX_TICK_MAY_CRIT (265)
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
 *
 * @param attributes - Object with Attributes_0 through Attributes_15 keys
 * @param attribute - The attribute constant (e.g., SX_DOT_HASTED = 173)
 * @returns true if the attribute is set
 *
 * @example
 * // SX_REFRESH_EXTENDS_DURATION = 436
 * // Column 13, Bit 20, so Attributes_13 & (1 << 20)
 * const attrs = { Attributes_13: 1048576 }; // 1 << 20
 * hasSpellAttribute(attrs, 436) // true
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

### 3. Create Constants Index

**File:** `packages/wowlab-core/src/internal/constants/index.ts`

```typescript
export * from "./SpellAttributes.js";
```

### 4. Export from wowlab-core

Update the main exports to include the new types:

**File:** `packages/wowlab-core/src/Schemas.ts` (or appropriate export file)

Add exports for:

- `AuraDataFlat`, `AuraDataFlatSchema`
- `RefreshBehavior`
- `PeriodicType`
- `hasSpellAttribute` and spell attribute constants

## Verification

After implementation, verify:

1. All schemas compile without errors: `pnpm build`
2. `hasSpellAttribute` correctly decodes bitmasks:
   ```typescript
   // Test: SX_REFRESH_EXTENDS_DURATION = 436
   // Column 13, Bit 20, so Attributes_13 & (1 << 20)
   const attrs = { Attributes_13: 1048576 }; // 1 << 20
   assert(hasSpellAttribute(attrs, 436) === true);
   ```

## What's NOT in Phase 1

- `AuraScheduleState` - This is runtime state, belongs in wowlab-services (Phase 3)
- `AuraDefinitionService` - This transforms DBC → AuraDataFlat (Phase 2)
- `AuraCollectionMeta` changes to Unit - Deferred until scheduler is implemented (Phase 3)

## Next Phase

Once complete, proceed to `04-phase2-aura-definition-service.md` to implement the transformer and service.
