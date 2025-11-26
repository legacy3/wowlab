# Combat Log Event Architecture

Architecture for a WoW spell rotation simulator that runs in two modes:

1. **Browser mode**: Full simulation, Supabase provides spell/item data
2. **WoW mode**: Embedded V8 inside WoW client, receives real combat log events

## Core Concept

The same simulation code runs in both environments. In WoW mode, it works like Hekili: the sim runs ahead predicting optimal actions, while real combat log events feed in to correct/confirm state (procs, cast confirmations, external buffs, etc.).

```text
┌─────────────────────────────────────────────────────────────┐
│                      Simulation Core                        │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ GameState   │◄───│ CombatLog    │◄───│ Event Source  │  │
│  │ (truth)     │    │ Processor    │    │               │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│         │                                       ▲           │
│         ▼                                       │           │
│  ┌─────────────┐                      ┌─────────┴────────┐ │
│  │ APL/Rotation│                      │ Browser: SimDriver│ │
│  │ (reads      │                      │ WoW: Real CLEU    │ │
│  │  state)     │                      └──────────────────┘ │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Event Architecture

### Combat Log Events (WoW Format)

Events that match WoW's `COMBAT_LOG_EVENT_UNFILTERED`. Used for:

- Input from WoW in live mode
- Simulation output in browser mode
- State synchronization between predicted and actual

These use WoW's prefix+suffix structure:

- `SPELL_CAST_SUCCESS` = SPELL prefix + _CAST_SUCCESS suffix
- `SPELL_DAMAGE` = SPELL prefix + _DAMAGE suffix
- `SPELL_AURA_APPLIED` = SPELL prefix + _AURA_APPLIED suffix

### Single Internal Event: APL_EVALUATE

One internal event for scheduling rotation evaluation. No WoW equivalent, never leaves the simulation.

When to schedule `APL_EVALUATE`:

- Cooldown expires → `scheduleAPL(cooldownExpiresAt)`
- GCD expires → `scheduleAPL(gcdExpiresAt)`
- Charge refills → `scheduleAPL(chargeReadyAt)`
- Combat log event processed → `scheduleAPL(event.timestamp)`

The scheduler dedupes APL events (keeps earliest). Spam `scheduleAPL` freely.

```typescript
// After processing any combat log event
yield* scheduleAPL(event.timestamp);

// When scheduling cooldown in handler
const cooldownExpires = event.timestamp + spell.info.cooldown;
yield* scheduleAPL(cooldownExpires);
```

## WoW Mode: How It Works

### Feed Everything, Handlers Are Idempotent

Don't filter or categorize events. Feed all combat log events to CombatLogProcessor. Handlers check state and apply:

```typescript
// Handler for SPELL_AURA_APPLIED
handle(event: SpellAuraApplied) {
  const existingAura = state.getAura(event.destGUID, event.spellId);

  if (existingAura) {
    // Already have it (sim predicted it) → refresh duration
    state.refreshAura(event.destGUID, event.spellId, event.timestamp);
  } else {
    // Don't have it (proc we couldn't predict) → add it
    state.addAura(event.destGUID, event.spellId, event.timestamp);
  }
  // State converges either way
}
```

No need to know if event is "correction" or "confirmation". State converges.

### Lookahead Predictions (Hekili-style)

To show "next 3 spells":

1. Fork current GameState
2. Run sim forward on fork (evaluate APL 3 times)
3. Collect predicted spell sequence
4. Display to user
5. When real events arrive, update actual state
6. Re-fork and re-predict when state changes

Predictions are disposable. Ground truth always wins.

### Timing

Sim advances `currentTime` to event timestamps in both modes:

- Browser: SimDriver controls time, schedules events in priority queue
- WoW: Events arrive with real timestamps, sim advances to match

The priority queue still works in WoW mode for scheduling `APL_EVALUATE`. Real combat log events inject with their actual timestamps.

## Combat Log Event Structure

Based on WoW's `CombatLogGetCurrentEventInfo()`.

### Base Fields (All Events)

```typescript
interface CombatLogEventBase {
  timestamp: number;      // Unix time with ms precision
  subevent: string;       // e.g., "SPELL_DAMAGE"
  sourceGUID: string;     // Who did it
  sourceName: string;
  sourceFlags: number;    // Unit type flags
  destGUID: string;       // Target
  destName: string;
  destFlags: number;
}
```

### Prefix Types

| Prefix           | Extra Fields                    |
| ---------------- | ------------------------------- |
| `SWING`          | (none)                          |
| `SPELL`          | spellId, spellName, spellSchool |
| `SPELL_PERIODIC` | spellId, spellName, spellSchool |
| `RANGE`          | spellId, spellName, spellSchool |

### Suffix Types

| Suffix               | Extra Fields                               |
| -------------------- | ------------------------------------------ |
| `_CAST_START`        | (none)                                     |
| `_CAST_SUCCESS`      | (none)                                     |
| `_CAST_FAILED`       | failedType                                 |
| `_DAMAGE`            | amount, overkill, school, critical, etc.   |
| `_HEAL`              | amount, overhealing, absorbed, critical    |
| `_AURA_APPLIED`      | auraType ("BUFF" / "DEBUFF"), amount?      |
| `_AURA_REMOVED`      | auraType, amount?                          |
| `_AURA_REFRESH`      | auraType                                   |
| `_AURA_APPLIED_DOSE` | auraType, amount (stack count)             |
| `_AURA_REMOVED_DOSE` | auraType, amount (stack count)             |
| `_ENERGIZE`          | amount, powerType                          |
| `_MISSED`            | missType, amountMissed?                    |
| `_INTERRUPT`         | extraSpellId, extraSpellName, extraSchool  |

### Priority Subevents for Rotation Sim

Focus on these first:

| Subevent             | Why It Matters                       |
| -------------------- | ------------------------------------ |
| `SPELL_CAST_START`   | Player started casting               |
| `SPELL_CAST_SUCCESS` | Cast completed, cooldown started     |
| `SPELL_CAST_FAILED`  | Cast interrupted/failed              |
| `SPELL_AURA_APPLIED` | Buff/proc activated                  |
| `SPELL_AURA_REMOVED` | Buff expired/consumed                |
| `SPELL_AURA_REFRESH` | Buff duration reset                  |
| `SPELL_ENERGIZE`     | Resource gained (combo points, etc.) |
| `SPELL_DAMAGE`       | For damage tracking/logging          |
| `UNIT_DIED`          | Target dead, pick new target         |

Everything else (ENVIRONMENTAL_DAMAGE, ENCHANT_APPLIED, etc.) can be ignored initially.

## Components

### CombatLogProcessor

Receives all combat log events, routes to handlers, updates GameState:

```typescript
class CombatLogProcessor extends Effect.Service<CombatLogProcessor>()(
  "CombatLogProcessor",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;
      const handlers = yield* CombatLogHandlerRegistry;
      const scheduler = yield* EventSchedulerService;

      return {
        process: (event: CombatLogEvent) =>
          Effect.gen(function* () {
            // Advance time to event timestamp
            yield* state.updateState(s =>
              s.set("currentTime", Math.max(s.currentTime, event.timestamp))
            );

            // Get handler for this subevent
            const handler = handlers.get(event.subevent);
            if (handler) {
              yield* handler(event);
            }

            // State changed, schedule APL re-evaluation
            yield* scheduler.scheduleAPL(event.timestamp);
          }),
      };
    }),
  },
) {}
```

### SimDriver (Browser Mode)

Generates combat log events based on spell execution:

```typescript
executeCast(casterId: string, spellId: number, targetId: string) {
  const spell = yield* getSpellInfo(spellId);
  const now = yield* getCurrentTime();

  // Emit SPELL_CAST_START (if has cast time)
  if (spell.castTime > 0) {
    yield* processor.process({
      timestamp: now,
      subevent: "SPELL_CAST_START",
      sourceGUID: casterId,
      destGUID: targetId,
      spellId,
      spellName: spell.name,
      spellSchool: spell.schoolMask,
    });
  }

  // Schedule SPELL_CAST_SUCCESS at cast end
  const castEnd = now + spell.castTime;
  yield* scheduler.scheduleAt(castEnd, () =>
    processor.process({
      timestamp: castEnd,
      subevent: "SPELL_CAST_SUCCESS",
      sourceGUID: casterId,
      destGUID: targetId,
      spellId,
      spellName: spell.name,
      spellSchool: spell.schoolMask,
    })
  );
}
```

### WoWEventSource (WoW Mode)

Receives real combat log events from WoW's Lua environment:

```typescript
class WoWEventSource {
  constructor(private processor: CombatLogProcessor) {}

  // Called from Lua when COMBAT_LOG_EVENT_UNFILTERED fires
  onCombatLogEvent(raw: unknown[]) {
    const event = parseCombatLogEvent(raw);
    Effect.runPromise(this.processor.process(event));
  }
}
```

### Handler Examples

```typescript
// SPELL_CAST_SUCCESS handler
const handleCastSuccess = (event: SpellCastSuccess) =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const scheduler = yield* EventSchedulerService;
    const player = yield* getPlayer();

    // Clear casting state
    yield* state.updateState(s =>
      s.setIn(["units", player.id, "isCasting"], false)
       .setIn(["units", player.id, "castingSpellId"], null)
    );

    // Start cooldown
    const spell = player.spells.get(event.spellId);
    if (spell && spell.info.cooldown > 0) {
      const cooldownExpires = event.timestamp + spell.info.cooldown;

      yield* state.updateState(s =>
        s.setIn(
          ["units", player.id, "spells", event.spellId, "cooldownExpiry"],
          cooldownExpires
        )
      );

      // Schedule APL when cooldown expires
      yield* scheduler.scheduleAPL(cooldownExpires);
    }
  });

// SPELL_AURA_APPLIED handler (idempotent)
const handleAuraApplied = (event: SpellAuraApplied) =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();
    const unit = currentState.units.get(event.destGUID);

    if (!unit) return; // Not tracking this unit

    const existingAura = unit.auras.get(event.spellId);
    const auraInfo = yield* getAuraInfo(event.spellId);

    if (existingAura) {
      // Refresh existing aura
      yield* state.updateState(s =>
        s.setIn(
          ["units", event.destGUID, "auras", event.spellId, "expiresAt"],
          event.timestamp + auraInfo.duration
        )
      );
    } else {
      // Add new aura
      const newAura = Aura.create({
        spellId: event.spellId,
        casterUnitId: event.sourceGUID,
        expiresAt: event.timestamp + auraInfo.duration,
        stacks: event.amount ?? 1,
      });

      yield* state.updateState(s =>
        s.setIn(["units", event.destGUID, "auras", event.spellId], newAura)
      );
    }
  });
```

## File Structure

Matches existing package patterns (`internal/{feature}/`):

```text
packages/wowlab-core/src/internal/combatlog/
├── CombatLogEvent.ts           # Base event schema
├── CombatLogSubevent.ts        # Subevent union type
├── prefixes/
│   ├── SpellPrefix.ts
│   ├── SwingPrefix.ts
│   └── index.ts
├── suffixes/
│   ├── DamageSuffix.ts
│   ├── AuraSuffix.ts
│   ├── CastSuffix.ts
│   └── index.ts
├── events/                     # Composed event types
│   ├── SpellCastSuccess.ts
│   ├── SpellDamage.ts
│   ├── SpellAuraApplied.ts
│   └── index.ts
└── index.ts

packages/wowlab-services/src/internal/combatlog/
├── CombatLogProcessor.ts       # Main processor service
├── CombatLogHandlerRegistry.ts # Handler registration
├── handlers/
│   ├── cast.ts                 # CAST_START, CAST_SUCCESS, CAST_FAILED
│   ├── aura.ts                 # AURA_APPLIED, AURA_REMOVED, AURA_REFRESH
│   ├── damage.ts               # DAMAGE, HEAL
│   ├── resource.ts             # ENERGIZE
│   └── index.ts
└── index.ts

packages/wowlab-services/src/internal/simulation/
├── SimulationService.ts        # Existing, minimal changes
├── SimDriver.ts                # NEW: Generates combat log events
├── WoWEventSource.ts           # NEW: Receives WoW events
└── index.ts
```

Barrel exports:

- `packages/wowlab-core/src/CombatLog.ts` → re-exports from `internal/combatlog/`
- `packages/wowlab-services/src/CombatLog.ts` → re-exports from `internal/combatlog/`

## Migration Path

### Phase 1: Combat Log Schemas

1. Create `packages/wowlab-core/src/internal/combatlog/` directory
2. Define CombatLogEventBase schema
3. Define prefix schemas (SpellPrefix, SwingPrefix)
4. Define suffix schemas (DamageSuffix, AuraSuffix, etc.)
5. Create composed event types (SpellCastSuccess, SpellDamage, etc.)
6. Add barrel export `packages/wowlab-core/src/CombatLog.ts`

### Phase 2: CombatLogProcessor

1. Create `packages/wowlab-services/src/internal/combatlog/` directory
2. Create CombatLogHandlerRegistry service
3. Create CombatLogProcessor service
4. Implement handlers for priority subevents
5. Make handlers idempotent (check state, apply if needed)
6. Add barrel export `packages/wowlab-services/src/CombatLog.ts`

### Phase 3: SimDriver

1. Create SimDriver in `internal/simulation/`
2. SimDriver generates combat log events → feeds CombatLogProcessor
3. Replace CastQueueService internals to use SimDriver

### Phase 4: Wire Up

1. Update AppLayer to include CombatLogProcessor
2. Browser mode: SimDriver feeds CombatLogProcessor
3. Test with existing rotations
4. WoW mode: Create WoWEventSource (when ready)

## What Changes

| Component            | Before                          | After                                 |
| -------------------- | ------------------------------- | ------------------------------------- |
| Event format         | Custom EventType enum           | WoW combat log format                 |
| Event payloads       | Rich domain objects (Spell)     | Primitives (spellId, spellName)       |
| Internal events      | 4 types (APL, COOLDOWN, etc.)   | 1 type (APL_EVALUATE only)            |
| Cast flow            | CastQueueService schedules      | SimDriver generates combat log events |
| Handler trigger      | Per event type                  | Per subevent                          |

## What Stays The Same

- GameState structure (units, spells, auras)
- Immutable.js Records
- StateService
- APL/Rotation logic (reads from GameState)
- Priority queue scheduler (for APL_EVALUATE)
- Effect-TS service patterns
- Layer composition

## Key Design Decisions

1. **Handlers are idempotent**: Don't care if event is prediction or ground truth. Check state, apply change if needed, state converges.

2. **One internal event**: Just `APL_EVALUATE`. Schedule it whenever rotation should re-evaluate. Scheduler dedupes.

3. **Combat log events for WoW I/O**: Combat log events cross the WoW boundary. APL_EVALUATE never does.

4. **GameState is source of truth**: APL reads GameState, not events. Events just update state.

5. **Predictions are forks**: For lookahead, fork state, run sim, collect predictions, discard fork. Real events update actual state.

6. **Feed everything in WoW mode**: No filtering. Let handlers decide what matters.
