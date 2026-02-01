//! Backoff with full jitter.
//!
//! Implements AWS-style full jitter algorithm matching centrifuge-js.

use std::time::Duration;

use rand::Rng;

#[derive(Debug, Clone)]
pub struct Backoff {
    min_delay: Duration,
    max_delay: Duration,
    attempt: u32,
}

impl Backoff {
    pub fn new(min_delay: Duration, max_delay: Duration) -> Self {
        Self {
            min_delay,
            max_delay,
            attempt: 0,
        }
    }

    pub fn next_delay(&mut self) -> Duration {
        let delay = self.calculate_delay();
        self.attempt = self.attempt.saturating_add(1);
        delay
    }

    pub fn calculate_delay(&self) -> Duration {
        backoff_with_jitter(self.attempt, self.min_delay, self.max_delay)
    }

    pub fn reset(&mut self) {
        self.attempt = 0;
    }

    pub fn attempt(&self) -> u32 {
        self.attempt
    }
}

impl Default for Backoff {
    fn default() -> Self {
        Self::new(Duration::from_millis(500), Duration::from_secs(20))
    }
}

/// AWS-style full jitter: `min(max, min + random(0, min * 2^attempt))`
pub fn backoff_with_jitter(attempt: u32, min_delay: Duration, max_delay: Duration) -> Duration {
    let base_ms = min_delay.as_millis() as u64;
    let max_ms = max_delay.as_millis() as u64;

    let exp = attempt.min(31);
    let calculated = base_ms.saturating_mul(1u64 << exp);

    let interval = if calculated > 0 {
        rand::thread_rng().gen_range(0..=calculated)
    } else {
        0
    };

    let result = base_ms.saturating_add(interval).min(max_ms);
    Duration::from_millis(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backoff_increases() {
        let mut backoff = Backoff::new(Duration::from_millis(100), Duration::from_secs(10));

        // Run many iterations to verify statistical properties
        let mut max_seen = Duration::ZERO;
        for _ in 0..1000 {
            backoff.reset();
            for _ in 0..10 {
                let delay = backoff.next_delay();
                if delay > max_seen {
                    max_seen = delay;
                }
            }
        }

        // Should have seen delays close to max
        assert!(max_seen >= Duration::from_secs(5));
    }

    #[test]
    fn test_backoff_respects_max() {
        for attempt in 0..50 {
            let delay =
                backoff_with_jitter(attempt, Duration::from_millis(100), Duration::from_secs(10));
            assert!(delay <= Duration::from_secs(10));
            // With the min + jitter formula, delay is always >= min
            assert!(delay >= Duration::from_millis(100));
        }
    }

    #[test]
    fn test_backoff_reset() {
        let mut backoff = Backoff::default();
        backoff.next_delay();
        backoff.next_delay();
        assert_eq!(backoff.attempt(), 2);

        backoff.reset();
        assert_eq!(backoff.attempt(), 0);
    }
}
