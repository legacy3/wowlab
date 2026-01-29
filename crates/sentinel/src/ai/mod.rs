//! AI module for LLM-powered summarization.
//!
//! Provides a trait-based abstraction for AI backends with OpenRouter as the default.

mod openrouter;
mod prompts;

use async_trait::async_trait;

use crate::config::Config;
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

/// Create an AI client from configuration.
///
/// Returns `None` if AI is not enabled or API key is not set.
pub fn client_from_config(config: &Config) -> Option<Box<dyn AiBackend>> {
    if !config.ai_enabled {
        return None;
    }
    let api_key = config.ai_api_key.as_ref()?;
    Some(Box::new(OpenRouterClient::new(
        api_key.clone(),
        config.ai_model.clone(),
        config.ai_max_input_tokens,
        config.ai_diff_output_tokens,
        config.ai_commit_output_tokens,
    )))
}
