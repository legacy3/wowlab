//! Core Supabase PostgREST client

use crate::SupabaseError;
use reqwest::Client;
use std::time::Duration;

/// Supabase PostgREST client
pub struct SupabaseClient {
    http: Client,
    base_url: String,
    anon_key: String,
}

impl SupabaseClient {
    /// Create a new client with the given project URL and anon key
    pub fn new(project_url: &str, anon_key: &str) -> Result<Self, SupabaseError> {
        let http = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| SupabaseError::ClientBuild(e.to_string()))?;

        Ok(Self {
            http,
            base_url: format!("{}/rest/v1", project_url.trim_end_matches('/')),
            anon_key: anon_key.to_string(),
        })
    }

    /// Create a client from environment variables
    ///
    /// Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` to be set
    pub fn from_env() -> Result<Self, SupabaseError> {
        Self::new(
            &std::env::var("SUPABASE_URL")?,
            &std::env::var("SUPABASE_ANON_KEY")?,
        )
    }

    /// GET request to PostgREST with error handling
    pub async fn get(&self, path: &str) -> Result<reqwest::Response, SupabaseError> {
        let url = format!("{}/{}", self.base_url, path);
        tracing::debug!("GET {}", url);

        let response = self
            .http
            .get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", self.anon_key))
            .send()
            .await?;

        let status = response.status();

        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(1000);
            return Err(SupabaseError::RateLimited {
                retry_after_ms: retry_after,
            });
        }

        if status.is_server_error() {
            let message = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Server {
                status: status.as_u16(),
                message,
            });
        }

        Ok(response)
    }
}
