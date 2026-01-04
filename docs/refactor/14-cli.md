# Phase 14: CLI

## Goal

Create the command-line interface for the simulation engine.

## Prerequisites

Phase 13 complete. `cargo test -p engine_new` passes (158 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod cli; (optional feature)
├── main.rs             # Binary entry point
└── cli/
    ├── mod.rs
    ├── args.rs
    ├── config.rs
    └── runner.rs
```

### Update `Cargo.toml`

```toml
[package]
name = "engine_new"
version = "0.1.0"
edition = "2021"

[lib]
path = "src/lib.rs"

[[bin]]
name = "engine"
path = "src/main.rs"

[dependencies]
bitflags = "2"
rhai = { version = "1", features = ["sync", "no_function", "no_module"] }
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

## Specifications

### `src/main.rs`

```rust
use engine_new::cli::{Args, Runner};
use clap::Parser;

fn main() {
    let args = Args::parse();

    if let Err(e) = Runner::run(args) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
```

### `src/cli/mod.rs`

```rust
mod args;
mod config;
mod runner;

pub use args::*;
pub use config::*;
pub use runner::*;
```

### `src/cli/args.rs`

```rust
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Parser, Debug)]
#[command(name = "engine")]
#[command(about = "WoW Combat Simulation Engine", long_about = None)]
pub struct Args {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Run a simulation
    Sim {
        /// Spec to simulate
        #[arg(short, long)]
        spec: SpecArg,

        /// Fight duration in seconds
        #[arg(short, long, default_value = "300")]
        duration: f32,

        /// Number of iterations
        #[arg(short, long, default_value = "1000")]
        iterations: u32,

        /// Number of targets
        #[arg(short, long, default_value = "1")]
        targets: usize,

        /// Random seed
        #[arg(long)]
        seed: Option<u64>,

        /// Output format
        #[arg(short, long, default_value = "text")]
        output: OutputFormat,

        /// Rotation script file
        #[arg(long)]
        rotation: Option<String>,

        /// Gear profile file
        #[arg(long)]
        gear: Option<String>,

        /// Enable detailed trace
        #[arg(long)]
        trace: bool,
    },

    /// List available specs
    Specs,

    /// Validate a rotation script
    Validate {
        /// Rotation script file
        #[arg(short, long)]
        file: String,
    },

    /// Show version info
    Version,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
pub enum SpecArg {
    BmHunter,
}

impl SpecArg {
    pub fn to_spec_id(&self) -> crate::types::SpecId {
        match self {
            SpecArg::BmHunter => crate::types::SpecId::BeastMastery,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, ValueEnum)]
pub enum OutputFormat {
    #[default]
    Text,
    Json,
    Csv,
}
```

### `src/cli/config.rs`

```rust
use serde::{Deserialize, Serialize};
use crate::types::SpecId;
use crate::stats::StatCache;

/// Gear configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GearConfig {
    /// Item level
    pub item_level: u16,
    /// Primary stat (agi/str/int)
    pub primary_stat: u32,
    /// Haste rating
    pub haste: u32,
    /// Crit rating
    pub crit: u32,
    /// Mastery rating
    pub mastery: u32,
    /// Versatility rating
    pub versatility: u32,
}

impl Default for GearConfig {
    fn default() -> Self {
        // Default to ~500 ilvl gear stats
        Self {
            item_level: 500,
            primary_stat: 15000,
            haste: 3000,
            crit: 3000,
            mastery: 2000,
            versatility: 1500,
        }
    }
}

impl GearConfig {
    /// Load from JSON file
    pub fn from_file(path: &str) -> Result<Self, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))
    }

    /// Apply to stat cache
    pub fn apply_to(&self, stats: &mut StatCache, spec: SpecId) {
        // Apply primary stat based on spec
        match spec {
            SpecId::BeastMastery => {
                stats.set_agility(self.primary_stat as i32);
            }
            // Add other specs as implemented
            _ => {}
        }

        stats.set_haste_rating(self.haste as i32);
        stats.set_crit_rating(self.crit as i32);
        stats.set_mastery_rating(self.mastery as i32);
        stats.set_versatility_rating(self.versatility as i32);
    }
}

/// Fight configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FightConfig {
    /// Duration in seconds
    pub duration: f32,
    /// Number of targets
    pub targets: usize,
    /// Fight type name
    pub fight_type: String,
}

impl Default for FightConfig {
    fn default() -> Self {
        Self {
            duration: 300.0,
            targets: 1,
            fight_type: "Patchwerk".to_string(),
        }
    }
}
```

### `src/cli/runner.rs`

```rust
use crate::types::SpecId;
use crate::sim::{SimConfig, SimState, SimExecutor, BatchRunner, BatchResults};
use crate::actor::Player;
use crate::stats::StatCache;
use crate::rotation::{RotationScript, ScriptedRotation, SimpleRotation, Rotation};
use crate::results::{StatsCollector, DamageBreakdown, ResultsExporter, SimSummary};
use crate::specs::BeastMasteryHandler;
use super::{Args, Command, SpecArg, OutputFormat, GearConfig};
use std::collections::HashMap;

pub struct Runner;

impl Runner {
    pub fn run(args: Args) -> Result<(), String> {
        match args.command {
            Command::Sim {
                spec,
                duration,
                iterations,
                targets,
                seed,
                output,
                rotation,
                gear,
                trace,
            } => {
                Self::run_sim(
                    spec,
                    duration,
                    iterations,
                    targets,
                    seed,
                    output,
                    rotation,
                    gear,
                    trace,
                )
            }

            Command::Specs => {
                Self::list_specs()
            }

            Command::Validate { file } => {
                Self::validate_rotation(&file)
            }

            Command::Version => {
                println!("engine_new v{}", env!("CARGO_PKG_VERSION"));
                Ok(())
            }
        }
    }

    fn run_sim(
        spec: SpecArg,
        duration: f32,
        iterations: u32,
        targets: usize,
        seed: Option<u64>,
        output: OutputFormat,
        rotation_file: Option<String>,
        gear_file: Option<String>,
        trace: bool,
    ) -> Result<(), String> {
        // Load gear
        let gear = if let Some(path) = gear_file {
            GearConfig::from_file(&path)?
        } else {
            GearConfig::default()
        };

        // Setup player
        let spec_id = spec.to_spec_id();
        let mut player = Player::new(spec_id);

        // Apply gear stats
        gear.apply_to(&mut player.stats, spec_id);

        // Initialize spec
        match spec_id {
            SpecId::BeastMastery => {
                BeastMasteryHandler::init_player(&mut player);
            }
            _ => return Err("Spec not implemented".to_string()),
        }

        // Setup config
        let mut config = SimConfig::default()
            .with_duration(duration);

        if let Some(s) = seed {
            config = config.with_seed(s);
        }

        if trace {
            config = config.with_trace();
        }

        config.target_count = targets;

        // Run simulation
        if iterations == 1 {
            // Single iteration with details
            let mut state = SimState::new(config, player);

            match spec_id {
                SpecId::BeastMastery => {
                    BeastMasteryHandler::init_sim(&mut state);
                }
                _ => {}
            }

            SimExecutor::run(&mut state);

            Self::output_single(&state, output)?;
        } else {
            // Batch run
            let runner = BatchRunner::new(config.clone(), player)
                .with_iterations(iterations);

            let results = runner.run_with_progress(|done, total| {
                if done % 100 == 0 || done == total {
                    eprint!("\rProgress: {}/{} ({:.1}%)", done, total, (done as f32 / total as f32) * 100.0);
                }
            });
            eprintln!(); // New line after progress

            Self::output_batch(&results, output, duration)?;
        }

        Ok(())
    }

    fn output_single(state: &SimState, format: OutputFormat) -> Result<(), String> {
        let collector = StatsCollector::new(); // Would be populated during sim

        match format {
            OutputFormat::Text => {
                println!("\n=== Simulation Results ===");
                println!("Duration: {:.1}s", state.config.duration.as_secs_f32());
                println!("DPS: {:.2}", state.current_dps());
                println!("Total Damage: {:.0}", state.total_damage);
            }

            OutputFormat::Json => {
                let json = format!(
                    r#"{{"dps": {:.2}, "damage": {:.0}, "duration": {:.2}}}"#,
                    state.current_dps(),
                    state.total_damage,
                    state.config.duration.as_secs_f32(),
                );
                println!("{}", json);
            }

            OutputFormat::Csv => {
                println!("dps,damage,duration");
                println!("{:.2},{:.0},{:.2}",
                    state.current_dps(),
                    state.total_damage,
                    state.config.duration.as_secs_f32(),
                );
            }
        }

        Ok(())
    }

    fn output_batch(results: &BatchResults, format: OutputFormat, duration: f32) -> Result<(), String> {
        match format {
            OutputFormat::Text => {
                println!("\n=== Batch Results ===");
                println!("Iterations: {}", results.iterations);
                println!("Mean DPS: {:.2}", results.mean_dps);
                println!("Std Dev: {:.2}", results.std_dev);
                println!("Min DPS: {:.2}", results.min_dps);
                println!("Max DPS: {:.2}", results.max_dps);
                println!("Median: {:.2}", results.median());
                println!("CV: {:.2}%", results.cv() * 100.0);
            }

            OutputFormat::Json => {
                println!("{}", ResultsExporter::to_json(results));
            }

            OutputFormat::Csv => {
                println!("{}", ResultsExporter::to_csv(results));
            }
        }

        Ok(())
    }

    fn list_specs() -> Result<(), String> {
        println!("Available specs:");
        println!("  bm-hunter  - Beast Mastery Hunter");
        // Add more as implemented
        Ok(())
    }

    fn validate_rotation(file: &str) -> Result<(), String> {
        let content = std::fs::read_to_string(file)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        match RotationScript::compile(&content) {
            Ok(_) => {
                println!("✓ Rotation script is valid");
                Ok(())
            }
            Err(e) => {
                println!("✗ Rotation script has errors:");
                println!("  {}", e);
                Err(e)
            }
        }
    }
}
```

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
pub mod resource;
pub mod combat;
pub mod aura;
pub mod proc;
pub mod actor;
pub mod spec;
pub mod sim;
pub mod rotation;
pub mod results;
pub mod specs;
pub mod cli;
```

## CLI Usage Examples

```bash
# Run single iteration
./engine sim --spec bm-hunter --duration 300 --iterations 1

# Run batch simulation
./engine sim --spec bm-hunter --iterations 1000

# With custom gear
./engine sim --spec bm-hunter --gear gear.json

# Output as JSON
./engine sim --spec bm-hunter -o json

# Multi-target
./engine sim --spec bm-hunter --targets 5 --duration 60

# Validate rotation script
./engine validate --file rotation.rhai

# List specs
./engine specs
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo build --release
cargo test

# Test CLI
./target/release/engine --help
./target/release/engine specs
./target/release/engine sim --spec bm-hunter --iterations 10
```

Expected: Build succeeds, all 158 tests pass, CLI runs without errors.

## Todo Checklist

- [ ] Add dependencies to `Cargo.toml` (clap, serde, serde_json)
- [ ] Create `src/main.rs`
- [ ] Create `src/cli/mod.rs`
- [ ] Create `src/cli/args.rs`
- [ ] Create `src/cli/config.rs`
- [ ] Create `src/cli/runner.rs`
- [ ] Update `src/lib.rs` to add `pub mod cli;`
- [ ] Run `cargo build --release` — builds successfully
- [ ] Run `cargo test` — 158 tests pass
- [ ] Run `./target/release/engine --help` — shows help
- [ ] Run `./target/release/engine sim --spec bm-hunter --iterations 10` — runs simulation

## Final Summary

At completion of Phase 14:

- **Total Lines**: ~12,800 lines of Rust
- **Total Tests**: 158 tests
- **Modules**: 14 modules
- **Specs**: 1 complete (Beast Mastery Hunter)

The engine is ready for:

1. Adding more specs (following the BM Hunter pattern)
2. Integration with the web UI via WASM
3. Advanced features (talents, gear optimization)
