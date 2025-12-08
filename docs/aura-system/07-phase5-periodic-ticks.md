# Phase 5: Periodic Tick Scheduling

## Goal

Implement scheduling for periodic damage/heal ticks (DoTs/HoTs).

## Prerequisites

- Phase 1-4 complete
- Understand tick behavior from `01-reference-simc-behaviors.md`

## Key Concepts

1. **Tick Period** - From `SpellEffect.EffectAuraPeriod` (milliseconds)
2. **Hasted Ticks** - If `SX_DOT_HASTED` flag, period = base / (1 + haste)
3. **Tick on Application** - If `SX_TICK_ON_APPLICATION`, first tick fires immediately
4. **Generation Checking** - Same as removal, use `tickGeneration` to invalidate stale ticks

## Tasks

### 1. Add Tick Scheduling to AuraScheduler

**File:** `packages/wowlab-services/src/internal/aura/AuraScheduler.ts`

Add these functions:

```typescript
import type {
  AuraDefinition,
  AuraScheduleState,
} from "@wowlab/core/schemas/aura";
import type { Emitter } from "../combat-log/Emitter.js";
import { getHastedTickPeriod } from "./RefreshCalculator.js";

/**
 * Schedule the first tick when an aura is applied.
 */
export function scheduleInitialTick(
  emitter: Emitter,
  schedule: AuraScheduleState,
  definition: AuraDefinition,
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
  auraType: "damage" | "heal",
): void {
  if (!definition.tickPeriodMs || definition.tickPeriodMs <= 0) return;

  // Calculate hasted tick period
  const tickPeriodMs = getHastedTickPeriod(
    definition.tickPeriodMs,
    schedule.hasteSnapshot ?? 0,
    definition.flags.hastedTicks,
  );

  // Determine first tick delay
  const firstTickDelay = definition.flags.tickOnApplication ? 0 : tickPeriodMs;

  // Update schedule
  schedule.tickGeneration++;
  schedule.tickAt = emitter.currentTime + firstTickDelay / 1000;
  schedule.tickProgress = 0;

  // Emit the tick event
  const tickEvent =
    auraType === "damage" ? "SPELL_PERIODIC_DAMAGE" : "SPELL_PERIODIC_HEAL";

  emitter.emitAt(firstTickDelay, {
    _tag: tickEvent,
    hideCaster: false,
    timestamp: 0, // Will be set by emitAt
    ...eventBase,
    amount: 0, // Placeholder - actual damage calculated elsewhere
    overkill: 0,
    school: eventBase.spellSchool,
    resisted: 0,
    blocked: 0,
    absorbed: 0,
    critical: false,
    // Custom field for generation checking
    _tickGeneration: schedule.tickGeneration,
    _tickPeriodMs: tickPeriodMs,
  } as any);
}

/**
 * Schedule the next tick after one fires.
 */
export function scheduleNextTick(
  emitter: Emitter,
  schedule: AuraScheduleState,
  eventBase: Parameters<typeof scheduleInitialTick>[3],
  auraType: "damage" | "heal",
): void {
  // Check if aura is still active
  if (emitter.currentTime >= schedule.removalAt) return;

  const tickPeriodMs = getHastedTickPeriod(
    schedule.tickPeriodMs ?? 0,
    schedule.hasteSnapshot ?? 0,
    schedule.hastedTicks,
  );

  if (tickPeriodMs <= 0) return;

  // Update schedule
  schedule.tickGeneration++;
  schedule.tickAt = emitter.currentTime + tickPeriodMs / 1000;
  schedule.tickProgress = 0;

  const tickEvent =
    auraType === "damage" ? "SPELL_PERIODIC_DAMAGE" : "SPELL_PERIODIC_HEAL";

  emitter.emitAt(tickPeriodMs, {
    _tag: tickEvent,
    hideCaster: false,
    timestamp: 0,
    ...eventBase,
    amount: 0,
    overkill: 0,
    school: eventBase.spellSchool,
    resisted: 0,
    blocked: 0,
    absorbed: 0,
    critical: false,
    _tickGeneration: schedule.tickGeneration,
    _tickPeriodMs: tickPeriodMs,
  } as any);
}

/**
 * Reschedule ticks when an aura is refreshed.
 * Preserves tick progress for smooth continuation.
 */
export function rescheduleTicksOnRefresh(
  emitter: Emitter,
  schedule: AuraScheduleState,
  eventBase: Parameters<typeof scheduleInitialTick>[3],
  auraType: "damage" | "heal",
): void {
  if (!schedule.tickPeriodMs || schedule.tickPeriodMs <= 0) return;
  if (!schedule.tickAt) return;

  const tickPeriodMs = getHastedTickPeriod(
    schedule.tickPeriodMs,
    schedule.hasteSnapshot ?? 0,
    schedule.hastedTicks,
  );

  // Calculate how much of the current tick has elapsed
  const previousTickAt = schedule.tickAt - tickPeriodMs / 1000;
  const elapsed = emitter.currentTime - previousTickAt;
  const tickPeriodSec = tickPeriodMs / 1000;

  // Handle wrap-around for multiple ticks
  const progress = Math.max(
    0,
    Math.min(1, (elapsed % tickPeriodSec) / tickPeriodSec),
  );
  schedule.tickProgress = progress;

  // Continue from where we were in the tick cycle
  const remainingTickTime = (1 - progress) * tickPeriodMs;

  // Increment generation to invalidate any pending tick
  schedule.tickGeneration++;
  schedule.tickAt = emitter.currentTime + remainingTickTime / 1000;

  const tickEvent =
    auraType === "damage" ? "SPELL_PERIODIC_DAMAGE" : "SPELL_PERIODIC_HEAL";

  emitter.emitAt(remainingTickTime, {
    _tag: tickEvent,
    hideCaster: false,
    timestamp: 0,
    ...eventBase,
    amount: 0,
    overkill: 0,
    school: eventBase.spellSchool,
    resisted: 0,
    blocked: 0,
    absorbed: 0,
    critical: false,
    _tickGeneration: schedule.tickGeneration,
    _tickPeriodMs: tickPeriodMs,
  } as any);
}

/**
 * Check if a tick event is still valid.
 */
export function isTickValid(
  event: { _tickGeneration?: number },
  schedule: AuraScheduleState | undefined,
): boolean {
  if (!schedule) return false; // Aura doesn't exist

  if (
    event._tickGeneration !== undefined &&
    event._tickGeneration !== schedule.tickGeneration
  ) {
    return false; // Stale tick
  }

  return true;
}
```

### 2. Update Apply Handler to Schedule Initial Tick

In `applyAura`:

```typescript
// After scheduling removal...

// Schedule initial tick if periodic
if (definition.tickPeriodMs && definition.tickPeriodMs > 0) {
  // Determine aura type from effect
  const auraType = determineAuraType(definition); // "damage" or "heal"

  scheduleInitialTick(
    emitter,
    schedule,
    definition,
    {
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceFlags: event.sourceFlags,
      sourceRaidFlags: event.sourceRaidFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destFlags: event.destFlags,
      destRaidFlags: event.destRaidFlags,
      spellId: event.spellId,
      spellName: event.spellName,
      spellSchool: event.spellSchool,
    },
    auraType,
  );
}

// Helper function - uses periodicType stored in AuraDefinition
function determineAuraType(definition: AuraDefinition): "damage" | "heal" {
  return definition.periodicType ?? "damage";
}
```

### 3. Update Refresh Handler to Reschedule Ticks

In `refreshAura`, after rescheduling removal:

```typescript
// Reschedule ticks if periodic
if (definition.tickPeriodMs && definition.tickPeriodMs > 0) {
  const auraType = determineAuraType(definition);

  rescheduleTicksOnRefresh(
    emitter,
    schedule,
    {
      sourceGUID: event.sourceGUID,
      sourceName: event.sourceName,
      sourceFlags: event.sourceFlags,
      sourceRaidFlags: event.sourceRaidFlags,
      destGUID: event.destGUID,
      destName: event.destName,
      destFlags: event.destFlags,
      destRaidFlags: event.destRaidFlags,
      spellId: event.spellId,
      spellName: event.spellName,
      spellSchool: event.spellSchool,
    },
    auraType,
  );
}
```

### 4. Create Periodic Tick Handlers

**File:** `packages/wowlab-services/src/internal/combat-log/handlers/periodic.ts`

```typescript
import { Effect } from "effect";
import { StateService } from "../../state/StateService.js";
import {
  isTickValid,
  scheduleNextTick,
  getSchedule,
  setSchedule,
} from "../../aura/index.js";
import type {
  SpellPeriodicDamage,
  SpellPeriodicHeal,
} from "@wowlab/core/schemas/combat-log";
import type { Emitter } from "../Emitter.js";

export const handlePeriodicDamage = (
  event: SpellPeriodicDamage,
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const schedule = getSchedule(unit, event.spellId);

    // Check if this tick is still valid
    if (!isTickValid(event as any, schedule)) {
      return; // Stale tick - ignore
    }

    if (!schedule) return;

    // Process the tick (damage calculation would go here)
    // For now, just log/emit that the tick happened

    // Schedule the next tick
    scheduleNextTick(
      emitter,
      schedule,
      {
        sourceGUID: event.sourceGUID,
        sourceName: event.sourceName,
        sourceFlags: event.sourceFlags,
        sourceRaidFlags: event.sourceRaidFlags,
        destGUID: event.destGUID,
        destName: event.destName,
        destFlags: event.destFlags,
        destRaidFlags: event.destRaidFlags,
        spellId: event.spellId,
        spellName: event.spellName,
        spellSchool: event.spellSchool,
      },
      "damage",
    );

    // Update schedule in state
    const updatedUnit = setSchedule(unit, event.spellId, schedule);
    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );
  });

export const handlePeriodicHeal = (
  event: SpellPeriodicHeal,
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const schedule = getSchedule(unit, event.spellId);

    if (!isTickValid(event as any, schedule)) {
      return; // Stale tick
    }

    if (!schedule) return;

    // Schedule next tick
    scheduleNextTick(
      emitter,
      schedule,
      {
        sourceGUID: event.sourceGUID,
        sourceName: event.sourceName,
        sourceFlags: event.sourceFlags,
        sourceRaidFlags: event.sourceRaidFlags,
        destGUID: event.destGUID,
        destName: event.destName,
        destFlags: event.destFlags,
        destRaidFlags: event.destRaidFlags,
        spellId: event.spellId,
        spellName: event.spellName,
        spellSchool: event.spellSchool,
      },
      "heal",
    );

    const updatedUnit = setSchedule(unit, event.spellId, schedule);
    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );
  });

export const PERIODIC_HANDLERS: HandlerRegistration[] = [
  {
    subevent: "SPELL_PERIODIC_DAMAGE",
    handler: handlePeriodicDamage,
    priority: 1000,
    id: "state:SPELL_PERIODIC_DAMAGE",
  },
  {
    subevent: "SPELL_PERIODIC_HEAL",
    handler: handlePeriodicHeal,
    priority: 1000,
    id: "state:SPELL_PERIODIC_HEAL",
  },
];
```

### 5. Register Periodic Handlers

Add to handler registration:

```typescript
import { PERIODIC_HANDLERS } from "./handlers/periodic.js";

export const ALL_MUTATIONS = [
  ...AURA_MUTATIONS,
  ...PERIODIC_HANDLERS,
  // ... other handlers
];
```

## Verification

Test periodic tick flow:

```typescript
const testPeriodic = Effect.gen(function* () {
  const driver = yield* SimDriver;

  // Apply a DoT at t=0 (assume 2s tick period, 14s duration)
  yield* driver.processEvent({
    _tag: "SPELL_AURA_APPLIED",
    timestamp: 0,
    spellId: 172, // Corruption
    destGUID: "Target-1",
    sourceGUID: "Player-1",
    // ...
  });

  // Check schedule has tick info
  const state1 = yield* StateService.getState();
  const schedule1 = state1.units
    .get("Target-1")
    ?.auras.meta.schedules?.get(172);

  console.assert(schedule1?.tickGeneration === 1);
  console.assert(schedule1?.tickAt !== undefined);

  // Fast forward - process the first tick at t=2
  yield* driver.runUntil(2.1);

  // Check tick generation incremented
  const state2 = yield* StateService.getState();
  const schedule2 = state2.units
    .get("Target-1")
    ?.auras.meta.schedules?.get(172);

  console.assert(schedule2?.tickGeneration === 2); // Incremented after tick

  // Refresh at t=3
  yield* driver.processEvent({
    _tag: "SPELL_AURA_REFRESH",
    timestamp: 3,
    spellId: 172,
    destGUID: "Target-1",
    // ...
  });

  // Tick generation should increment again
  const state3 = yield* StateService.getState();
  const schedule3 = state3.units
    .get("Target-1")
    ?.auras.meta.schedules?.get(172);

  console.assert(schedule3?.tickGeneration === 3);
  console.assert(schedule3?.tickProgress !== undefined); // Should have progress

  // Old tick event (gen=2) should be ignored when it fires
});
```

## Edge Cases

1. **No tick period** - Skip tick scheduling entirely
2. **Stale ticks** - Generation mismatch, ignore
3. **Aura expired** - Don't schedule next tick if `currentTime >= removalAt`
4. **Tick on application** - First tick fires at delay 0 (immediately)
5. **Hasted ticks** - Apply haste snapshot to period calculation

## Future Improvements

1. **Partial ticks** - Handle the final fractional tick before aura expires
2. **Tick damage calculation** - Integrate with damage formula system
3. **Crit handling** - Use `SX_TICK_MAY_CRIT` flag
4. **Haste changes** - Recalculate tick period if haste changes mid-duration

## Summary

The aura system is now complete with:

| Feature                       | Implementation                          |
| ----------------------------- | --------------------------------------- |
| Duration from spell data      | ✓ AuraDefinitionService                 |
| Pandemic refresh              | ✓ RefreshCalculator                     |
| Generation-based cancellation | ✓ AuraScheduler                         |
| Periodic tick scheduling      | ✓ scheduleInitialTick, scheduleNextTick |
| Tick carryover on refresh     | ✓ rescheduleTicksOnRefresh              |
| Hasted ticks                  | ✓ getHastedTickPeriod                   |
| Tick on application           | ✓ flags.tickOnApplication               |

All components emit standard CLEU events and use the generation counter pattern to handle the non-cancellable queue.
