# engine

WoW combat simulation engine written in Rust.

## Commands

```bash
cargo build --release     # Release build (optimized)
cargo build               # Debug build
cargo test                # Run tests
cargo bench               # Run benchmarks
./target/release/engine --help
```

## CLI Usage

```bash
# Run simulation
./target/release/engine sim -s bm-hunter -d 300 -i 1000

# Run with external tuning
./target/release/engine sim -s bm-hunter --tuning data/tuning/bm_hunter.toml

# Multiple tuning files (later files override earlier)
./target/release/engine sim -s bm-hunter \
    --tuning data/tuning/hunter.toml \
    --tuning data/tuning/bm_hunter.toml

# List available specs
./target/release/engine specs

# Validate rotation script
./target/release/engine validate -f rotation.rhai
```

**Logging:** Use `RUST_LOG=engine=debug` for detailed output.

## Architecture

```
src/
  actor/     - Player/enemy actors and state
  aura/      - Buff/debuff system
  cli/       - Command-line interface (clap)
  combat/    - Damage calculation, combat events
  core/      - Core types and traits
  data/      - External tuning (TOML loader)
  proc/      - Proc system (trinkets, enchants, etc.)
  resource/  - Resource management (mana, focus, etc.)
  results/   - Simulation results and statistics
  rotation/  - Rhai scripting with AST optimization
  sim/       - Simulation executor and batch processing
  spec/      - Spec definitions and talent trees
  specs/     - Individual spec implementations
  stats/     - Character stats and rating conversions
  types/     - Shared type definitions

data/
  tuning/    - TOML tuning files for specs
```

## Rotation System

Rotations use Rhai scripts with `$` prefix for state lookups:

```rhai
if $spell.kill_command.ready() && $power.focus >= 30.0 {
    cast($spell.kill_command)
} else {
    wait_gcd()
}
```

## External Tuning

Override spell/aura values without recompiling using TOML files:

```toml
# data/tuning/bm_hunter.toml

[spell.kill_command]
cooldown = 7.5
cost_focus = 30.0
ap_coefficient = 2.0

[aura.bestial_wrath]
duration = 15.0
damage_multiplier = 1.25

[class]
focus_regeneration = 5.0
```

Tuning fields are optional - only specified values override defaults.

## Key Dependencies

- `rhai` - Embedded scripting
- `bitflags` - Efficient flag types
- `clap` - CLI parsing
- `serde` - Serialization
- `toml` - External tuning files
- `tracing` - Structured logging
