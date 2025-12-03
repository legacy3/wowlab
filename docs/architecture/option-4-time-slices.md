# Option 4: Time Slice Pipeline

## Overview

A TimeSlice Manager batches events by timestamp and processes them in discrete time slices. All events at the same timestamp are processed together before advancing to the next slice. This provides clean separation between event sources (simulation, bot, browser) and ensures consistent ordering.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIME SLICE PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLEU Adapter Layer                                     │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  SimAdapter  │  │  BotAdapter  │  │BrowserAdapter│                      │
│  │ (generates)  │  │ (from WoW)   │  │ (WebSocket)  │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
│         │                 │                 │                               │
│         └────────────────┼─────────────────┘                               │
│                          │                                                  │
│                          ▼                                                  │
│                   ┌──────────────┐                                          │
│                   │  EventQueue  │                                          │
│                   └──────────────┘                                          │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       TimeSlice Manager                        OWNS TIME    │
│                                                                              │
│   1. Collect all events at timestamp T                                       │
│   2. Set currentTime = T                                                     │
│   3. Process slice (all events at T)                                         │
│   4. Run rotation (may enqueue events at T or T+N)                          │
│   5. Advance to next timestamp T' where T' > T                              │
│   6. Loop                                                                    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Slice @ t=0.000: [SPELL_CAST_SUCCESS, SPELL_AURA_APPLIED, ...]     │   │
│   │ Slice @ t=1.500: [SPELL_CAST_SUCCESS, SPELL_DAMAGE, ...]           │   │
│   │ Slice @ t=3.000: [SPELL_AURA_REMOVED, SPELL_CAST_SUCCESS, ...]     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           │ process each slice
                           ▼
                   ┌─────────────────┐
                   │ HandlerRegistry │
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌──────────┐               ┌──────────────┐
       │ Handlers │               │   Rotation   │ (runs at end of slice)
       └──────────┘               └──────┬───────┘
                                         │
                                         │ may cast
                                         ▼
                                  ┌──────────────┐
                                  │ SpellActions │
                                  └──────────────┘
                                         │
                                         │ enqueue events
                                         └─────────────▶ back to queue
```

## Time Slice Concept

```
Timeline:
├─── t=0.000 ───┼─── t=0.000 ───┼─── t=1.500 ───┼─── t=3.000 ───┤
│ CAST_SUCCESS  │ AURA_APPLIED  │ CAST_SUCCESS  │ AURA_REMOVED  │
│ (Bestial W)   │ (Bestial W)   │ (Kill Cmd)    │ (Bestial W)   │
└───────────────┴───────────────┴───────────────┴───────────────┘
        │               │               │               │
        └───────┬───────┘               │               │
                │                       │               │
         Slice 1 @ t=0.000       Slice 2 @ t=1.500   Slice 3 @ t=3.000
         (2 events)              (1 event)           (1 event)
```

## Event Flow Example

```
Slice @ t=0.000:
  ├─▶ Collect: [SPELL_CAST_SUCCESS(BW), SPELL_AURA_APPLIED(BW_buff)]
  ├─▶ Set currentTime = 0.000
  ├─▶ Process SPELL_CAST_SUCCESS
  │   └─▶ Handler logs cast
  ├─▶ Process SPELL_AURA_APPLIED
  │   └─▶ Handler updates buff state
  ├─▶ Run Rotation @ end of slice
  │   └─▶ Decides: Cast Kill Command
  │   └─▶ SpellActions.cast(KILL_COMMAND)
  │       └─▶ Enqueues SPELL_CAST_SUCCESS @ t=0.000 (instant, same slice)
  │       └─▶ Enqueues SPELL_DAMAGE @ t=0.000
  │       └─▶ Enqueues GCD_END marker @ t=1.500 (internal tracking)
  ├─▶ New events at t=0.000? YES - extend slice
  ├─▶ Process SPELL_CAST_SUCCESS(KC)
  ├─▶ Process SPELL_DAMAGE
  ├─▶ Run Rotation @ end of slice
  │   └─▶ GCD active, cannot cast
  ├─▶ No more events at t=0.000
  └─▶ Advance to next timestamp: t=1.500

Slice @ t=1.500:
  ├─▶ Collect: [GCD_END_MARKER]
  ├─▶ Set currentTime = 1.500
  ├─▶ Process GCD_END_MARKER
  │   └─▶ Handler sets gcdActive = false
  ├─▶ Run Rotation @ end of slice
  │   └─▶ Decides: Cast Barbed Shot
  │   └─▶ Enqueues events...
  └─▶ Continue...
```

## Component Responsibilities

### TimeSlice Manager

```typescript
interface TimeSlice {
  timestamp: number;
  events: CombatLogEvent[];
}

const runSlices = (endTime: number) =>
  Effect.gen(function* () {
    const stateService = yield* StateService;
    const queue = yield* EventQueue;
    const registry = yield* HandlerRegistry;
    const rotation = yield* RotationService;

    while (true) {
      // 1. Get next timestamp
      const nextEvent = yield* queue.peek;
      if (Option.isNone(nextEvent)) break;
      if (nextEvent.value.timestamp > endTime) break;

      const sliceTime = nextEvent.value.timestamp;

      // 2. Collect all events at this timestamp
      const slice = yield* collectSlice(queue, sliceTime);

      // 3. Set time
      yield* stateService.updateState((s) => s.set("currentTime", sliceTime));

      // 4. Process slice
      yield* processSlice(slice, registry);

      // 5. Run rotation at end of slice
      yield* rotation.tick();

      // 6. Check for new events at same timestamp (from rotation)
      // Loop until no more events at sliceTime
      while (true) {
        const peek = yield* queue.peek;
        if (Option.isNone(peek) || peek.value.timestamp !== sliceTime) break;

        const extraSlice = yield* collectSlice(queue, sliceTime);
        yield* processSlice(extraSlice, registry);
        yield* rotation.tick();
      }
    }
  });

const collectSlice = (queue: EventQueue, timestamp: number) =>
  Effect.gen(function* () {
    const events: CombatLogEvent[] = [];
    while (true) {
      const peek = yield* queue.peek;
      if (Option.isNone(peek) || peek.value.timestamp !== timestamp) break;
      const event = yield* queue.take;
      events.push(event);
    }
    return { timestamp, events };
  });

const processSlice = (slice: TimeSlice, registry: HandlerRegistry) =>
  Effect.gen(function* () {
    for (const event of slice.events) {
      const handlers = yield* registry.getHandlers(event);
      for (const h of handlers) {
        yield* h.handler(event);
      }
    }
  });
```

### CLEU Adapters

```typescript
// Simulation Adapter - generates events
const SimAdapter = {
  init: () =>
    Effect.gen(function* () {
      // Seed initial events
      yield* queue.offer(
        new SpellCastSuccess({
          timestamp: 0,
          spellId: FIRST_SPELL,
          // ...
        }),
      );
    }),
};

// Bot Adapter - receives from WoW
const BotAdapter = {
  init: () =>
    Effect.gen(function* () {
      onCombatLogEvent((wowEvent) => {
        const event = convertWowEvent(wowEvent);
        queue.offer(event);
      });
    }),
};

// Browser Adapter - WebSocket or replay
const BrowserAdapter = {
  init: (source: EventSource) =>
    Effect.gen(function* () {
      source.onMessage((data) => {
        const event = parseEvent(data);
        queue.offer(event);
      });
    }),
};
```

### Rotation Service

```typescript
const RotationService = Effect.gen(function* () {
  const state = yield* StateService;
  const spellActions = yield* SpellActions;
  const queue = yield* EventQueue;

  return {
    tick: () =>
      Effect.gen(function* () {
        const gameState = yield* state.getState();

        // Check if we can act (GCD ready)
        if (gameState.gcdActive) return;

        // Decide next spell
        const spell = yield* decideNextSpell(gameState);
        if (!spell) return;

        // Cast (will enqueue events)
        yield* spellActions.cast(gameState.playerId, spell);
      }),
  };
});
```

## GCD Handling

GCD is tracked via state fields, updated by handlers:

```typescript
// State
interface GameState {
  currentTime: number;
  gcdActive: boolean;
  gcdEnd: number;
}

// When spell is cast, handler updates GCD
const onCastSuccess: EventHandler<SpellCastSuccess> = (event) =>
  Effect.gen(function* () {
    const spell = yield* getSpellInfo(event.spellId);
    if (spell.triggersGcd) {
      yield* state.updateState((s) =>
        s.set("gcdActive", true).set("gcdEnd", event.timestamp + spell.gcd),
      );

      // Schedule GCD end as internal event
      yield* queue.offer({
        _tag: "GCD_END",
        timestamp: event.timestamp + spell.gcd,
      });
    }
  });

// GCD end handler
const onGcdEnd: EventHandler<GcdEndEvent> = (event) =>
  Effect.gen(function* () {
    yield* state.updateState((s) => s.set("gcdActive", false));
  });
```

Note: `GCD_END` is an internal marker, not a real CLEU event. If you want pure CLEU, use `SPELL_AURA_REMOVED` instead.

## Platform Behavior

All platforms use the same TimeSlice Manager - only the adapter differs:

```typescript
const run = (platform: "sim" | "bot" | "browser", config: Config) =>
  Effect.gen(function* () {
    // Initialize appropriate adapter
    switch (platform) {
      case "sim":
        yield* SimAdapter.init();
        break;
      case "bot":
        yield* BotAdapter.init();
        break;
      case "browser":
        yield* BrowserAdapter.init(config.eventSource);
        break;
    }

    // Same processing logic for all
    yield* runSlices(config.duration);
  });
```

## Pros

1. **Clean separation** - Adapters isolated from processing logic
2. **Consistent ordering** - Same-timestamp events processed together
3. **Easy debugging** - Can inspect slices before processing
4. **Platform parity** - Identical behavior across sim/bot/browser
5. **Deterministic** - Same slices = same results

## Cons

1. **Buffering overhead** - Must collect events before processing
2. **Latency** - In bot mode, must wait for full slice
3. **Complexity** - Extra layer between queue and handlers
4. **Internal markers** - May need pseudo-events for GCD
5. **Slice extension** - New events during slice processing complicate flow

## When to Use

- Multi-platform applications with strict parity requirements
- Replay/analysis systems that need to process historical data
- When you need clean separation between event sources
- Browser-based simulators with various input sources
