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
    /// Create a new client with the given project URL and API key (anon or service role).
    pub fn new(project_url: &str, api_key: &str) -> Result<Self, SupabaseError> {
        let http = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| SupabaseError::ClientBuild(e.to_string()))?;

        Ok(Self {
            http,
            base_url: format!("{}/rest/v1", project_url.trim_end_matches('/')),
            anon_key: api_key.to_string(),
        })
    }

    /// Create a client from environment variables using the anon key.
    ///
    /// Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` to be set.
    pub fn from_env() -> Result<Self, SupabaseError> {
        Self::new(
            &std::env::var("SUPABASE_URL")?,
            &std::env::var("SUPABASE_ANON_KEY")?,
        )
    }

    /// Create a client from environment variables using the service role key.
    ///
    /// Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be set.
    pub fn from_env_service_role() -> Result<Self, SupabaseError> {
        Self::new(
            &std::env::var("SUPABASE_URL")?,
            &std::env::var("SUPABASE_SERVICE_ROLE_KEY")?,
        )
    }

    /// GET request to PostgREST with error handling.
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

        Self::check_response(response).await
    }

    /// PATCH request to PostgREST with query filter and JSON body.
    pub async fn patch<T: serde::Serialize>(
        &self,
        path: &str,
        body: &T,
    ) -> Result<reqwest::Response, SupabaseError> {
        let url = format!("{}/{}", self.base_url, path);
        tracing::debug!("PATCH {}", url);

        let response = self
            .http
            .patch(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", self.anon_key))
            .header("Content-Type", "application/json")
            .json(body)
            .send()
            .await?;

        Self::check_response(response).await
    }

    async fn check_response(
        response: reqwest::Response,
    ) -> Result<reqwest::Response, SupabaseError> {
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

        if !status.is_success() {
            let message = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Server {
                status: status.as_u16(),
                message,
            });
        }

        Ok(response)
    }
}
