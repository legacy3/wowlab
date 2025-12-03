# Option 5: Dual-Clock Adapter

## Overview

A TimeAdapter normalizes time from multiple sources: simulation queue timestamps, WoW's GetTime(), or browser's performance.now()/requestAnimationFrame. The adapter is the single authority that advances StateService.currentTime, regardless of the underlying clock source. Rotation can request "wake me when time reaches X" without knowing which clock is active.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DUAL-CLOCK ADAPTER                                │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌───────────────────────────────────┐
                         │         Environment Clocks        │
                         ├───────────────────────────────────┤
                         │  ┌─────────┐  ┌─────────┐  ┌────┐ │
                         │  │ SimTime │  │GetTime()│  │RAF │ │
                         │  │ (queue) │  │ (WoW)   │  │(JS)│ │
                         │  └────┬────┘  └────┬────┘  └──┬─┘ │
                         │       │            │          │   │
                         └───────┼────────────┼──────────┼───┘
                                 │            │          │
                                 └─────┬──────┴──────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │        TimeAdapter          │◀── OWNS TIME
                         │                             │
                         │  • normalizes all clocks    │
                         │  • advances currentTime     │
                         │  • manages wake requests    │
                         │                             │
                         │  Interface:                 │
                         │  - now(): number            │
                         │  - requestWake(time): void  │
                         │  - onWake(cb): Subscription │
                         └──────────────┬──────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
       ┌──────────────┐         ┌──────────────┐          ┌──────────┐
       │  SimDriver   │         │ StateService │          │ Rotation │
       │              │         │ .currentTime │          │          │
       │ processes    │         └──────────────┘          │ requests │
       │ CLEU events  │                                   │ wake at  │
       └──────┬───────┘                                   │ gcdEnd   │
              │                                           └────┬─────┘
              │                                                │
              ▼                                                │
       ┌──────────────┐                                        │
       │  EventQueue  │◀───────────────────────────────────────┘
       └──────┬───────┘         enqueue future events
              │
              ▼
       ┌─────────────────┐
       │ HandlerRegistry │
       └─────────────────┘
```

## TimeAdapter Implementations

### Simulation Mode (Queue-Based Time)

```typescript
const SimTimeAdapter = Effect.gen(function* () {
  const queue = yield* EventQueue;
  const state = yield* StateService;

  let wakeRequests: Array<{ time: number; callback: () => void }> = [];

  return {
    now: () =>
      Effect.gen(function* () {
        const s = yield* state.getState();
        return s.currentTime;
      }),

    // In sim mode, advance by processing queue
    advance: () =>
      Effect.gen(function* () {
        const event = yield* queue.poll;
        if (Option.isNone(event)) return false;

        // Set time from event
        yield* state.updateState((s) =>
          s.set("currentTime", event.value.timestamp),
        );

        // Check wake requests
        const currentTime = event.value.timestamp;
        const ready = wakeRequests.filter((w) => w.time <= currentTime);
        wakeRequests = wakeRequests.filter((w) => w.time > currentTime);
        ready.forEach((w) => w.callback());

        // Process event
        yield* processEvent(event.value);

        return true;
      }),

    requestWake: (time: number, callback: () => void) => {
      wakeRequests.push({ time, callback });
      wakeRequests.sort((a, b) => a.time - b.time);
    },

    // Fast-forward to a specific time
    sleepUntil: (targetTime: number) =>
      Effect.gen(function* () {
        while (true) {
          const s = yield* state.getState();
          if (s.currentTime >= targetTime) break;

          const hasMore = yield* this.advance();
          if (!hasMore) {
            // No more events - just set time
            yield* state.updateState((s) => s.set("currentTime", targetTime));
            break;
          }
        }
      }),
  };
});
```

### Bot Mode (WoW Time)

```typescript
const WowTimeAdapter = Effect.gen(function* () {
  const state = yield* StateService;

  let wakeRequests: Array<{ time: number; callback: () => void }> = [];
  let lastWowTime = 0;

  // Called on each WoW frame
  const onFrame = (wowTime: number) =>
    Effect.gen(function* () {
      lastWowTime = wowTime;
      yield* state.updateState((s) => s.set("currentTime", wowTime));

      // Check wake requests
      const ready = wakeRequests.filter((w) => w.time <= wowTime);
      wakeRequests = wakeRequests.filter((w) => w.time > wowTime);
      ready.forEach((w) => w.callback());
    });

  // Called when CLEU event arrives
  const onEvent = (event: CombatLogEvent) =>
    Effect.gen(function* () {
      // Update time to event timestamp
      yield* state.updateState((s) => s.set("currentTime", event.timestamp));

      // Process
      yield* processEvent(event);

      // Check wakes
      const ready = wakeRequests.filter((w) => w.time <= event.timestamp);
      wakeRequests = wakeRequests.filter((w) => w.time > event.timestamp);
      ready.forEach((w) => w.callback());
    });

  return {
    now: () => Effect.succeed(lastWowTime),

    requestWake: (time: number, callback: () => void) => {
      wakeRequests.push({ time, callback });
    },

    // In bot mode, sleepUntil actually waits
    sleepUntil: (targetTime: number) =>
      Effect.async<void>((resume) => {
        if (lastWowTime >= targetTime) {
          resume(Effect.unit);
        } else {
          wakeRequests.push({
            time: targetTime,
            callback: () => resume(Effect.unit),
          });
        }
      }),

    // Hooks for WoW integration
    onFrame,
    onEvent,
  };
});
```

### Browser Mode (RAF Time)

```typescript
const BrowserTimeAdapter = Effect.gen(function* () {
  const state = yield* StateService;

  let wakeRequests: Array<{ time: number; callback: () => void }> = [];
  let startRealTime = performance.now();
  let simTimeOffset = 0;

  const realToSimTime = (realTime: number) =>
    (realTime - startRealTime) / 1000 + simTimeOffset;

  return {
    now: () => Effect.sync(() => realToSimTime(performance.now())),

    requestWake: (time: number, callback: () => void) => {
      wakeRequests.push({ time, callback });
    },

    sleepUntil: (targetTime: number) =>
      Effect.async<void>((resume) => {
        const check = () => {
          const now = realToSimTime(performance.now());
          if (now >= targetTime) {
            resume(Effect.unit);
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      }),

    // For replay: process events from WebSocket
    onEvent: (event: CombatLogEvent) =>
      Effect.gen(function* () {
        yield* state.updateState((s) => s.set("currentTime", event.timestamp));
        yield* processEvent(event);
      }),
  };
});
```

## Event Flow Example

```
┌────────────────────────────────────────────────────────────────┐
│ SIMULATION MODE                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ t=0.000  Rotation casts Bestial Wrath                          │
│          └─▶ Enqueues SPELL_CAST_SUCCESS @ 0.000               │
│          └─▶ Enqueues SPELL_AURA_APPLIED @ 0.000               │
│          └─▶ Requests wake at t=1.500 (GCD end)                │
│                                                                │
│ t=0.000  TimeAdapter.advance()                                 │
│          └─▶ Pops SPELL_CAST_SUCCESS                           │
│          └─▶ Sets currentTime = 0.000                          │
│          └─▶ Processes event                                   │
│                                                                │
│ t=0.000  TimeAdapter.advance()                                 │
│          └─▶ Pops SPELL_AURA_APPLIED                           │
│          └─▶ Sets currentTime = 0.000                          │
│          └─▶ Processes event                                   │
│                                                                │
│ t=0.000  TimeAdapter.advance()                                 │
│          └─▶ Queue empty, no event to pop                      │
│          └─▶ sleepUntil(1.500) fast-forwards                   │
│          └─▶ Sets currentTime = 1.500                          │
│          └─▶ Triggers wake callback                            │
│                                                                │
│ t=1.500  Rotation wakes up, casts Kill Command                 │
│          └─▶ Enqueues events...                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ BOT MODE                                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ t=0.000  Player presses keybind for Bestial Wrath              │
│                                                                │
│ t=0.050  WoW sends COMBAT_LOG_EVENT_UNFILTERED                 │
│          └─▶ TimeAdapter.onEvent(SPELL_CAST_SUCCESS)           │
│          └─▶ Sets currentTime = 0.050                          │
│          └─▶ Processes event                                   │
│                                                                │
│ t=0.050  Rotation handler triggered                            │
│          └─▶ Decides next spell: Kill Command                  │
│          └─▶ Requests wake at t=1.550 (GCD end)                │
│                                                                │
│ ...real time passes...                                         │
│                                                                │
│ t=1.550  WoW frame tick                                        │
│          └─▶ TimeAdapter.onFrame(1.550)                        │
│          └─▶ Sets currentTime = 1.550                          │
│          └─▶ Triggers wake callback                            │
│                                                                │
│ t=1.550  Rotation wakes, sends keybind for Kill Command        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Rotation with Wake Requests

```typescript
const runRotation = () =>
  Effect.gen(function* () {
    const timeAdapter = yield* TimeAdapter;
    const spellActions = yield* SpellActions;
    const state = yield* StateService;

    while (true) {
      // Wait for GCD to be ready
      const gameState = yield* state.getState();
      if (gameState.gcdEnd > gameState.currentTime) {
        yield* timeAdapter.sleepUntil(gameState.gcdEnd);
      }

      // Decide and cast
      const spell = yield* decideNextSpell();
      yield* spellActions.cast(spell);

      // Update GCD end time
      const spellInfo = yield* getSpellInfo(spell);
      const newGcdEnd = gameState.currentTime + spellInfo.gcd;
      yield* state.updateState((s) => s.set("gcdEnd", newGcdEnd));
    }
  });
```

### SpellActions (No Time Management)

```typescript
const cast = (spellId: number) =>
  Effect.gen(function* () {
    const timeAdapter = yield* TimeAdapter;
    const now = yield* timeAdapter.now();

    // Just emit events at current time
    yield* combatLog.emit(
      new SpellCastSuccess({
        timestamp: now,
        spellId,
        // ...
      }),
    );
  });
```

## GCD Handling

GCD is tracked as a timestamp in state. Rotation uses `sleepUntil(gcdEnd)`:

```typescript
// State
interface GameState {
  currentTime: number;
  gcdEnd: number; // When GCD will be ready
}

// Rotation checks GCD before casting
if (state.gcdEnd > state.currentTime) {
  yield * timeAdapter.sleepUntil(state.gcdEnd);
}

// After cast, update GCD
state.gcdEnd = state.currentTime + spell.gcd;
```

In simulation, `sleepUntil` fast-forwards. In bot mode, it actually waits.

## Pros

1. **Unified interface** - Same rotation code for all platforms
2. **Real-time support** - Bot mode can wait for actual time
3. **Flexible** - Easy to add new time sources
4. **Wake semantics** - Natural "notify me when ready" pattern
5. **No synthetic events** - GCD is just a timestamp comparison

## Cons

1. **Abstraction overhead** - Extra layer between code and time
2. **Testing complexity** - Must mock time adapter
3. **Two time concepts** - "Sim time" vs "real time" can confuse
4. **Async complexity** - Wake callbacks add state
5. **Platform leakage** - Bot-specific timing concerns may leak

## When to Use

- Applications that must run both as simulation AND live bot
- When rotation logic should be truly platform-agnostic
- Real-time systems where actual waiting is required
- Complex scheduling with multiple wake conditions
