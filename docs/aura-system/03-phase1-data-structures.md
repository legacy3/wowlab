# Phase 1: Data Structures

## Goal

Create the core data structures needed for the aura scheduling system.

## Prerequisites

- Read `00-overview.md` to understand the problem
- Read `02-reference-spell-data.md` to understand spell attributes

## Tasks

### 1. Create RefreshBehavior Type

**File:** `packages/wowlab-core/src/internal/schemas/aura/RefreshBehavior.ts`

```typescript
import { Schema } from "effect";

export const RefreshBehavior = Schema.Literal(
  "disabled", // No refresh allowed
  "duration", // Replace duration entirely (non-periodic default)
  "pandemic", // 30% carryover cap (periodic default)
  "extend", // Add full duration to remaining
  "tick", // Carry residual tick fraction
  "max", // Keep maximum of remaining vs new
  "custom", // Per-spell callback (future)
);

export type RefreshBehavior = Schema.Schema.Type<typeof RefreshBehavior>;
```

### 2. Create AuraFlags Schema

**File:** `packages/wowlab-core/src/internal/schemas/aura/AuraFlags.ts`

```typescript
import { Schema } from "effect";

export class AuraFlags extends Schema.Class<AuraFlags>("AuraFlags")({
  pandemicRefresh: Schema.Boolean, // SX_REFRESH_EXTENDS_DURATION (436)
  hastedTicks: Schema.Boolean, // SX_DOT_HASTED (173)
  tickOnApplication: Schema.Boolean, // SX_TICK_ON_APPLICATION (169)
  durationHasted: Schema.Boolean, // SX_DURATION_HASTED (273)
  rollingPeriodic: Schema.Boolean, // SX_ROLLING_PERIODIC (334)
  tickMayCrit: Schema.Boolean, // SX_TICK_MAY_CRIT (265)
}) {}
```

### 3. Create AuraDefinition Schema

**File:** `packages/wowlab-core/src/internal/schemas/aura/AuraDefinition.ts`

```typescript
import { Schema } from "effect";
import { RefreshBehavior } from "./RefreshBehavior.js";
import { AuraFlags } from "./AuraFlags.js";

export const PeriodicType = Schema.Literal("damage", "heal");
export type PeriodicType = Schema.Schema.Type<typeof PeriodicType>;

export class AuraDefinition extends Schema.Class<AuraDefinition>(
  "AuraDefinition",
)({
  spellId: Schema.Number,
  baseDurationMs: Schema.Number, // From SpellDuration table
  maxStacks: Schema.Number, // From SpellAuraOptions.CumulativeAura (default 1)
  tickPeriodMs: Schema.optionalWith(Schema.Number, { exact: true }), // From SpellEffect.EffectAuraPeriod
  periodicType: Schema.optionalWith(PeriodicType, { exact: true }), // "damage" or "heal" based on EffectAura
  refreshBehavior: RefreshBehavior,
  flags: AuraFlags,
}) {}
```

### 4. Create AuraScheduleState Schema

**File:** `packages/wowlab-core/src/internal/schemas/aura/AuraScheduleState.ts`

This is the key structure that tracks scheduled events for validity checking.

```typescript
import { Schema } from "effect";
import { RefreshBehavior } from "./RefreshBehavior.js";

export class AuraScheduleState extends Schema.Class<AuraScheduleState>(
  "AuraScheduleState",
)({
  // Removal scheduling
  removalAt: Schema.Number, // When removal is scheduled (seconds, sim time)
  removalGeneration: Schema.Number, // Incremented on each reschedule

  // Tick scheduling
  tickAt: Schema.optionalWith(Schema.Number, { exact: true }),
  tickGeneration: Schema.Number,
  tickProgress: Schema.optionalWith(Schema.Number, { exact: true }), // Fraction of current tick elapsed

  // Cached from spell data (avoid re-lookups)
  baseDurationMs: Schema.Number,
  pandemicCapMs: Schema.Number, // baseDuration * 0.3
  refreshBehavior: RefreshBehavior,
  tickPeriodMs: Schema.optionalWith(Schema.Number, { exact: true }),
  hastedTicks: Schema.Boolean,
  tickOnApplication: Schema.Boolean,
  stackCap: Schema.Number,

  // For haste calculations
  casterUnitId: Schema.String,
  hasteSnapshot: Schema.optionalWith(Schema.Number, { exact: true }),
}) {}
```

### 5. Create Spell Attribute Constants

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

// Helper function
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

### 6. Update Unit.AuraCollection Meta Type

**File:** `packages/wowlab-core/src/internal/entities/Unit.ts`

Update the `AuraCollection` interface to properly type the `meta` field:

```typescript
import { Map as ImmutableMap } from "immutable";
import type { AuraScheduleState } from "../schemas/aura/AuraScheduleState.js";
import type { SpellID } from "../branded/SpellID.js";

interface AuraCollectionMeta {
  schedules: ImmutableMap<SpellID, AuraScheduleState>;
}

interface AuraCollection {
  all: ImmutableMap<SpellID, Aura>;
  meta: AuraCollectionMeta;
}
```

### 7. Create Index File

**File:** `packages/wowlab-core/src/internal/schemas/aura/index.ts`

```typescript
export { RefreshBehavior } from "./RefreshBehavior.js";
export { AuraFlags } from "./AuraFlags.js";
export { AuraDefinition, PeriodicType } from "./AuraDefinition.js";
export { AuraScheduleState } from "./AuraScheduleState.js";
```

## Verification

After implementation, verify:

1. All schemas compile without errors
2. `AuraScheduleState` can be created and serialized
3. `hasSpellAttribute` correctly decodes bitmasks:
   ```typescript
   // Test: SX_REFRESH_EXTENDS_DURATION = 436
   // Column 13, Bit 20, so Attributes_13 & (1 << 20)
   const attrs = { Attributes_13: 1048576 }; // 1 << 20
   assert(hasSpellAttribute(attrs, 436) === true);
   ```

## Next Phase

Once complete, proceed to `04-phase2-aura-definition-service.md` to implement loading spell data.
