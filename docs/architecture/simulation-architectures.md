# Simulation Architecture Options

This document provides an overview of 6 architectural approaches for the WoW combat simulation system. Each option is detailed in its own document.

> **See also:** [ERRATA.md](./ERRATA.md) for critical issues found in Options 1-5.

## Constraints

All architectures must satisfy:

1. **Real CLEU Events Only** - Use authentic WoW Combat Log Event Unfiltered events (SPELL_CAST_SUCCESS, SPELL_AURA_APPLIED, SPELL_DAMAGE, etc.)
2. **Multi-Platform** - Work as: local simulation, bot inside WoW, browser simulation
3. **Event-Driven** - Events drive the system, not polling loops
4. **Effect-TS** - Functional architecture with immutable state

> **Note:** Options 1-5 all have critical flaws. Option 6 relaxes constraint 1 minimally to allow ONE synthetic event.

## Current Components

| Component        | Location                                                               | Purpose                            |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| EventQueue       | `packages/wowlab-services/src/internal/combat-log/EventQueue.ts`       | Priority queue sorted by timestamp |
| HandlerRegistry  | `packages/wowlab-services/src/internal/combat-log/HandlerRegistry.ts`  | Event subscriptions                |
| CombatLogService | `packages/wowlab-services/src/internal/combat-log/CombatLogService.ts` | Facade for queue + registry        |
| SimDriver        | `packages/wowlab-services/src/internal/combat-log/SimDriver.ts`        | Event processor                    |
| SpellActions     | `packages/wowlab-rotation/src/internal/actions/spell/SpellActions.ts`  | Spell casting                      |
| StateService     | `packages/wowlab-services/src/internal/state/StateService.ts`          | Game state including currentTime   |

## Architecture Options

| #     | Name                                                         | Time Owner           | Best For                      | Status          |
| ----- | ------------------------------------------------------------ | -------------------- | ----------------------------- | --------------- |
| 1     | [Driver-Clocked Loop](./option-1-driver-clocked.md)          | SimDriver            | Pure deterministic simulation | Has issues      |
| 2     | [Queue-as-Time Source](./option-2-queue-time.md)             | EventQueue           | Simple simulations            | Has issues      |
| 3     | [Rotation-Orchestrated](./option-3-rotation-orchestrated.md) | Rotation             | Bot pre-planning              | Has issues      |
| 4     | [Time Slice Pipeline](./option-4-time-slices.md)             | SliceManager         | Multi-platform parity         | Has issues      |
| 5     | [Dual-Clock Adapter](./option-5-dual-clock.md)               | TimeAdapter          | Live bot + simulation         | Has issues      |
| **6** | **[Minimal Synthetic](./option-6-minimal-synthetic.md)**     | **Event timestamps** | **All platforms**             | **RECOMMENDED** |

## Quick Comparison

```
                    ┌─────────────────────────────────────────────────────┐
                    │              WHO OWNS TIME?                         │
                    ├─────────────────────────────────────────────────────┤
                    │                                                     │
  Option 1,2        │   EVENT TIMESTAMPS                                  │
  (Event-Driven)    │   Time = timestamp of current event                 │
                    │                                                     │
                    ├─────────────────────────────────────────────────────┤
                    │                                                     │
  Option 3          │   ROTATION LOGIC                                    │
  (Orchestrated)    │   Time = rotation decides when next action happens  │
                    │                                                     │
                    ├─────────────────────────────────────────────────────┤
                    │                                                     │
  Option 4,5        │   ADAPTER/MANAGER                                   │
  (Hybrid)          │   Time = normalized from multiple sources           │
                    │                                                     │
                    └─────────────────────────────────────────────────────┘
```

## GCD Handling Approaches

| Approach                   | Description                                       | Used In      |
| -------------------------- | ------------------------------------------------- | ------------ |
| CLEU Aura                  | GCD as real `SPELL_AURA_APPLIED`/`REMOVED`        | Option 1, 4  |
| Future Timestamps          | Schedule next cast at `now + gcd`                 | Option 2     |
| Local Computation          | Track `gcdEnd` in state, check before cast        | Option 3     |
| Wake Notifications         | Register callback for when time crosses `gcdEnd`  | Option 5     |
| **Single Synthetic Timer** | ONE `GCD_UNLOCKED` event scheduled at `now + gcd` | **Option 6** |

## Recommendation

**Option 6 (Minimal Synthetic)** is recommended because:

1. Uses only ONE synthetic event (`GCD_UNLOCKED`)
2. Everything else is real CLEU
3. Same code path for sim/bot/browser
4. Pure reducer, easy to test
5. Extensible timer system for future needs
