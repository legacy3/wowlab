# Combat Log Event Architecture

Plan for restructuring the simulation around WoW's `COMBAT_LOG_EVENT_UNFILTERED`.

## Goal

Unify event handling so the same sim core code works for:

- **Simulation mode**: SimDriver generates combat log events
- **In-game mode**: Real WoW combat log events feed directly in

## Current Architecture

```text
┌─────────────────────────────────────┐
│ EventSchedulerService               │
│ - Schedules custom events           │
│ - SPELL_CAST_START, SPELL_DAMAGE,   │
│   APL_EVALUATE, etc.                │
└─────────────────────────────────────┘
```

Custom event types that loosely map to combat log but aren't 1:1.

## Proposed Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Event Source                         │
├────────────────────────┬────────────────────────────────┤
│ In-game:               │ Simulation:                    │
│ WoW COMBAT_LOG_EVENT_  │ SimDriver generates            │
│ UNFILTERED             │ COMBAT_LOG_EVENT_UNFILTERED    │
└────────────────────────┴────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CombatLogProcessor (Sim Core)              │
│ - Receives COMBAT_LOG_EVENT_UNFILTERED                  │
│ - Parses subevent (SPELL_CAST_SUCCESS, etc.)            │
│ - Updates GameState                                     │
│ - Triggers APL evaluation                               │
└─────────────────────────────────────────────────────────┘
```

## Combat Log Event Structure

Based on WoW's `CombatLogGetCurrentEventInfo()`.

### Base Parameters (Always Present)

| Index | Parameter | Type | Description |
|-------|-----------|------|-------------|
| 1 | timestamp | number | Unix time with ms precision (e.g., `1555749627.861`) |
| 2 | subevent | string | Event type (e.g., `SPELL_DAMAGE`) |
| 3 | hideCaster | boolean | True if source unit is hidden |
| 4 | sourceGUID | string | Source unit GUID |
| 5 | sourceName | string | Source unit name |
| 6 | sourceFlags | number | Unit type/reaction flags |
| 7 | sourceRaidFlags | number | Raid target marker |
| 8 | destGUID | string | Destination unit GUID |
| 9 | destName | string | Destination unit name |
| 10 | destFlags | number | Unit type/reaction flags |
| 11 | destRaidFlags | number | Raid target marker |

### Subevent Composition

Subevents are composed of **PREFIX + SUFFIX**:

```text
SPELL_DAMAGE = SPELL (prefix) + _DAMAGE (suffix)
SWING_MISSED = SWING (prefix) + _MISSED (suffix)
SPELL_AURA_APPLIED = SPELL (prefix) + _AURA_APPLIED (suffix)
```

### Prefixes (Parameters 12-14)

| Prefix | Param 12 | Param 13 | Param 14 |
|--------|----------|----------|----------|
| `SWING` | - | - | - |
| `RANGE` | spellId | spellName | spellSchool |
| `SPELL` | spellId | spellName | spellSchool |
| `SPELL_PERIODIC` | spellId | spellName | spellSchool |
| `SPELL_BUILDING` | spellId | spellName | spellSchool |
| `ENVIRONMENTAL` | environmentalType | - | - |

### Suffixes (Parameters 15+)

| Suffix | Parameters |
|--------|------------|
| `_DAMAGE` | amount, overkill, school, resisted, blocked, absorbed, critical, glancing, crushing, isOffHand |
| `_MISSED` | missType, isOffHand, amountMissed, critical |
| `_HEAL` | amount, overhealing, absorbed, critical |
| `_ENERGIZE` | amount, overEnergize, powerType, maxPower |
| `_DRAIN` | amount, powerType, extraAmount, maxPower |
| `_LEECH` | amount, powerType, extraAmount |
| `_INTERRUPT` | extraSpellId, extraSpellName, extraSchool |
| `_DISPEL` | extraSpellId, extraSpellName, extraSchool, auraType |
| `_STOLEN` | extraSpellId, extraSpellName, extraSchool, auraType |
| `_EXTRA_ATTACKS` | amount |
| `_AURA_APPLIED` | auraType, amount |
| `_AURA_REMOVED` | auraType, amount |
| `_AURA_APPLIED_DOSE` | auraType, amount |
| `_AURA_REMOVED_DOSE` | auraType, amount |
| `_AURA_REFRESH` | auraType |
| `_AURA_BROKEN` | auraType |
| `_AURA_BROKEN_SPELL` | extraSpellId, extraSpellName, extraSchool, auraType |
| `_CAST_START` | - |
| `_CAST_SUCCESS` | - |
| `_CAST_FAILED` | failedType |
| `_INSTAKILL` | unconsciousOnDeath |
| `_CREATE` | - |
| `_SUMMON` | - |
| `_RESURRECT` | - |
| `_EMPOWER_START` | - |
| `_EMPOWER_END` | empoweredRank |
| `_EMPOWER_INTERRUPT` | empoweredRank |

### Special Events (No Prefix/Suffix)

| Subevent | Parameters |
|----------|------------|
| `PARTY_KILL` | - |
| `UNIT_DIED` | recapID, unconsciousOnDeath |
| `UNIT_DESTROYED` | recapID, unconsciousOnDeath |
| `UNIT_DISSIPATES` | recapID, unconsciousOnDeath |
| `ENCHANT_APPLIED` | spellName, itemID, itemName |
| `ENCHANT_REMOVED` | spellName, itemID, itemName |

## TypeScript Types

```typescript
// Base event structure
interface CombatLogEventBase {
  readonly timestamp: number;
  readonly subevent: CombatLogSubevent;
  readonly hideCaster: boolean;
  readonly sourceGUID: string;
  readonly sourceName: string;
  readonly sourceFlags: number;
  readonly sourceRaidFlags: number;
  readonly destGUID: string;
  readonly destName: string;
  readonly destFlags: number;
  readonly destRaidFlags: number;
}

// Spell prefix parameters
interface SpellPrefix {
  readonly spellId: number;
  readonly spellName: string;
  readonly spellSchool: SpellSchool;
}

// Damage suffix parameters
interface DamageSuffix {
  readonly amount: number;
  readonly overkill: number;
  readonly school: SpellSchool;
  readonly resisted: number | null;
  readonly blocked: number | null;
  readonly absorbed: number | null;
  readonly critical: boolean;
  readonly glancing: boolean;
  readonly crushing: boolean;
  readonly isOffHand: boolean;
}

// Example composed event
type SpellDamageEvent = CombatLogEventBase & SpellPrefix & DamageSuffix & {
  readonly subevent: "SPELL_DAMAGE";
};

// Aura suffix parameters
interface AuraSuffix {
  readonly auraType: "BUFF" | "DEBUFF";
  readonly amount?: number;
}

// Missed suffix parameters
interface MissedSuffix {
  readonly missType: MissType;
  readonly isOffHand: boolean;
  readonly amountMissed: number;
  readonly critical: boolean;
}
```

## Enums

### Spell School (Bitmask)

```typescript
enum SpellSchool {
  Physical = 1,    // 0x01
  Holy = 2,        // 0x02
  Fire = 4,        // 0x04
  Nature = 8,      // 0x08
  Frost = 16,      // 0x10
  Shadow = 32,     // 0x20
  Arcane = 64,     // 0x40
}

// Combined schools (bitmask OR)
// Frostfire = Frost | Fire = 20
// Shadowflame = Shadow | Fire = 36
// Chaos = 127 (all schools)
```

### Power Type

```typescript
enum PowerType {
  Mana = 0,
  Rage = 1,
  Focus = 2,
  Energy = 3,
  ComboPoints = 4,
  Runes = 5,
  RunicPower = 6,
  SoulShards = 7,
  LunarPower = 8,
  HolyPower = 9,
  Maelstrom = 11,
  Chi = 12,
  Insanity = 13,
  ArcaneCharges = 16,
  Fury = 17,
  Pain = 18,
  Essence = 19,
}
```

### Miss Type

```typescript
type MissType =
  | "ABSORB"
  | "BLOCK"
  | "DEFLECT"
  | "DODGE"
  | "EVADE"
  | "IMMUNE"
  | "MISS"
  | "PARRY"
  | "REFLECT"
  | "RESIST";
```

### Aura Type

```typescript
type AuraType = "BUFF" | "DEBUFF";
```

### Environmental Type

```typescript
type EnvironmentalType =
  | "Drowning"
  | "Falling"
  | "Fatigue"
  | "Fire"
  | "Lava"
  | "Slime";
```

## Complete Subevent List

```typescript
type CombatLogSubevent =
  // Swing (melee auto-attack)
  | "SWING_DAMAGE"
  | "SWING_MISSED"
  | "SWING_DAMAGE_LANDED"  // Advanced log only

  // Range (ranged auto-attack)
  | "RANGE_DAMAGE"
  | "RANGE_MISSED"

  // Spell
  | "SPELL_CAST_START"
  | "SPELL_CAST_SUCCESS"
  | "SPELL_CAST_FAILED"
  | "SPELL_DAMAGE"
  | "SPELL_MISSED"
  | "SPELL_HEAL"
  | "SPELL_ENERGIZE"
  | "SPELL_DRAIN"
  | "SPELL_LEECH"
  | "SPELL_INTERRUPT"
  | "SPELL_DISPEL"
  | "SPELL_DISPEL_FAILED"
  | "SPELL_STOLEN"
  | "SPELL_EXTRA_ATTACKS"
  | "SPELL_AURA_APPLIED"
  | "SPELL_AURA_REMOVED"
  | "SPELL_AURA_APPLIED_DOSE"
  | "SPELL_AURA_REMOVED_DOSE"
  | "SPELL_AURA_REFRESH"
  | "SPELL_AURA_BROKEN"
  | "SPELL_AURA_BROKEN_SPELL"
  | "SPELL_INSTAKILL"
  | "SPELL_DURABILITY_DAMAGE"
  | "SPELL_DURABILITY_DAMAGE_ALL"
  | "SPELL_CREATE"
  | "SPELL_SUMMON"
  | "SPELL_RESURRECT"
  | "SPELL_ABSORBED"
  | "SPELL_HEAL_ABSORBED"

  // Spell Periodic (DoTs/HoTs)
  | "SPELL_PERIODIC_DAMAGE"
  | "SPELL_PERIODIC_MISSED"
  | "SPELL_PERIODIC_HEAL"
  | "SPELL_PERIODIC_ENERGIZE"
  | "SPELL_PERIODIC_DRAIN"
  | "SPELL_PERIODIC_LEECH"

  // Empower (Evoker)
  | "SPELL_EMPOWER_START"
  | "SPELL_EMPOWER_END"
  | "SPELL_EMPOWER_INTERRUPT"

  // Environmental
  | "ENVIRONMENTAL_DAMAGE"

  // Special events
  | "DAMAGE_SPLIT"
  | "DAMAGE_SHIELD"
  | "DAMAGE_SHIELD_MISSED"
  | "ENCHANT_APPLIED"
  | "ENCHANT_REMOVED"
  | "PARTY_KILL"
  | "UNIT_DIED"
  | "UNIT_DESTROYED"
  | "UNIT_DISSIPATES";
```

## Sim-Only Events

These have no combat log equivalent and remain internal:

| Event | Purpose |
|-------|---------|
| `APL_EVALUATE` | Trigger rotation to decide next action |
| `COOLDOWN_READY` | Internal: cooldown expired |
| `CHARGE_READY` | Internal: charge recovered |
| `GCD_READY` | Internal: GCD expired |
| `PROJECTILE_SCHEDULED` | Internal: schedule impact |

These are scheduling hints for the SimDriver, not processed by CombatLogProcessor.

## Components

### 1. CombatLogEvent Schema

**Location:** `packages/wowlab-core/src/internal/events/CombatLogEvent.ts`

Define the combat log event structure matching WoW's format using Effect Schema:

```typescript
import { Schema } from "effect";

const CombatLogEventBaseSchema = Schema.Struct({
  timestamp: Schema.Number,
  subevent: CombatLogSubeventSchema,
  hideCaster: Schema.Boolean,
  sourceGUID: Schema.String,
  sourceName: Schema.String,
  sourceFlags: Schema.Number,
  sourceRaidFlags: Schema.Number,
  destGUID: Schema.String,
  destName: Schema.String,
  destFlags: Schema.Number,
  destRaidFlags: Schema.Number,
});

const SpellPrefixSchema = Schema.Struct({
  spellId: Schema.Number,
  spellName: Schema.String,
  spellSchool: Schema.Number,
});

const DamageSuffixSchema = Schema.Struct({
  amount: Schema.Number,
  overkill: Schema.Number,
  school: Schema.Number,
  resisted: Schema.NullOr(Schema.Number),
  blocked: Schema.NullOr(Schema.Number),
  absorbed: Schema.NullOr(Schema.Number),
  critical: Schema.Boolean,
  glancing: Schema.Boolean,
  crushing: Schema.Boolean,
  isOffHand: Schema.Boolean,
});
```

### 2. CombatLogProcessor Service

**Location:** `packages/wowlab-services/src/internal/combatlog/CombatLogProcessor.ts`

Processes incoming combat log events:

```typescript
class CombatLogProcessor extends Effect.Service<CombatLogProcessor>()("CombatLogProcessor", {
  effect: Effect.gen(function* () {
    const state = yield* StateService;

    return {
      process: (event: CombatLogEvent) =>
        Effect.gen(function* () {
          // Route to handler based on subevent
          const handler = getHandler(event.subevent);
          yield* handler(event);

          // Trigger APL re-evaluation after state change
          yield* triggerAPLEvaluation();
        }),
    };
  }),
}) {}
```

### 3. SimDriver Service

**Location:** `packages/wowlab-services/src/internal/simulation/SimDriver.ts`

Generates combat log events based on spell mechanics:

```typescript
class SimDriver extends Effect.Service<SimDriver>()("SimDriver", {
  effect: Effect.gen(function* () {
    const processor = yield* CombatLogProcessor;
    const scheduler = yield* InternalScheduler;

    return {
      executeCast: (casterId: string, spellId: number, targetId: string) =>
        Effect.gen(function* () {
          const currentTime = yield* getCurrentTime();
          const spell = yield* getSpellInfo(spellId);

          // Emit SPELL_CAST_START (for non-instant)
          if (spell.castTime > 0) {
            yield* processor.process({
              timestamp: currentTime,
              subevent: "SPELL_CAST_START",
              sourceGUID: casterId,
              destGUID: targetId,
              spellId,
              spellName: spell.name,
              spellSchool: spell.schoolMask,
              // ... base params
            });
          }

          // Schedule SPELL_CAST_SUCCESS
          const castEnd = currentTime + spell.castTime;
          yield* scheduler.scheduleAt(castEnd, () =>
            processor.process({
              timestamp: castEnd,
              subevent: "SPELL_CAST_SUCCESS",
              // ...
            })
          );

          // Schedule damage/heal events based on spell type
          // ...
        }),

      run: (duration: number) =>
        Effect.gen(function* () {
          // Main simulation loop
          while ((yield* getCurrentTime()) < duration) {
            // Process next scheduled event
            const next = yield* scheduler.dequeue();
            if (!next) break;

            yield* advanceTime(next.at);
            yield* next.execute();
          }
        }),
    };
  }),
}) {}
```

### 4. EventSource Abstraction

**Location:** `packages/wowlab-services/src/internal/events/EventSource.ts`

```typescript
interface EventSource {
  subscribe(handler: (event: CombatLogEvent) => Effect.Effect<void>): Effect.Effect<void>;
}

// Simulation mode - events come from SimDriver
class SimulatedEventSource implements EventSource {
  private readonly queue = new PubSub<CombatLogEvent>();

  emit(event: CombatLogEvent) {
    return this.queue.publish(event);
  }

  subscribe(handler) {
    return this.queue.subscribe(handler);
  }
}

// In-game mode - events come from WoW
class WoWEventSource implements EventSource {
  constructor(private readonly connection: WoWConnection) {}

  subscribe(handler) {
    return Effect.async((resume) => {
      this.connection.on("COMBAT_LOG_EVENT", (data) => {
        const event = parseCombatLogEvent(data);
        Effect.runPromise(handler(event));
      });
    });
  }
}
```

## Migration Steps

### Phase 1: Define Combat Log Types

1. Create `CombatLogEvent.ts` with base schema
2. Create prefix schemas (SpellPrefix, etc.)
3. Create suffix schemas (DamageSuffix, MissedSuffix, AuraSuffix, etc.)
4. Create composed event types (SpellDamageEvent, etc.)
5. Create enums (SpellSchool, PowerType, MissType, etc.)
6. Add to `@wowlab/core` exports

### Phase 2: Build CombatLogProcessor

1. Create processor service
2. Implement handlers for priority subevents:
   - `SPELL_CAST_START` → set casting state
   - `SPELL_CAST_SUCCESS` → clear casting, trigger cooldown
   - `SPELL_DAMAGE` → apply damage
   - `SPELL_AURA_APPLIED` → add aura
   - `SPELL_AURA_REMOVED` → remove aura
   - `SPELL_ENERGIZE` → add resources
3. Wire up state mutations
4. Trigger APL after processing

### Phase 3: Build SimDriver

1. Create SimDriver service
2. Implement `executeCast` to generate events
3. Implement internal scheduler for future events
4. Generate correct sequence:
   - `SPELL_CAST_START` (if cast time > 0)
   - `SPELL_CAST_SUCCESS` (at cast end)
   - `SPELL_DAMAGE` / `SPELL_HEAL` (on impact)
   - `SPELL_AURA_APPLIED` (if applies buff/debuff)

### Phase 4: Refactor Simulation Loop

1. Replace current EventSchedulerService
2. SimDriver becomes top-level driver in sim mode
3. CombatLogProcessor becomes core for both modes

### Phase 5: Remove Old Event System

1. Remove custom event types
2. Remove old event handlers
3. Clean up old scheduler

## File Changes Summary

### New Files

```text
packages/wowlab-core/src/internal/events/
├── CombatLogEvent.ts       # Base event schema
├── CombatLogSubevent.ts    # Subevent union type
├── CombatLogPrefix.ts      # Prefix schemas
├── CombatLogSuffix.ts      # Suffix schemas
├── CombatLogEnums.ts       # SpellSchool, PowerType, etc.
└── index.ts

packages/wowlab-services/src/internal/combatlog/
├── CombatLogProcessor.ts   # Main processor
├── handlers/
│   ├── cast.ts             # SPELL_CAST_* handlers
│   ├── damage.ts           # *_DAMAGE handlers
│   ├── heal.ts             # *_HEAL handlers
│   ├── aura.ts             # SPELL_AURA_* handlers
│   ├── resource.ts         # SPELL_ENERGIZE, SPELL_DRAIN
│   └── unit.ts             # UNIT_DIED, etc.
└── index.ts

packages/wowlab-services/src/internal/simulation/
├── SimDriver.ts            # Simulation event generator
├── InternalScheduler.ts    # For scheduling future events
└── index.ts
```

### Modified Files

```text
packages/wowlab-core/src/internal/events/Events.ts
  - Keep APL_EVALUATE, COOLDOWN_READY, etc. as internal
  - Remove SPELL_CAST_START, SPELL_DAMAGE, etc.

packages/wowlab-runtime/src/AppLayer.ts
  - Add CombatLogProcessor
  - Add SimDriver (for sim mode)
  - Add EventSource abstraction
```

## In-Game Integration (Future)

### Addon Side (Lua)

```lua
local frame = CreateFrame("Frame")
frame:RegisterEvent("COMBAT_LOG_EVENT_UNFILTERED")
frame:SetScript("OnEvent", function()
  local info = {CombatLogGetCurrentEventInfo()}
  -- Send to sim via WebSocket/IPC
  SendToSim(SerializeEvent(info))
end)

function SerializeEvent(info)
  return {
    timestamp = info[1],
    subevent = info[2],
    hideCaster = info[3],
    sourceGUID = info[4],
    sourceName = info[5],
    sourceFlags = info[6],
    sourceRaidFlags = info[7],
    destGUID = info[8],
    destName = info[9],
    destFlags = info[10],
    destRaidFlags = info[11],
    -- Remaining params depend on subevent
    payload = {unpack(info, 12)}
  }
end
```

### Sim Side (TypeScript)

```typescript
class WoWEventSource implements EventSource {
  constructor(private connection: WoWConnection) {}

  subscribe(handler) {
    this.connection.on("COMBAT_LOG_EVENT", (data) => {
      const event = parseCombatLogEvent(data);
      handler(event);
    });
  }
}
```

Same CombatLogProcessor handles both - zero code changes needed.

## Open Questions

1. **GUIDs**: WoW uses GUIDs like `"Player-1096-06DF65C1"` or `"Creature-0-4253-0-160-94-00003AD5D7"`. Do we adopt this format or keep simple UnitID?

2. **Unit Flags**: WoW uses bitmask flags for unit type/reaction. Do we need these for the sim?

3. **Advanced Combat Log**: WoW has extended parameters (position, stats, etc.) when `advancedCombatLogging` is enabled. Do we want to support this?

4. **Timing**: In-game, events arrive in real-time. In sim, we control time. How does the processor handle both?

5. **Missing Events**: In-game, we might miss events (joined mid-combat). How do we handle state sync?
