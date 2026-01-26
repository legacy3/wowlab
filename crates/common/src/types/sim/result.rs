//! Simulation result types shared between engine, nodes, and frontend.

use serde::{Deserialize, Serialize};

/// Result from a single simulation chunk (processed by a node).
///
/// This is what nodes write to `jobs_chunks.result` after completing their work.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ChunkResult {
    /// Number of iterations completed in this chunk
    pub iterations: u32,
    /// Mean DPS across all iterations in this chunk
    pub mean_dps: f64,
    /// Standard deviation of DPS in this chunk
    pub std_dps: f64,
    /// Minimum DPS observed
    pub min_dps: f64,
    /// Maximum DPS observed
    pub max_dps: f64,
}

/// Aggregated result from a completed simulation job.
///
/// This is stored in `jobs.result` once all chunks are complete.
/// The frontend uses this type to display final results.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct SimulationResult {
    /// Mean DPS across all iterations
    pub mean_dps: f64,
    /// Minimum DPS observed across all iterations
    pub min_dps: f64,
    /// Maximum DPS observed across all iterations
    pub max_dps: f64,
    /// Total number of iterations completed
    pub total_iterations: u32,
    /// Number of chunks that were processed
    pub chunks_completed: u32,
}

impl SimulationResult {
    /// Create a new empty result
    pub fn new() -> Self {
        Self {
            mean_dps: 0.0,
            min_dps: f64::MAX,
            max_dps: f64::MIN,
            total_iterations: 0,
            chunks_completed: 0,
        }
    }

    /// Merge a chunk result into this aggregated result
    pub fn merge_chunk(&mut self, chunk: &ChunkResult) {
        // Update min/max
        self.min_dps = self.min_dps.min(chunk.min_dps);
        self.max_dps = self.max_dps.max(chunk.max_dps);

        // Weighted mean calculation
        let total_before = self.total_iterations as f64;
        let chunk_count = chunk.iterations as f64;
        let total_after = total_before + chunk_count;

        if total_after > 0.0 {
            self.mean_dps =
                (self.mean_dps * total_before + chunk.mean_dps * chunk_count) / total_after;
        }

        self.total_iterations += chunk.iterations;
        self.chunks_completed += 1;
    }
}

impl Default for SimulationResult {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_chunks() {
        let mut result = SimulationResult::new();

        // First chunk: 1000 iterations, mean 50000 DPS
        result.merge_chunk(&ChunkResult {
            iterations: 1000,
            mean_dps: 50000.0,
            std_dps: 1000.0,
            min_dps: 45000.0,
            max_dps: 55000.0,
        });

        assert_eq!(result.total_iterations, 1000);
        assert_eq!(result.mean_dps, 50000.0);
        assert_eq!(result.min_dps, 45000.0);
        assert_eq!(result.max_dps, 55000.0);
        assert_eq!(result.chunks_completed, 1);

        // Second chunk: 1000 iterations, mean 52000 DPS
        result.merge_chunk(&ChunkResult {
            iterations: 1000,
            mean_dps: 52000.0,
            std_dps: 1200.0,
            min_dps: 46000.0,
            max_dps: 58000.0,
        });

        assert_eq!(result.total_iterations, 2000);
        assert_eq!(result.mean_dps, 51000.0); // (50000 + 52000) / 2
        assert_eq!(result.min_dps, 45000.0); // min of both
        assert_eq!(result.max_dps, 58000.0); // max of both
        assert_eq!(result.chunks_completed, 2);
    }
}
