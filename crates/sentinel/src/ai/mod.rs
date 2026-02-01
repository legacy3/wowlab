mod openrouter;
mod prompts;

use async_trait::async_trait;

use crate::config::Config;
pub use openrouter::OpenRouterClient;

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

#[async_trait]
pub trait AiBackend: Send + Sync {
    async fn summarize_diff(&self, diff: &str) -> Result<String, AiError>;
    async fn summarize_commits(&self, commits: &str) -> Result<String, AiError>;
    async fn complete(&self, prompt: &str, max_tokens: u32) -> Result<String, AiError>;
}

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
