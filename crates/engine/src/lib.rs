pub mod config;
pub mod script;
pub mod sim;
pub mod util;

use config::SimConfig;
use script::RotationScript;
use sim::{run_batch, run_simulation, SimState};
use util::FastRng;

/// Native simulator with WASM rotation scripting
pub struct Simulator {
    config: SimConfig,
    state: SimState,
    rng: FastRng,
    rotation: RotationScript,
}

impl Simulator {
    /// Create a new simulator from config and rotation WASM bytes
    pub fn new(config: SimConfig, rotation_wasm: &[u8]) -> Result<Self, EngineError> {
        let state = SimState::new(&config);
        let rotation = RotationScript::new(rotation_wasm, &config)?;

        Ok(Simulator {
            config,
            state,
            rng: FastRng::new(1),
            rotation,
        })
    }

    /// Run a single simulation
    pub fn run(&mut self, seed: u64) -> sim::SimResult {
        self.rng.reseed(seed);
        run_simulation(&mut self.state, &self.config, &mut self.rng, &mut self.rotation)
    }

    /// Run a batch of simulations
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
}

#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Script error: {0}")]
    Script(String),

    #[error("Spell not found: {0}")]
    SpellNotFound(u32),

    #[error("Aura not found: {0}")]
    AuraNotFound(u32),
}

impl From<wasmtime::Error> for EngineError {
    fn from(e: wasmtime::Error) -> Self {
        EngineError::Script(e.to_string())
    }
}
