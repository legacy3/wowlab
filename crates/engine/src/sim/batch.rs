use super::{SimState, SimConfig, SimExecutor};
use crate::actor::Player;
use std::sync::atomic::{AtomicU32, Ordering};

/// Results from a batch of iterations
#[derive(Clone, Debug)]
pub struct BatchResults {
    /// Number of iterations
    pub iterations: u32,
    /// Mean DPS
    pub mean_dps: f64,
    /// Std dev of DPS
    pub std_dev: f64,
    /// Minimum DPS
    pub min_dps: f64,
    /// Maximum DPS
    pub max_dps: f64,
    /// All DPS values (for percentile calculations)
    pub dps_values: Vec<f64>,
}

impl BatchResults {
    pub fn from_values(values: Vec<f64>) -> Self {
        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;

        let variance = values.iter()
            .map(|v| (v - mean).powi(2))
            .sum::<f64>() / n;
        let std_dev = variance.sqrt();

        let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

        Self {
            iterations: values.len() as u32,
            mean_dps: mean,
            std_dev,
            min_dps: min,
            max_dps: max,
            dps_values: values,
        }
    }

    /// Get DPS at percentile (0-100)
    pub fn percentile(&self, p: f64) -> f64 {
        if self.dps_values.is_empty() {
            return 0.0;
        }

        let mut sorted = self.dps_values.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let index = ((p / 100.0) * (sorted.len() - 1) as f64) as usize;
        sorted[index.min(sorted.len() - 1)]
    }

    /// Median DPS
    pub fn median(&self) -> f64 {
        self.percentile(50.0)
    }

    /// Coefficient of variation (std_dev / mean)
    pub fn cv(&self) -> f64 {
        if self.mean_dps > 0.0 {
            self.std_dev / self.mean_dps
        } else {
            0.0
        }
    }
}

/// Runs multiple simulation iterations
pub struct BatchRunner {
    config: SimConfig,
    player_template: Player,
    iterations: u32,
}

impl BatchRunner {
    pub fn new(config: SimConfig, player: Player) -> Self {
        Self {
            config,
            player_template: player,
            iterations: 1000,
        }
    }

    pub fn with_iterations(mut self, count: u32) -> Self {
        self.iterations = count;
        self
    }

    /// Run all iterations (single-threaded)
    pub fn run(&self) -> BatchResults {
        let mut dps_values = Vec::with_capacity(self.iterations as usize);

        for i in 0..self.iterations {
            let mut config = self.config.clone();
            config.seed = config.seed.wrapping_add(i as u64);

            let mut state = SimState::new(config, self.player_template.clone());
            SimExecutor::run(&mut state);

            dps_values.push(state.current_dps());
        }

        BatchResults::from_values(dps_values)
    }

    /// Run with progress callback
    pub fn run_with_progress<F>(&self, mut callback: F) -> BatchResults
    where
        F: FnMut(u32, u32),
    {
        let mut dps_values = Vec::with_capacity(self.iterations as usize);

        for i in 0..self.iterations {
            let mut config = self.config.clone();
            config.seed = config.seed.wrapping_add(i as u64);

            let mut state = SimState::new(config, self.player_template.clone());
            SimExecutor::run(&mut state);

            dps_values.push(state.current_dps());

            callback(i + 1, self.iterations);
        }

        BatchResults::from_values(dps_values)
    }
}

/// Progress tracking for parallel execution
pub struct Progress {
    completed: AtomicU32,
    total: u32,
}

impl Progress {
    pub fn new(total: u32) -> Self {
        Self {
            completed: AtomicU32::new(0),
            total,
        }
    }

    pub fn increment(&self) -> u32 {
        self.completed.fetch_add(1, Ordering::Relaxed) + 1
    }

    pub fn completed(&self) -> u32 {
        self.completed.load(Ordering::Relaxed)
    }

    pub fn total(&self) -> u32 {
        self.total
    }

    pub fn percent(&self) -> f32 {
        (self.completed() as f32 / self.total as f32) * 100.0
    }
}
