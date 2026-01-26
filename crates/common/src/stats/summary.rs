//! Statistics: streaming (Welford) and batch algorithms.
//!
//! - `Streaming`: O(1) memory, online mean/variance via Welford's algorithm
//! - `Batch`: Full dataset statistics including percentiles

/// Streaming statistics using Welford's online algorithm.
///
/// Computes mean and variance incrementally with O(1) memory.
#[derive(Clone, Debug, Default)]
pub struct Streaming {
    n: u64,
    mean: f64,
    m2: f64,
    min: f64,
    max: f64,
}

impl Streaming {
    pub fn new() -> Self {
        Self {
            n: 0,
            mean: 0.0,
            m2: 0.0,
            min: f64::INFINITY,
            max: f64::NEG_INFINITY,
        }
    }

    /// Add a value to the running statistics.
    #[inline]
    pub fn push(&mut self, x: f64) {
        self.n += 1;
        let delta = x - self.mean;
        self.mean += delta / self.n as f64;
        let delta2 = x - self.mean;
        self.m2 += delta * delta2;
        self.min = self.min.min(x);
        self.max = self.max.max(x);
    }

    /// Add multiple values.
    pub fn extend(&mut self, values: impl IntoIterator<Item = f64>) {
        for x in values {
            self.push(x);
        }
    }

    /// Merge another Streaming into this one (parallel-friendly).
    pub fn merge(&mut self, other: &Streaming) {
        if other.n == 0 {
            return;
        }
        if self.n == 0 {
            *self = other.clone();
            return;
        }

        let n = self.n + other.n;
        let delta = other.mean - self.mean;
        let mean = self.mean + delta * other.n as f64 / n as f64;
        let m2 = self.m2
            + other.m2
            + delta * delta * (self.n as f64 * other.n as f64 / n as f64);

        self.n = n;
        self.mean = mean;
        self.m2 = m2;
        self.min = self.min.min(other.min);
        self.max = self.max.max(other.max);
    }

    #[inline]
    pub fn count(&self) -> u64 {
        self.n
    }

    #[inline]
    pub fn mean(&self) -> f64 {
        if self.n == 0 {
            f64::NAN
        } else {
            self.mean
        }
    }

    /// Sample variance (Bessel's correction: n-1 denominator).
    #[inline]
    pub fn variance(&self) -> f64 {
        if self.n < 2 {
            f64::NAN
        } else {
            self.m2 / (self.n - 1) as f64
        }
    }

    /// Population variance (n denominator).
    #[inline]
    pub fn variance_pop(&self) -> f64 {
        if self.n == 0 {
            f64::NAN
        } else {
            self.m2 / self.n as f64
        }
    }

    #[inline]
    pub fn std_dev(&self) -> f64 {
        self.variance().sqrt()
    }

    #[inline]
    pub fn std_dev_pop(&self) -> f64 {
        self.variance_pop().sqrt()
    }

    #[inline]
    pub fn min(&self) -> f64 {
        if self.n == 0 {
            f64::NAN
        } else {
            self.min
        }
    }

    #[inline]
    pub fn max(&self) -> f64 {
        if self.n == 0 {
            f64::NAN
        } else {
            self.max
        }
    }

    /// Coefficient of variation (std_dev / mean).
    #[inline]
    pub fn cv(&self) -> f64 {
        let mean = self.mean();
        if mean.abs() < f64::EPSILON {
            f64::NAN
        } else {
            self.std_dev() / mean
        }
    }
}

impl FromIterator<f64> for Streaming {
    fn from_iter<I: IntoIterator<Item = f64>>(iter: I) -> Self {
        let mut s = Streaming::new();
        s.extend(iter);
        s
    }
}

/// Batch statistics for a complete dataset.
///
/// Supports percentiles, median, IQR (requires sorted data).
pub struct Batch {
    data: Vec<f64>,
    sorted: bool,
    streaming: Streaming,
}

impl Batch {
    pub fn new(values: Vec<f64>) -> Self {
        let streaming: Streaming = values.iter().copied().collect();
        Self {
            data: values,
            sorted: false,
            streaming,
        }
    }

    fn ensure_sorted(&mut self) {
        if !self.sorted {
            self.data.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            self.sorted = true;
        }
    }

    #[inline]
    pub fn count(&self) -> usize {
        self.data.len()
    }

    #[inline]
    pub fn mean(&self) -> f64 {
        self.streaming.mean()
    }

    #[inline]
    pub fn variance(&self) -> f64 {
        self.streaming.variance()
    }

    #[inline]
    pub fn std_dev(&self) -> f64 {
        self.streaming.std_dev()
    }

    #[inline]
    pub fn min(&self) -> f64 {
        self.streaming.min()
    }

    #[inline]
    pub fn max(&self) -> f64 {
        self.streaming.max()
    }

    #[inline]
    pub fn cv(&self) -> f64 {
        self.streaming.cv()
    }

    /// Median (50th percentile).
    pub fn median(&mut self) -> f64 {
        self.percentile(50)
    }

    /// Percentile using linear interpolation (0-100).
    pub fn percentile(&mut self, p: usize) -> f64 {
        if self.data.is_empty() {
            return f64::NAN;
        }
        self.ensure_sorted();

        let p = p.min(100) as f64 / 100.0;
        let idx = p * (self.data.len() - 1) as f64;
        let lo = idx.floor() as usize;
        let hi = idx.ceil() as usize;

        if lo == hi {
            self.data[lo]
        } else {
            let frac = idx - lo as f64;
            self.data[lo] * (1.0 - frac) + self.data[hi] * frac
        }
    }

    /// Interquartile range (Q3 - Q1).
    pub fn iqr(&mut self) -> f64 {
        self.percentile(75) - self.percentile(25)
    }
}

// Keep Summary as alias for backwards compatibility during migration
pub type Summary = Batch;

/// Linear regression result.
#[derive(Clone, Debug)]
pub struct LinearRegression {
    pub slope: f64,
    pub intercept: f64,
    pub r_squared: f64,
}

/// Compute sample covariance between two slices.
pub fn covariance(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.len() < 2 {
        return f64::NAN;
    }

    let n = x.len() as f64;
    let x_mean: f64 = x.iter().sum::<f64>() / n;
    let y_mean: f64 = y.iter().sum::<f64>() / n;

    let cov: f64 = x
        .iter()
        .zip(y.iter())
        .map(|(xi, yi)| (xi - x_mean) * (yi - y_mean))
        .sum();

    cov / (n - 1.0)
}

/// Compute Pearson correlation coefficient.
pub fn correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.len() < 2 {
        return f64::NAN;
    }

    let x_stats: Streaming = x.iter().copied().collect();
    let y_stats: Streaming = y.iter().copied().collect();

    let x_std = x_stats.std_dev();
    let y_std = y_stats.std_dev();

    if x_std.abs() < f64::EPSILON || y_std.abs() < f64::EPSILON {
        return f64::NAN;
    }

    covariance(x, y) / (x_std * y_std)
}

/// Compute simple linear regression using least squares.
pub fn linear_regression(x: &[f64], y: &[f64]) -> Option<LinearRegression> {
    if x.len() < 2 || x.len() != y.len() {
        return None;
    }

    let x_stats: Streaming = x.iter().copied().collect();
    let y_stats: Streaming = y.iter().copied().collect();

    let x_var = x_stats.variance();
    if x_var.abs() < f64::EPSILON {
        return None;
    }

    let cov = covariance(x, y);
    let slope = cov / x_var;
    let intercept = y_stats.mean() - slope * x_stats.mean();

    // R-squared
    let y_mean = y_stats.mean();
    let ss_tot: f64 = y.iter().map(|yi| (yi - y_mean).powi(2)).sum();
    let ss_res: f64 = x
        .iter()
        .zip(y.iter())
        .map(|(xi, yi)| {
            let predicted = slope * xi + intercept;
            (yi - predicted).powi(2)
        })
        .sum();

    let r_squared = if ss_tot.abs() < f64::EPSILON {
        1.0
    } else {
        1.0 - ss_res / ss_tot
    };

    Some(LinearRegression {
        slope,
        intercept,
        r_squared,
    })
}

/// Exponential moving average with smoothing factor alpha (0-1).
pub fn ema(data: &[f64], alpha: f64) -> Vec<f64> {
    if data.is_empty() {
        return Vec::new();
    }

    let alpha = alpha.clamp(0.0, 1.0);
    let mut result = Vec::with_capacity(data.len());
    let mut prev = data[0];
    result.push(prev);

    for &x in &data[1..] {
        prev = alpha * x + (1.0 - alpha) * prev;
        result.push(prev);
    }

    result
}

/// EMA with span-based smoothing: alpha = 2 / (span + 1).
pub fn ema_span(data: &[f64], span: usize) -> Vec<f64> {
    if span == 0 {
        return data.to_vec();
    }
    ema(data, 2.0 / (span as f64 + 1.0))
}

/// Simple moving average with window size.
pub fn sma(data: &[f64], window: usize) -> Vec<f64> {
    if data.is_empty() || window == 0 {
        return Vec::new();
    }

    let mut result = Vec::with_capacity(data.len());
    let mut sum = 0.0;

    for (i, &x) in data.iter().enumerate() {
        sum += x;
        if i >= window {
            sum -= data[i - window];
            result.push(sum / window as f64);
        } else {
            result.push(sum / (i + 1) as f64);
        }
    }

    result
}
