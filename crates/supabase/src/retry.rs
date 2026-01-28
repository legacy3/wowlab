//! Retry logic with exponential backoff using the backoff crate

use crate::SupabaseError;
use backoff::backoff::Backoff;
use backoff::ExponentialBackoff;
use std::future::Future;
use std::time::Duration;
use tokio::time::sleep;

/// Retry configuration
#[derive(Clone)]
pub struct RetryConfig {
    /// Maximum number of retry attempts
    pub max_attempts: u32,
    /// Initial delay in milliseconds
    pub initial_delay_ms: u64,
    /// Maximum delay in milliseconds
    pub max_delay_ms: u64,
    /// Backoff multiplication factor
    pub backoff_factor: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay_ms: 100,
            max_delay_ms: 5000,
            backoff_factor: 2.0,
        }
    }
}

impl RetryConfig {
    /// Create a backoff strategy from this config
    fn to_backoff(&self) -> ExponentialBackoff {
        ExponentialBackoff {
            current_interval: Duration::from_millis(self.initial_delay_ms),
            initial_interval: Duration::from_millis(self.initial_delay_ms),
            max_interval: Duration::from_millis(self.max_delay_ms),
            multiplier: self.backoff_factor,
            max_elapsed_time: None, // We handle max attempts separately
            ..ExponentialBackoff::default()
        }
    }
}

/// Check if an error is retryable
fn is_retryable(err: &SupabaseError) -> bool {
    match err {
        SupabaseError::Http(_) => true,
        SupabaseError::RateLimited { .. } => true,
        SupabaseError::Server { status, .. } => *status >= 500,
        _ => false,
    }
}

/// Retry a fallible async operation with exponential backoff
pub async fn with_retry<T, F, Fut>(
    config: &RetryConfig,
    mut operation: F,
) -> Result<T, SupabaseError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, SupabaseError>>,
{
    let mut backoff = config.to_backoff();
    let mut attempts = 0;

    loop {
        attempts += 1;
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                if !is_retryable(&e) || attempts >= config.max_attempts {
                    return Err(e);
                }

                // Get next delay from backoff, or use rate limit delay
                let delay = if let SupabaseError::RateLimited { retry_after_ms } = &e {
                    Duration::from_millis(*retry_after_ms)
                } else {
                    backoff
                        .next_backoff()
                        .unwrap_or(Duration::from_millis(config.max_delay_ms))
                };

                tracing::warn!(
                    "Request failed (attempt {}/{}), retrying in {:?}: {}",
                    attempts,
                    config.max_attempts,
                    delay,
                    e
                );

                sleep(delay).await;
            }
        }
    }
}
