# crates/engine

Rust simulation core with CLI interface. High-performance combat simulation with Rhai-based rotation scripting.

## CLI Usage

```bash
# Run a simulation
./target/release/engine sim --spec specs/hunter/beast-mastery.toml -i 10000

# Validate a rotation without running
./target/release/engine validate --spec specs/hunter/beast-mastery.toml --rotation rotations/bm_st.rhai

# Run benchmarks with detailed stats
./target/release/engine bench --spec specs/hunter/beast-mastery.toml -i 100000 --stats

# List available specs
./target/release/engine list --dir specs

# JSON output for integration
./target/release/engine sim --spec specs/hunter/beast-mastery.toml -o json
```

## Building

```bash
# Dev build
cargo build

# Release build (optimized)
cargo build --release

# Run CLI
./target/release/engine --help

# WASM build (for web)
wasm-pack build --target web --out-dir ../../packages/wowlab-engine/wasm
```

## Structure

```
src/
  lib.rs              # Library entry, Simulator API
  bin/
    main.rs           # CLI entry point (clap)
  cli/
    mod.rs            # TOML config loading, SpecConfig types
  config/
    mod.rs            # SimConfig, SpellDef, AuraDef, Stats
  rotation/
    mod.rs            # PredictiveRotation, condition gating
    compiler.rs       # Rhai AST → Condition tree
    condition.rs      # Condition enum and evaluation
  sim/
    mod.rs            # SimState, run_simulation, run_batch
    engine.rs         # Core simulation loop
    events.rs         # Timing wheel event queue
    state.rs          # UnitState, SpellState, AuraTracker
  util/
    mod.rs            # FastRng, helpers

specs/                # Spec configuration files (TOML)
  hunter/
    beast-mastery.toml
rotations/            # Rotation scripts (Rhai)
  bm_st.rhai
```

## Spec Configuration (TOML)

```toml
[spec]
id = "hunter:beast-mastery"
name = "Beast Mastery"
class = "Hunter"
default_rotation = "rotations/bm_st.rhai"

[player]
primary_stat = "agility"
resource = "focus"
resource_max = 100
resource_regen = 10.0

[[spells]]
id = 34026
name = "Kill Command"
cooldown = 7.5
gcd = 1.5
cost = 30
damage = { base = [1000, 1200], ap_coeff = 0.6 }

[[auras]]
id = 19574
name = "Bestial Wrath"
duration = 15.0
damage_mod = 25.0
```

## Rotation Scripts (Rhai)

```rhai
// Priority-based: first matching rule wins
if bestial_wrath.ready() { cast("bestial_wrath") }
if kill_command.ready() { cast("kill_command") }
if barbed_shot.ready() { cast("barbed_shot") }
if cobra_shot.ready() { cast("cobra_shot") }
```

### Available Conditions

- `spell.ready()` - Spell off cooldown and has resources
- `aura.active()` - Aura is currently applied
- `aura.stacks() >= N` - Aura has at least N stacks
- `aura.remaining() <= N` - Aura expires within N seconds

## Key Types

- `SpecConfig` - TOML spec configuration with spells, auras, player setup
- `SimConfig` - Runtime simulation configuration
- `PredictiveRotation` - Compiled rotation with condition gating
- `Simulator` - High-level API combining all components
- `BatchResult` - Statistics from multiple simulation runs

## Design Principles

- **Zero allocations in hot loop** - All state pre-allocated
- **Rhai compile-time analysis** - AST parsed once, conditions extracted
- **Predictive gating** - Skip conditions that can't be true yet (78%+ savings)
- **O(1) event queue** - Timing wheel with bitmap for next-slot lookup
- **Cache-friendly structs** - Hot fields grouped, aligned access
