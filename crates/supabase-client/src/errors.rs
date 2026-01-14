//! Error types for the Supabase client

use thiserror::Error;

/// Errors that can occur when interacting with Supabase
#[derive(Debug, Error)]
pub enum SupabaseError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Not found: {resource} with {key}={value}")]
    NotFound {
        resource: String,
        key: String,
        value: String,
    },

    #[error("Parse error: {0}")]
    Parse(#[from] serde_json::Error),

    #[error("Rate limited, retry after {retry_after_ms}ms")]
    RateLimited { retry_after_ms: u64 },

    #[error("Server error ({status}): {message}")]
    Server { status: u16, message: String },

    #[error("Environment variable '{name}' not set")]
    EnvVar { name: String },

    #[error("IO error: {message}")]
    Io { message: String },
}

impl From<std::env::VarError> for SupabaseError {
    fn from(_: std::env::VarError) -> Self {
        Self::EnvVar {
            name: "SUPABASE_URL or SUPABASE_ANON_KEY".to_string(),
        }
    }
}
