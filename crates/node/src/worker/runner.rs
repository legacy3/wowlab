use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub total_damage: f64,
    pub total_iterations: u32,
    pub dps: f64,
    pub duration: f64,
}

pub struct SimRunner;

impl SimRunner {
    pub fn run(
        config_json: &str,
        iterations: u32,
        _base_seed: u64,
    ) -> Result<serde_json::Value, SimError> {
        let config: serde_json::Value =
            serde_json::from_str(config_json).map_err(|e| SimError::Config(e.to_string()))?;

        let duration = config
            .get("duration")
            .and_then(serde_json::Value::as_f64)
            .unwrap_or(300.0);

        // Mock result - in production this calls the actual engine
        let result = BatchResult {
            total_damage: 1_000_000.0 * f64::from(iterations),
            total_iterations: iterations,
            dps: 1_000_000.0 / duration,
            duration,
        };

        tracing::debug!(
            "Simulated {} iterations, mock DPS: {:.0}",
            iterations,
            result.dps
        );
        serde_json::to_value(result).map_err(|e| SimError::Serialization(e.to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SimError {
    #[error("Configuration error: {0}")]
    Config(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
}
