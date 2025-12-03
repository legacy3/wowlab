# Option 2: Queue-as-Time Source

## Overview

The EventQueue itself is the source of truth for time. When an event is dequeued, its timestamp becomes "now". There is no separate time management - the queue's ordering IS the timeline. Rotation schedules future casts by enqueuing events at specific timestamps.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          QUEUE-AS-TIME SOURCE                               │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌────────────────────────────────────────┐
                    │              EventQueue                │
                    │         (Priority by timestamp)        │
                    │                                        │
                    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
                    │  │t=0.0│ │t=0.0│ │t=1.5│ │t=3.0│ ... │
                    │  └─────┘ └─────┘ └─────┘ └─────┘      │
                    │     ▲                                  │
                    │     │ DEQUEUE = "NOW"                  │◀── IS TIME
                    └─────┼──────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
         ▼                                 │
  ┌──────────────┐                         │
  │ StateService │                         │
  │ .currentTime │ = event.timestamp       │
  └──────────────┘                         │
         │                                 │
         ▼                                 │
  ┌─────────────────┐                      │
  │ HandlerRegistry │                      │
  └────────┬────────┘                      │
           │                               │
           │ handlers may enqueue          │
           │ future events                 │
           ▼                               │
    ┌────────────┐      enqueue at         │
    │  Rotation  │──────future time────────┘
    │  (Handler) │
    └──────┬─────┘
           │
           │ decides spell, computes
           │ next available time
           ▼
    ┌──────────────┐
    │ SpellActions │
    └──────────────┘
           │
           │ emits SPELL_CAST_SUCCESS
           │ at computed timestamp
           └──────────────────────────────▶ back to queue
```

## Event Flow Example

```
Queue State: [SPELL_CAST_SUCCESS@0.0, SPELL_CAST_SUCCESS@1.5, ...]

Step 1: Dequeue SPELL_CAST_SUCCESS@0.0
        └─▶ currentTime = 0.0
        └─▶ Rotation handler runs
        └─▶ Checks: nextAvailableTime = 0.0, currentTime >= nextAvailableTime? YES
        └─▶ Decides next spell: Kill Command
        └─▶ Computes: nextCastTime = currentTime + GCD = 1.5
        └─▶ Enqueues: SPELL_CAST_SUCCESS(Kill Command)@1.5
        └─▶ Updates: nextAvailableTime = 1.5

Queue State: [SPELL_CAST_SUCCESS@1.5, SPELL_CAST_SUCCESS@1.5, ...]

Step 2: Dequeue SPELL_CAST_SUCCESS@1.5
        └─▶ currentTime = 1.5
        └─▶ Rotation handler runs
        └─▶ Checks: nextAvailableTime = 1.5, currentTime >= nextAvailableTime? YES
        └─▶ Decides next spell: Cobra Shot
        └─▶ Computes: nextCastTime = currentTime + GCD = 3.0
        └─▶ Enqueues: SPELL_CAST_SUCCESS(Cobra Shot)@3.0

... and so on
```

## Component Responsibilities

### Event Processing Loop

```typescript
// Simple loop - queue IS time
const run = (endTime: number) =>
  Effect.gen(function* () {
    while (true) {
      const maybeEvent = yield* queue.poll;
      if (Option.isNone(maybeEvent)) break;

      const event = maybeEvent.value;
      if (event.timestamp > endTime) {
        yield* queue.offer(event); // put back
        break;
      }

      // TIME IS THE EVENT'S TIMESTAMP
      yield* state.updateState((s) => s.set("currentTime", event.timestamp));

      // Dispatch
      const handlers = yield* registry.getHandlers(event);
      for (const h of handlers) {
        yield* h.handler(event);
      }
    }
  });
```

### Rotation as Handler

```typescript
// Rotation is just another handler that schedules future events
const rotationHandler: EventHandler<SpellCastSuccess> = (event) =>
  Effect.gen(function* () {
    const state = yield* stateService.getState();
    const now = state.currentTime;

    // Check if we can cast (GCD ready)
    const player = yield* getPlayer(state);
    if (now < player.nextAvailableTime) {
      // Can't cast yet - this event was probably a proc or something
      return;
    }

    // Decide next spell
    const nextSpell = yield* decideNextSpell(state);
    const spell = yield* getSpellInfo(nextSpell);

    // Compute when this cast will happen
    const castTime = spell.castTime > 0 ? spell.castTime : 0;
    const gcd = spell.gcd;
    const nextAvailable = now + Math.max(castTime, gcd);

    // Update player state
    yield* updatePlayer((p) => p.set("nextAvailableTime", nextAvailable));

    // Schedule the cast event at the right time
    const castTimestamp = now + castTime; // instant = now, cast = now + castTime

    yield* combatLog.emit(
      new SpellCastSuccess({
        timestamp: castTimestamp,
        spellId: nextSpell,
        // ...
      }),
    );

    // Schedule any follow-up events (auras, damage, etc.)
    if (spell.appliesBuff) {
      yield* combatLog.emit(
        new SpellAuraApplied({
          timestamp: castTimestamp,
          spellId: spell.buffId,
          // ...
        }),
      );
    }
  });
```

### SpellActions (Simplified)

```typescript
// SpellActions just creates event objects - doesn't manage time
const createCastEvent = (spellId: number, timestamp: number) =>
  new SpellCastSuccess({
    timestamp,
    spellId,
    // ... other fields from spell data
  });

// Validation helper
const canCast = (unitId: UnitID, spellId: number) =>
  Effect.gen(function* () {
    const state = yield* stateService.getState();
    const player = yield* getUnit(unitId);

    // Check GCD
    if (state.currentTime < player.nextAvailableTime) {
      return false;
    }

    // Check cooldown
    const spell = player.spells.get(spellId);
    if (state.currentTime < spell.cooldownExpiry) {
      return false;
    }

    return true;
  });
```

## GCD Handling

GCD is tracked as a simple timestamp field, not via aura events:

```typescript
interface PlayerState {
  nextAvailableTime: number; // When GCD ends
  // ...
}

// When casting
const nextAvailable = currentTime + spell.gcd;
player = player.set("nextAvailableTime", nextAvailable);

// When deciding to cast
if (currentTime >= player.nextAvailableTime) {
  // Can cast
}
```

No `SPELL_AURA_APPLIED`/`REMOVED` for GCD - it's implicit in the scheduling.

## Platform Behavior

### Simulation Mode

```typescript
// Seed initial event, let queue drive everything
const runSimulation = (duration: number) =>
  Effect.gen(function* () {
    // Seed first cast at t=0
    yield* combatLog.emit(
      new SpellCastSuccess({
        timestamp: 0,
        spellId: FIRST_SPELL,
      }),
    );

    // Process queue until duration
    yield* processLoop(duration);
  });
```

### Bot Mode

```typescript
// WoW events come in with their timestamps
// They get queued and processed in order
const runBot = () =>
  Effect.gen(function* () {
    onWowEvent((event) => {
      // WoW's timestamp becomes the event timestamp
      combatLog.emit(event);
    });

    // Process forever
    yield* processLoop(Infinity);
  });
```

### Browser Mode

```typescript
// Same as simulation, events drive time
const runBrowser = (replayEvents: CombatLogEvent[]) =>
  Effect.gen(function* () {
    // Load all events into queue
    for (const event of replayEvents) {
      yield* combatLog.emit(event);
    }

    // Process
    yield* processLoop(Infinity);
  });
```

## Pros

1. **Minimal central logic** - Queue is just a priority queue, no special time code
2. **Natural future scheduling** - Want something at t=5? Just enqueue it at t=5
3. **Self-documenting** - Looking at queue shows entire future timeline
4. **Easy lookahead** - Can peek at upcoming events for decision making
5. **No synthetic events** - GCD is just a timestamp comparison

## Cons

1. **Distributed time control** - Any handler can enqueue future events
2. **Hard to debug** - Flow is implicit in queue contents
3. **Ordering complexity** - Same-timestamp events need tiebreaker
4. **State consistency** - Must ensure state matches queue expectations
5. **Rotation coupling** - Rotation must understand scheduling mechanics

## When to Use

- Simple simulations with straightforward spell logic
- When you want rotation to explicitly control timing
- When you need easy lookahead for decision making
- Prototyping before committing to more complex architecture
