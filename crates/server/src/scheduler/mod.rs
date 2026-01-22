mod assign;

use std::sync::Arc;

use crate::state::ServerState;

/// Run the chunk scheduler. Subscribes to Realtime postgres_changes on
/// `jobs_chunks` and assigns pending chunks to eligible online nodes.
///
/// Blocks indefinitely (reconnects on failure).
pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing::info!("Scheduler starting");

    loop {
        if let Err(e) = subscribe_and_assign(&state).await {
            tracing::error!(error = %e, "Scheduler subscription failed, reconnecting...");
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        }
    }
}

/// Subscribe to jobs_chunks changes and process pending chunks.
///
/// TODO: Replace polling with Supabase Realtime subscription once
/// supabase-realtime-rs is integrated. For now, polls every 2s.
async fn subscribe_and_assign(
    state: &ServerState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing::info!("Polling for pending chunks");

    loop {
        let pending = fetch_pending_chunks(state).await?;

        if !pending.is_empty() {
            tracing::info!(count = pending.len(), "Found pending chunks");
            assign::assign_pending_chunks(state, &pending).await?;
        }

        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    }
}

/// Fetch unassigned pending chunks from Supabase.
async fn fetch_pending_chunks(
    state: &ServerState,
) -> Result<Vec<PendingChunk>, Box<dyn std::error::Error + Send + Sync>> {
    let response = state
        .supabase
        .get("jobs_chunks?status=eq.pending&node_id=is.null&select=id,job_id&limit=100")
        .await?;

    let chunks: Vec<PendingChunk> = response.json().await?;
    Ok(chunks)
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct PendingChunk {
    pub id: String,
    pub job_id: String,
}
