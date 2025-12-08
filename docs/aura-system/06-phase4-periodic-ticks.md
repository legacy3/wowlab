# Phase 4: Periodic Ticks

Goal: schedule periodic ticks via the Event Queue without storing timing on entities. This phase aligns tick behavior with game events.

Prereqs: Phases 1-3; read `docs/wowlab/00-data-flow.md` for timing model.

## Rules

- Aura entity stays minimal (no expiresAt/nextTickAt/tickPeriodMs).
- Tick period snapshot lives on the queued event payload (`tickPeriodMs`).
- Haste is applied when scheduling; later haste changes do not retroactively adjust already queued ticks.

## Apply-time Scheduling

```typescript
if (auraData.tickPeriodMs > 0 && auraData.periodicType) {
  const tickPeriodMs = auraData.hastedTicks
    ? auraData.tickPeriodMs / (1 + hastePercent)
    : auraData.tickPeriodMs;

  const firstTickDelay = auraData.tickOnApplication ? 0 : tickPeriodMs;

  emitter.emitAt(firstTickDelay, {
    _tag:
      auraData.periodicType === "heal"
        ? "SPELL_PERIODIC_HEAL"
        : "SPELL_PERIODIC_DAMAGE",
    ...event,
    tickPeriodMs, // snapshot lives here
  });
}
```

## Tick Handler

```typescript
const handlePeriodicTick = (
  event: (SpellPeriodicDamage | SpellPeriodicHeal) & { tickPeriodMs?: number },
  emitter: Emitter,
) =>
  Effect.gen(function* () {
    const state = yield* StateService.getState();
    const unit = state.units.get(event.destGUID);
    if (!unit) return;

    const aura = unit.auras.all.get(event.spellId);
    if (!aura) return; // stale tick

    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) return;

    // Apply periodic effect...

    emitter.emitAt(tickPeriodMs, { ...event, tickPeriodMs });
  });
```

## Refresh Interaction

Refreshing a periodic aura **does not** reset tick timers. Only removal is rescheduled. Ticks keep firing until the aura is removed, at which point subsequent tick events see no aura and no-op (stale).

Next: Phase 5 (07-phase5-simulation-setup.md).
