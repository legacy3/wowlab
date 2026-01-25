//! Centrifugo HTTP API for server-side operations.

use std::time::Duration;

use serde::Serialize;
use serde_json::json;
use uuid::Uuid;

use crate::error::Error;

/// Centrifugo HTTP API client for server-side operations.
#[derive(Clone)]
pub struct CentrifugoApi {
    client: reqwest::Client,
    url: String,
    api_key: String,
}

impl CentrifugoApi {
    /// Create a new API client.
    pub fn new(url: impl Into<String>, api_key: impl Into<String>) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .connect_timeout(Duration::from_secs(10))
                .build()
                .expect("Failed to build HTTP client"),
            url: url.into().trim_end_matches('/').to_string(),
            api_key: api_key.into(),
        }
    }

    /// Create from environment variables.
    /// Reads CENTRIFUGO_API_URL and CENTRIFUGO_HTTP_API_KEY.
    pub fn from_env() -> Option<Self> {
        let url = std::env::var("CENTRIFUGO_API_URL").ok()?;
        let api_key = std::env::var("CENTRIFUGO_HTTP_API_KEY").ok()?;
        Some(Self::new(url, api_key))
    }

    /// Publish data to a channel.
    pub async fn publish<T: Serialize>(&self, channel: &str, data: &T) -> Result<(), Error> {
        let resp = self
            .client
            .post(format!("{}/api/publish", self.url))
            .header("X-API-Key", &self.api_key)
            .json(&json!({
                "channel": channel,
                "data": data
            }))
            .send()
            .await?;

        self.check_response(resp).await
    }

    /// Broadcast data to multiple channels.
    pub async fn broadcast<T: Serialize>(&self, channels: &[String], data: &T) -> Result<(), Error> {
        let resp = self
            .client
            .post(format!("{}/api/broadcast", self.url))
            .header("X-API-Key", &self.api_key)
            .json(&json!({
                "channels": channels,
                "data": data
            }))
            .send()
            .await?;

        self.check_response(resp).await
    }

    /// Get presence information for a channel.
    /// Returns a list of user IDs (parsed as UUIDs) currently present.
    pub async fn presence(&self, channel: &str) -> Result<Vec<Uuid>, Error> {
        let resp = self
            .client
            .post(format!("{}/api/presence", self.url))
            .header("X-API-Key", &self.api_key)
            .json(&json!({ "channel": channel }))
            .send()
            .await?;

        let body = self.check_status_and_parse(resp).await?;
        Self::check_api_error(&body)?;

        // Extract user IDs from presence
        let ids = body
            .get("result")
            .and_then(|r| r.get("presence"))
            .and_then(|p| p.as_object())
            .map(|obj| {
                obj.values()
                    .filter_map(|v| v.get("user").and_then(|u| u.as_str()))
                    .filter_map(|s| s.parse::<Uuid>().ok())
                    .collect()
            })
            .unwrap_or_default();

        Ok(ids)
    }

    /// Get presence stats for a channel.
    pub async fn presence_stats(&self, channel: &str) -> Result<(u32, u32), Error> {
        let resp = self
            .client
            .post(format!("{}/api/presence_stats", self.url))
            .header("X-API-Key", &self.api_key)
            .json(&json!({ "channel": channel }))
            .send()
            .await?;

        let body = self.check_status_and_parse(resp).await?;
        Self::check_api_error(&body)?;

        let result = body.get("result").unwrap_or(&body);
        let num_clients = result
            .get("num_clients")
            .and_then(|n| n.as_u64())
            .unwrap_or(0) as u32;
        let num_users = result
            .get("num_users")
            .and_then(|n| n.as_u64())
            .unwrap_or(0) as u32;

        Ok((num_clients, num_users))
    }

    /// Check HTTP status and parse JSON body.
    async fn check_status_and_parse(
        &self,
        resp: reqwest::Response,
    ) -> Result<serde_json::Value, Error> {
        let status = resp.status();
        if !status.is_success() {
            let message = resp.text().await.unwrap_or_default();
            return Err(Error::HttpStatus {
                status: status.as_u16(),
                message,
            });
        }
        Ok(resp.json().await?)
    }

    /// Check for API-level errors in response body.
    fn check_api_error(body: &serde_json::Value) -> Result<(), Error> {
        if let Some(error) = body.get("error") {
            let code = error.get("code").and_then(|c| c.as_u64()).unwrap_or(0) as u32;
            let message = error
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("unknown")
                .to_string();
            return Err(Error::Server { code, message });
        }
        Ok(())
    }

    async fn check_response(&self, resp: reqwest::Response) -> Result<(), Error> {
        let body = self.check_status_and_parse(resp).await?;
        Self::check_api_error(&body)
    }
}
