use super::{SimConfig, Simulation};
use crate::handler::SpecHandler;
use crate::actor::Player;
use crate::math::{Summary, RunningStats};
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::Instant;
use rayon::prelude::*;
use parking_lot::Mutex;

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
        let stats = Summary::new(values.clone());

        Self {
            iterations: values.len() as u32,
            mean_dps: stats.mean(),
            std_dev: stats.std_dev(),
            min_dps: stats.min(),
            max_dps: stats.max(),
            dps_values: values,
        }
    }

    /// Get DPS at percentile (0-100)
    pub fn percentile(&self, p: f64) -> f64 {
        if self.dps_values.is_empty() {
            return 0.0;
        }
        let mut stats = Summary::new(self.dps_values.clone());
        stats.percentile(p as usize)
    }

    /// Median DPS
    pub fn median(&self) -> f64 {
        if self.dps_values.is_empty() {
            return 0.0;
        }
        let mut stats = Summary::new(self.dps_values.clone());
        stats.median()
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

/// Runs multiple simulation iterations in parallel
pub struct BatchRunner {
    handler: Arc<dyn SpecHandler>,
    config: SimConfig,
    player_template: Player,
    iterations: u32,
}

impl BatchRunner {
    pub fn with_handler(handler: Arc<dyn SpecHandler>, config: SimConfig, player: Player) -> Self {
        Self {
            handler,
            config,
            player_template: player,
            iterations: 1000,
        }
    }

    pub fn with_iterations(mut self, count: u32) -> Self {
        self.iterations = count;
        self
    }

    /// Run all iterations in parallel using rayon
    pub fn run(&self) -> BatchResults {
        self.run_internal(None)
    }

    /// Run with progress tracking (parallel)
    pub fn run_with_progress(&self, progress: &ExactProgress) -> BatchResults {
        self.run_internal(Some(progress))
    }

    fn run_internal(&self, progress: Option<&ExactProgress>) -> BatchResults {
        let dps_values: Vec<f64> = (0..self.iterations)
            .into_par_iter()
            .map(|i| {
                let mut config = self.config.clone();
                config.seed = config.seed.wrapping_add(i as u64);

                let mut sim = Simulation::new(
                    Arc::clone(&self.handler),
                    config,
                    self.player_template.clone(),
                );
                sim.run();
                let dps = sim.dps();

                if let Some(p) = progress {
                    p.record_iteration(dps);
                }

                dps
            })
            .collect();

        BatchResults::from_values(dps_values)
    }
}

/// Progress tracking with running statistics for live display.
/// Uses mutex-protected RunningStats for thread-safe accumulation.
pub struct ExactProgress {
    completed: AtomicU32,
    total: u32,
    stats: Mutex<RunningStats>,
    start: Instant,
    num_threads: usize,
}

impl ExactProgress {
    pub fn new(total: u32) -> Self {
        Self {
            completed: AtomicU32::new(0),
            total,
            stats: Mutex::new(RunningStats::new()),
            start: Instant::now(),
            num_threads: rayon::current_num_threads(),
        }
    }

    pub fn record_iteration(&self, dps: f64) {
        self.completed.fetch_add(1, Ordering::Relaxed);
        self.stats.lock().push(dps);
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

    pub fn throughput(&self) -> f64 {
        let elapsed = self.start.elapsed().as_secs_f64();
        if elapsed > 0.0 {
            self.completed() as f64 / elapsed
        } else {
            0.0
        }
    }

    /// Running mean (Welford's algorithm)
    pub fn running_mean(&self) -> f64 {
        self.stats.lock().mean()
    }

    /// Running standard deviation (Welford's algorithm)
    pub fn running_std_dev(&self) -> f64 {
        self.stats.lock().std_dev()
    }

    pub fn current_min(&self) -> f64 {
        self.stats.lock().min()
    }

    pub fn current_max(&self) -> f64 {
        self.stats.lock().max()
    }

    pub fn num_threads(&self) -> usize {
        self.num_threads
    }

    pub fn elapsed(&self) -> std::time::Duration {
        self.start.elapsed()
    }
}
