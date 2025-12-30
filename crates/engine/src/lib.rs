pub mod config;
pub mod rotation;
pub mod sim;
pub mod util;

use config::SimConfig;
use rotation::{PredictiveRotation, RotationError};
use sim::{run_batch, run_simulation, SimState};
use util::FastRng;

/// Native simulator with Rhai rotation scripting and predictive condition gating.
pub struct Simulator {
    config: SimConfig,
    state: SimState,
    rng: FastRng,
    rotation: PredictiveRotation,
}

impl Simulator {
    /// Create a new simulator from config and rotation script.
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

    /// Run a single simulation.
    pub fn run(&mut self, seed: u64) -> sim::SimResult {
        self.rng.reseed(seed);
        self.rotation.reset();
        run_simulation(&mut self.state, &self.config, &mut self.rng, &mut self.rotation)
    }

    /// Run a batch of simulations.
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

    /// Get rotation statistics.
    pub fn rotation_stats(&self) -> rotation::RotationStats {
        self.rotation.stats()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Rotation error: {0}")]
    Rotation(#[from] RotationError),

    #[error("Spell not found: {0}")]
    SpellNotFound(u32),

    #[error("Aura not found: {0}")]
    AuraNotFound(u32),
}
