//! Node claiming flow implementation

use crate::supabase::SupabaseClient;
use rand::Rng;
use std::time::Duration;
use uuid::Uuid;

/// Character set for claim codes (no confusing chars like 0/O, 1/l/I)
const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/// Generate a 6-character claim code
pub fn generate_code() -> String {
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

/// Register a pending node with the given claim code and wait for it to be claimed
pub async fn register_and_wait(client: &SupabaseClient, code: &str) -> Result<Uuid, ClaimError> {
    // Register the pending node
    let node_id = client.create_pending_node(code).await?;
    tracing::info!("Registered pending node {} with code {}", node_id, code);

    // Poll for claim
    loop {
        tokio::time::sleep(Duration::from_secs(3)).await;

        match client.get_node(node_id).await {
            Ok(Some(node)) => {
                if node.user_id.is_some() {
                    // Node has been claimed!
                    tracing::info!("Node {} claimed by user {:?}", node_id, node.user_id);

                    // Update local config
                    let mut config = crate::config::NodeConfig::load_or_create();
                    config.set_node_id(node_id);
                    if let Some(user_id) = node.user_id {
                        config.set_user_id(user_id);
                    }

                    return Ok(node_id);
                }
            }
            Ok(None) => {
                // Node was deleted - abort
                return Err(ClaimError::NodeDeleted);
            }
            Err(e) => {
                tracing::warn!("Failed to check node status: {}", e);
                // Continue polling
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
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
}

impl From<crate::supabase::SupabaseError> for ClaimError {
    fn from(e: crate::supabase::SupabaseError) -> Self {
        ClaimError::RegistrationFailed(e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_code() {
        let code = generate_code();
        assert_eq!(code.len(), 6);
        assert!(code.chars().all(|c| CHARSET.contains(&(c as u8))));
    }

    #[test]
    fn test_code_uniqueness() {
        let codes: std::collections::HashSet<_> = (0..1000).map(|_| generate_code()).collect();
        // Should have high uniqueness (not exactly 1000 due to random chance, but close)
        assert!(codes.len() > 990);
    }
}
