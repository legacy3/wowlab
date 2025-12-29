use crate::supabase::{ApiClient, ApiError};
use uuid::Uuid;

pub fn default_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "WoW Lab Node".to_string())
}

pub fn default_cores() -> i32 {
    i32::try_from(num_cpus::get()).unwrap_or(4)
}

pub async fn register(client: &ApiClient) -> Result<(Uuid, String), ClaimError> {
    let hostname = default_name();
    let cores = default_cores();
    let version = env!("CARGO_PKG_VERSION");

    let response = client.register_node(&hostname, cores, version).await?;
    tracing::info!(
        "Registered node {} with code {}",
        response.id,
        response.claim_code
    );
    Ok((response.id, response.claim_code))
}

#[derive(Debug, thiserror::Error)]
pub enum ClaimError {
    #[error("API error: {0}")]
    Api(#[from] ApiError),
}
