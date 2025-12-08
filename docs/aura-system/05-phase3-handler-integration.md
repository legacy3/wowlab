# Phase 3: Handler Integration

## Goal

Update aura handlers to use `AuraService` for spell data and `aura.expiresAt` for stale event detection.

## Prerequisites

- Phase 1-2 complete
- Emitter stamps `event.timestamp` when scheduling (see 00-overview.md)

## Tasks

### 1. Update SPELL_AURA_APPLIED Handler

```typescript
export const applyAura = (event: SpellAuraApplied, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const auraData = yield* AuraService.pipe(
      Effect.flatMap((svc) => svc.getAura(event.spellId)),
      Effect.catchAll(() => Effect.succeed(null)),
    );

    const durationMs = auraData?.baseDurationMs ?? 0;
    const expiresAt =
      durationMs > 0 ? state.currentTime + durationMs / 1000 : Infinity;

    const aura = {
      casterUnitId: event.sourceGUID,
      spellId: event.spellId,
      stacks: 1,
      expiresAt,
    };

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

### 2. Update SPELL_AURA_REMOVED Handler

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

### 3. Update SPELL_AURA_REFRESH Handler

```typescript
export const refreshAura = (event: SpellAuraRefresh, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return;

    const auraData = yield* AuraService.pipe(
      Effect.flatMap((svc) => svc.getAura(event.spellId)),
      Effect.catchAll(() => Effect.succeed(null)),
    );
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

### 4. Forced Removal (Dispel, Death)

For non-expiration removals, update `expiresAt` first:

```typescript
export const dispelAura = (event: SpellDispel, emitter: Emitter) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();

    // Set expiresAt to now so stale check passes
    yield* StateService.updateState((s) =>
      s.setIn(
        ["units", event.destGUID, "auras", "all", event.spellId, "expiresAt"],
        state.currentTime,
      ),
    );

    // Emit immediate removal
    emitter.emitAt(0, {
      _tag: "SPELL_AURA_REMOVED",
      ...event,
    });
  });
```

### 5. Stack Handlers

`SPELL_AURA_APPLIED_DOSE` and `SPELL_AURA_REMOVED_DOSE` update `aura.stacks`. Use `auraData.maxStacks` to cap.

## Verification

1. Apply aura, check `expiresAt` is set
2. Refresh before expiry, check `expiresAt` extended with pandemic
3. Let old removal fire, check aura still exists (stale event ignored)
4. Let new removal fire, check aura removed
5. Dispel aura, check it's removed immediately
6. Apply permanent aura, dispel it, check it's removed
