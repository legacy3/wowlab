# Phase 3: Handler Integration

## Goal

Update aura handlers to use `AuraDataFlat` from simulation config and implement stale event detection via `aura.expiresAt`.

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

### 1. Extend Aura Entity for Periodic Ticks

**File:** `packages/wowlab-core/src/internal/schemas/Aura.ts`

Update the runtime `AuraSchema` to include tick fields:

```typescript
export const AuraSchema = Schema.Struct({
  casterUnitId: Branded.UnitIDSchema,
  expiresAt: Schema.Number,
  spellId: Branded.SpellIDSchema,
  stacks: Schema.Number,
  // Periodic tick fields (snapshotted at application)
  nextTickAt: Schema.optional(Schema.Number),
  tickPeriodMs: Schema.optional(Schema.Number),
});
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

    const auraData = config.auras.get(event.spellId);
    const durationMs = auraData?.baseDurationMs ?? 0;
    const expiresAt =
      durationMs > 0 ? state.currentTime + durationMs / 1000 : Infinity;

    const aura: Aura = {
      casterUnitId: event.sourceGUID,
      spellId: event.spellId,
      stacks: 1,
      expiresAt,
    };

    // Add periodic tick info if applicable
    if (auraData && auraData.tickPeriodMs > 0) {
      const tickPeriodMs = auraData.hastedTicks
        ? auraData.tickPeriodMs / (1 + getHastePercent(unit))
        : auraData.tickPeriodMs;

      const firstTickDelay = auraData.tickOnApplication ? 0 : tickPeriodMs;
      aura.nextTickAt = state.currentTime + firstTickDelay / 1000;
      aura.tickPeriodMs = tickPeriodMs;

      // Schedule first tick
      emitter.emitAt(firstTickDelay, {
        _tag:
          auraData.periodicType === "heal"
            ? "SPELL_PERIODIC_HEAL"
            : "SPELL_PERIODIC_DAMAGE",
        ...event,
      });
    }

    yield* StateService.updateState((s) =>
      s.setIn(["units", event.destGUID, "auras", "all", event.spellId], aura),
    );

    // Schedule removal (only for finite duration)
    if (durationMs > 0) {
      emitter.emitAt(durationMs, {
        _tag: "SPELL_AURA_REMOVED",
        ...event,
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
    if (!aura) return;

    // Stale check (skip for permanent auras)
    if (
      Number.isFinite(aura.expiresAt) &&
      event.timestamp < aura.expiresAt - 0.001
    ) {
      return; // Was refreshed, ignore stale removal
    }

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

    // Calculate new duration (pandemic: carry up to 30% of remaining)
    const remainingMs = Math.max(
      0,
      (aura.expiresAt - state.currentTime) * 1000,
    );
    const baseMs = auraData.baseDurationMs;
    const newDurationMs = baseMs + Math.min(remainingMs, baseMs * 0.3);
    const newExpiresAt = state.currentTime + newDurationMs / 1000;

    yield* StateService.updateState((s) =>
      s.setIn(
        ["units", event.destGUID, "auras", "all", event.spellId, "expiresAt"],
        newExpiresAt,
      ),
    );

    // Schedule new removal
    emitter.emitAt(newDurationMs, {
      _tag: "SPELL_AURA_REMOVED",
      ...event,
    });
  });
```

### 5. Handle Periodic Tick

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

    // Don't tick after aura expired
    if (state.currentTime > aura.expiresAt) return;

    const tickPeriodMs = aura.tickPeriodMs;
    if (!tickPeriodMs || tickPeriodMs <= 0) return;

    // Schedule next tick
    const nextTickAt = state.currentTime + tickPeriodMs / 1000;

    if (nextTickAt <= aura.expiresAt) {
      yield* StateService.updateState((s) =>
        s.setIn(
          ["units", event.destGUID, "auras", "all", event.spellId, "nextTickAt"],
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

### 6. Forced Removal (Dispel, Death)

For non-expiration removals, update `expiresAt` first so the stale check passes:

```typescript
export const dispelAura = (event: SpellDispel, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();

    yield* StateService.updateState((s) =>
      s.setIn(
        ["units", event.destGUID, "auras", "all", event.spellId, "expiresAt"],
        state.currentTime,
      ),
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

1. Apply aura → `expiresAt` is set correctly
2. Refresh before expiry → `expiresAt` extended with pandemic
3. Let old removal fire → aura still exists (stale event ignored)
4. Let new removal fire → aura removed
5. Dispel aura → removed immediately
6. Apply permanent aura, dispel it → removed
7. Apply DoT → ticks fire at correct intervals
8. Refresh DoT → tick cycle continues, only `expiresAt` changes

## Next Phase

Proceed to `06-phase4-simulation-setup.md` to integrate aura loading into simulation initialization.
