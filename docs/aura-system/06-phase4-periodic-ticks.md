# Phase 4: Periodic Ticks

## Goal

Schedule periodic damage/heal ticks using the same pattern as removal events.

## Aura Entity

The runtime Aura entity stays identical to the CLEU-visible shape (`casterUnitId`, `spellId`, `stacks`). Do **not** add `expiresAt`, `nextTickAt`, or `tickPeriodMs`; as stated in `00-data-flow.md`, the Event Queue is the single source of truth for timing.

Tick period is snapshotted at application time (includes haste) and stored in the event payload, not on the entity. This ensures ticks remain consistent even if haste changes mid-duration.

## Tasks

### 1. Schedule Initial Tick on Apply

```typescript
// In applyAura, after scheduling removal:
if (auraData.tickPeriodMs > 0) {
  // Snapshot tick period (apply haste if applicable)
  const tickPeriodMs = auraData.hastedTicks
    ? auraData.tickPeriodMs / (1 + hastePercent)
    : auraData.tickPeriodMs;

  const firstTickDelay = auraData.tickOnApplication ? 0 : tickPeriodMs;

  // Schedule first tick - snapshot lives in the queued event, NOT on the aura entity
  emitter.emitAt(firstTickDelay, {
    _tag:
      auraData.periodicType === "heal"
        ? "SPELL_PERIODIC_HEAL"
        : "SPELL_PERIODIC_DAMAGE",
    ...event,
    tickPeriodMs, // stash the snapshot on the queued event
  });
}
```

### 2. Handle Periodic Tick

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
    if (!aura) return; // stale tick, aura already gone

    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) return;

    // Apply damage/heal logic...

    // Schedule next tick (the snapshot stays with the queued event)
    emitter.emitAt(tickPeriodMs, {
      ...event,
      tickPeriodMs,
    });
  });
```

Staleness is determined solely by aura presence—no timing fields on the entity.

### 3. Refresh Behavior

Refreshing a periodic aura does not touch any entity fields—the tick cadence is controlled entirely by the already-scheduled periodic events. When a refresh occurs, you only reschedule the removal event; any previously queued ticks will keep firing so long as `getAura` returns the aura, and they become stale automatically once the aura is gone.

This matches WoW behavior where refreshing a DoT doesn't reset the tick timer.
