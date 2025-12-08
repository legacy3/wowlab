# WoWLab Aura System

## Document Structure

| Doc                                    | Description                     |
| -------------------------------------- | ------------------------------- |
| `01-reference-simc-behaviors.md`       | SimC aura behaviors (read-only) |
| `02-reference-spell-data.md`           | Spell data sources (read-only)  |
| `03-phase1-data-structures.md`         | AuraDataFlat schema             |
| `04-phase2-aura-definition-service.md` | AuraService                     |
| `05-phase3-handler-integration.md`     | Handler updates                 |
| `06-phase4-periodic-ticks.md`          | Tick scheduling                 |

## Architecture

All state lives in immutable `GameState`. The `Aura` entity has `expiresAt` - this is the single source of truth for expiration.

The event queue (TinyQueue) is the scheduler. No separate scheduling mechanism needed.

## Emitter Contract

`emitter.emitAt(delayMs, event)` schedules an event. The emitter MUST set `event.timestamp = currentTime + delayMs / 1000` when the event is enqueued. Handlers receive events with accurate timestamps.

## Stale Event Handling

When an aura is refreshed, a new removal event is scheduled. The old one still fires but is ignored:

```
SPELL_AURA_REMOVED handler:
  aura = getAura(unit, spellId)
  if (!aura) return                                    // Already gone
  if (event.timestamp < aura.expiresAt - 0.001) return // Stale (was refreshed)
  removeAura(unit, spellId)
```

TinyQueue processes events in timestamp order. Old removals fire first, see `expiresAt` was extended, and no-op.

## Forced Removals (Dispel, Death, Cancel)

For non-expiration removals, set `expiresAt = currentTime` before emitting removal:

```
// Dispel handler
aura.expiresAt = state.currentTime
emitter.emitAt(0, SPELL_AURA_REMOVED)
```

This ensures the stale check passes. Alternatively, emit immediately without scheduling.

## Permanent Auras

Auras with no duration have `expiresAt = Infinity`. The stale check skips infinite values:

```
if (Number.isFinite(aura.expiresAt) && event.timestamp < aura.expiresAt - 0.001) return;
```

## Periodic Ticks

Same pattern. Store `nextTickAt` and `tickPeriodMs` (snapshotted) on the Aura entity. When a tick fires, compare `event.timestamp` against `nextTickAt`.
