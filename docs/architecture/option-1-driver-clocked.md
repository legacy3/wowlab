# Option 1: Driver-Clocked Loop

## Overview

SimDriver is the single authority over time. It pops events from the queue, sets `currentTime` to the event's timestamp, and dispatches to handlers. Rotation logic subscribes to events and reacts by casting spells.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DRIVER-CLOCKED LOOP                               │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Rotation   │
                              │   (Handler)  │
                              └──────┬───────┘
                                     │
                                     │ subscribes to GCD_AURA_REMOVED
                                     │ calls SpellActions.cast()
                                     ▼
┌──────────────┐            ┌──────────────────┐
│ SpellActions │◀───────────│                  │
└──────┬───────┘            │                  │
       │                    │                  │
       │ emits CLEU events  │   HandlerRegistry│
       │ at currentTime     │                  │
       ▼                    │                  │
┌──────────────┐            └────────▲─────────┘
│  EventQueue  │                     │
│  (priority   │                     │ dispatch matching handlers
│   by time)   │                     │
└──────┬───────┘                     │
       │                             │
       │ pop earliest event          │
       ▼                             │
┌──────────────────────────────────────────────┐
│                  SimDriver                    │
│                                              │
│  1. event = queue.pop()                      │
│  2. currentTime = event.timestamp  ◀─────────┼── OWNS TIME
│  3. dispatch(event)                          │
│  4. loop                                     │
└──────────────────────────────────────────────┘
       │
       │ updates
       ▼
┌──────────────┐
│ StateService │
│ .currentTime │
└──────────────┘
```

## Event Flow Example

```
t=0.000  Initial state
         └─▶ Rotation sees no GCD active, decides to cast Bestial Wrath

t=0.000  SpellActions.cast(BESTIAL_WRATH)
         └─▶ Emits: SPELL_CAST_SUCCESS @ t=0.000
         └─▶ Emits: SPELL_AURA_APPLIED (Bestial Wrath buff) @ t=0.000
         └─▶ Emits: SPELL_AURA_APPLIED (GCD) @ t=0.000
         └─▶ Emits: SPELL_AURA_REMOVED (GCD) @ t=1.500

t=0.000  SimDriver processes SPELL_CAST_SUCCESS
         └─▶ currentTime = 0.000
         └─▶ Handlers log cast, update damage meters

t=0.000  SimDriver processes SPELL_AURA_APPLIED (buff)
         └─▶ Handlers update buff tracking state

t=0.000  SimDriver processes SPELL_AURA_APPLIED (GCD)
         └─▶ Handlers set state.gcdActive = true

t=1.500  SimDriver processes SPELL_AURA_REMOVED (GCD)
         └─▶ currentTime = 1.500
         └─▶ Handlers set state.gcdActive = false
         └─▶ Rotation handler triggered: "GCD ended, time to cast!"
         └─▶ Rotation decides next spell: Kill Command

t=1.500  SpellActions.cast(KILL_COMMAND)
         └─▶ Emits: SPELL_CAST_SUCCESS @ t=1.500
         └─▶ Emits: SPELL_AURA_APPLIED (GCD) @ t=1.500
         └─▶ Emits: SPELL_AURA_REMOVED (GCD) @ t=3.000

... and so on
```

## Component Responsibilities

### SimDriver

```typescript
// ONLY responsibility: process events and set time
const processEvent = (event: CombatLogEvent) =>
  Effect.gen(function* () {
    // 1. Set time from event
    yield* state.updateState((s) => s.set("currentTime", event.timestamp));

    // 2. Dispatch to handlers
    const handlers = yield* registry.getHandlers(event);
    for (const h of handlers) {
      yield* h.handler(event, emitter);
    }

    // 3. Queue any emitted events
    const emitted = yield* getEmitted(emitter);
    yield* queue.offerAll(emitted);
  });

const run = (endTime: number) =>
  Effect.gen(function* () {
    while (true) {
      const event = yield* queue.poll;
      if (Option.isNone(event)) break;
      if (event.value.timestamp > endTime) {
        yield* queue.offer(event.value); // put back
        break;
      }
      yield* processEvent(event.value);
    }
  });
```

### SpellActions

```typescript
// Does NOT advance time - just emits events
const cast = (unitId: UnitID, spellId: number) =>
  Effect.gen(function* () {
    const state = yield* stateService.getState();
    const now = state.currentTime;

    // Emit cast success
    yield* combatLog.emit(
      new SpellCastSuccess({
        timestamp: now,
        spellId,
        // ... other fields
      }),
    );

    // Emit GCD aura (if spell has GCD)
    if (spell.gcd > 0) {
      yield* combatLog.emit(
        new SpellAuraApplied({
          timestamp: now,
          spellId: GCD_AURA_ID,
          auraType: "BUFF",
          // ...
        }),
      );

      yield* combatLog.emit(
        new SpellAuraRemoved({
          timestamp: now + spell.gcd,
          spellId: GCD_AURA_ID,
          auraType: "BUFF",
          // ...
        }),
      );
    }
  });
```

### Rotation (as Handler)

```typescript
// Rotation subscribes to GCD removal
const rotationHandler: EventHandler<SpellAuraRemoved> = (event, emitter) =>
  Effect.gen(function* () {
    if (event.spellId !== GCD_AURA_ID) return;

    // GCD ended - decide next spell
    const state = yield* stateService.getState();
    const nextSpell = yield* decideNextSpell(state);

    // Cast it (will emit more events)
    yield* spellActions.cast(state.playerId, nextSpell);
  });

// Register on startup
yield *
  combatLog.on(
    { subevent: "SPELL_AURA_REMOVED", spellId: GCD_AURA_ID },
    rotationHandler,
    { id: "rotation:gcd-trigger", priority: 100 },
  );
```

## GCD as Real CLEU Events

The GCD is represented as an actual aura in the game. We use:

| Event                | Timestamp                | Meaning    |
| -------------------- | ------------------------ | ---------- |
| `SPELL_AURA_APPLIED` | Cast time                | GCD starts |
| `SPELL_AURA_REMOVED` | Cast time + GCD duration | GCD ends   |

This mirrors how WoW actually works - the GCD is visible as a "spell lockout" aura.

## Platform Behavior

### Simulation Mode

```typescript
// We generate all events
const runSimulation = (duration: number) =>
  Effect.gen(function* () {
    // Seed initial rotation decision
    yield* spellActions.cast(playerId, firstSpell);

    // Let SimDriver process everything
    yield* simDriver.run(duration);
  });
```

### Bot Mode

```typescript
// WoW generates events, we just process them
const runBot = () =>
  Effect.gen(function* () {
    // Subscribe to WoW's CLEU
    onCombatLogEvent((event) => {
      combatLog.emit(event);
    });

    // SimDriver processes as they arrive
    // Time comes from WoW's timestamps
    yield* simDriver.runForever();
  });
```

### Browser Mode

```typescript
// Events come from WebSocket/replay
const runBrowser = (eventSource: Stream<CombatLogEvent>) =>
  Effect.gen(function* () {
    yield* eventSource.forEach((event) => combatLog.emit(event));
    yield* simDriver.run(Infinity);
  });
```

## Pros

1. **Single time authority** - SimDriver is the only thing that writes `currentTime`
2. **Deterministic** - Same events = same results
3. **Pure event-driven** - All logic triggered by events
4. **Real CLEU only** - GCD is a real aura, not synthetic
5. **Same code everywhere** - Handlers work identically in sim/bot/browser

## Cons

1. **Rotation is reactive** - Can only act when events arrive
2. **GCD aura overhead** - Extra events for GCD tracking
3. **Latency sensitivity** - In bot mode, if GCD removal event is delayed, rotation delays
4. **Complex initialization** - Need to seed first cast somehow

## When to Use

- Pure simulations where determinism matters
- When you want the simulation to exactly mirror WoW's event stream
- When rotation logic should be purely reactive
