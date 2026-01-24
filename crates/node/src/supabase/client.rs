use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

use crate::auth::NodeKeypair;

#[derive(Clone)]
pub struct ApiClient {
    http: reqwest::Client,
    /// Supabase API URL (for direct PostgREST queries).
    api_url: String,
    /// Supabase anon key (for PostgREST auth).
    anon_key: String,
    /// Sentinel HTTP URL (for node operations).
    sentinel_url: String,
    /// Ed25519 keypair for request signing.
    keypair: NodeKeypair,
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
    #[error("Failed to build HTTP client: {0}")]
    ClientBuild(String),
}

impl ApiClient {
    pub fn new(api_url: String, anon_key: String, sentinel_url: String, keypair: NodeKeypair) -> Result<Self, ApiError> {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .map_err(|e| ApiError::ClientBuild(e.to_string()))?;

        Ok(Self {
            http,
            api_url,
            anon_key,
            sentinel_url,
            keypair,
        })
    }

    /// Send a signed POST request to the sentinel.
    async fn signed_post(&self, path: &str, body: &[u8]) -> Result<reqwest::Response, ApiError> {
        let url = format!("{}{}", self.sentinel_url, path);
        let headers = self.keypair.sign_request("POST", path, body);

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
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    pub async fn set_online(&self, _node_id: Uuid) -> Result<(), ApiError> {
        #[derive(Serialize)]
        struct Request {
            status: &'static str,
        }

        let body = serde_json::to_vec(&Request { status: "online" }).unwrap();
        let response = self.signed_post("/nodes/heartbeat", &body).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(())
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

        let body = serde_json::to_vec(&Request { chunk_id, result }).unwrap();
        let response = self.signed_post("/chunks/complete", &body).await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(())
    }
}

impl ApiClient {
    /// Fetch a simulation config by hash via direct PostgREST query.
    pub async fn fetch_config(&self, hash: &str) -> Result<serde_json::Value, ApiError> {
        let url = format!(
            "{}/rest/v1/jobs_configs?hash=eq.{}&select=config",
            self.api_url, hash,
        );

        let response = self
            .http
            .get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", self.anon_key))
            .header("Accept", "application/vnd.pgrst.object+json")
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        let row: ConfigRow = response.json().await?;
        Ok(row.config)
    }

    /// Fetch a rotation script by ID via direct PostgREST query.
    pub async fn fetch_rotation(&self, id: &str) -> Result<RotationResponse, ApiError> {
        let url = format!(
            "{}/rest/v1/rotations?id=eq.{}&select=id,script,checksum",
            self.api_url, id,
        );

        let response = self
            .http
            .get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", self.anon_key))
            .header("Accept", "application/vnd.pgrst.object+json")
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }
}

#[derive(Deserialize)]
struct ConfigRow {
    config: serde_json::Value,
}

/// Response from rotation-fetch edge function.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RotationResponse {
    pub id: String,
    pub script: String,
    pub checksum: String,
}
