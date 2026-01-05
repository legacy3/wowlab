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
  proc/      - Proc system (trinkets, enchants, etc.)
  resource/  - Resource management (mana, focus, etc.)
  results/   - Simulation results and statistics
  rotation/  - Rhai scripting with AST optimization
  sim/       - Simulation executor and batch processing
  spec/      - Spec definitions and talent trees
  specs/     - Individual spec implementations
  stats/     - Character stats and rating conversions
  types/     - Shared type definitions
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

## Key Dependencies

- `rhai` - Embedded scripting
- `bitflags` - Efficient flag types
- `clap` - CLI parsing
- `serde` - Serialization
- `tracing` - Structured logging
