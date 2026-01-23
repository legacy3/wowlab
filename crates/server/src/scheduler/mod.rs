mod assign;

use std::sync::Arc;
use std::time::Duration;

use sqlx::postgres::PgListener;
use uuid::Uuid;

use crate::state::ServerState;

/// Run the chunk scheduler. Listens for `pending_chunk` notifications via
/// Postgres LISTEN/NOTIFY and assigns pending chunks to eligible online nodes.
///
/// Blocks indefinitely (reconnects on failure).
pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing::info!("Scheduler starting");

    loop {
        if let Err(e) = listen_and_assign(&state).await {
            tracing::error!(error = %e, "Scheduler failed, reconnecting...");
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    }
}

async fn listen_and_assign(
    state: &ServerState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut listener = PgListener::connect_with(&state.db).await?;
    listener.listen("pending_chunk").await?;
    tracing::info!("Listening for pending_chunk notifications");

    // Process any chunks that arrived before we started listening
    process_pending(state).await;

    loop {
        // Wait for notification with a timeout so we periodically sweep for
        // any missed chunks (e.g. if a notification was lost during reconnect)
        match tokio::time::timeout(Duration::from_secs(30), listener.recv()).await {
            Ok(Ok(notification)) => {
                tracing::debug!(payload = notification.payload(), "pending_chunk notification");
                // Small debounce: collect rapid-fire notifications from batch inserts
                tokio::time::sleep(Duration::from_millis(50)).await;
                process_pending(state).await;
            }
            Ok(Err(e)) => {
                return Err(e.into());
            }
            Err(_timeout) => {
                // Periodic sweep
                process_pending(state).await;
            }
        }
    }
}

/// Fetch all unassigned pending chunks and run assignment.
async fn process_pending(state: &ServerState) {
    match fetch_pending_chunks(state).await {
        Ok(pending) if !pending.is_empty() => {
            tracing::info!(count = pending.len(), "Found pending chunks");
            if let Err(e) = assign::assign_pending_chunks(state, &pending).await {
                tracing::error!(error = %e, "Assignment failed");
            }
        }
        Ok(_) => {}
        Err(e) => {
            tracing::error!(error = %e, "Failed to fetch pending chunks");
        }
    }
}

/// Fetch unassigned pending chunks from the database.
async fn fetch_pending_chunks(
    state: &ServerState,
) -> Result<Vec<PendingChunk>, sqlx::Error> {
    sqlx::query_as::<_, PendingChunk>(
        "SELECT id, job_id FROM public.jobs_chunks
         WHERE status = 'pending' AND node_id IS NULL
         ORDER BY created_at ASC
         LIMIT 100"
    )
    .fetch_all(&state.db)
    .await
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PendingChunk {
    pub id: Uuid,
    pub job_id: Uuid,
}
