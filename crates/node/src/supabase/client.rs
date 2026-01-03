use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

#[derive(Clone)]
pub struct ApiClient {
    http: reqwest::Client,
    api_url: String,
}

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResponse {
    pub id: Uuid,
    pub claim_code: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
}

impl ApiClient {
    pub fn new(api_url: String) -> Self {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .expect("Failed to create HTTP client");

        Self { http, api_url }
    }

    pub async fn register_node(
        &self,
        hostname: &str,
        total_cores: i32,
        enabled_cores: i32,
        platform: &str,
        version: &str,
    ) -> Result<RegisterResponse, ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            hostname: &'a str,
            total_cores: i32,
            enabled_cores: i32,
            platform: &'a str,
            version: &'a str,
        }

        let url = format!("{}/functions/v1/node-register", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request {
                hostname,
                total_cores,
                enabled_cores,
                platform,
                version,
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    pub async fn set_online(&self, node_id: Uuid) -> Result<(), ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            node_id: Uuid,
            status: &'static str,
        }

        let url = format!("{}/functions/v1/node-heartbeat", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request {
                node_id,
                status: "online",
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(())
    }

    /// Claim a chunk and get its config. Returns the full config JSON needed to run the simulation.
    pub async fn claim_chunk(
        &self,
        chunk_id: Uuid,
        node_id: Uuid,
    ) -> Result<ChunkClaimResponse, ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            chunk_id: Uuid,
            node_id: Uuid,
        }

        let url = format!("{}/functions/v1/chunk-claim", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request { chunk_id, node_id })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    /// Submit completed chunk result.
    pub async fn complete_chunk(
        &self,
        chunk_id: Uuid,
        result: serde_json::Value,
    ) -> Result<(), ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            chunk_id: Uuid,
            result: serde_json::Value,
        }

        let url = format!("{}/functions/v1/chunk-complete", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request { chunk_id, result })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(())
    }
}

/// Response from chunk-claim edge function (old single-chunk API).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkClaimResponse {
    pub id: Uuid,
    pub config_hash: String,
    pub iterations: i32,
    pub seed_offset: i64,
    pub config: serde_json::Value,
}

/// A single chunk in the batch claim response.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimedChunk {
    pub id: Uuid,
    pub iterations: i32,
    pub seed_offset: i64,
}

/// Response from new chunk-claim edge function (batch API).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimWorkResponse {
    pub chunks: Vec<ClaimedChunk>,
    #[serde(default)]
    pub config_hash: Option<String>,
    #[serde(default)]
    pub config: Option<serde_json::Value>,
}

impl ApiClient {
    /// Claim available work for this node. Returns batch of chunks + configHash.
    /// This is the new pull-based API - node asks for work instead of being assigned.
    pub async fn claim_work(
        &self,
        node_id: Uuid,
        batch_size: u32,
    ) -> Result<ClaimWorkResponse, ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            node_id: Uuid,
            batch_size: u32,
        }

        let url = format!("{}/functions/v1/chunk-claim", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request { node_id, batch_size })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    /// Fetch a simulation config by hash.
    /// Returns the full config JSON (includes rotationId for fetching script).
    pub async fn fetch_config(&self, hash: &str) -> Result<serde_json::Value, ApiError> {
        let url = format!("{}/functions/v1/config-fetch?hash={}", self.api_url, hash);
        let response = self.http.get(&url).send().await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    /// Fetch a rotation script by ID.
    /// Returns the script and checksum for cache validation.
    pub async fn fetch_rotation(&self, id: &str) -> Result<RotationResponse, ApiError> {
        let url = format!("{}/functions/v1/rotation-fetch?id={}", self.api_url, id);
        let response = self.http.get(&url).send().await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }
}

/// Response from rotation-fetch edge function.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RotationResponse {
    pub id: String,
    pub script: String,
    pub checksum: String,
}
