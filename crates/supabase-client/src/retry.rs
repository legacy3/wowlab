//! Retry logic with exponential backoff

use crate::SupabaseError;
use std::future::Future;
use std::time::Duration;
use tokio::time::sleep;

/// Retry configuration
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
pub async fn with_retry<T, F, Fut>(config: &RetryConfig, mut operation: F) -> Result<T, SupabaseError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, SupabaseError>>,
{
    let mut attempts = 0;
    let mut delay_ms = config.initial_delay_ms;

    loop {
        attempts += 1;
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                if !is_retryable(&e) || attempts >= config.max_attempts {
                    return Err(e);
                }

                if let SupabaseError::RateLimited { retry_after_ms } = &e {
                    delay_ms = *retry_after_ms;
                }

                tracing::warn!(
                    "Request failed (attempt {}/{}), retrying in {}ms: {}",
                    attempts,
                    config.max_attempts,
                    delay_ms,
                    e
                );

                sleep(Duration::from_millis(delay_ms)).await;

                delay_ms = ((delay_ms as f64) * config.backoff_factor) as u64;
                delay_ms = delay_ms.min(config.max_delay_ms);
            }
        }
    }
}
