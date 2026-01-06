//! Batch statistics computed from a complete dataset.

use statrs::statistics::{Data, Distribution, Max, Min, OrderStatistics};

/// Statistical summary of a dataset.
/// Wraps statrs for consistent API across the codebase.
pub struct Summary {
    data: Data<Vec<f64>>,
}

impl Summary {
    /// Create summary statistics from a vector of values.
    pub fn new(values: Vec<f64>) -> Self {
        Self {
            data: Data::new(values),
        }
    }

    /// Number of samples
    pub fn count(&self) -> usize {
        self.data.len()
    }

    /// Arithmetic mean
    pub fn mean(&self) -> f64 {
        self.data.mean().unwrap_or(0.0)
    }

    /// Sample standard deviation
    pub fn std_dev(&self) -> f64 {
        self.data.std_dev().unwrap_or(0.0)
    }

    /// Sample variance
    pub fn variance(&self) -> f64 {
        self.data.variance().unwrap_or(0.0)
    }

    /// Minimum value
    pub fn min(&self) -> f64 {
        self.data.min()
    }

    /// Maximum value
    pub fn max(&self) -> f64 {
        self.data.max()
    }

    /// Median (50th percentile)
    pub fn median(&mut self) -> f64 {
        self.data.median()
    }

    /// Percentile (0-100)
    pub fn percentile(&mut self, p: usize) -> f64 {
        self.data.percentile(p)
    }

    /// Coefficient of variation (std_dev / mean)
    pub fn cv(&self) -> f64 {
        let mean = self.mean();
        if mean > 0.0 {
            self.std_dev() / mean
        } else {
            0.0
        }
    }
}
