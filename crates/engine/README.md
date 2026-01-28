# WoW Lab Simulation Engine

High-performance WoW combat simulation engine written in Rust.

## Features

- Discrete-event simulation with parallel batch processing (rayon)
- JSON-based rotation DSL with variables, action lists, and conditions
- JIT compilation via Cranelift for rotation evaluation
- Accurate damage calculation with all game mechanics
- Multi-target support
- WASM build for browser integration
- JSON/CSV/text output formats
- Structured logging with tracing

## Building

```bash
cargo build --release
```

WASM target:

```bash
wasm-pack build --target web --out-dir ../../packages/wowlab-engine/wasm
```

## Usage

### Run a Simulation

```bash
./target/release/engine sim \
  --spec bm-hunter \
  --duration 300 \
  --iterations 1000 \
  --targets 1 \
  --output json
```

### CLI Options

```
USAGE:
    engine sim [OPTIONS] --spec <SPEC>

OPTIONS:
    -s, --spec <SPEC>          Spec to simulate (e.g., bm-hunter)
    -d, --duration <SECS>      Fight duration in seconds [default: 300]
    -i, --iterations <N>       Number of iterations [default: 1000]
    -t, --targets <N>          Number of targets [default: 1]
    -o, --output <FORMAT>      Output format: text, json, csv [default: text]
        --threads <N>          Number of threads (auto-detected)
        --rotation <FILE>      Custom rotation file (JSON)
        --gear <FILE>          Gear profile file
        --seed <SEED>          Random seed for reproducibility
        --trace                Enable detailed event tracing
```

### List Available Specs

```bash
./target/release/engine specs
```

### Validate a Rotation File

```bash
./target/release/engine validate --file rotation.json
```

## Rotation DSL

Rotations are JSON files with variables, named action lists, and conditions:

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
        "if": {
          "or": [
            { "not": "buff.frenzy.active" },
            "need_frenzy_refresh",
            { ">=": ["cd.barbed_shot.charges", 2] }
          ]
        }
      },
      { "cast": "kill_command", "if": "cd.kill_command.ready" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] } }
    ]
  }
}
```

### Condition Syntax

- String literals: `"buff.frenzy.active"`, `"cd.kill_command.ready"`
- Comparisons: `{ "<": ["combat.time", 10] }`, `{ ">=": ["resource.focus", 50] }`
- Logic: `{ "and": [...] }`, `{ "or": [...] }`, `{ "not": expr }`
- Variables: Reference by name (e.g., `"need_frenzy_refresh"`)

## Architecture

The engine uses a discrete-event simulation model:

1. **Actors** - Players and enemies with stats, resources, and auras
2. **Events** - Scheduled combat events (casts, damage, aura applications)
3. **Rotation** - JSON DSL compiled to AST, evaluated each decision point
4. **Batch** - Parallel iteration via rayon with running statistics

### Library Usage

```rust
use wowlab_engine::sim::{BatchRunner, SimConfig};

let runner = BatchRunner::with_handler(handler, config, player)
    .with_iterations(1000);

let results = runner.run();
println!("DPS: {:.0} +/- {:.0}", results.mean_dps, results.std_dev);
```

## License

PolyForm Noncommercial License 1.0.0
