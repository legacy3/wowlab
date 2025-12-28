//! Node claiming flow implementation

use crate::supabase::{ApiClient, ApiError};
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

#[derive(Debug, thiserror::Error)]
pub enum ClaimError {
    #[error("Failed to register node: {0}")]
    RegistrationFailed(String),
    #[error("API error: {0}")]
    Api(#[from] ApiError),
}
