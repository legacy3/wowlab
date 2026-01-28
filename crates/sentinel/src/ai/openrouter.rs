//! OpenRouter API client implementation.

use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use super::{prompts, AiBackend, AiError};

const OPENROUTER_API_URL: &str = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL: &str = "anthropic/claude-haiku-4.5";

/// OpenRouter API request body.
#[derive(Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: Vec<ChatMessage<'a>>,
    max_tokens: u32,
}

#[derive(Serialize)]
struct ChatMessage<'a> {
    role: &'static str,
    content: &'a str,
}

/// OpenRouter API response.
#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Deserialize)]
struct ChatMessageResponse {
    content: String,
}

/// OpenRouter API client.
pub struct OpenRouterClient {
    client: Client,
    api_key: String,
    model: String,
}

impl OpenRouterClient {
    /// Create a new client with explicit configuration.
    pub fn new(api_key: impl Into<String>, model: impl Into<String>) -> Self {
        Self {
            client: Client::builder()
                .use_rustls_tls()
                .build()
                .expect("Failed to build HTTP client"),
            api_key: api_key.into(),
            model: model.into(),
        }
    }

    /// Create a client from environment variables.
    ///
    /// Returns `None` if `OPENROUTER_API_KEY` is not set.
    pub fn from_env() -> Option<Self> {
        let api_key = std::env::var("OPENROUTER_API_KEY").ok()?;
        let model = std::env::var("OPENROUTER_MODEL").unwrap_or_else(|_| DEFAULT_MODEL.to_string());
        Some(Self::new(api_key, model))
    }

    /// Send a chat completion request.
    async fn send_request(&self, prompt: &str, max_tokens: u32) -> Result<String, AiError> {
        let request = ChatRequest {
            model: &self.model,
            messages: vec![ChatMessage {
                role: "user",
                content: prompt,
            }],
            max_tokens,
        };

        let response = self
            .client
            .post(OPENROUTER_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("HTTP-Referer", "https://wowlab.gg")
            .header("X-Title", "WowLab Sentinel")
            .json(&request)
            .send()
            .await?
            .error_for_status()?
            .json::<ChatResponse>()
            .await?;

        response
            .choices
            .into_iter()
            .next()
            .map(|c| c.message.content.trim().to_string())
            .ok_or(AiError::EmptyResponse)
    }
}

#[async_trait]
impl AiBackend for OpenRouterClient {
    async fn summarize_diff(&self, diff: &str) -> Result<String, AiError> {
        if diff.trim().is_empty() {
            return Ok("No changes to summarize.".to_string());
        }

        let prompt = prompts::summarize_diff(diff);
        self.send_request(&prompt, 200).await
    }

    async fn summarize_commits(&self, commits: &str) -> Result<String, AiError> {
        if commits.trim().is_empty() {
            return Ok("No commits to summarize.".to_string());
        }

        let prompt = prompts::summarize_commits(commits);
        self.send_request(&prompt, 150).await
    }

    async fn complete(&self, prompt: &str, max_tokens: u32) -> Result<String, AiError> {
        self.send_request(prompt, max_tokens).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_empty_diff() {
        let client = OpenRouterClient::new("fake-key", "fake-model");
        let result = client.summarize_diff("").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No changes to summarize.");
    }

    #[tokio::test]
    async fn test_empty_commits() {
        let client = OpenRouterClient::new("fake-key", "fake-model");
        let result = client.summarize_commits("").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No commits to summarize.");
    }

    #[tokio::test]
    async fn test_whitespace_only_diff() {
        let client = OpenRouterClient::new("fake-key", "fake-model");
        let result = client.summarize_diff("   \n\t  ").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No changes to summarize.");
    }

    #[test]
    fn test_default_model() {
        assert_eq!(DEFAULT_MODEL, "anthropic/claude-haiku-4.5");
    }
}
