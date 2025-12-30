//! Simulation runner that integrates with the engine crate.

use engine::{config::SimConfig, sim::BatchResult, Simulator};
use serde::{Deserialize, Serialize};

/// JSON request format for distributed simulation.
///
/// Contains both the simulation configuration and rotation script.
#[derive(Debug, Clone, Deserialize)]
pub struct SimRequest {
    /// Simulation configuration (player, spells, auras, etc.)
    #[serde(flatten)]
    pub config: SimConfig,

    /// Rotation script (Rhai code).
    pub rotation: String,
}

/// Result format returned by the simulation runner.
///
/// Maps the engine's BatchResult to a node-friendly format.
#[derive(Debug, Clone, Serialize)]
pub struct SimResponse {
    pub iterations: u32,
    pub mean_dps: f32,
    pub std_dps: f32,
    pub min_dps: f32,
    pub max_dps: f32,
    pub total_casts: u64,
}

impl From<BatchResult> for SimResponse {
    fn from(result: BatchResult) -> Self {
        Self {
            iterations: result.iterations,
            mean_dps: result.mean_dps,
            std_dps: result.std_dps,
            min_dps: result.min_dps,
            max_dps: result.max_dps,
            total_casts: result.total_casts,
        }
    }
}

pub struct SimRunner;

impl SimRunner {
    /// Run a batch simulation using the engine.
    ///
    /// # Arguments
    /// * `config_json` - JSON string containing SimRequest (config + rotation)
    /// * `iterations` - Number of simulation iterations to run
    /// * `base_seed` - Base seed for RNG (offset by chunk for distribution)
    ///
    /// # Returns
    /// JSON value containing simulation results
    pub fn run(
        config_json: &str,
        iterations: u32,
        base_seed: u64,
    ) -> Result<serde_json::Value, SimError> {
        // Parse the request
        let mut request: SimRequest =
            serde_json::from_str(config_json).map_err(|e| SimError::Config(e.to_string()))?;

        // Finalize derived stats
        request.config.finalize();

        // Create simulator with rotation
        let mut simulator = Simulator::new(request.config, &request.rotation)
            .map_err(|e| SimError::Engine(e.to_string()))?;

        // Run the simulation batch
        let result = simulator.run_batch(iterations, base_seed);

        tracing::debug!(
            "Completed {} iterations: mean DPS = {:.0} (±{:.0})",
            result.iterations,
            result.mean_dps,
            result.std_dps
        );

        // Convert to response format
        let response = SimResponse::from(result);
        serde_json::to_value(response).map_err(|e| SimError::Serialization(e.to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SimError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Engine error: {0}")]
    Engine(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}
