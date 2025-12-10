# WoWLab Data Flow

## Core Principle

**The Event Queue is the single source of truth for timing.**

Entities store only CLEU-observable data. Anything about the future (when an aura expires, when the next tick fires, when a cooldown is ready) lives in the scheduler, not on the entity.

## Data Flow Diagram

```mermaid
flowchart TB
    subgraph STATIC["STATIC DATA"]
        DBC["DBC Tables<br/>(spell_*, item_*, etc.)"]
        Transform["Transformer<br/>(flattens DBC data)"]
        SpellInfo["SpellInfo<br/>(immutable config)"]
        Meta["MetadataService<br/>(memoized lookup)"]

        DBC --> Transform --> SpellInfo --> Meta
    end

    subgraph RUNTIME["SIMULATION RUNTIME"]
        Rotation["Rotation<br/>(player actions)"]
        CLS["CombatLogService<br/>(event router)"]
        Queue["EventQueue<br/>(TinyQueue)"]
        Driver["SimDriver<br/>(main loop)"]

        subgraph Handlers["Event Handlers"]
            Spec["Spec Handlers<br/>(priority 100)<br/>emit derived CLEU events"]
            State["State Handlers<br/>(priority 1000)<br/>update GameState"]
        end

        Emitter["Emitter<br/>(buffers future events)"]
        GS["GameState<br/>(immutable snapshot)"]

        Rotation -->|"emit()"| CLS
        CLS -->|"offer()"| Queue
        Queue -->|"poll()"| Driver
        Driver --> Spec
        Driver --> State
        Spec -->|"emitAt()"| Emitter
        State --> GS
        Emitter -->|"back to queue"| Queue
    end

    Meta --> RUNTIME
```

## The Three Data Domains

### 1. Static Config (DBC / SpellInfo)

Data that never changes during simulation. Loaded once at startup.

| Source               | Transformer        | Output                         |
| -------------------- | ------------------ | ------------------------------ |
| `spell_*` DBC tables | `transformSpell()` | `SpellDataFlat` -> `SpellInfo` |
| `item_*` DBC tables  | `transformItem()`  | `ItemDataFlat` -> `ItemInfo`   |
| Aura DBC data        | `transformAura()`  | `AuraDataFlat`                 |

**Location:** `MetadataService`, `SimulationConfig`

**Examples:**

- Base spell duration (15000ms)
- Tick period (3000ms)
- Max stacks (3)
- Spell school (Fire)

### 2. Runtime State (GameState)

CLEU-observable data only. What you could see by parsing combat log events.

| Entity       | CLEU-Observable Fields                                |
| ------------ | ----------------------------------------------------- |
| `Unit`       | id, name, health, power, position, isCasting          |
| `Aura`       | casterUnitId, spellId, stacks                         |
| `Spell`      | charges (via SPELL_CHARGE_USED/SPELL_CHARGES_CHANGED) |
| `Projectile` | sourceId, targetId, spellId                           |

**Location:** `GameState` (immutable, accessed via `StateService`)

**NOT stored on entities:**

- `expiresAt` - scheduler concern
- `nextTickAt` - scheduler concern
- `cooldownExpiry` - scheduler concern

### 3. Scheduler (EventQueue)

The single source of truth for anything that happens in the future.

| Future Event     | How It's Scheduled                                          |
| ---------------- | ----------------------------------------------------------- |
| Aura expires     | `emitAt(durationMs, SPELL_AURA_REMOVED)` on apply           |
| DoT tick         | `emitAt(tickPeriodMs, SPELL_PERIODIC_DAMAGE)` on apply/tick |
| Cooldown ready   | `emitAt(cooldownMs, LAB_COOLDOWN_READY)` on cast            |
| Projectile lands | `emitAt(travelTimeMs, SPELL_DAMAGE)` on cast                |

**Location:** `EventQueue` (TinyQueue priority queue)

## Event Flow Example: Applying a DoT

```mermaid
sequenceDiagram
    participant R as Rotation
    participant D as SimDriver
    participant SH as Spec Handler
    participant STH as State Handler
    participant Q as EventQueue
    participant GS as GameState

    R->>Q: SPELL_CAST_SUCCESS
    Q->>D: poll()
    D->>SH: handle event
    SH->>Q: emitAt(0, SPELL_AURA_APPLIED)

    Q->>D: poll()
    D->>STH: handle event
    STH->>GS: add Aura
    D->>SH: handle event
    SH->>Q: emitAt(duration, SPELL_AURA_REMOVED)
    SH->>Q: emitAt(tickPeriod, SPELL_PERIODIC_DAMAGE)

    Note over Q,GS: Time passes...

    Q->>D: poll() SPELL_PERIODIC_DAMAGE
    D->>SH: handle tick
    SH->>Q: emitAt(tickPeriod, SPELL_PERIODIC_DAMAGE)

    Note over Q,GS: More time passes...

    Q->>D: poll() SPELL_AURA_REMOVED
    D->>STH: handle event
    STH->>GS: remove Aura
```

## Stale Event Handling

When an aura is refreshed, a new removal event is scheduled. The old one still fires but is ignored:

```typescript
// SPELL_AURA_REMOVED handler
const aura = getAura(unit, spellId);
if (!aura) return; // Already gone - stale event
// Remove aura
```

The queue processes events in timestamp order. If an aura was refreshed at T=5s with a new 10s duration:

- Old removal at T=10s fires, aura still exists, ignored
- New removal at T=15s fires, removes aura

## Handler Priority

Lower number = runs first.

| Priority | Handler Type   | Purpose                         |
| -------- | -------------- | ------------------------------- |
| 100      | Spec handlers  | Game logic, emit derived events |
| 1000     | State handlers | Update GameState from CLEU      |

Spec handlers run first so they can:

1. Read current state
2. Emit new events based on game rules
3. State handlers then persist those events to GameState

## Key Files

| File                                                                  | Purpose                        |
| --------------------------------------------------------------------- | ------------------------------ |
| `packages/wowlab-services/src/internal/combat-log/EventQueue.ts`      | TinyQueue wrapper              |
| `packages/wowlab-services/src/internal/combat-log/Emitter.ts`         | Buffers events with timestamps |
| `packages/wowlab-services/src/internal/combat-log/SimDriver.ts`       | Main simulation loop           |
| `packages/wowlab-services/src/internal/combat-log/HandlerRegistry.ts` | Routes events to handlers      |
| `packages/wowlab-services/src/internal/state/StateService.ts`         | GameState Ref wrapper          |
| `packages/wowlab-core/src/internal/entities/GameState.ts`             | Immutable state record         |
