use crate::sentinel::{SentinelClient, SentinelError};
use crate::utils::cpu;
use uuid::Uuid;

pub fn default_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "WoW Lab Node".to_string())
}

pub fn total_cores() -> i32 {
    i32::try_from(cpu::get_total_cores()).unwrap_or(4)
}

/// Optimal cores for compute work (P-cores on ARM, physical on x86).
pub fn default_enabled_cores() -> i32 {
    i32::try_from(cpu::get_optimal_concurrency()).unwrap_or(4)
}

pub fn platform() -> String {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    format!("{os}-{arch}")
}

pub async fn register(
    client: &SentinelClient,
    claim_token: Option<&str>,
) -> Result<(Uuid, Option<String>), ClaimError> {
    let hostname = default_name();
    let total = total_cores();
    let enabled = default_enabled_cores();
    let platform = platform();
    let version = env!("CARGO_PKG_VERSION");

    let response = client
        .register_node(&hostname, total, enabled, &platform, version, claim_token)
        .await?;
    tracing::info!("Registered node {}", response.id);
    Ok((response.id, response.beacon_token))
}

#[derive(Debug, thiserror::Error)]
pub enum ClaimError {
    #[error("Sentinel error: {0}")]
    Sentinel(#[from] SentinelError),
}
