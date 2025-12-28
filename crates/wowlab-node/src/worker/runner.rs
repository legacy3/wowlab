//! Simulation runner for native execution
//!
//! This module provides native simulation capability. The engine crate currently
//! uses wasm_bindgen for its public interface, which is WASM-specific.
//!
//! TODO: When the engine crate supports native builds (via feature flags or
//! separate native interface), this runner will use that directly.

use serde::{Deserialize, Serialize};

/// Result from a batch simulation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub total_damage: f64,
    pub total_iterations: u32,
    pub dps: f64,
    pub duration: f64,
}

/// Runs simulations using the native engine
pub struct SimRunner {
    // Reserved for future engine state
}

impl SimRunner {
    pub fn new() -> Self {
        Self {}
    }

    /// Run a batch of simulations
    ///
    /// Currently returns a mock result. When the engine supports native builds,
    /// this will call the actual simulation code.
    pub fn run(
        &self,
        config_json: &str,
        iterations: u32,
        _base_seed: u64,
    ) -> Result<serde_json::Value, SimError> {
        // Validate config is valid JSON
        let config: serde_json::Value =
            serde_json::from_str(config_json).map_err(|e| SimError::Config(e.to_string()))?;

        // Extract duration from config for mock result
        let duration = config
            .get("duration")
            .and_then(|d| d.as_f64())
            .unwrap_or(300.0);

        // Mock result for now - in production this calls the engine
        // The engine simulation is highly optimized and would actually run here
        let mock_result = BatchResult {
            total_damage: 1_000_000.0 * iterations as f64,
            total_iterations: iterations,
            dps: 1_000_000.0 / duration,
            duration,
        };

        tracing::debug!(
            "Simulated {} iterations, mock DPS: {:.0}",
            iterations,
            mock_result.dps
        );

        serde_json::to_value(mock_result).map_err(|e| SimError::Serialization(e.to_string()))
    }

    /// Run a single simulation (for testing/debugging)
    #[allow(dead_code)]
    pub fn run_single(&self, config_json: &str, seed: u64) -> Result<serde_json::Value, SimError> {
        self.run(config_json, 1, seed)
    }
}

impl Default for SimRunner {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum SimError {
    #[error("Configuration error: {0}")]
    Config(String),
    #[error("Simulation error: {0}")]
    Simulation(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
}
