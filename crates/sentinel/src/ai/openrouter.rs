use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tiktoken_rs::o200k_base;

use super::{prompts, AiBackend, AiError};
use crate::utils::meta;

const OPENROUTER_API_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

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

pub struct OpenRouterClient {
    client: Client,
    api_key: String,
    model: String,
    max_input_tokens: usize,
    diff_output_tokens: u32,
    commit_output_tokens: u32,
}

impl OpenRouterClient {
    pub fn new(
        api_key: impl Into<String>,
        model: impl Into<String>,
        max_input_tokens: usize,
        diff_output_tokens: u32,
        commit_output_tokens: u32,
    ) -> Self {
        Self {
            client: Client::builder()
                .use_rustls_tls()
                .build()
                .expect("Failed to build HTTP client"),
            api_key: api_key.into(),
            model: model.into(),
            max_input_tokens,
            diff_output_tokens,
            commit_output_tokens,
        }
    }

    fn truncate_to_tokens(&self, text: &str) -> String {
        let Ok(bpe) = o200k_base() else {
            // Fallback to char-based truncation if tokenizer fails
            return text.chars().take(self.max_input_tokens * 4).collect();
        };

        let tokens = bpe.encode_with_special_tokens(text);
        if tokens.len() <= self.max_input_tokens {
            return text.to_string();
        }

        // Truncate tokens and decode back to string
        let truncated_tokens: Vec<_> = tokens.into_iter().take(self.max_input_tokens).collect();
        let truncated = bpe
            .decode(truncated_tokens)
            .unwrap_or_else(|_| text.to_string());
        format!("{}...\n[truncated]", truncated)
    }

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
            .header("HTTP-Referer", meta::WEBSITE)
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

        let truncated = self.truncate_to_tokens(diff);
        let prompt = prompts::summarize_diff(&truncated);
        self.send_request(&prompt, self.diff_output_tokens).await
    }

    async fn summarize_commits(&self, commits: &str) -> Result<String, AiError> {
        if commits.trim().is_empty() {
            return Ok("No commits to summarize.".to_string());
        }

        let truncated = self.truncate_to_tokens(commits);
        let prompt = prompts::summarize_commits(&truncated);
        self.send_request(&prompt, self.commit_output_tokens).await
    }

    async fn complete(&self, prompt: &str, max_tokens: u32) -> Result<String, AiError> {
        let truncated = self.truncate_to_tokens(prompt);
        self.send_request(&truncated, max_tokens).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_client() -> OpenRouterClient {
        OpenRouterClient::new("fake-key", "fake-model", 4000, 500, 300)
    }

    #[tokio::test]
    async fn test_empty_diff() {
        let client = test_client();
        let result = client.summarize_diff("").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No changes to summarize.");
    }

    #[tokio::test]
    async fn test_empty_commits() {
        let client = test_client();
        let result = client.summarize_commits("").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No commits to summarize.");
    }

    #[tokio::test]
    async fn test_whitespace_only_diff() {
        let client = test_client();
        let result = client.summarize_diff("   \n\t  ").await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "No changes to summarize.");
    }

    #[test]
    fn test_truncation() {
        let client = OpenRouterClient::new("fake-key", "fake-model", 10, 500, 300);
        let long_text =
            "This is a very long text that should be truncated to fit within the token limit";
        let truncated = client.truncate_to_tokens(long_text);
        assert!(truncated.ends_with("...\n[truncated]"));
    }
}
