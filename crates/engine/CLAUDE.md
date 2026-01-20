# engine

**RULE: Never leave old code.** When refactoring or renaming, DELETE the old code completely. No deprecated wrappers, no backwards-compatibility shims, no "legacy exports", no commented-out old versions. Update ALL usages and remove the old thing entirely.

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
  data/      - Data resolvers (local CSV, Supabase)
  proc/      - Proc system (trinkets, enchants, etc.)
  resource/  - Resource management (mana, focus, etc.)
  results/   - Simulation results and statistics
  rotation/  - JSON-based rotation system
  sim/       - Simulation executor and batch processing
  spec/      - Spec definitions and talent trees
  specs/     - Individual spec implementations
  stats/     - Character stats and rating conversions
  types/     - Shared type definitions
```

## Rotation System

Rotations use JSON format with actions and conditions:

```json
{
  "name": "BM Hunter",
  "actions": [
    { "spell": "kill_command", "condition": "cooldown.ready" },
    { "spell": "barbed_shot", "condition": "charges >= 1" }
  ]
}
```

## Key Dependencies

- `bitflags` - Efficient flag types
- `clap` - CLI parsing
- `serde` - Serialization
- `tracing` - Structured logging
