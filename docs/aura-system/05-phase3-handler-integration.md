# Phase 3: Handler Integration

## Goal

Update aura handlers to use `AuraDataFlat` from simulation config and rely on Event Queue + `getAura(...)` existence checks for stale detection (no timing data on the aura).

## Prerequisites

- Phase 1-2 complete
- Emitter stamps `event.timestamp` when scheduling (see `00-overview.md`)

## Architecture

Aura data flows through the system as immutable config:

```
Simulation Setup:
  transformAura(spellId) → AuraDataFlat → SimulationConfig.auras

Runtime:
  Handler reads from config.auras.get(spellId)
  Handler updates GameState.units[].auras
  Handler schedules events via Emitter
```

## Tasks

### 1. Keep Aura Entity Minimal

**File:** `packages/wowlab-core/src/internal/schemas/Aura.ts`

The runtime `AuraSchema` stores only CLEU-observable fields:

```typescript
export const AuraSchema = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
});
// Future timing (expiration, ticks, cooldowns) stays inside the scheduler/event payloads per 00-data-flow.md.
```

### 2. Update SPELL_AURA_APPLIED Handler

```typescript
export const applyAura = (
  event: SpellAuraApplied,
  emitter: Emitter,
  config: SimulationConfig,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    // Aura stores only CLEU-observable fields
    const aura: Aura = {
      casterUnitId: event.sourceGUID,
      spellId: event.spellId,
      stacks: 1,
    };

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID, "auras", "all", event.spellId], aura),
    );

    const auraData = config.auras.get(event.spellId);

    // Schedule removal (only for finite duration)
    if (auraData && auraData.baseDurationMs > 0) {
      emitter.emitAt(auraData.baseDurationMs, {
        _tag: "SPELL_AURA_REMOVED",
        ...event,
      });
    }

    // Schedule periodic ticks (tick period snapshot goes in event payload)
    if (auraData && auraData.periodicType && auraData.tickPeriodMs > 0) {
      const tickPeriodMs = auraData.hastedTicks
        ? auraData.tickPeriodMs / (1 + getHastePercent(unit))
        : auraData.tickPeriodMs;

      const firstTickDelay = auraData.tickOnApplication ? 0 : tickPeriodMs;

      emitter.emitAt(firstTickDelay, {
        _tag:
          auraData.periodicType === "heal"
            ? "SPELL_PERIODIC_HEAL"
            : "SPELL_PERIODIC_DAMAGE",
        ...event,
        tickPeriodMs, // scheduler holds the snapshot
      });
    }
  });
```

### 3. Update SPELL_AURA_REMOVED Handler

```typescript
export const removeAura = (event: SpellAuraRemoved) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return; // already gone ⇒ stale event

    yield* StateService.updateState((s) =>
      s.deleteIn(["units", event.destGUID, "auras", "all", event.spellId]),
    );
  });
```

### 4. Update SPELL_AURA_REFRESH Handler

```typescript
export const refreshAura = (
  event: SpellAuraRefresh,
  emitter: Emitter,
  config: SimulationConfig,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return;

    const auraData = config.auras.get(event.spellId);
    if (!auraData) return;

    // Get remaining time from pending removal event in queue (helper function)
    const remainingMs =
      getPendingRemovalMs(event.destGUID, event.spellId) ?? 0;

    // Calculate new duration based on refresh behavior
    const newDurationMs =
      auraData.refreshBehavior === "pandemic"
        ? auraData.baseDurationMs +
          Math.min(remainingMs, auraData.baseDurationMs * 0.3)
        : auraData.baseDurationMs;

    // Schedule new removal (old removal becomes stale via getAura check)
    emitter.emitAt(newDurationMs, {
      _tag: "SPELL_AURA_REMOVED",
      ...event,
    });
  });
```

Note: GameState remains untouched; the scheduler reschedules removal and old events become stale via `getAura()`.

### 5. Handle Periodic Tick

```typescript
export const handlePeriodicDamage = (
  event: SpellPeriodicDamage & { tickPeriodMs?: number },
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return; // aura already removed ⇒ stale tick

    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) return;

    // Apply damage here...

    // Schedule next tick (the snapshot stays with the queued event)
    emitter.emitAt(tickPeriodMs, {
      ...event,
      tickPeriodMs, // keep the snapshot with the queued event
    });
  });
```

### 6. Forced Removal (Dispel, Death)

For non-expiration removals, delete the aura immediately. Scheduled removals become stale via missing aura:

```typescript
export const dispelAura = (event: SpellDispel, emitter: Emitter) =>
  Effect.gen(function* () {
    yield* StateService.updateState((s) =>
      s.deleteIn(["units", event.destGUID, "auras", "all", event.spellId]),
    );

    emitter.emitAt(0, {
      _tag: "SPELL_AURA_REMOVED",
      ...event,
    });
  });
```

### 7. Stack Handlers

`SPELL_AURA_APPLIED_DOSE` and `SPELL_AURA_REMOVED_DOSE` update `aura.stacks`. Use `config.auras.get(spellId).maxStacks` to cap.

## Verification

1. Apply aura → GameState stores only CLEU fields while the queued removal fires later
2. Refresh before expiry → new removal event is scheduled; when the old removal pops it sees no aura and no-ops
3. Dispel aura → aura disappears immediately; any queued removal/tick events see no aura and stop
4. Apply DoT/HoT → periodic events fire via the scheduler; deleting the aura stops further ticks because events become stale

## Next Phase

Proceed to `06-phase4-simulation-setup.md` to integrate aura loading into simulation initialization.
