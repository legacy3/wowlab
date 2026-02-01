//! Exponential backoff for retries.

use std::time::{Duration, Instant};

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

    pub fn next_retry_at(&mut self) -> Instant {
        let retry_at = Instant::now() + self.current;
        self.retry_at = Some(retry_at);
        retry_at
    }

    pub fn time_until_retry(&self) -> Option<Duration> {
        self.retry_at
            .map(|at| at.saturating_duration_since(Instant::now()))
    }

    pub fn should_retry(&self) -> bool {
        self.retry_at
            .map(|at| Instant::now() >= at)
            .unwrap_or(false)
    }

    pub fn on_retry(&mut self) {
        self.retry_at = None;
        self.current = (self.current * 2).min(self.max);
    }

    pub fn reset(&mut self) {
        self.current = self.initial;
        self.retry_at = None;
    }

    pub fn current_backoff(&self) -> Duration {
        self.current
    }
}
