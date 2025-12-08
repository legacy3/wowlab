# WoWLab Aura System

## Document Structure

| Doc                                | Description                           |
| ---------------------------------- | ------------------------------------- |
| `01-reference-simc-behaviors.md`   | SimC aura behaviors (reference)       |
| `02-reference-spell-data.md`       | Spell data sources (reference)        |
| `03-phase1-data-structures.md`     | AuraDataFlat schema + constants       |
| `04-phase2-transformer.md`         | transformAura() function              |
| `05-phase3-handler-integration.md` | Handler updates + periodic ticks      |
| `06-phase4-simulation-setup.md`    | Simulation initialization integration |

## Architecture

All state lives in immutable `GameState`. Aura entities only keep CLEU-observable fields (`casterUnitId`, `spellId`, `stacks`); expiration timing is owned entirely by the Event Queue scheduler.

The event queue (TinyQueue) is the scheduler. Events are scheduled via `emitter.emitAt()`.

```
Simulation Setup:
  transformAura(spellId) → AuraDataFlat → SimulationConfig.auras

Runtime:
  Handler reads from config.auras.get(spellId)
  Handler updates GameState.units[].auras
  Handler schedules events via Emitter
```

## Emitter Contract

`emitter.emitAt(delayMs, event)` schedules an event. The emitter sets `event.timestamp = currentTime + delayMs / 1000` when the event is enqueued. Handlers receive events with accurate timestamps.

## Stale Event Handling

When an aura is refreshed, a new removal event is scheduled. The old one still fires but is ignored:

```typescript
// SPELL_AURA_REMOVED handler:
const aura = getAura(unit, spellId);
if (!aura) return; // Already gone – stale event
removeAura(unit, spellId);
```

TinyQueue processes events in timestamp order. Old removals fire first; because the refresh left a valid aura and scheduled a later removal, the stale event observes "no aura" and returns.

## Forced Removals (Dispel, Death, Cancel)

For non-expiration removals, delete the aura immediately and emit the CLEU removal event—there is no timing field to mutate:

```typescript
// Dispel handler
yield* StateService.updateState((s) =>
  s.deleteIn(["units", event.destGUID, "auras", "all", event.spellId]),
);
emitter.emitAt(0, SPELL_AURA_REMOVED);
```

Pending scheduled removals become stale automatically because `getAura` now returns `undefined`.

## Permanent Auras

Permanent auras never enqueue a removal event. Because the scheduler has nothing pending for them, they persist until a dispel/death/cancel explicitly removes the aura from GameState; the same `if (!aura) return` stale guard handles every leftover removal event.

## Periodic Ticks

Periodic ticks are scheduled exclusively through the Event Queue: snapshot any needed tick period into the queued event payload when calling `emitAt`, and have the tick handler simply call `getAura(...)` to decide whether the event is stale. No tick metadata lives on the aura entity.

On refresh, the tick cycle continues uninterrupted—only a new removal event is scheduled; pending tick events keep firing until the aura is removed.
