//! AI module for LLM-powered summarization.
//!
//! Provides a trait-based abstraction for AI backends with OpenRouter as the default.

mod openrouter;
mod prompts;

use async_trait::async_trait;

pub use openrouter::OpenRouterClient;

/// Error type for AI operations.
#[derive(Debug, thiserror::Error)]
pub enum AiError {
    #[error("API key not configured: {0}")]
    MissingApiKey(&'static str),
    #[error("HTTP request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("Empty response from API")]
    EmptyResponse,
    #[error("Backend not configured")]
    NotConfigured,
}

/// Trait for AI backends that can summarize text.
#[async_trait]
pub trait AiBackend: Send + Sync {
    /// Summarize a git diff/patch.
    async fn summarize_diff(&self, diff: &str) -> Result<String, AiError>;

    /// Summarize commit messages.
    async fn summarize_commits(&self, commits: &str) -> Result<String, AiError>;

    /// General-purpose completion with a custom prompt.
    async fn complete(&self, prompt: &str, max_tokens: u32) -> Result<String, AiError>;
}

/// Create the default AI client from environment variables.
///
/// Returns `None` if `OPENROUTER_API_KEY` is not set.
pub fn default_client() -> Option<Box<dyn AiBackend>> {
    OpenRouterClient::from_env().map(|c| Box::new(c) as Box<dyn AiBackend>)
}
