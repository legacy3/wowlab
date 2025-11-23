# Event Scheduler Plan

Status: draft for implementation
Audience: engineers building the simulation core
Principle: everything is immutable; scheduler API must feel frictionless.

## Goals

- Single source of truth for APL scheduling; never duplicate evaluations.
- Deterministic ordering: `(time asc, priority desc, id asc)`.
- Pure, immutable state management; easy to test with Vitest.
- Ergonomic helpers so callers never fiddle with ids, priorities, or rotation plumbing.

## Event model

- `EventId`: stable string (monotonic counter + nanoid prefix for uniqueness).
- `ScheduledEvent<T extends EventType>` fields:
  - `id`, `time` (ms), `priority`, `type`, `payload`, `execute: Effect.Effect<void>`.
- Priority map lives in `@wowlab/core/Events` (single truth). Higher number = earlier at same timestamp.
- Tie-breaker: id asc for stability.

## Scheduler state & structure

```typescript
interface SchedulerState {
  currentTime: number;
  counter: number;
  queue: TinyQueue<ScheduledEvent>;  // Binary heap for O(log n) operations
  index: Immutable.Map<EventId, ScheduledEvent>;  // For O(log₃₂ n) lookup/cancel
}
```

- TinyQueue comparator: `(a, b) => a.time !== b.time ? a.time - b.time : b.priority !== a.priority ? b.priority - a.priority : a.id.localeCompare(b.id)`
- State stored in `Ref<SchedulerState>`; every operation returns new state.
- TinyQueue is mutable internally but wrapped in immutable Ref pattern.
- Index enables fast cancel-by-id without iterating the heap.

## Complexity analysis

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| schedule  | O(log n) | Heap push + index insert |
| peek      | O(1) | Heap peek only |
| dequeue   | O(log n) | Heap pop + index delete |
| cancel    | O(1) mark, O(log n) skip | Tombstones + skip-stale on pop |
| cancelWhere | O(n) | Filter and rebuild (rare; can compact) |

### Optional performance tweak: lazy tombstones

- Keep `tombstones: Set<EventId>` in state.
- `cancel(id)`: add to tombstones and remove from index (no heap rebuild).
- `peek/dequeue`: while heap.peek() is tombstoned, pop and continue; on real dequeue, delete id from tombstones.
- Compaction trigger: when `tombstones.size > queue.length / 2`, rebuild heap from index to purge dead entries.

## Service API (Effect service)

- `schedule(input: ScheduledInput) -> Effect<EventId>`: assigns `id`, fills `priority` from `EVENT_PRIORITY`, rejects `time < currentTime`, inserts into queue/index, publishes to `events$`.
- `ScheduledInput` is a tagged union (one variant per event type) so callers pass semantic params; builder fills payload/priority/execute.
- `peek() -> Effect<Option<ScheduledEvent>>`: returns `queue.peek()`.
- `dequeue() -> Effect<Option<ScheduledEvent>>`: pops from queue, updates `currentTime = event.time`, removes from index.
- `clear()`: resets to empty queue and index.
- `size()`, `isEmpty()`: query queue length.
- `cancel(id)`: tombstone mark + index delete (lazy skip on pop).
- `cancelWhere(predicate)`: filters index, rebuilds queue (rare, acceptable O(n)).
- `events$`: PubSub stream of scheduled events for tracing.
- `setCurrentTime(t)`: optional helper to sync from runner if time lives outside scheduler.

## APL ergonomics (guardrails)

Single APL pending at any time:

```typescript
scheduleAPL(at: number): Effect<void>
```

- Before scheduling, check if any `APL_EVALUATE` event exists in queue.
- If existing APL is at same or later time, drop the new request.
- If new APL is earlier, cancel existing and schedule new one.
- Only keeps earliest pending APL.

```typescript
scheduleNextAPL({ castComplete, gcdExpiry }): Effect<Interrupted>
```

- Computes `at = Math.max(castComplete, gcdExpiry)`.
- Calls `scheduleAPL(at)`.
- Returns `Effect.interrupt` to stop rotation fiber.

Only two places schedule APL:

1. Simulation start seeds one APL at `t=0`.
2. CastQueue schedules next APL after successful cast (via `scheduleNextAPL`).

Rotation source: `scheduleAPL` pulls rotation from `RotationProviderService` (set once per run by SimulationService); if none set, it is a no-op or logs error.

## Builder helpers

Convenience functions that hide priority, id, and payload construction:

- `cooldownReady(spell, at)`: schedules `SPELL_COOLDOWN_READY` event.
- `chargeReady(spell, at)`: schedules `SPELL_CHARGE_READY` event.
- `auraExpire(auraId, at)`: schedules `AURA_EXPIRE` event.
- `periodicPower(rate, at)`: schedules `PERIODIC_POWER` event.
- `projectileImpact(spell, at)`: schedules `PROJECTILE_IMPACT` event.

Callers provide semantic parameters; builders handle technical details.

`ScheduledInput` union (example):

```typescript
type ScheduledInput =
  | { type: "APL_EVALUATE"; at: number }
  | { type: "SPELL_CAST_START"; at: number; spell; targetId }
  | { type: "SPELL_CAST_COMPLETE"; at: number; spell; targetId }
  | { type: "SPELL_COOLDOWN_READY"; at: number; spell }
  | { type: "SPELL_CHARGE_READY"; at: number; spell }
  | { type: "PROJECTILE_IMPACT"; at: number; projectileId; spell; casterUnitId; targetUnitId; damage }
  | { type: "AURA_EXPIRE"; at: number; aura; unitId }
  | { type: "AURA_STACK_DECAY"; at: number; aura; unitId }
  | { type: "PERIODIC_POWER"; at: number }
  | { type: "PERIODIC_SPELL"; at: number };
```

## Invariants to enforce

- **Time monotonic**: cannot schedule in the past (`time < currentTime` -> error).
- **Deterministic order**: at same timestamp, higher priority first; same priority, lower id first.
- **Immutable guarantee**: `Ref` pattern ensures previous state snapshots remain unchanged.
- **Single APL**: at most one `APL_EVALUATE` event pending in queue.
- **Index consistency**: index and queue always contain same event IDs.

## Testing plan (Vitest)

### Unit tests

- **Comparator**: verify `(time asc, priority desc, id asc)` ordering.
- **Immutability**: confirm previous state reference unchanged after operations.
- **EventId generation**: monotonic counter produces unique IDs.

### Service tests

- **schedule + dequeue**: events come out in correct priority order.
- **peek**: non-destructive read of next event.
- **currentTime advancement**: dequeue updates currentTime to event.time.
- **cancel**: removes event; size decrements correctly.
- **Reject past scheduling**: `time < currentTime` fails with error.
- **Tie-breaking**: events at same time/priority ordered by id.
- **Tombstones**: cancel marks are skipped on peek/dequeue and compacted when threshold hits.

### APL guard tests

- **scheduleAPL**: prevents duplicate APL events.
- **scheduleAPL**: keeps earliest APL when multiple requested.
- **scheduleNextAPL**: schedules APL and interrupts rotation.

### Integration tests

- **Cast flow**: cast complete -> `scheduleNextAPL` -> single APL in queue.
- **Cooldown ready**: fires event -> can trigger APL re-evaluation.
- **Index consistency**: after multiple schedule/cancel operations, index matches queue.

## Implementation

### packages/wowlab-core/src/internal/events/Events.ts

- Export `EVENT_PRIORITY`.
- Add `EventId` type: `type EventId = string & { readonly EventId: unique symbol }`.

### packages/wowlab-services/src/internal/rotation/RotationProviderService.ts (new)

- `set(rotation: Effect<void>)`, `get(): Effect<Option<Effect<void>>>`.
- Provided per simulation run; consumed by scheduler APL helpers.

### packages/wowlab-services/src/internal/scheduler/EventSchedulerService.ts

- Add index to state: `Immutable.Map<EventId, ScheduledEvent>` and tombstones set.
- Implement typed `schedule` that accepts `ScheduledInput`, assigns id/priority/execute, returns `EventId`.
- Implement APL guard: `scheduleAPL`, `scheduleNextAPL` pulling rotation from `RotationProviderService`.
- Add builder helpers: `cooldownReady`, `chargeReady`, `auraExpire`, `periodicPower`, `projectileImpact`.
- Update comparator: `(time asc, priority desc, id asc)`.
- Implement cancel with tombstones + optional compaction; cancelWhere rebuilds.

### packages/wowlab-services/__tests__/scheduler.test.ts

- Test suite covering all invariants and service operations.

### packages/wowlab-services/src/internal/castQueue/CastQueueService.ts

- Delete inline APL scheduling logic.
- Use `scheduleNextAPL` helper with `Effect.interrupt`.

### packages/wowlab-services/src/internal/simulation/SimulationService.ts

- Seed initial APL at `t=0`.
- Delete periodic APL fallback.
- Set `RotationProviderService` at run start; clear on completion.

### Event lifecycle hooks

- Implement `CooldownModifier` events to schedule `SPELL_COOLDOWN_READY`.
- Implement `ChargeModifier` events to schedule `SPELL_CHARGE_READY`.
- Wake rotation when resources become available.

### Tracing

- Subscribe to `events$` PubSub for timeline debugging.
- Log event scheduling and execution.
