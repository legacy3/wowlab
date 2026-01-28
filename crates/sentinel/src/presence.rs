//! Track node online/offline status via Centrifugo presence polling.
//!
//! Periodically polls the `nodes:online` channel to get online nodes,
//! then reconciles the database status accordingly.

use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use sqlx::PgPool;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::state::ServerState;
use wowlab_centrifugo::{CentrifugoApi, Error as CentrifugoError};

/// Centrifugo error code for "unknown channel" (no subscribers yet).
const ERROR_UNKNOWN_CHANNEL: u32 = 102;

const POLL_INTERVAL: Duration = Duration::from_secs(5);

pub async fn run(
    state: Arc<ServerState>,
    shutdown: CancellationToken,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api =
        CentrifugoApi::from_env().expect("CENTRIFUGO_API_URL and CENTRIFUGO_HTTP_API_KEY required");

    tracing::info!(
        "Presence monitor starting (polling every {:?})",
        POLL_INTERVAL
    );

    let mut previous_online: HashSet<Uuid> = HashSet::new();

    loop {
        tokio::select! {
            _ = shutdown.cancelled() => {
                tracing::info!("Presence monitor shutting down");
                return Ok(());
            }
            _ = tokio::time::sleep(POLL_INTERVAL) => {
                let current_online = match api.presence("nodes:online").await {
                    Ok(ids) => ids,
                    // "Unknown channel" means no nodes are subscribed yet - treat as empty
                    Err(CentrifugoError::Server { code, .. }) if code == ERROR_UNKNOWN_CHANNEL => {
                        vec![]
                    }
                    Err(e) => {
                        tracing::warn!(error = %e, "Failed to poll presence");
                        continue;
                    }
                };

                let current_set: HashSet<Uuid> = current_online.iter().copied().collect();

                // Find nodes that joined (in current but not in previous)
                let joined: Vec<Uuid> = current_set.difference(&previous_online).copied().collect();

                // Find nodes that left (in previous but not in current)
                let left: Vec<Uuid> = previous_online.difference(&current_set).copied().collect();

                if !joined.is_empty() {
                    set_online(&state.db, &joined).await;
                }

                if !left.is_empty() {
                    set_offline(&state.db, &left).await;
                }

                metrics::gauge!(crate::telemetry::NODES_ONLINE).set(current_set.len() as f64);
                previous_online = current_set;
            }
        }
    }
}

/// Mark nodes online and update last_seen_at.
async fn set_online(db: &PgPool, ids: &[Uuid]) {
    match sqlx::query(
        "UPDATE public.nodes SET status = 'online', last_seen_at = now() WHERE id = ANY($1)",
    )
    .bind(ids)
    .execute(db)
    .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            tracing::info!(count = r.rows_affected(), nodes = ?ids, "Nodes online");
        }
        Ok(_) => {}
        Err(e) => {
            tracing::warn!(error = %e, nodes = ?ids, "Failed to mark nodes online");
        }
    }
}

/// Mark nodes offline.
async fn set_offline(db: &PgPool, ids: &[Uuid]) {
    match sqlx::query("UPDATE public.nodes SET status = 'offline' WHERE id = ANY($1)")
        .bind(ids)
        .execute(db)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            tracing::info!(count = r.rows_affected(), nodes = ?ids, "Nodes offline");
            metrics::counter!(crate::telemetry::NODES_MARKED_OFFLINE).increment(r.rows_affected());
        }
        Ok(_) => {}
        Err(e) => {
            tracing::warn!(error = %e, nodes = ?ids, "Failed to mark nodes offline");
        }
    }
}
