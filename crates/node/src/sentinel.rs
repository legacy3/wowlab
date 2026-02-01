//! Signed HTTP client for sentinel operations.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

/// Auth headers for signed requests.
pub struct SignedHeaders {
    pub key: String,
    pub signature: String,
    pub timestamp: String,
}

/// Trait for request signing.
pub trait RequestSigner: Send + Sync {
    fn sign_request(&self, method: &str, host: &str, path: &str, body: &[u8]) -> SignedHeaders;
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResponse {
    pub id: Uuid,
    #[serde(default)]
    pub beacon_token: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum SentinelError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
    #[error("Failed to build HTTP client: {0}")]
    ClientBuild(String),
}

/// Client for signed requests to the sentinel.
#[derive(Clone)]
pub struct SentinelClient {
    http: reqwest::Client,
    sentinel_url: String,
    sentinel_host: String,
    signer: Arc<dyn RequestSigner>,
}

impl SentinelClient {
    pub fn new(
        sentinel_url: String,
        signer: Arc<dyn RequestSigner>,
    ) -> Result<Self, SentinelError> {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .map_err(|e| SentinelError::ClientBuild(e.to_string()))?;

        let sentinel_host = reqwest::Url::parse(&sentinel_url)
            .ok()
            .and_then(|u| u.host_str().map(|h| h.to_string()))
            .unwrap_or_default();

        Ok(Self {
            http,
            sentinel_url,
            sentinel_host,
            signer,
        })
    }

    async fn signed_post(
        &self,
        path: &str,
        body: &[u8],
    ) -> Result<reqwest::Response, SentinelError> {
        let url = format!("{}{}", self.sentinel_url, path);
        let headers = self.signer.sign_request("POST", &self.sentinel_host, path, body);

        let response = self
            .http
            .post(&url)
            .header("Content-Type", "application/json")
            .header("X-Node-Key", &headers.key)
            .header("X-Node-Sig", &headers.signature)
            .header("X-Node-Ts", &headers.timestamp)
            .body(body.to_vec())
            .send()
            .await?;

        Ok(response)
    }

    pub async fn register_node(
        &self,
        hostname: &str,
        total_cores: i32,
        enabled_cores: i32,
        platform: &str,
        version: &str,
        claim_token: Option<&str>,
    ) -> Result<RegisterResponse, SentinelError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            hostname: &'a str,
            total_cores: i32,
            enabled_cores: i32,
            platform: &'a str,
            version: &'a str,
            #[serde(skip_serializing_if = "Option::is_none")]
            claim_token: Option<&'a str>,
        }

        let body = serde_json::to_vec(&Request {
            hostname,
            total_cores,
            enabled_cores,
            platform,
            version,
            claim_token,
        })
        .unwrap();

        let response = self.signed_post("/nodes/register", &body).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        Ok(response.json().await?)
    }

    /// Verify node is registered and claimed via token refresh.
    pub async fn verify(&self) -> Result<String, SentinelError> {
        let response = self.signed_post("/nodes/token", &[]).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        #[derive(serde::Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct TokenResponse {
            beacon_token: String,
        }

        let resp: TokenResponse = response.json().await?;
        Ok(resp.beacon_token)
    }

    pub async fn refresh_token(&self) -> Result<String, SentinelError> {
        let response = self.signed_post("/nodes/token", &[]).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct TokenResponse {
            beacon_token: String,
        }

        let resp: TokenResponse = response.json().await?;
        Ok(resp.beacon_token)
    }

    pub async fn unlink(&self) -> Result<(), SentinelError> {
        let response = self.signed_post("/nodes/unlink", &[]).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        Ok(())
    }

    pub async fn complete_chunk(
        &self,
        chunk_id: Uuid,
        result: serde_json::Value,
    ) -> Result<(), SentinelError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            chunk_id: Uuid,
            result: serde_json::Value,
        }

        let body = serde_json::to_vec(&Request { chunk_id, result }).unwrap();
        let response = self.signed_post("/chunks/complete", &body).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        Ok(())
    }
}
