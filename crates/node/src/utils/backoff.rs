//! Exponential backoff for retry logic.

use std::time::{Duration, Instant};

/// Exponential backoff with configurable initial and maximum delays.
#[derive(Debug, Clone)]
pub struct ExponentialBackoff {
    initial: Duration,
    max: Duration,
    current: Duration,
    retry_at: Option<Instant>,
}

impl ExponentialBackoff {
    pub fn new(initial: Duration, max: Duration) -> Self {
        Self {
            initial,
            max,
            current: initial,
            retry_at: None,
        }
    }

    /// Schedule next retry and return when it should occur.
    pub fn next_retry_at(&mut self) -> Instant {
        let retry_at = Instant::now() + self.current;
        self.retry_at = Some(retry_at);
        retry_at
    }

    /// Time remaining until retry (for UI display).
    pub fn time_until_retry(&self) -> Option<Duration> {
        self.retry_at
            .map(|at| at.saturating_duration_since(Instant::now()))
    }

    /// Returns true if scheduled retry time has passed.
    pub fn should_retry(&self) -> bool {
        self.retry_at
            .map(|at| Instant::now() >= at)
            .unwrap_or(false)
    }

    /// Call when retrying - clears schedule and increases backoff.
    pub fn on_retry(&mut self) {
        self.retry_at = None;
        self.current = (self.current * 2).min(self.max);
    }

    /// Reset backoff to initial values after success.
    pub fn reset(&mut self) {
        self.current = self.initial;
        self.retry_at = None;
    }

    /// Current backoff duration.
    pub fn current_backoff(&self) -> Duration {
        self.current
    }
}
