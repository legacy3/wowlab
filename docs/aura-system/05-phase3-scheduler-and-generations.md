# Phase 3: Scheduler and Generation-Based Cancellation

## Goal

Implement the core scheduling logic with generation-based validity checking.

## Prerequisites

- Phase 1 complete (data structures)
- Phase 2 complete (AuraDefinitionService)

## The Key Insight

We cannot cancel events from TinyQueue. Instead:

1. Store a `removalGeneration` counter in `AuraScheduleState`
2. Embed the generation in the scheduled `SPELL_AURA_REMOVED` event
3. When the event fires, compare generations
4. If mismatch → event is stale, ignore it

## Tasks

### 1. Create RefreshCalculator

**File:** `packages/wowlab-services/src/internal/aura/RefreshCalculator.ts`

```typescript
import type {
  AuraDefinition,
  AuraScheduleState,
  RefreshBehavior,
} from "@wowlab/core/schemas/aura";

/**
 * Calculate new duration when refreshing an aura.
 *
 * @param currentTime - Current simulation time (seconds)
 * @param schedule - Current schedule state
 * @param definition - Aura definition with refresh behavior
 * @returns New duration in milliseconds, or 0 if refresh is disabled
 */
export function resolveRefreshDuration(
  currentTime: number,
  schedule: AuraScheduleState,
  definition: AuraDefinition,
): number {
  const remainingMs = Math.max(0, (schedule.removalAt - currentTime) * 1000);
  const baseMs = definition.baseDurationMs;

  switch (definition.refreshBehavior) {
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
      const tickCarry = tickProgress * (definition.tickPeriodMs ?? 0);
      return baseMs + tickCarry;
    }

    case "max":
      return Math.max(remainingMs, baseMs);

    case "custom":
      // Future: per-spell callbacks
      return baseMs;

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

### 2. Create AuraScheduler Service

**File:** `packages/wowlab-services/src/internal/aura/AuraScheduler.ts`

```typescript
import { Effect } from "effect";
import { Map as ImmutableMap } from "immutable";
import type {
  AuraDefinition,
  AuraScheduleState,
} from "@wowlab/core/schemas/aura";
import type { SpellID, UnitID } from "@wowlab/core/branded";
import type { Emitter } from "../combat-log/Emitter.js";
import {
  resolveRefreshDuration,
  getHastedTickPeriod,
} from "./RefreshCalculator.js";

/**
 * Create initial schedule state when applying an aura.
 */
export function createScheduleState(
  definition: AuraDefinition,
  casterUnitId: string,
  currentTime: number,
  hasteSnapshot?: number,
): AuraScheduleState {
  const removalAt =
    definition.baseDurationMs > 0
      ? currentTime + definition.baseDurationMs / 1000
      : Infinity; // Permanent buff

  return {
    removalAt,
    removalGeneration: 1,
    tickGeneration: 0,
    tickAt: undefined,
    tickProgress: undefined,
    baseDurationMs: definition.baseDurationMs,
    pandemicCapMs: definition.baseDurationMs * 0.3,
    refreshBehavior: definition.refreshBehavior,
    tickPeriodMs: definition.tickPeriodMs,
    hastedTicks: definition.flags.hastedTicks,
    tickOnApplication: definition.flags.tickOnApplication,
    stackCap: definition.maxStacks,
    casterUnitId,
    hasteSnapshot,
  };
}

/**
 * Schedule aura removal event.
 *
 * @param emitter - Event emitter
 * @param schedule - Current schedule state (will be mutated)
 * @param eventBase - Base fields for the SPELL_AURA_REMOVED event
 */
export function scheduleRemoval(
  emitter: Emitter,
  schedule: AuraScheduleState,
  eventBase: {
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
  },
): void {
  if (schedule.baseDurationMs <= 0) return; // Permanent, no removal

  const delayMs = (schedule.removalAt - emitter.currentTime) * 1000;
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
 *
 * @param emitter - Event emitter
 * @param schedule - Current schedule state (will be mutated)
 * @param definition - Aura definition
 * @param eventBase - Base event fields
 * @returns New removal time, or 0 if refresh is disabled
 */
export function rescheduleRemoval(
  emitter: Emitter,
  schedule: AuraScheduleState,
  definition: AuraDefinition,
  eventBase: Parameters<typeof scheduleRemoval>[2],
): number {
  const newDurationMs = resolveRefreshDuration(
    emitter.currentTime,
    schedule,
    definition,
  );

  if (newDurationMs === 0) return 0; // Refresh disabled

  // Increment generation to invalidate any pending removal
  schedule.removalGeneration++;
  schedule.removalAt = emitter.currentTime + newDurationMs / 1000;

  // Schedule new removal
  scheduleRemoval(emitter, schedule, eventBase);

  return newDurationMs;
}

/**
 * Check if a removal event is still valid.
 *
 * @param event - The SPELL_AURA_REMOVED event
 * @param schedule - Current schedule state
 * @returns true if the event should be processed, false if stale
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
 * Mark an aura for immediate removal (dispel, death, etc.).
 * Sets generation to -1 so any pending scheduled removal will be ignored.
 */
export function invalidateSchedule(schedule: AuraScheduleState): void {
  schedule.removalGeneration = -1;
  schedule.tickGeneration = -1;
}
```

### 3. Create ScheduleState Helpers for Unit

**File:** `packages/wowlab-services/src/internal/aura/ScheduleStateHelpers.ts`

```typescript
import { Map as ImmutableMap } from "immutable";
import type { Unit } from "@wowlab/core/entities";
import type { AuraScheduleState } from "@wowlab/core/schemas/aura";
import type { SpellID } from "@wowlab/core/branded";

/**
 * Get schedule state for an aura on a unit.
 */
export function getSchedule(
  unit: Unit,
  spellId: SpellID,
): AuraScheduleState | undefined {
  return unit.auras.meta.schedules?.get(spellId);
}

/**
 * Set schedule state for an aura on a unit.
 * Returns a new Unit instance (immutable update).
 */
export function setSchedule(
  unit: Unit,
  spellId: SpellID,
  schedule: AuraScheduleState,
): Unit {
  const currentSchedules = unit.auras.meta.schedules ?? ImmutableMap();
  const newSchedules = currentSchedules.set(spellId, schedule);

  return unit.setIn(["auras", "meta", "schedules"], newSchedules);
}

/**
 * Delete schedule state for an aura on a unit.
 * Returns a new Unit instance (immutable update).
 */
export function deleteSchedule(unit: Unit, spellId: SpellID): Unit {
  const currentSchedules = unit.auras.meta.schedules;
  if (!currentSchedules) return unit;

  const newSchedules = currentSchedules.delete(spellId);
  return unit.setIn(["auras", "meta", "schedules"], newSchedules);
}
```

### 4. Update Index Export

**File:** `packages/wowlab-services/src/internal/aura/index.ts`

```typescript
export {
  AuraDefinitionService,
  SpellNotFoundError,
} from "./AuraDefinitionService.js";
export { AuraDefinitionServiceLive } from "./AuraDefinitionServiceImpl.js";
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

// Test pandemic refresh
const schedule: AuraScheduleState = {
  removalAt: 10.0, // Expires at t=10
  removalGeneration: 1,
  baseDurationMs: 12000, // 12s base
  pandemicCapMs: 3600, // 30% = 3.6s
  refreshBehavior: "pandemic",
  // ... other fields
};

const definition: AuraDefinition = {
  baseDurationMs: 12000,
  refreshBehavior: "pandemic",
  // ... other fields
};

// At t=6, remaining = 4s
const currentTime = 6.0;
const newDuration = resolveRefreshDuration(currentTime, schedule, definition);

// Expected: 12000 + min(4000, 3600) = 15600ms
console.assert(newDuration === 15600);
```

Test generation validity:

```typescript
import { isRemovalValid } from "./AuraScheduler.js";

const schedule: AuraScheduleState = {
  removalAt: 10.0,
  removalGeneration: 3,
  // ...
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
