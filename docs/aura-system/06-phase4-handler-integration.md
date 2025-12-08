# Phase 4: Handler Integration

## Goal

Integrate the scheduling system with the aura event handlers.

## Prerequisites

- Phase 1-3 complete

## Tasks

### 1. Update SPELL_AURA_APPLIED Handler

**File:** `packages/wowlab-services/src/internal/combat-log/handlers/aura.ts`

```typescript
import { Effect } from "effect";
import { StateService } from "../../state/StateService.js";
import { AuraDefinitionService } from "../../aura/AuraDefinitionService.js";
import {
  createScheduleState,
  scheduleRemoval,
  setSchedule,
} from "../../aura/index.js";
import { Aura } from "@wowlab/core/entities";
import type { SpellAuraApplied } from "@wowlab/core/schemas/combat-log";
import type { Emitter } from "../Emitter.js";

export const applyAura = (event: SpellAuraApplied, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const definition = yield* AuraDefinitionService.getDefinition(
      event.spellId,
    );

    // Get caster's haste for snapshot (if applicable)
    const caster = state.units.get(event.sourceGUID);
    const hasteSnapshot = caster?.paperDoll?.haste;

    // Create schedule state
    const schedule = createScheduleState(
      definition,
      event.sourceGUID,
      state.currentTime,
      hasteSnapshot,
    );

    // Create the aura entity
    const aura = Aura.create(
      {
        casterUnitId: event.sourceGUID,
        expiresAt: schedule.removalAt,
        info: {
          spellId: event.spellId,
          name: event.spellName,
          school: event.spellSchool,
          duration: definition.baseDurationMs / 1000,
        },
        stacks: Math.min(event.amount ?? 1, definition.maxStacks),
      },
      state.currentTime,
    );

    // Update unit with aura and schedule
    let updatedUnit = unit.setIn(["auras", "all", event.spellId], aura);
    updatedUnit = setSchedule(updatedUnit, event.spellId, schedule);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );

    // Schedule removal event
    scheduleRemoval(emitter, schedule, {
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
    });
  });
```

### 2. Update SPELL_AURA_REMOVED Handler

```typescript
import {
  isRemovalValid,
  getSchedule,
  deleteSchedule,
} from "../../aura/index.js";

export const removeAura = (event: SpellAuraRemoved, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    // Check if aura exists
    const existingAura = unit.auras.all.get(event.spellId);
    if (!existingAura) return;

    // Get schedule and check if this removal is still valid
    const schedule = getSchedule(unit, event.spellId);

    if (!isRemovalValid(event as any, schedule)) {
      // Stale removal event - ignore it
      return;
    }

    // Actually remove the aura and schedule
    let updatedUnit = unit.deleteIn(["auras", "all", event.spellId]);
    updatedUnit = deleteSchedule(updatedUnit, event.spellId);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );
  });
```

### 3. Update SPELL_AURA_REFRESH Handler

```typescript
import {
  rescheduleRemoval,
  getSchedule,
  setSchedule,
} from "../../aura/index.js";

export const refreshAura = (event: SpellAuraRefresh, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const existingAura = unit.auras.all.get(event.spellId);
    if (!existingAura) return;

    const schedule = getSchedule(unit, event.spellId);
    if (!schedule) return;

    const definition = yield* AuraDefinitionService.getDefinition(
      event.spellId,
    );

    // Calculate new duration and reschedule
    const newDurationMs = rescheduleRemoval(emitter, schedule, definition, {
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
    });

    if (newDurationMs === 0) return; // Refresh disabled

    // Update aura expiry
    const updatedAura = existingAura.with(
      { expiresAt: schedule.removalAt },
      state.currentTime,
    );

    // Update unit
    let updatedUnit = unit.setIn(["auras", "all", event.spellId], updatedAura);
    updatedUnit = setSchedule(updatedUnit, event.spellId, schedule);

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID], updatedUnit),
    );
  });
```

### 4. Update SPELL_AURA_APPLIED_DOSE Handler

```typescript
export const addAuraStacks = (event: SpellAuraAppliedDose, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const existingAura = unit.auras.all.get(event.spellId);
    if (!existingAura) return;

    const schedule = getSchedule(unit, event.spellId);

    // Clamp to max stacks
    const maxStacks = schedule?.stackCap ?? 999;
    const newStacks = Math.min(
      event.amount ?? existingAura.stacks + 1,
      maxStacks,
    );

    const updatedAura = existingAura.with(
      { stacks: newStacks },
      state.currentTime,
    );

    yield* StateService.updateState((s) =>
      s.setIn(
        ["units", event.destGUID, "auras", "all", event.spellId],
        updatedAura,
      ),
    );
  });
```

### 5. Update SPELL_AURA_REMOVED_DOSE Handler

```typescript
export const removeAuraStacks = (
  event: SpellAuraRemovedDose,
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const existingAura = unit.auras.all.get(event.spellId);
    if (!existingAura) return;

    const amountToRemove = event.amount ?? 1;
    const newStacks = Math.max(0, existingAura.stacks - amountToRemove);

    if (newStacks === 0) {
      // Stack depleted - could trigger removal
      // For now, just update to 0 stacks
      // The aura will be removed by a separate SPELL_AURA_REMOVED event
    }

    const updatedAura = existingAura.with(
      { stacks: newStacks },
      state.currentTime,
    );

    yield* StateService.updateState((s) =>
      s.setIn(
        ["units", event.destGUID, "auras", "all", event.spellId],
        updatedAura,
      ),
    );
  });
```

### 6. Register Handlers with Dependencies

Update the handler registration to include the new services:

```typescript
// In handler registration
export const AURA_MUTATIONS: HandlerRegistration[] = [
  {
    subevent: "SPELL_AURA_APPLIED",
    handler: applyAura,
    priority: 1000,
    id: "state:SPELL_AURA_APPLIED",
  },
  {
    subevent: "SPELL_AURA_REMOVED",
    handler: removeAura,
    priority: 1000,
    id: "state:SPELL_AURA_REMOVED",
  },
  {
    subevent: "SPELL_AURA_REFRESH",
    handler: refreshAura,
    priority: 1000,
    id: "state:SPELL_AURA_REFRESH",
  },
  {
    subevent: "SPELL_AURA_APPLIED_DOSE",
    handler: addAuraStacks,
    priority: 1000,
    id: "state:SPELL_AURA_APPLIED_DOSE",
  },
  {
    subevent: "SPELL_AURA_REMOVED_DOSE",
    handler: removeAuraStacks,
    priority: 1000,
    id: "state:SPELL_AURA_REMOVED_DOSE",
  },
];
```

### 7. Update SimDriver Layer

Ensure `AuraDefinitionService` is provided in the SimDriver's layer:

```typescript
// In SimDriver setup
const SimDriverLive = Layer.mergeAll(
  StateServiceLive,
  HandlerRegistryLive,
  EventQueueLive,
  AuraDefinitionServiceLive, // Add this
  // ... other layers
);
```

## Verification

Test the full flow:

```typescript
const testProgram = Effect.gen(function* () {
  const driver = yield* SimDriver;

  // Apply an aura at t=0
  yield* driver.processEvent({
    _tag: "SPELL_AURA_APPLIED",
    timestamp: 0,
    spellId: 172, // Corruption
    destGUID: "Player-1",
    // ... other fields
  });

  // Check state - aura should exist with schedule
  const state1 = yield* StateService.getState();
  const unit1 = state1.units.get("Player-1");
  const aura1 = unit1?.auras.all.get(172);
  const schedule1 = unit1?.auras.meta.schedules?.get(172);

  console.assert(aura1 !== undefined);
  console.assert(schedule1?.removalGeneration === 1);

  // Refresh at t=10 (before expiry)
  yield* driver.processEvent({
    _tag: "SPELL_AURA_REFRESH",
    timestamp: 10,
    spellId: 172,
    destGUID: "Player-1",
    // ...
  });

  // Check schedule was updated
  const state2 = yield* StateService.getState();
  const schedule2 = state2.units
    .get("Player-1")
    ?.auras.meta.schedules?.get(172);

  console.assert(schedule2?.removalGeneration === 2); // Incremented
  console.assert(schedule2?.removalAt > 10); // Extended

  // Process the OLD removal event (from first application)
  // It should be ignored because generation doesn't match
  yield* driver.processEvent({
    _tag: "SPELL_AURA_REMOVED",
    timestamp: 14, // Original expiry time
    spellId: 172,
    destGUID: "Player-1",
    _removalGeneration: 1, // Old generation
    // ...
  });

  // Aura should still exist!
  const state3 = yield* StateService.getState();
  const aura3 = state3.units.get("Player-1")?.auras.all.get(172);
  console.assert(
    aura3 !== undefined,
    "Aura should NOT be removed by stale event",
  );
});
```

## Edge Cases Handled

1. **Stale removal** - Ignored via generation check
2. **Stack cap** - Enforced from spell data
3. **Permanent buffs** - No removal scheduled if duration ≤ 0
4. **Missing spell data** - `SpellNotFoundError` propagates (caller must ensure spell data exists)

## Next Phase

Once complete, proceed to `07-phase5-periodic-ticks.md` to implement periodic tick scheduling.
