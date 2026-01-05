# WoW Lab Simulation Engine

High-performance WoW combat simulation engine written in Rust.

## Features

- Fast discrete-event simulation with batch processing
- Rhai-based rotation scripting with aggressive AST optimization
- Accurate damage calculation with all game mechanics
- Multi-target support
- JSON/CSV/text output formats
- Structured logging with tracing

## Building

```bash
cargo build --release
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
        --rotation <FILE>      Custom rotation script file
        --gear <FILE>          Gear profile file
        --seed <SEED>          Random seed for reproducibility
        --trace                Enable detailed combat trace
```

### List Available Specs

```bash
./target/release/engine specs
```

### Validate a Rotation Script

```bash
./target/release/engine validate --file my_rotation.rhai
```

## Rotation Scripting

Rotations are written in Rhai with a `$` prefix for game state access:

```rhai
// Priority-based rotation
if $spell.bestial_wrath.ready() {
    cast($spell.bestial_wrath)
} else if $spell.kill_command.ready() && $power.focus >= 30.0 {
    cast($spell.kill_command)
} else if $talent.killer_instinct.enabled && $target.health_pct < 0.2 {
    cast($spell.kill_shot)
} else {
    cast($spell.cobra_shot)
}
```

### State Namespaces

| Prefix | Description | Example |
|--------|-------------|---------|
| `$spell` | Spell info and readiness | `$spell.kill_command.ready()` |
| `$aura` | Buff/debuff tracking | `$aura.frenzy.stacks()` |
| `$power` | Resources | `$power.focus` |
| `$target` | Target state | `$target.health_pct` |
| `$talent` | Talent info | `$talent.killer_instinct.enabled` |

### Actions

- `cast($spell.name)` - Cast a spell
- `wait_gcd()` - Wait for GCD
- `wait(seconds)` - Wait for a duration

## Architecture

The engine uses a discrete-event simulation model:

1. **Actors** - Players and enemies with stats, resources, and auras
2. **Events** - Scheduled combat events (casts, damage, aura applications)
3. **Rotation** - Rhai scripts determine player actions each tick
4. **Results** - Aggregated statistics across iterations

### Performance

The rotation system achieves ~0.05 microseconds per evaluation through:

- One-time script compilation with variable extraction
- Static optimization when talents/config change
- Dynamic optimization per tick with constant folding
- Minimal AST evaluation after optimization

## Library Usage

```rust
use engine::{sim::SimExecutor, cli::SimConfig};

let config = SimConfig {
    spec: SpecId::BeastMastery,
    duration: 300.0,
    iterations: 1000,
    targets: 1,
    ..Default::default()
};

let results = SimExecutor::run(&config)?;
println!("DPS: {:.0}", results.dps.mean);
```

## License

Proprietary - WoW Lab
