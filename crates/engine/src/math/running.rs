//! Online (streaming) statistics using Welford's algorithm.

/// Running statistics accumulator using Welford's algorithm.
///
/// Use when you need to compute statistics incrementally without storing all values.
/// Numerically stable for large datasets.
///
/// Reference: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm
#[derive(Clone, Debug)]
pub struct RunningStats {
    count: u64,
    mean: f64,
    m2: f64,
    min: f64,
    max: f64,
}

impl Default for RunningStats {
    fn default() -> Self {
        Self::new()
    }
}

impl RunningStats {
    /// Create a new running statistics accumulator.
    pub fn new() -> Self {
        Self {
            count: 0,
            mean: 0.0,
            m2: 0.0,
            min: f64::INFINITY,
            max: f64::NEG_INFINITY,
        }
    }

    /// Add a value to the running statistics.
    pub fn push(&mut self, value: f64) {
        self.count += 1;
        let delta = value - self.mean;
        self.mean += delta / self.count as f64;
        let delta2 = value - self.mean;
        self.m2 += delta * delta2;
        self.min = self.min.min(value);
        self.max = self.max.max(value);
    }

    /// Number of samples seen
    pub fn count(&self) -> u64 {
        self.count
    }

    /// Running mean
    pub fn mean(&self) -> f64 {
        self.mean
    }

    /// Running sample variance
    pub fn variance(&self) -> f64 {
        if self.count < 2 {
            0.0
        } else {
            self.m2 / (self.count - 1) as f64
        }
    }

    /// Running sample standard deviation
    pub fn std_dev(&self) -> f64 {
        self.variance().sqrt()
    }

    /// Minimum value seen
    pub fn min(&self) -> f64 {
        self.min
    }

    /// Maximum value seen
    pub fn max(&self) -> f64 {
        self.max
    }

    /// Coefficient of variation (std_dev / mean)
    pub fn cv(&self) -> f64 {
        if self.mean > 0.0 {
            self.std_dev() / self.mean
        } else {
            0.0
        }
    }

    /// Merge another RunningStats into this one (parallel reduction).
    /// Uses Chan's parallel algorithm.
    pub fn merge(&mut self, other: &RunningStats) {
        if other.count == 0 {
            return;
        }
        if self.count == 0 {
            *self = other.clone();
            return;
        }

        let combined_count = self.count + other.count;
        let delta = other.mean - self.mean;
        let combined_mean = self.mean + delta * other.count as f64 / combined_count as f64;

        // Chan's parallel algorithm for M2
        let combined_m2 = self.m2
            + other.m2
            + delta * delta * self.count as f64 * other.count as f64 / combined_count as f64;

        self.count = combined_count;
        self.mean = combined_mean;
        self.m2 = combined_m2;
        self.min = self.min.min(other.min);
        self.max = self.max.max(other.max);
    }
}
