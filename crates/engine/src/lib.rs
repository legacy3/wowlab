//! WoW combat simulation engine.
//!
//! This crate provides a high-performance simulation engine for World of Warcraft
//! combat mechanics. Key features:
//!
//! - **Rhai-based rotation scripting** with compile-time AST analysis
//! - **Predictive condition gating** to skip conditions that can't be true yet
//! - **O(1) event queue** using a timing wheel with bitmap acceleration
//! - **Zero allocations** in the hot loop (all state pre-allocated)
//!
//! # Usage
//!
//! ```rust,ignore
//! use engine::{Simulator, config::SimConfig};
//!
//! let config = SimConfig { /* ... */ };
//! let rotation = r#"
//!     if kill_command.ready() { cast("kill_command") }
//!     if cobra_shot.ready() { cast("cobra_shot") }
//! "#;
//!
//! let mut sim = Simulator::new(config, rotation)?;
//! let result = sim.run_batch(10_000, 0);
//! println!("Mean DPS: {}", result.mean_dps);
//! ```
//!
//! # Modules
//!
//! - [`cli`] - CLI configuration and spec loading (TOML)
//! - [`config`] - Configuration types (spells, auras, stats)
//! - [`rotation`] - Rotation scripting and compilation
//! - [`sim`] - Simulation engine and state management
//! - [`util`] - Utility types (RNG)

pub mod cli;
pub mod config;
pub mod paperdoll;
pub mod resources;
pub mod rotation;
pub mod sim;
pub mod traits;
pub mod util;

use config::SimConfig;
use rotation::{PredictiveRotation, RotationError};
use sim::{run_batch, run_simulation, SimState};
use util::FastRng;

/// High-level simulator with integrated rotation scripting.
///
/// Wraps the low-level simulation components into a convenient API.
pub struct Simulator {
    config: SimConfig,
    state: SimState,
    rng: FastRng,
    rotation: PredictiveRotation,
}

impl Simulator {
    /// Creates a new simulator from configuration and rotation script.
    ///
    /// # Errors
    ///
    /// Returns an error if the rotation script fails to compile.
    pub fn new(config: SimConfig, rotation_script: &str) -> Result<Self, EngineError> {
        let state = SimState::new(&config);
        let rotation = PredictiveRotation::compile(rotation_script, &config)?;

        Ok(Simulator {
            config,
            state,
            rng: FastRng::new(1),
            rotation,
        })
    }

    /// Runs a single simulation with the given RNG seed.
    pub fn run(&mut self, seed: u64) -> sim::SimResult {
        self.rng.reseed(seed);
        self.rotation.reset();
        run_simulation(&mut self.state, &self.config, &mut self.rng, &mut self.rotation)
    }

    /// Runs a batch of simulations for statistical analysis.
    pub fn run_batch(&mut self, iterations: u32, base_seed: u64) -> sim::BatchResult {
        run_batch(
            &mut self.state,
            &self.config,
            &mut self.rng,
            &mut self.rotation,
            iterations,
            base_seed,
        )
    }

    /// Returns current rotation evaluation statistics.
    #[must_use]
    pub fn rotation_stats(&self) -> rotation::RotationStats {
        self.rotation.stats()
    }
}

/// Top-level errors from the simulation engine.
#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    /// Invalid configuration.
    #[error("Configuration error: {0}")]
    Config(String),

    /// Rotation script compilation failed.
    #[error("Rotation error: {0}")]
    Rotation(#[from] RotationError),

    /// Referenced spell not found in configuration.
    #[error("Spell not found: {0}")]
    SpellNotFound(u32),

    /// Referenced aura not found in configuration.
    #[error("Aura not found: {0}")]
    AuraNotFound(u32),
}
