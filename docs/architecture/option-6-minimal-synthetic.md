# Option 6: Minimal Synthetic Events

## Overview

This architecture uses real CLEU events for everything except one unavoidable synthetic event: `GCD_UNLOCKED`. This single timer is the minimum required to make an event-driven system work, since WoW never emits a "GCD ended" CLEU event.

## The One Synthetic Event

### `GCD_UNLOCKED`

| Aspect                 | Detail                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Why needed**         | CLEU never emits "global cooldown ended". Without a wakeup, rotation stalls when no other events occur between casts.                     |
| **When emitted**       | Scheduled when we see a GCD-triggering event (`SPELL_CAST_SUCCESS` with GCD). Timestamp = `now + gcd_duration`.                           |
| **What it triggers**   | Decision engine runs, picks next spell, enqueues real WoW action.                                                                         |
| **Can it be avoided?** | Only via polling (busy tick every few ms) or non-CLEU UI events (`SPELL_UPDATE_COOLDOWN`), both of which break multi-platform constraint. |

## Everything Else is Real CLEU

| Game Mechanic   | How It's Handled                                                      |
| --------------- | --------------------------------------------------------------------- |
| Cooldowns       | Store `readyAt` timestamp per spell, compare with `now` when deciding |
| Resources       | Lazy compute from `lastResourceTimestamp + regenRate * elapsed`       |
| Aura expiration | Real `SPELL_AURA_REMOVED` events                                      |
| DoT ticks       | Real `SPELL_PERIODIC_DAMAGE` events                                   |
| Cast completion | Real `SPELL_CAST_SUCCESS` events                                      |
| Damage/healing  | Real `SPELL_DAMAGE`, `SPELL_HEAL` events                              |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MINIMAL SYNTHETIC ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Event Source Layer                                  │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  Simulation  │  │   Bot/WoW    │  │   Browser    │                      │
│  │  (generate)  │  │ (CLEU feed)  │  │ (WebSocket)  │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
│         │                 │                 │                               │
│         └────────────────┬┴─────────────────┘                              │
│                          │                                                  │
│                          ▼                                                  │
│              ┌───────────────────────┐                                      │
│              │ Unified Event Stream  │ (real CLEU + GCD_UNLOCKED timers)   │
│              └───────────────────────┘                                      │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Priority Queue                                       │
│                         (sorted by timestamp)                                │
│                                                                              │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│   │SPELL_CAST_SUCC  │ │ GCD_UNLOCKED    │ │SPELL_AURA_REM   │  ...          │
│   │ @ t=0.000       │ │ @ t=1.500       │ │ @ t=15.000      │               │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘               │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           │ pop earliest
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Reducer                                         │
│                                                                              │
│   reduce(state: GameState, event: Event) -> GameState                       │
│                                                                              │
│   • Real CLEU events: mutate auras, resources, cooldowns                    │
│   • GCD_UNLOCKED: set gcdLocked = false                                     │
│                                                                              │
│   Pure function, immutable state (Effect-TS)                                │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           │ if GCD_UNLOCKED
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Decision Engine                                      │
│                                                                              │
│   1. Read current GameState                                                 │
│   2. Lazy-compute derived values:                                           │
│      • Resources = lastValue + regenRate × (now - lastUpdate)               │
│      • Cooldowns = check readyAt vs now                                     │
│      • Procs = check current aura map                                       │
│   3. Run rotation priority logic                                            │
│   4. Return next spell to cast                                              │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │
                           │ spell decision
                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Output Port                                          │
│                                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│   │  Simulation  │  │   Bot/WoW    │  │   Browser    │                      │
│   │ (emit CLEU)  │  │ (press key)  │  │ (render)     │                      │
│   └──────────────┘  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Flow Example

```
t=0.000  SPELL_CAST_SUCCESS (Bestial Wrath) arrives
         ├─▶ Reducer: update state (buff applied, cooldown started)
         ├─▶ Scheduler: spell has GCD → schedule GCD_UNLOCKED @ t=1.500
         └─▶ (no decision yet, GCD locked)

t=0.000  SPELL_AURA_APPLIED (Bestial Wrath buff) arrives
         └─▶ Reducer: add buff to aura map

t=1.500  GCD_UNLOCKED (synthetic) fires
         ├─▶ Reducer: set gcdLocked = false
         └─▶ Decision Engine runs:
             ├─▶ Compute current resources (lazy)
             ├─▶ Check cooldowns vs t=1.500
             ├─▶ Run priority: Kill Command is best
             └─▶ Output: cast Kill Command

t=1.500  Output Port executes cast
         └─▶ Simulation: emit SPELL_CAST_SUCCESS @ t=1.500
             Bot: press keybind
             Browser: show action

t=1.500  SPELL_CAST_SUCCESS (Kill Command) arrives
         ├─▶ Reducer: update cooldown
         ├─▶ Scheduler: schedule GCD_UNLOCKED @ t=3.000
         └─▶ (GCD locked again)

... and so on
```

## Scheduler Service

The scheduler manages timers. It's a simple timer wheel that can be extended later for other timing needs (cast bars, animation locks) without adding new event types.

```typescript
interface SchedulerService {
  // Schedule a GCD_UNLOCKED event
  scheduleGcdUnlock(timestamp: number): Effect.Effect<void>;

  // Generic timer (for future use: cast completion, etc.)
  scheduleTimer(
    id: string,
    timestamp: number,
    payload: unknown,
  ): Effect.Effect<void>;

  // Cancel a timer
  cancel(id: string): Effect.Effect<void>;
}
```

## Reducer (Pure Function)

```typescript
type Event = CombatLogEvent | GcdUnlockedEvent;

interface GcdUnlockedEvent {
  _tag: "GCD_UNLOCKED";
  timestamp: number;
}

const reduce = (state: GameState, event: Event): GameState => {
  switch (event._tag) {
    case "GCD_UNLOCKED":
      return state.set("gcdLocked", false);

    case "SPELL_CAST_SUCCESS":
      return state
        .setIn(
          ["spells", event.spellId, "cooldownExpiry"],
          event.timestamp + getSpellCooldown(event.spellId),
        )
        .set("gcdLocked", true);

    case "SPELL_AURA_APPLIED":
      return state.setIn(["auras", event.spellId], {
        appliedAt: event.timestamp,
        stacks: event.amount ?? 1,
      });

    case "SPELL_AURA_REMOVED":
      return state.deleteIn(["auras", event.spellId]);

    // ... other real CLEU events

    default:
      return state;
  }
};
```

## Decision Engine

```typescript
const decide = (state: GameState, now: number): Effect.Effect<number | null> =>
  Effect.gen(function* () {
    // Lazy compute resources
    const resource = computeResource(state, now);

    // Check what's castable
    const castable = state.spells
      .filter((spell) => spell.cooldownExpiry <= now && resource >= spell.cost)
      .toList();

    // Run priority logic
    if (canCast(BESTIAL_WRATH) && !hasBuff(BESTIAL_WRATH_BUFF)) {
      return BESTIAL_WRATH;
    }
    if (canCast(KILL_COMMAND)) {
      return KILL_COMMAND;
    }
    // ... etc

    return null; // nothing to cast
  });
```

## Platform Behavior

### Simulation

```typescript
// We generate CLEU events when spells are cast
const onDecision = (spellId: number, timestamp: number) =>
  Effect.gen(function* () {
    // Emit real CLEU
    yield* queue.offer(new SpellCastSuccess({ timestamp, spellId, ... }));

    // Schedule GCD unlock
    yield* scheduler.scheduleGcdUnlock(timestamp + gcd);
  });
```

### Bot (WoW)

```typescript
// WoW generates CLEU events, we just react
const onWowCleu = (event: CombatLogEvent) =>
  Effect.gen(function* () {
    yield* queue.offer(event);

    // If this starts a GCD, schedule unlock
    if (event._tag === "SPELL_CAST_SUCCESS" && hasGcd(event.spellId)) {
      yield* scheduler.scheduleGcdUnlock(event.timestamp + gcd);
    }
  });

const onDecision = (spellId: number) =>
  Effect.gen(function* () {
    // Press the keybind - WoW will generate the CLEU
    yield* pressKey(getKeybind(spellId));
  });
```

### Browser

```typescript
// Events come from WebSocket/replay, same as simulation
const onEvent = (event: Event) =>
  Effect.gen(function* () {
    yield* queue.offer(event);

    if (event._tag === "SPELL_CAST_SUCCESS" && hasGcd(event.spellId)) {
      yield* scheduler.scheduleGcdUnlock(event.timestamp + gcd);
    }
  });
```

## Pros

1. **Truly minimal** - Only ONE synthetic event
2. **Real CLEU everywhere else** - Auras, damage, resources all use real events
3. **Same code path** - Decision engine identical across platforms
4. **Pure reducer** - Easy to test, deterministic
5. **Extensible** - Timer wheel can add more timers without new event types

## Cons

1. **Still one synthetic event** - Not 100% pure CLEU
2. **GCD duration must be known** - Need spell data for GCD calculation
3. **Scheduler complexity** - Timer management adds some code

## Why This Is Minimal

Every other approach either:

- Polls continuously (wastes resources, different behavior per platform)
- Uses multiple synthetic events (GCD_LOCK, GCD_UNLOCK, ROTATION_TICK, etc.)
- Relies on non-CLEU WoW events (SPELL_UPDATE_COOLDOWN)

This uses exactly ONE synthetic event that bridges the one gap WoW's CLEU doesn't cover.
