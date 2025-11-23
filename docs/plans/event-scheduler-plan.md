# Event Scheduler Plan (immutable, event-driven, nice to use)

Status: draft for implementation  
Audience: engineers building the simulation core  
Principle: everything is immutable; scheduler API must feel frictionless.

## Goals

- Single source of truth for APL scheduling; never duplicate evaluations.
- Deterministic ordering: `(time asc, priority desc, id asc)`.
- Pure, immutable queue; easy to test with Vitest.
- Ergonomic helpers so callers never fiddle with ids or priorities.

## Event model

- `EventId`: stable string (monotonic counter + nanoid prefix).
- `ScheduledEvent<T extends EventType>` fields:
  - `id`, `time` (ms), `priority`, `type`, `payload`, `execute: Effect.Effect<void>`.
- Priority map lives in `@wowlab/core/Events` (single truth). Higher number = earlier at same timestamp.
- Tie-breaker: id asc for stability.

## Scheduler state & structure

- `SchedulerState`: `{ currentTime: number; queue: PriorityHeap<ScheduledEvent>; counter: number; }`.
- `PriorityHeap`: tiny immutable binary heap backed by `ReadonlyArray`. Helpers: `push`, `pop`, `peek`, `size`, `isEmpty`. No mutation.
- Stored in `Ref<SchedulerState>` inside the service; all ops return new state.

## Service API (Effect service)

- `schedule(input) -> Effect<EventId>`: fills `priority` from map if absent, assigns `id`, rejects `time < currentTime`, pushes immutably, publishes to `events$` PubSub.
- `peek() -> Effect<Option<ScheduledEvent>>`
- `dequeue() -> Effect<Option<ScheduledEvent>>`: pops earliest, advances `currentTime` to event.time.
- `clear()`, `size()`, `isEmpty()`.
- `cancel(id)`, `cancelWhere(predicate)` (useful for canceled projectiles/auras).
- `events$`: PubSub stream of scheduled events for tracing.

## APL ergonomics (guardrails)

- `scheduleAPL(at: number, rotation: Effect<void>)`: enforces “only one APL in queue”.
  - Drops later duplicates at the same or later timestamp; keeps earliest pending APL.
- `scheduleNextAPL({ castComplete, gcdExpiry, rotation })`:
  - `const at = Math.max(castComplete, gcdExpiry);`
  - `scheduleAPL(at, rotation)` then `return Effect.interrupt` to stop further casts.
- Only two places schedule APL:
  1. Simulation start seeds one APL at `t=0`.
  2. CastQueue schedules next APL after successful cast (via helper above).

## Other builder helpers

- `cooldownReady(spell, at)`, `chargeReady(spell, at)`, `auraExpire(auraId, at)`, `periodicPower(rate, at)`, `projectileImpact(spell, at)`, `snapshot(at)`.
- Builders hide priority, id, payload shaping.

## Invariants to enforce

- Time monotonic: cannot schedule in the past (`time < currentTime` -> error).
- Deterministic order at same time via priority then id.
- Immutable guarantee: previous queue snapshots remain untouched after ops.
- Single APL pending at any time.

## Testing plan (Vitest)

- Unit (pure heap):
  - push/pop ordering by `(time, -priority, id)`.
  - immutability: old heap reference unchanged after push/pop.
- Service:
  - `schedule` then `peek`/`dequeue` respects ordering and advances `currentTime`.
  - APL guard prevents duplicates.
  - `cancel` removes event; size updates.
  - Reject scheduling in the past.
  - Tie-breaker uses id for stability.
- Integration-ish:
  - Simulate cast completes -> `scheduleNextAPL` enqueues one APL and interrupts.
  - CooldownReady fires -> schedules APL wake-up if rotation provided.

## File touchpoints

- `packages/wowlab-core/src/internal/events/Events.ts`:
  - Ensure `EVENT_PRIORITY` exported; add `EventId` type and `DefaultPriority(eventType)`.
- `packages/wowlab-services/src/internal/scheduler/`:
  - New `PriorityHeap` (pure).
  - Replace TinyQueue service with immutable implementation + builders.
  - Add `APLGuard` helpers.
- `packages/wowlab-services/__tests__/scheduler.test.ts`:
  - Vitest coverage for invariants above.
- `packages/wowlab-services/src/internal/castQueue/CastQueueService.ts`:
  - Use `scheduleNextAPL` helper; keep `Effect.interrupt` after scheduling.

## Developer ergonomics

- Defaults everywhere: no manual ids/priorities in callers.
- Friendly errors with context (type, time, currentTime) when scheduling invalid events.
- Snapshot hook: optional `tap(state => ...)` for timeline debugging without mutation.

## Rollout steps

1) Land core heap + service + APL helper + tests (no behavior change yet).
2) Wire CastQueue to helper; seed single APL in SimulationService; delete any periodic APL fallback.
3) Introduce `CooldownModifier` + `ChargeModifier` events to wake rotation (follow docs design).
4) Add tracing hook for debugging (optional).
