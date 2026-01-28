//! Signed HTTP client for sentinel node operations.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

/// Headers produced by signing a request.
pub struct SignedHeaders {
    pub key: String,
    pub signature: String,
    pub timestamp: String,
}

/// Trait for signing HTTP requests to the sentinel.
pub trait RequestSigner: Send + Sync {
    fn sign_request(&self, method: &str, path: &str, body: &[u8]) -> SignedHeaders;
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResponse {
    pub id: Uuid,
    pub claim_code: String,
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

/// Client for signed HTTP requests to the sentinel service.
#[derive(Clone)]
pub struct SentinelClient {
    http: reqwest::Client,
    sentinel_url: String,
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

        Ok(Self {
            http,
            sentinel_url,
            signer,
        })
    }

    async fn signed_post(
        &self,
        path: &str,
        body: &[u8],
    ) -> Result<reqwest::Response, SentinelError> {
        let url = format!("{}{}", self.sentinel_url, path);
        let headers = self.signer.sign_request("POST", path, body);

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
    ) -> Result<RegisterResponse, SentinelError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            hostname: &'a str,
            total_cores: i32,
            enabled_cores: i32,
            platform: &'a str,
            version: &'a str,
        }

        let body = serde_json::to_vec(&Request {
            hostname,
            total_cores,
            enabled_cores,
            platform,
            version,
        })
        .unwrap();

        let response = self.signed_post("/nodes/register", &body).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        Ok(response.json().await?)
    }

    /// Verify this node is registered and claimed.
    ///
    /// Returns Ok(()) if the node exists and is claimed.
    /// Returns an error with "not found"/"not claimed" for invalid nodes,
    /// or a network/server error if the sentinel is unavailable.
    pub async fn verify(&self) -> Result<(), SentinelError> {
        let response = self.signed_post("/nodes/verify", &[]).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(SentinelError::Api(error));
        }

        Ok(())
    }

    /// Submit completed chunk result.
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
