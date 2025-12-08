# Phase 4: Periodic Ticks

## Goal

Schedule periodic damage/heal ticks using the same pattern as removal events.

## Aura Entity Extension

Add tick fields to the Aura entity:

```typescript
export const Aura = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
  expiresAt: Schema.Number,
  // Periodic tick fields (optional, only for DoTs/HoTs)
  nextTickAt: Schema.optional(Schema.Number),
  tickPeriodMs: Schema.optional(Schema.Number), // Snapshotted at application
});
```

The `tickPeriodMs` is snapshotted at application time (includes haste). This ensures ticks remain consistent even if haste changes mid-duration.

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
  const nextTickAt = state.currentTime + firstTickDelay / 1000;

  // Store tick info on aura
  yield *
    StateService.updateState((s) =>
      s.mergeIn(["units", event.destGUID, "auras", "all", event.spellId], {
        nextTickAt,
        tickPeriodMs,
      }),
    );

  emitter.emitAt(firstTickDelay, {
    _tag:
      auraData.periodicType === "heal"
        ? "SPELL_PERIODIC_HEAL"
        : "SPELL_PERIODIC_DAMAGE",
    ...event,
    amount: 0, // Calculated by damage system
  });
}
```

### 2. Handle Periodic Tick

```typescript
export const handlePeriodicDamage = (
  event: SpellPeriodicDamage,
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return;

    // Stale check
    if (!aura.nextTickAt || event.timestamp < aura.nextTickAt - 0.001) return;

    // Don't tick after aura expired (use > not >= to allow final tick)
    if (state.currentTime > aura.expiresAt) return;

    // Use snapshotted tick period from aura
    const tickPeriodMs = aura.tickPeriodMs;
    if (!tickPeriodMs || tickPeriodMs <= 0) return;

    // Schedule next tick
    const nextTickAt = state.currentTime + tickPeriodMs / 1000;

    // Only schedule if next tick would be before expiry
    if (nextTickAt <= aura.expiresAt) {
      yield* StateService.updateState((s) =>
        s.setIn(
          [
            "units",
            event.destGUID,
            "auras",
            "all",
            event.spellId,
            "nextTickAt",
          ],
          nextTickAt,
        ),
      );

      emitter.emitAt(tickPeriodMs, {
        _tag: "SPELL_PERIODIC_DAMAGE",
        ...event,
      });
    }
  });
```

### 3. Refresh Behavior

On refresh, keep the current tick cycle running. The `nextTickAt` and `tickPeriodMs` are preserved - only `expiresAt` changes.

```typescript
// In refreshAura: don't touch nextTickAt or tickPeriodMs
// The tick cycle continues uninterrupted with the original snapshot
```

This matches WoW behavior where refreshing a DoT doesn't reset the tick timer.
