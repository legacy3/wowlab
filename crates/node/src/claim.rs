use crate::sentinel::{SentinelClient, SentinelError};
use crate::utils::cpu;
use uuid::Uuid;

pub fn default_name() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "WoW Lab Node".to_string())
}

/// Total logical cores available (slider max)
pub fn total_cores() -> i32 {
    i32::try_from(cpu::get_total_cores()).unwrap_or(4)
}

/// Optimal cores to enable by default (P-cores on ARM, physical on x86)
pub fn default_enabled_cores() -> i32 {
    i32::try_from(cpu::get_optimal_concurrency()).unwrap_or(4)
}

/// Platform identifier (os-arch), e.g. "macos-aarch64", "linux-x86_64"
pub fn platform() -> String {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    format!("{os}-{arch}")
}

pub async fn register(client: &SentinelClient) -> Result<(Uuid, String, Option<String>), ClaimError> {
    let hostname = default_name();
    let total = total_cores();
    let enabled = default_enabled_cores();
    let platform = platform();
    let version = env!("CARGO_PKG_VERSION");

    let response = client
        .register_node(&hostname, total, enabled, &platform, version)
        .await?;
    tracing::info!(
        "Registered node {} with code {}",
        response.id,
        response.claim_code
    );
    Ok((response.id, response.claim_code, response.beacon_token))
}

#[derive(Debug, thiserror::Error)]
pub enum ClaimError {
    #[error("Sentinel error: {0}")]
    Sentinel(#[from] SentinelError),
}
