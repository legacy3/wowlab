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

# Validate rotation file
./target/release/engine validate -f rotation.json
```

**Logging:** Use `RUST_LOG=engine=debug` for detailed output.

## Architecture

```
src/
  actor/     - Player/enemy actors and state
  aura/      - Buff/debuff system
  class/     - Class-specific logic
  cli/       - Command-line interface (clap)
  combat/    - Damage calculation, combat events
  core/      - Core types and traits
  data/      - Data resolvers (local CSV, Supabase)
  handler/   - Spec handlers
  math/      - Mathematical utilities
  proc/      - Proc system (trinkets, enchants, etc.)
  resource/  - Resource management (mana, focus, etc.)
  results/   - Simulation results and statistics
  rotation/  - JSON-based rotation compiler and evaluator
  sim/       - Simulation executor and batch processing
  spec/      - Spec definitions and talent trees
  specs/     - Individual spec implementations (hunter/bm, hunter/mm)
  stats/     - Character stats and rating conversions
  wasm_exports.rs - WASM export layer
```

## Rotation System

Rotations use JSON with variables, action lists, and conditions:

```json
{
  "name": "BM Hunter ST",
  "variables": {
    "need_frenzy_refresh": {
      "and": ["buff.frenzy.active", { "<": ["buff.frenzy.remaining", 2] }]
    }
  },
  "lists": {
    "cooldowns": [{ "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" }],
    "st": [
      {
        "cast": "barbed_shot",
        "if": { "or": [{ "not": "buff.frenzy.active" }, "need_frenzy_refresh"] }
      },
      { "cast": "kill_command", "if": "cd.kill_command.ready" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] } }
    ]
  }
}
```

## Features (Cargo)

- `default` = local + jit + cli + parallel
- `local` - Use local CSV data files
- `supabase` - Network-based data resolution
- `jit` - JIT compilation via Cranelift
- `cli` - CLI binary (clap, console, indicatif)
- `wasm` - WASM export support
- `parallel` - Parallel simulation (rayon, mimalloc)

## Key Dependencies

- `wowlab-types`, `wowlab-parsers` - Shared types and data parsing
- `cranelift` - JIT compilation for rotation evaluation
- `rayon` - Parallel simulation
- `bitflags` - Efficient flag types
- `clap` - CLI parsing
- `serde` - Serialization
- `tracing` - Structured logging
