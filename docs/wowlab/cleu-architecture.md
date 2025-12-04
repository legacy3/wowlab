# CLEU Architecture

## What is CLEU?

CLEU (Combat Log Event Unfiltered) is WoW's combat log API. Every combat-related action in the game fires a CLEU event with a specific subevent type.

WowLab mirrors this system exactly so the same code can:

- **Emit** events (simulator mode)
- **Consume** events (in-game addon mode)

## Event Types

WowLab implements the same subevent types as WoW:

### Spell Events

- `SPELL_CAST_SUCCESS` - Spell cast completed
- `SPELL_CAST_START` - Spell cast began (for cast-time spells)
- `SPELL_CAST_FAILED` - Spell cast failed
- `SPELL_DAMAGE` - Spell dealt damage
- `SPELL_HEAL` - Spell healed
- `SPELL_MISSED` - Spell missed/resisted/etc

### Aura Events

- `SPELL_AURA_APPLIED` - Buff/debuff applied
- `SPELL_AURA_REMOVED` - Buff/debuff removed
- `SPELL_AURA_APPLIED_DOSE` - Stack added
- `SPELL_AURA_REMOVED_DOSE` - Stack removed
- `SPELL_AURA_REFRESH` - Duration refreshed

### Resource Events

- `SPELL_ENERGIZE` - Resource gained
- `SPELL_DRAIN` - Resource drained

### Unit Events

- `SPELL_SUMMON` - Unit summoned
- `UNIT_DIED` - Unit died

### Lab-Specific Events

- `LAB_RECOVERY_READY` - Internal event for cooldown/charge recovery

## Event Flow

```
Action (cast spell, apply buff, etc.)
    │
    ▼
Emit CLEU Event ──► EventQueue (priority queue by timestamp)
                        │
                        ▼
                   SimDriver.run()
                        │
                        ▼
                   Poll next event
                        │
                        ▼
                   HandlerRegistry.getHandlers(event)
                        │
                        ▼
                   Execute matching handlers
                        │
                        ├──► State mutation handlers (update GameState)
                        │
                        └──► Spec handlers (apply spell-specific effects)
                                  │
                                  ▼
                             Emit more events (procs, etc.)
```

## Handler System

Handlers register to receive specific events:

```typescript
// Register for all SPELL_CAST_SUCCESS events
combatLog.on({ subevent: "SPELL_CAST_SUCCESS" }, (event, emitter) =>
  handleCast(event, emitter),
);

// Register for specific spell's cast success
combatLog.on(
  { subevent: "SPELL_CAST_SUCCESS", spellId: 34026 },
  (event, emitter) => handleKillCommand(event, emitter),
);
```

### Handler Priorities

Handlers execute in priority order:

- **State mutation handlers** (priority 1000): Update cooldowns, buffs, resources
- **Spec handlers** (priority 10): Apply spell-specific effects, emit procs

### Emitter

Handlers receive an `emitter` to emit follow-up events:

```typescript
const handleKillCommand = (event, emitter) =>
  Effect.gen(function* () {
    // Check for proc
    if (shouldProc()) {
      yield* emitter.emit(
        new SpellAuraApplied({
          spellId: KILLER_INSTINCT,
          timestamp: event.timestamp,
          // ...
        }),
      );
    }
  });
```

Emitted events go back into the EventQueue for processing.

## Current Implementation

### Packages

- `@wowlab/core/Schemas/CombatLog` - Event type definitions
- `@wowlab/services/CombatLog` - CombatLogService, EventQueue, SimDriver, HandlerRegistry
- `@wowlab/specs` - Spec-specific handlers (e.g., Hunter Beast Mastery)

### Key Files

```
packages/wowlab-core/src/internal/schemas/combat-log/
├── Events.ts              # All CLEU event class definitions
├── CombatLogEvent.ts      # Union type, type guards
└── index.ts               # Exports

packages/wowlab-services/src/internal/combat-log/
├── CombatLogService.ts    # Main service (emit, on, poll, etc.)
├── EventQueue.ts          # Priority queue for events
├── SimDriver.ts           # Event processing loop
├── HandlerRegistry.ts     # Handler registration/matching
├── Emitter.ts             # Handler emitter for follow-up events
└── handlers/
    ├── index.ts           # State mutation handler registration
    ├── cast.ts            # SPELL_CAST_SUCCESS handler
    ├── aura.ts            # Aura handlers
    ├── damage.ts          # Damage handlers
    └── ...

packages/wowlab-specs/src/
├── Hunter/
│   └── BeastMastery/
│       ├── index.ts       # Spec definition
│       └── handlers/      # Spell-specific handlers
└── Shared/
    ├── register.ts        # registerSpec(), registerClass()
    └── types.ts           # SpellHandler, SpecDefinition interfaces
```

## Simulation vs In-Game

### Simulator Mode

```
Rotation APL ──► SpellActions.cast() ──► Emit SPELL_CAST_SUCCESS
                                              │
                                              ▼
                                         SimDriver processes
                                              │
                                              ▼
                                         Handlers update state
```

### In-Game Mode (Future)

```
WoW Combat Log ──► CLEU frame event ──► Parse into event object
                                              │
                                              ▼
                                         Same handlers update state
                                              │
                                              ▼
                                         State drives UI/predictions
```

The same handlers work in both modes because they just react to events - they don't care where the events came from.
