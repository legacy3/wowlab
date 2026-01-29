//! Track node online/offline status via Centrifugo presence polling.
//!
//! Periodically polls the `nodes:online` channel to get online nodes,
//! then reconciles the database status accordingly.

use std::collections::HashSet;
use std::sync::Arc;

use tokio_util::sync::CancellationToken;
use uuid::Uuid;

use crate::notifications::{Notification, NotificationEvent};
use crate::state::ServerState;
use crate::utils::markdown as md;
use wowlab_centrifugo::{CentrifugoApi, Error as CentrifugoError};

/// Centrifugo error code for "unknown channel" (no subscribers yet).
const ERROR_UNKNOWN_CHANNEL: u32 = 102;

pub async fn run(
    state: Arc<ServerState>,
    shutdown: CancellationToken,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api = CentrifugoApi::new(&state.config.centrifugo_url, &state.config.centrifugo_key);
    let poll_interval = state.config.presence_poll_interval;

    tracing::info!(
        "Presence monitor starting (polling every {:?})",
        poll_interval
    );

    let mut previous_online: HashSet<Uuid> = HashSet::new();

    loop {
        tokio::select! {
            _ = shutdown.cancelled() => {
                tracing::info!("Presence monitor shutting down");
                return Ok(());
            }
            _ = tokio::time::sleep(poll_interval) => {
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
                    set_online(&state, &joined).await;
                }

                if !left.is_empty() {
                    set_offline(&state, &left).await;
                }

                metrics::gauge!(crate::telemetry::NODES_ONLINE).set(current_set.len() as f64);
                metrics::counter!(crate::telemetry::PRESENCE_POLLS).increment(1);
                state.touch_presence();
                previous_online = current_set;
            }
        }
    }
}

/// Node info for notifications.
#[derive(sqlx::FromRow)]
struct NodeInfo {
    name: String,
    platform: Option<String>,
}

/// Mark nodes online and update last_seen_at.
async fn set_online(state: &ServerState, ids: &[Uuid]) {
    // First update the status
    match sqlx::query(
        "UPDATE public.nodes SET status = 'online', last_seen_at = now() WHERE id = ANY($1)",
    )
    .bind(ids)
    .execute(&state.db)
    .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            tracing::info!(count = r.rows_affected(), nodes = ?ids, "Nodes online");

            // Fetch node names for notifications
            if let Ok(nodes) = sqlx::query_as::<_, NodeInfo>(
                "SELECT name, platform FROM public.nodes WHERE id = ANY($1)",
            )
            .bind(ids)
            .fetch_all(&state.db)
            .await
            {
                for node in nodes {
                    let platform = node.platform.as_deref().unwrap_or("unknown");
                    let notification = Notification::new(
                        NotificationEvent::NodeOnline,
                        format!("Node Online: {}", node.name),
                        format!(
                            "{} is now online\nPlatform: {}",
                            md::bold(&node.name),
                            md::code(platform)
                        ),
                    );

                    if let Err(e) = state.notification_tx.send(notification) {
                        tracing::error!(error = %e, "Failed to send node-online notification");
                    }
                }
            }
        }
        Ok(_) => {}
        Err(e) => {
            tracing::warn!(error = %e, nodes = ?ids, "Failed to mark nodes online");
        }
    }
}

/// Mark nodes offline.
async fn set_offline(state: &ServerState, ids: &[Uuid]) {
    // First fetch node names for notifications (before updating status)
    let nodes: Vec<NodeInfo> =
        sqlx::query_as("SELECT name, platform FROM public.nodes WHERE id = ANY($1)")
            .bind(ids)
            .fetch_all(&state.db)
            .await
            .inspect_err(
                |e| tracing::warn!(error = %e, "Failed to fetch node info for notifications"),
            )
            .unwrap_or_default();

    match sqlx::query("UPDATE public.nodes SET status = 'offline' WHERE id = ANY($1)")
        .bind(ids)
        .execute(&state.db)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            tracing::info!(count = r.rows_affected(), nodes = ?ids, "Nodes offline");
            metrics::counter!(crate::telemetry::NODES_MARKED_OFFLINE).increment(r.rows_affected());

            // Send notifications
            for node in nodes {
                let platform = node.platform.as_deref().unwrap_or("unknown");
                let notification = Notification::new(
                    NotificationEvent::NodeOffline,
                    format!("Node Offline: {}", node.name),
                    format!(
                        "{} went offline\nPlatform: {}",
                        md::bold(&node.name),
                        md::code(platform)
                    ),
                );

                if let Err(e) = state.notification_tx.send(notification) {
                    tracing::error!(error = %e, "Failed to send node-offline notification");
                }
            }
        }
        Ok(_) => {}
        Err(e) => {
            tracing::warn!(error = %e, nodes = ?ids, "Failed to mark nodes offline");
        }
    }
}
