//! Supabase REST client for node operations
#![allow(dead_code)]

use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Supabase client for making REST API calls
#[derive(Clone)]
pub struct SupabaseClient {
    http: reqwest::Client,
    base_url: String,
    anon_key: String,
}

/// Node data from the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeData {
    pub id: Uuid,
    pub user_id: Option<String>,
    pub name: String,
    pub claim_code: Option<String>,
    pub max_parallel: i32,
    pub status: String,
    pub last_seen_at: Option<String>,
    pub version: Option<String>,
}

/// Simulation chunk data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkData {
    pub id: Uuid,
    pub job_id: Uuid,
    pub config_hash: String,
    pub iterations: i32,
    pub seed_offset: i32,
    pub status: String,
}

/// Simulation config data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigData {
    pub hash: String,
    pub config: serde_json::Value,
}

#[derive(Debug, thiserror::Error)]
pub enum SupabaseError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl SupabaseClient {
    pub fn new(base_url: String, anon_key: String) -> Self {
        let http = reqwest::Client::new();
        Self {
            http,
            base_url,
            anon_key,
        }
    }

    /// Build headers for Supabase API calls
    fn headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(
            "apikey",
            HeaderValue::from_str(&self.anon_key).unwrap_or_else(|_| HeaderValue::from_static("")),
        );
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.anon_key))
                .unwrap_or_else(|_| HeaderValue::from_static("")),
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert("Prefer", HeaderValue::from_static("return=representation"));
        headers
    }

    /// Create a pending node with the given claim code
    pub async fn create_pending_node(&self, claim_code: &str) -> Result<Uuid, SupabaseError> {
        let url = format!("{}/rest/v1/nodes", self.base_url);

        #[derive(Serialize)]
        struct CreateNode {
            claim_code: String,
            status: String,
            name: String,
            max_parallel: i32,
        }

        let node_name = format!("Node-{}", &Uuid::new_v4().to_string()[..8]);
        let body = CreateNode {
            claim_code: claim_code.to_string(),
            status: "pending".to_string(),
            name: node_name,
            max_parallel: 4,
        };

        let response = self
            .http
            .post(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        let nodes: Vec<NodeData> = response.json().await?;
        nodes
            .first()
            .map(|n| n.id)
            .ok_or_else(|| SupabaseError::Api("No node returned".to_string()))
    }

    /// Get a node by ID
    pub async fn get_node(&self, id: Uuid) -> Result<Option<NodeData>, SupabaseError> {
        let url = format!("{}/rest/v1/nodes?id=eq.{}", self.base_url, id);

        let response = self.http.get(&url).headers(self.headers()).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        let nodes: Vec<NodeData> = response.json().await?;
        Ok(nodes.into_iter().next())
    }

    /// Update node status and last_seen_at
    pub async fn heartbeat(&self, id: Uuid, status: &str) -> Result<(), SupabaseError> {
        let url = format!("{}/rest/v1/nodes?id=eq.{}", self.base_url, id);

        #[derive(Serialize)]
        struct UpdateNode {
            status: String,
            last_seen_at: String,
        }

        let body = UpdateNode {
            status: status.to_string(),
            last_seen_at: chrono_now(),
        };

        let response = self
            .http
            .patch(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        Ok(())
    }

    /// Get pending chunks assigned to this node
    pub async fn get_pending_chunks(&self, node_id: Uuid) -> Result<Vec<ChunkData>, SupabaseError> {
        let url = format!(
            "{}/rest/v1/sim_chunks?node_id=eq.{}&status=eq.pending",
            self.base_url, node_id
        );

        let response = self.http.get(&url).headers(self.headers()).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        let chunks: Vec<ChunkData> = response.json().await?;
        Ok(chunks)
    }

    /// Claim a chunk (set status to running)
    pub async fn claim_chunk(&self, chunk_id: Uuid) -> Result<(), SupabaseError> {
        let url = format!("{}/rest/v1/sim_chunks?id=eq.{}", self.base_url, chunk_id);

        #[derive(Serialize)]
        struct UpdateChunk {
            status: String,
            claimed_at: String,
        }

        let body = UpdateChunk {
            status: "running".to_string(),
            claimed_at: chrono_now(),
        };

        let response = self
            .http
            .patch(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        Ok(())
    }

    /// Complete a chunk with results
    pub async fn complete_chunk(
        &self,
        chunk_id: Uuid,
        result: serde_json::Value,
    ) -> Result<(), SupabaseError> {
        let url = format!("{}/rest/v1/sim_chunks?id=eq.{}", self.base_url, chunk_id);

        #[derive(Serialize)]
        struct UpdateChunk {
            status: String,
            result: serde_json::Value,
            completed_at: String,
        }

        let body = UpdateChunk {
            status: "completed".to_string(),
            result,
            completed_at: chrono_now(),
        };

        let response = self
            .http
            .patch(&url)
            .headers(self.headers())
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        Ok(())
    }

    /// Get a simulation config by hash
    pub async fn get_config(&self, hash: &str) -> Result<String, SupabaseError> {
        let url = format!("{}/rest/v1/sim_configs?hash=eq.{}", self.base_url, hash);

        let response = self.http.get(&url).headers(self.headers()).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Api(error_text));
        }

        let configs: Vec<ConfigData> = response.json().await?;
        configs
            .first()
            .map(|c| serde_json::to_string(&c.config).unwrap_or_default())
            .ok_or_else(|| SupabaseError::Api("Config not found".to_string()))
    }
}

/// Get current timestamp in ISO format
fn chrono_now() -> String {
    chrono::Utc::now().to_rfc3339()
}
