//! Node claiming flow implementation

use crate::supabase::{ApiClient, ApiError};
use std::time::Duration;
use uuid::Uuid;

/// Get the system hostname as default node name
pub fn get_default_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "WowLab Node".to_string())
}

/// Get the number of CPU cores as default max_parallel
pub fn get_default_cores() -> i32 {
    num_cpus::get() as i32
}

/// Register a pending node and return the node ID and claim code
/// Sends OS defaults (hostname, cores) which user can modify in portal before claiming
pub async fn register(client: &ApiClient) -> Result<(Uuid, String), ClaimError> {
    let hostname = get_default_name();
    let cores = get_default_cores();
    let version = env!("CARGO_PKG_VERSION");

    let response = client.register_node(&hostname, cores, version).await?;
    tracing::info!(
        "Registered pending node {} with code {}",
        response.id,
        response.claim_code
    );
    Ok((response.id, response.claim_code))
}

/// Wait for a node to be claimed by polling status
/// Returns the node name when claimed
pub async fn wait_for_claim(client: &ApiClient, node_id: Uuid) -> Result<String, ClaimError> {
    loop {
        tokio::time::sleep(Duration::from_secs(3)).await;

        match client.get_status(node_id).await {
            Ok(status) => {
                if status.claimed {
                    tracing::info!("Node {} claimed!", node_id);
                    return Ok(status.name);
                }
                // Still pending, continue waiting
            }
            Err(ApiError::NotFound) => {
                return Err(ClaimError::NodeDeleted);
            }
            Err(e) => {
                tracing::warn!("Status check failed: {}", e);
            }
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ClaimError {
    #[error("Failed to register node: {0}")]
    RegistrationFailed(String),
    #[error("Node was deleted before claiming")]
    NodeDeleted,
    #[error("API error: {0}")]
    Api(#[from] ApiError),
}
