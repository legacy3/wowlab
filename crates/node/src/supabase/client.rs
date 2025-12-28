//! Edge Functions client for node operations
//! No database credentials - all writes go through edge functions

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Client for calling WowLab edge functions
#[derive(Clone)]
pub struct ApiClient {
    http: reqwest::Client,
    api_url: String,
}

/// Response from node-register
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResponse {
    pub id: Uuid,
    pub claim_code: String,
}

/// Response from node-status
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusResponse {
    pub id: Uuid,
    pub user_id: Option<String>,
    pub name: String,
    pub status: String,
    pub max_parallel: i32,
    pub claimed: bool,
}

/// Response from node-heartbeat (current node state)
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeartbeatResponse {
    pub id: Uuid,
    pub name: String,
    pub max_parallel: i32,
    pub status: String,
}

/// Response from chunk-claim (includes config)
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimChunkResponse {
    pub id: Uuid,
    pub config_hash: String,
    pub iterations: i32,
    pub seed_offset: i32,
    pub config: serde_json::Value,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
    #[error("Not found")]
    NotFound,
}

impl ApiClient {
    pub fn new(api_url: String) -> Self {
        let http = reqwest::Client::new();
        Self { http, api_url }
    }

    pub fn api_url(&self) -> &str {
        &self.api_url
    }

    /// Register a new pending node, returns node ID and claim code
    /// Sends OS defaults (hostname, cores) which user can modify in portal
    pub async fn register_node(
        &self,
        hostname: &str,
        cores: i32,
        version: &str,
    ) -> Result<RegisterResponse, ApiError> {
        let url = format!("{}/functions/v1/node-register", self.api_url);

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            hostname: &'a str,
            cores: i32,
            version: &'a str,
        }

        let response = self
            .http
            .post(&url)
            .json(&Request {
                hostname,
                cores,
                version,
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error_text));
        }

        Ok(response.json().await?)
    }

    /// Get node status (check if claimed)
    pub async fn get_status(&self, node_id: Uuid) -> Result<StatusResponse, ApiError> {
        let url = format!("{}/functions/v1/node-status", self.api_url);

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            node_id: Uuid,
        }

        let response = self
            .http
            .post(&url)
            .json(&Request { node_id })
            .send()
            .await?;

        if response.status().as_u16() == 404 {
            return Err(ApiError::NotFound);
        }

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error_text));
        }

        Ok(response.json().await?)
    }

    /// Send heartbeat to update node status, returns current node state
    pub async fn heartbeat(
        &self,
        node_id: Uuid,
        status: &str,
    ) -> Result<HeartbeatResponse, ApiError> {
        let url = format!("{}/functions/v1/node-heartbeat", self.api_url);

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            node_id: Uuid,
            status: &'a str,
        }

        let response = self
            .http
            .post(&url)
            .json(&Request { node_id, status })
            .send()
            .await?;

        if response.status().as_u16() == 404 {
            return Err(ApiError::NotFound);
        }

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error_text));
        }

        Ok(response.json().await?)
    }

    /// Claim a chunk for processing (returns chunk data + config)
    pub async fn claim_chunk(
        &self,
        chunk_id: Uuid,
        node_id: Uuid,
    ) -> Result<ClaimChunkResponse, ApiError> {
        let url = format!("{}/functions/v1/chunk-claim", self.api_url);

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            chunk_id: Uuid,
            node_id: Uuid,
        }

        let response = self
            .http
            .post(&url)
            .json(&Request { chunk_id, node_id })
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error_text));
        }

        Ok(response.json().await?)
    }

    /// Complete a chunk with results
    pub async fn complete_chunk(
        &self,
        chunk_id: Uuid,
        result: serde_json::Value,
    ) -> Result<(), ApiError> {
        let url = format!("{}/functions/v1/chunk-complete", self.api_url);

        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            chunk_id: Uuid,
            result: serde_json::Value,
        }

        let response = self
            .http
            .post(&url)
            .json(&Request { chunk_id, result })
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error_text));
        }

        Ok(())
    }
}
