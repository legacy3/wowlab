---
title: Module Structure
description: Code organization in the Rust simulation engine
updatedAt: 2026-01-16
---

# Module Structure

How the `crates/engine` code is organized.

## Directory layout

```
crates/engine/src/
  actor/     - Player, Pet, Enemy actors
  aura/      - Buff/debuff tracking, DoT mechanics
  class/     - Shared class logic (Hunter traits)
  cli/       - Command-line interface
  combat/    - Damage pipeline, cooldowns, snapshots
  core/      - Event queue, RNG, CPU detection
  data/      - Data loading, tuning system
  handler/   - SpecHandler trait, registry
  math/      - Utility math functions
  prelude/   - Common imports
  proc/      - Proc system (RPPM, fixed chance)
  resource/  - Resource pools, regeneration
  results/   - Simulation results, statistics
  rotation/  - AST, parser, JIT compiler, expressions
  sim/       - SimState, Simulation executor, BatchRunner
  spec/      - SpellDef, AuraDef, effects, builders
  specs/     - Spec implementations (Hunter BM/MM)
  stats/     - StatCache, ratings, modifiers
  types/     - Type-safe indices, enums
```

## Module responsibilities

### actor/

Defines unit types: `Player`, `Pet`, `Enemy`. Each actor has stats, resources, and position. Players have spec-specific initialization.

### aura/

`AuraTracker` manages all active buffs and debuffs. `AuraInstance` tracks individual aura state including stacks, duration, and snapshots.

### class/

Shared logic across specs of the same class. For Hunter, this includes pet management and shared abilities.

### combat/

The damage pipeline: `DamageCalculator`, `DamageMultipliers`, cooldown tracking, and snapshot management for DoTs.

### core/

Low-level infrastructure: timing wheel `EventQueue`, seeded `FastRng`, CPU feature detection for SIMD.

### data/

Loading external data: `TuningData` from TOML files, `DbcData` from CSV. Provides overrides for spell tuning.

### handler/

The `SpecHandler` trait that all specs implement. Registry for looking up handlers by `SpecId`.

### proc/

Proc system: `RppmState` for RPPM procs, `FixedProc` for percentage procs, `ProcRegistry` for registration and lookup.

### resource/

`ResourcePool` for focus/energy/mana. `UnitResources` bundles primary and secondary pools. Regeneration logic.

### results/

`BatchResults` aggregates many simulation runs. Calculates mean, std dev, percentiles. `DamageBreakdown` for per-spell analysis.

### rotation/

The JIT compilation pipeline:

- `parser.rs` - JSON to AST
- `resolver.rs` - Validate spell/aura names
- `compiler.rs` - AST to Cranelift IR
- `expr/` - Expression types and evaluation

### sim/

Core simulation logic:

- `state.rs` - `SimState` struct
- `simulation.rs` - Event loop execution
- `batch.rs` - Parallel batch runner

### spec/

Spell and aura definitions:

- `spell.rs` - `SpellDef`, `SpellFlags`
- `aura.rs` - `AuraDef`, `AuraFlags`
- `effects.rs` - Declarative spell effects
- `builders.rs` - Builder pattern helpers

### specs/

Actual spec implementations:

- `hunter/bm/` - Beast Mastery
- `hunter/mm/` - Marksmanship

Each spec has: constants, spells, auras, procs, handler, rotation.

### stats/

Stat computation:

- `cache.rs` - `StatCache` with dirty flag
- `ratings.rs` - Rating to percent conversion
- `modifiers.rs` - `DamageMultipliers` layers

### types/

Type-safe newtypes: `SpellIdx`, `AuraIdx`, `SimTime`, etc. Prevents mixing incompatible IDs.

## Statistics

| Component       | Approximate Lines | Files   |
| --------------- | ----------------- | ------- |
| Core Simulation | 2,700             | 8       |
| Combat/Damage   | 1,200             | 6       |
| Rotation/JIT    | 3,500             | 12      |
| Stats/Resources | 1,500             | 10      |
| Aura System     | 800               | 5       |
| Handler/Proc    | 1,800             | 8       |
| Spec (Hunter)   | 2,900             | 12      |
| Types/Data      | 2,100             | 14      |
| **Total**       | **~16,500**       | **~75** |

## Next steps

- [Event System](/docs/engine/01-event-system) - Timing wheel internals
- [Spec Handlers](/docs/engine/03-spec-handlers) - Implementing a spec
