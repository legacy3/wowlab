pub mod config;
pub mod rotation;
pub mod sim;
pub mod util;

use wasm_bindgen::prelude::*;

use config::SimConfig;
use sim::{run_batch, run_simulation, SimState};
use util::FastRng;

/// WASM-exposed simulator
#[wasm_bindgen]
pub struct Simulator {
    config: SimConfig,
    state: SimState,
    rng: FastRng,
}

#[wasm_bindgen]
impl Simulator {
    /// Create a new simulator from JSON config
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<Simulator, JsValue> {
        let mut config: SimConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;

        // Precompute derived stats
        config.finalize();

        let state = SimState::new(&config);

        Ok(Simulator {
            config,
            state,
            rng: FastRng::new(1),
        })
    }

    /// Run a single simulation
    pub fn run(&mut self, seed: u64) -> Result<JsValue, JsValue> {
        self.rng.reseed(seed);
        let result = run_simulation(&mut self.state, &self.config, &mut self.rng);
        serde_wasm_bindgen::to_value(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {e}")))
    }

    /// Run a batch of simulations
    pub fn run_batch(&mut self, iterations: u32, base_seed: u64) -> Result<JsValue, JsValue> {
        let result = run_batch(
            &mut self.state,
            &self.config,
            &mut self.rng,
            iterations,
            base_seed,
        );
        serde_wasm_bindgen::to_value(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {e}")))
    }
}

/// Error types for the engine
#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Simulation error: {0}")]
    Simulation(String),

    #[error("Spell not found: {0}")]
    SpellNotFound(u32),

    #[error("Aura not found: {0}")]
    AuraNotFound(u32),
}
