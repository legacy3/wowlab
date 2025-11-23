# Event Scheduler Plan

Status: draft for implementation
Audience: engineers building the simulation core
Principle: everything is immutable; scheduler API must feel frictionless.

## Goals

- Single source of truth for APL scheduling; never duplicate evaluations.
- Deterministic ordering: `(time asc, priority desc, id asc)`.
- Pure, immutable state management; easy to test with Vitest.
- Ergonomic helpers so callers never fiddle with ids or priorities.
- Efficient cancel operations without full queue rebuilds.

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
| cancel    | O(n) | Rebuild queue, but rare operation |
| cancelWhere | O(n) | Filter and rebuild |

## Service API (Effect service)

- `schedule(input) -> Effect<EventId>`: assigns `id` from counter, fills `priority` from `EVENT_PRIORITY`, rejects `time < currentTime`, inserts into queue and index, publishes to `events$`.
- `peek() -> Effect<Option<ScheduledEvent>>`: returns `queue.peek()`.
- `dequeue() -> Effect<Option<ScheduledEvent>>`: pops from queue, updates `currentTime = event.time`, removes from index.
- `clear()`: resets to empty queue and index.
- `size()`, `isEmpty()`: query queue length.
- `cancel(id)`: removes event from index, rebuilds queue without that event.
- `cancelWhere(predicate)`: filters index, rebuilds queue.
- `events$`: PubSub stream of scheduled events for tracing.

## APL ergonomics (guardrails)

Single APL pending at any time:

```typescript
scheduleAPL(at: number, rotation: Effect<void>): Effect<void>
```

- Before scheduling, check if any `APL_EVALUATE` event exists in queue.
- If existing APL is at same or later time, drop the new request.
- If new APL is earlier, cancel existing and schedule new one.
- Only keeps earliest pending APL.

```typescript
scheduleNextAPL({ castComplete, gcdExpiry, rotation }): Effect<Interrupted>
```

- Computes `at = Math.max(castComplete, gcdExpiry)`.
- Calls `scheduleAPL(at, rotation)`.
- Returns `Effect.interrupt` to stop rotation fiber.

Only two places schedule APL:

1. Simulation start seeds one APL at `t=0`.
2. CastQueue schedules next APL after successful cast (via `scheduleNextAPL`).

## Builder helpers

Convenience functions that hide priority, id, and payload construction:

- `cooldownReady(spell, at)`: schedules `SPELL_COOLDOWN_READY` event.
- `chargeReady(spell, at)`: schedules `SPELL_CHARGE_READY` event.
- `auraExpire(auraId, at)`: schedules `AURA_EXPIRE` event.
- `periodicPower(rate, at)`: schedules `PERIODIC_POWER` event.
- `projectileImpact(spell, at)`: schedules `PROJECTILE_IMPACT` event.

Callers provide semantic parameters; builders handle technical details.

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

### APL guard tests

- **scheduleAPL**: prevents duplicate APL events.
- **scheduleAPL**: keeps earliest APL when multiple requested.
- **scheduleNextAPL**: schedules APL and interrupts rotation.

### Integration tests

- **Cast flow**: cast complete -> `scheduleNextAPL` -> single APL in queue.
- **Cooldown ready**: fires event -> can trigger APL re-evaluation.
- **Index consistency**: after multiple schedule/cancel operations, index matches queue.

## File touchpoints

- `packages/wowlab-core/src/internal/events/Events.ts`:
  - Export `EVENT_PRIORITY` (already exists).
  - Add `EventId` type alias: `type EventId = string & { readonly EventId: unique symbol }`.

- `packages/wowlab-services/src/internal/scheduler/EventSchedulerService.ts`:
  - Enhance state with index: `Immutable.Map<EventId, ScheduledEvent>`.
  - Implement APL guard in `scheduleAPL`.
  - Add builder helpers.
  - Update comparator for full ordering.

- `packages/wowlab-services/__tests__/scheduler.test.ts`:
  - Create test file with coverage for invariants above.

- `packages/wowlab-services/src/internal/castQueue/CastQueueService.ts`:
  - Replace inline APL scheduling (lines 219-233) with `scheduleNextAPL` helper.
  - Keep `Effect.interrupt` after scheduling.

## Developer ergonomics

- **Defaults everywhere**: builders auto-fill priority from `EVENT_PRIORITY`, auto-generate IDs.
- **Typed errors**: friendly error with context when scheduling invalid events (include type, time, currentTime).
- **Optional tracing**: `events$` PubSub stream for debugging timeline without mutation.
- **Clean API**: callers work with semantic helpers, not raw scheduler primitives.

## Rollout steps

1. **Enhance scheduler**: add index to state, implement APL guard, add builders, write tests.
2. **Wire CastQueue**: replace inline APL scheduling with `scheduleNextAPL` helper.
3. **Seed APL**: in SimulationService, schedule initial APL at `t=0`; remove any periodic fallback.
4. **Add lifecycle events**: implement `CooldownModifier` + `ChargeModifier` to wake rotation when resources available.
5. **Tracing**: add optional subscriber to `events$` for timeline debugging.
