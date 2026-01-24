pub mod assign;
mod maintenance;
mod reclaim;

use std::sync::Arc;
use std::time::{Duration, Instant};

use sqlx::postgres::PgListener;
use uuid::Uuid;

use tokio_util::sync::CancellationToken;

use crate::state::ServerState;

pub async fn run(state: Arc<ServerState>, shutdown: CancellationToken) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    tracing::info!("Scheduler starting");

    loop {
        if shutdown.is_cancelled() {
            return Ok(());
        }
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

    process_pending(state).await;

    let mut last_maintenance = Instant::now();
    let mut last_cleanup = Instant::now();

    loop {
        state.touch_scheduler();

        match tokio::time::timeout(Duration::from_secs(30), listener.recv()).await {
            Ok(Ok(notification)) => {
                tracing::debug!(payload = notification.payload(), "pending_chunk notification");
                tokio::time::sleep(Duration::from_millis(50)).await;
                process_pending(state).await;
            }
            Ok(Err(e)) => {
                return Err(e.into());
            }
            Err(_timeout) => {
                process_pending(state).await;
                reclaim::reclaim_stale_chunks(state).await;

                // Every 60s: mark offline nodes
                if last_maintenance.elapsed() >= Duration::from_secs(60) {
                    maintenance::mark_nodes_offline(&state.db).await;
                    last_maintenance = Instant::now();
                }

                // Every hour: cleanup stale data
                if last_cleanup.elapsed() >= Duration::from_secs(3600) {
                    maintenance::cleanup_stale_data(&state.db).await;
                    last_cleanup = Instant::now();
                }

                record_gauges(state).await;
            }
        }
    }
}

async fn process_pending(state: &ServerState) {
    match fetch_pending_chunks(state).await {
        Ok(pending) if !pending.is_empty() => {
            tracing::debug!(count = pending.len(), "Found pending chunks");
            metrics::gauge!(crate::telemetry::CHUNKS_PENDING).set(pending.len() as f64);
            if let Err(e) = assign::assign_pending_chunks(state, &pending).await {
                tracing::error!(error = %e, "Assignment failed");
            }
        }
        Ok(_) => {
            metrics::gauge!(crate::telemetry::CHUNKS_PENDING).set(0.0);
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to fetch pending chunks");
        }
    }
}

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

async fn record_gauges(state: &ServerState) {
    use crate::telemetry;

    metrics::gauge!(telemetry::UPTIME_SECONDS).set(state.started_at.elapsed().as_secs() as f64);

    let running: Result<(i64,), _> = sqlx::query_as(
        "SELECT COUNT(*) FROM public.jobs_chunks WHERE status = 'running'"
    )
    .fetch_one(&state.db)
    .await;

    if let Ok((count,)) = running {
        metrics::gauge!(telemetry::CHUNKS_RUNNING).set(count as f64);
    }

    let online: Result<(i64,), _> = sqlx::query_as(
        "SELECT COUNT(*) FROM public.nodes WHERE last_seen_at > now() - interval '30 seconds'"
    )
    .fetch_one(&state.db)
    .await;

    if let Ok((count,)) = online {
        metrics::gauge!(telemetry::NODES_ONLINE).set(count as f64);
    }
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PendingChunk {
    pub id: Uuid,
    pub job_id: Uuid,
}
