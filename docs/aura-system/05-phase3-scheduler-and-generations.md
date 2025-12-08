# Phase 3: Scheduler and Generation-Based Cancellation

## Goal

Implement the core scheduling logic with generation-based validity checking.

## Prerequisites

- Phase 1 complete (`AuraDataFlat` schema and constants)
- Phase 2 complete (`AuraService` and `transformAura`)

## Architecture

**Runtime state lives in wowlab-services**, not wowlab-core.

```
AuraDataFlat (wowlab-core)     ← Static definition from DBC
       ↓
AuraScheduleState (wowlab-services)  ← Runtime scheduling state
       ↓
Unit.auras.meta.schedules      ← Per-unit schedule tracking
```

## The Key Insight

We cannot cancel events from TinyQueue. Instead:

1. Store a `removalGeneration` counter in `AuraScheduleState`
2. Embed the generation in the scheduled `SPELL_AURA_REMOVED` event
3. When the event fires, compare generations
4. If mismatch → event is stale, ignore it

## Tasks

### 1. Create AuraScheduleState Type

**File:** `packages/wowlab-services/src/internal/aura/AuraScheduleState.ts`

This is runtime state, NOT a Schema.Class. Plain TypeScript interface.

```typescript
import type { RefreshBehavior } from "@wowlab/core/Schemas";

/**
 * Runtime scheduling state for an active aura.
 * Stored in Unit.auras.meta.schedules (Immutable.Map).
 *
 * This is NOT static definition data - it changes during simulation.
 */
export interface AuraScheduleState {
  // Removal scheduling
  readonly removalAt: number; // When removal is scheduled (seconds, sim time)
  readonly removalGeneration: number; // Incremented on each reschedule

  // Tick scheduling
  readonly tickAt: number | undefined;
  readonly tickGeneration: number;
  readonly tickProgress: number | undefined; // Fraction of current tick elapsed (0-1)

  // Cached from AuraDataFlat (avoid repeated lookups)
  readonly baseDurationMs: number;
  readonly pandemicCapMs: number; // baseDuration * 0.3
  readonly refreshBehavior: RefreshBehavior;
  readonly tickPeriodMs: number; // 0 if not periodic
  readonly hastedTicks: boolean;
  readonly tickOnApplication: boolean;
  readonly stackCap: number;

  // For haste calculations
  readonly casterUnitId: string;
  readonly hasteSnapshot: number | undefined; // Snapshot haste at application
}

/**
 * Create a new schedule state (immutable update).
 */
export function updateScheduleState(
  state: AuraScheduleState,
  updates: Partial<AuraScheduleState>,
): AuraScheduleState {
  return { ...state, ...updates };
}
```

### 2. Create RefreshCalculator

**File:** `packages/wowlab-services/src/internal/aura/RefreshCalculator.ts`

```typescript
import type { AuraDataFlat, RefreshBehavior } from "@wowlab/core/Schemas";
import type { AuraScheduleState } from "./AuraScheduleState.js";

/**
 * Calculate new duration when refreshing an aura.
 *
 * @param currentTime - Current simulation time (seconds)
 * @param schedule - Current schedule state
 * @param auraData - Aura definition with refresh behavior
 * @returns New duration in milliseconds, or 0 if refresh is disabled
 */
export function resolveRefreshDuration(
  currentTime: number,
  schedule: AuraScheduleState,
  auraData: AuraDataFlat,
): number {
  const remainingMs = Math.max(0, (schedule.removalAt - currentTime) * 1000);
  const baseMs = auraData.baseDurationMs;

  switch (auraData.refreshBehavior) {
    case "disabled":
      return 0;

    case "duration":
      return baseMs;

    case "pandemic": {
      const cap = baseMs * 0.3;
      const carry = Math.min(remainingMs, cap);
      return baseMs + carry;
    }

    case "extend":
      return remainingMs + baseMs;

    case "tick": {
      const tickProgress = schedule.tickProgress ?? 0;
      const tickCarry = tickProgress * auraData.tickPeriodMs;
      return baseMs + tickCarry;
    }

    case "max":
      return Math.max(remainingMs, baseMs);

    default:
      return baseMs;
  }
}

/**
 * Calculate hasted tick period.
 */
export function getHastedTickPeriod(
  baseTickPeriodMs: number,
  hastePercent: number,
  isHasted: boolean,
): number {
  if (!isHasted) return baseTickPeriodMs;
  return baseTickPeriodMs / (1 + hastePercent);
}
```

### 3. Create AuraScheduler Functions

**File:** `packages/wowlab-services/src/internal/aura/AuraScheduler.ts`

```typescript
import type { AuraDataFlat, Branded } from "@wowlab/core/Schemas";
import type { Emitter } from "../combat-log/Emitter.js";
import type { AuraScheduleState } from "./AuraScheduleState.js";
import { resolveRefreshDuration } from "./RefreshCalculator.js";

/**
 * Create initial schedule state when applying an aura.
 */
export function createScheduleState(
  auraData: AuraDataFlat,
  casterUnitId: string,
  currentTime: number,
  hasteSnapshot?: number,
): AuraScheduleState {
  const removalAt =
    auraData.baseDurationMs > 0
      ? currentTime + auraData.baseDurationMs / 1000
      : Infinity; // Permanent buff

  return {
    removalAt,
    removalGeneration: 1,
    tickGeneration: 0,
    tickAt: undefined,
    tickProgress: undefined,
    baseDurationMs: auraData.baseDurationMs,
    pandemicCapMs: auraData.baseDurationMs * 0.3,
    refreshBehavior: auraData.refreshBehavior,
    tickPeriodMs: auraData.tickPeriodMs,
    hastedTicks: auraData.hastedTicks,
    tickOnApplication: auraData.tickOnApplication,
    stackCap: auraData.maxStacks,
    casterUnitId,
    hasteSnapshot,
  };
}

/**
 * Event base fields needed for scheduling removal events.
 */
export interface RemovalEventBase {
  sourceGUID: string;
  sourceName: string;
  sourceFlags: number;
  sourceRaidFlags: number;
  destGUID: string;
  destName: string;
  destFlags: number;
  destRaidFlags: number;
  spellId: number;
  spellName: string;
  spellSchool: number;
}

/**
 * Schedule aura removal event.
 */
export function scheduleRemoval(
  emitter: Emitter,
  schedule: AuraScheduleState,
  eventBase: RemovalEventBase,
  currentTime: number,
): void {
  if (schedule.baseDurationMs <= 0) return; // Permanent, no removal

  const delayMs = (schedule.removalAt - currentTime) * 1000;
  if (delayMs <= 0) return; // Already expired

  emitter.emitAt(Math.max(0, delayMs), {
    _tag: "SPELL_AURA_REMOVED",
    hideCaster: false,
    ...eventBase,
    auraType: "BUFF", // Will be overridden by caller if needed
    // Custom field for generation checking
    _removalGeneration: schedule.removalGeneration,
  } as any);
}

/**
 * Reschedule aura removal after a refresh.
 * Returns updated schedule state and new duration.
 */
export function rescheduleRemoval(
  emitter: Emitter,
  schedule: AuraScheduleState,
  auraData: AuraDataFlat,
  eventBase: RemovalEventBase,
  currentTime: number,
): { schedule: AuraScheduleState; newDurationMs: number } {
  const newDurationMs = resolveRefreshDuration(currentTime, schedule, auraData);

  if (newDurationMs === 0) {
    return { schedule, newDurationMs: 0 }; // Refresh disabled
  }

  // Create new schedule with incremented generation
  const newSchedule: AuraScheduleState = {
    ...schedule,
    removalGeneration: schedule.removalGeneration + 1,
    removalAt: currentTime + newDurationMs / 1000,
  };

  // Schedule new removal
  scheduleRemoval(emitter, newSchedule, eventBase, currentTime);

  return { schedule: newSchedule, newDurationMs };
}

/**
 * Check if a removal event is still valid.
 */
export function isRemovalValid(
  event: { timestamp: number; _removalGeneration?: number },
  schedule: AuraScheduleState | undefined,
): boolean {
  if (!schedule) return true; // No schedule = always valid (manual removal)

  // Check generation
  if (
    event._removalGeneration !== undefined &&
    event._removalGeneration !== schedule.removalGeneration
  ) {
    return false; // Stale
  }

  // Check timing (with 1ms epsilon)
  if (event.timestamp < schedule.removalAt - 0.001) {
    return false; // Too early
  }

  return true;
}

/**
 * Invalidate schedule for immediate removal (dispel, death, etc.).
 */
export function invalidateSchedule(
  schedule: AuraScheduleState,
): AuraScheduleState {
  return {
    ...schedule,
    removalGeneration: -1,
    tickGeneration: -1,
  };
}
```

### 4. Create Schedule State Helpers for Unit

**File:** `packages/wowlab-services/src/internal/aura/ScheduleStateHelpers.ts`

```typescript
import { Map as ImmutableMap } from "immutable";
import type { Unit } from "@wowlab/core/Entities";
import type { Branded } from "@wowlab/core/Schemas";
import type { AuraScheduleState } from "./AuraScheduleState.js";

/**
 * Get schedule state for an aura on a unit.
 */
export function getSchedule(
  schedules: ImmutableMap<Branded.SpellID, AuraScheduleState>,
  spellId: Branded.SpellID,
): AuraScheduleState | undefined {
  return schedules.get(spellId);
}

/**
 * Set schedule state for an aura.
 * Returns new schedules map (immutable).
 */
export function setSchedule(
  schedules: ImmutableMap<Branded.SpellID, AuraScheduleState>,
  spellId: Branded.SpellID,
  schedule: AuraScheduleState,
): ImmutableMap<Branded.SpellID, AuraScheduleState> {
  return schedules.set(spellId, schedule);
}

/**
 * Delete schedule state for an aura.
 * Returns new schedules map (immutable).
 */
export function deleteSchedule(
  schedules: ImmutableMap<Branded.SpellID, AuraScheduleState>,
  spellId: Branded.SpellID,
): ImmutableMap<Branded.SpellID, AuraScheduleState> {
  return schedules.delete(spellId);
}
```

### 5. Create Index Export

**File:** `packages/wowlab-services/src/internal/aura/index.ts`

```typescript
export { AuraService, AuraNotFoundError } from "./AuraService.js";
export { AuraServiceLive } from "./AuraServiceImpl.js";

export type { AuraScheduleState } from "./AuraScheduleState.js";
export { updateScheduleState } from "./AuraScheduleState.js";

export {
  resolveRefreshDuration,
  getHastedTickPeriod,
} from "./RefreshCalculator.js";

export {
  createScheduleState,
  scheduleRemoval,
  rescheduleRemoval,
  isRemovalValid,
  invalidateSchedule,
} from "./AuraScheduler.js";

export type { RemovalEventBase } from "./AuraScheduler.js";

export {
  getSchedule,
  setSchedule,
  deleteSchedule,
} from "./ScheduleStateHelpers.js";
```

## Verification

Test the refresh calculation:

```typescript
import { resolveRefreshDuration } from "./RefreshCalculator.js";
import type { AuraScheduleState } from "./AuraScheduleState.js";
import type { AuraDataFlat } from "@wowlab/core/Schemas";

// Test pandemic refresh
const schedule: AuraScheduleState = {
  removalAt: 10.0, // Expires at t=10
  removalGeneration: 1,
  tickGeneration: 0,
  tickAt: undefined,
  tickProgress: undefined,
  baseDurationMs: 12000, // 12s base
  pandemicCapMs: 3600, // 30% = 3.6s
  refreshBehavior: "pandemic",
  tickPeriodMs: 0,
  hastedTicks: false,
  tickOnApplication: false,
  stackCap: 1,
  casterUnitId: "player",
  hasteSnapshot: undefined,
};

const auraData: AuraDataFlat = {
  spellId: 172 as any,
  baseDurationMs: 12000,
  maxDurationMs: 12000,
  maxStacks: 1,
  tickPeriodMs: 0,
  periodicType: null,
  refreshBehavior: "pandemic",
  pandemicRefresh: true,
  hastedTicks: false,
  tickOnApplication: false,
  durationHasted: false,
  rollingPeriodic: false,
  tickMayCrit: false,
};

// At t=6, remaining = 4s
const currentTime = 6.0;
const newDuration = resolveRefreshDuration(currentTime, schedule, auraData);

// Expected: 12000 + min(4000, 3600) = 15600ms
console.assert(newDuration === 15600);
```

Test generation validity:

```typescript
import { isRemovalValid } from "./AuraScheduler.js";

const schedule: AuraScheduleState = {
  removalAt: 10.0,
  removalGeneration: 3,
  // ... other fields
};

// Stale event (wrong generation)
const staleEvent = { timestamp: 10.0, _removalGeneration: 2 };
console.assert(isRemovalValid(staleEvent, schedule) === false);

// Valid event (correct generation)
const validEvent = { timestamp: 10.0, _removalGeneration: 3 };
console.assert(isRemovalValid(validEvent, schedule) === true);
```

## Next Phase

Once complete, proceed to `06-phase4-handler-integration.md` to integrate with the existing aura handlers.
