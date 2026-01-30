//! Track node online/offline status via Centrifugo presence polling.
//!
//! Compares Centrifugo presence with database state and reconciles differences.

use std::collections::HashSet;

use async_trait::async_trait;
use serde::Serialize;
use uuid::Uuid;
use wowlab_centrifuge::error_codes;

use crate::cron::CronJob;
use crate::notifications::{Notification, NotificationEvent};
use crate::state::ServerState;
use crate::utils::markdown as md;

pub struct PresenceJob {
    schedule: String,
}

impl PresenceJob {
    pub fn new(schedule: &str) -> Self {
        Self {
            schedule: schedule.to_string(),
        }
    }
}

#[async_trait]
impl CronJob for PresenceJob {
    fn name(&self) -> &'static str {
        "presence_sync"
    }

    fn schedule(&self) -> &str {
        &self.schedule
    }

    async fn run(&self, state: &ServerState) {
        let centrifugo_online: HashSet<Uuid> = match state.presence.get_online("nodes:online").await {
            Ok(ids) => ids,
            Err(wowlab_centrifuge::Error::Server { code, .. }) if code == error_codes::UNKNOWN_CHANNEL => {
                HashSet::new()
            }
            Err(e) => {
                tracing::warn!(error = %e, "Failed to poll presence");
                return;
            }
        };

        let db_online: HashSet<Uuid> = match fetch_online_node_ids(&state.db).await {
            Ok(ids) => ids.into_iter().collect(),
            Err(e) => {
                tracing::warn!(error = %e, "Failed to fetch online nodes from DB");
                return;
            }
        };

        let to_online: Vec<Uuid> = centrifugo_online.difference(&db_online).copied().collect();
        let to_offline: Vec<Uuid> = db_online.difference(&centrifugo_online).copied().collect();

        if !to_online.is_empty() {
            set_online(state, &to_online).await;
        }

        if !to_offline.is_empty() {
            set_offline(state, &to_offline).await;
        }

        metrics::gauge!(crate::telemetry::NODES_ONLINE).set(centrifugo_online.len() as f64);
        metrics::counter!(crate::telemetry::PRESENCE_POLLS).increment(1);
        state.touch_presence();
    }
}

async fn fetch_online_node_ids(db: &sqlx::PgPool) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(Uuid,)> =
        sqlx::query_as("SELECT id FROM public.nodes WHERE status = 'online'")
            .fetch_all(db)
            .await?;
    Ok(rows.into_iter().map(|(id,)| id).collect())
}

/// Node info for notifications.
#[derive(sqlx::FromRow)]
struct NodeInfo {
    name: String,
    platform: Option<String>,
}

async fn set_online(state: &ServerState, ids: &[Uuid]) {
    let result = sqlx::query(
        "UPDATE public.nodes SET status = 'online', last_seen_at = now() WHERE id = ANY($1)",
    )
    .bind(ids)
    .execute(&state.db)
    .await;

    let Ok(r) = result else {
        tracing::warn!(error = ?result.unwrap_err(), nodes = ?ids, "Failed to mark nodes online");
        return;
    };

    if r.rows_affected() == 0 {
        return;
    }

    tracing::info!(count = r.rows_affected(), "Nodes online");
    publish_node_updates(state, ids).await;

    let nodes = fetch_node_info(&state.db, ids).await;
    for node in nodes {
        send_notification(state, &node, NotificationEvent::NodeOnline, "is now online");
    }
}

async fn set_offline(state: &ServerState, ids: &[Uuid]) {
    let nodes = fetch_node_info(&state.db, ids).await;

    let result = sqlx::query("UPDATE public.nodes SET status = 'offline' WHERE id = ANY($1)")
        .bind(ids)
        .execute(&state.db)
        .await;

    let Ok(r) = result else {
        tracing::warn!(error = ?result.unwrap_err(), nodes = ?ids, "Failed to mark nodes offline");
        return;
    };

    if r.rows_affected() == 0 {
        return;
    }

    tracing::info!(count = r.rows_affected(), "Nodes offline");
    metrics::counter!(crate::telemetry::NODES_MARKED_OFFLINE).increment(r.rows_affected());
    publish_node_updates(state, ids).await;

    for node in nodes {
        send_notification(state, &node, NotificationEvent::NodeOffline, "went offline");
    }
}

async fn fetch_node_info(db: &sqlx::PgPool, ids: &[Uuid]) -> Vec<NodeInfo> {
    sqlx::query_as("SELECT name, platform FROM public.nodes WHERE id = ANY($1)")
        .bind(ids)
        .fetch_all(db)
        .await
        .inspect_err(|e| tracing::warn!(error = %e, "Failed to fetch node info"))
        .unwrap_or_default()
}

/// Publish node status update to portal (Refine live format).
async fn publish_node_updates(state: &ServerState, ids: &[Uuid]) {
    #[derive(Serialize)]
    struct RefineUpdate {
        r#type: &'static str,
        payload: RefinePayload,
    }

    #[derive(Serialize)]
    struct RefinePayload {
        ids: Vec<String>,
    }

    let payload = RefineUpdate {
        r#type: "updated",
        payload: RefinePayload {
            ids: ids.iter().map(ToString::to_string).collect(),
        },
    };

    state.publish("nodes:all", &payload).await;
}

fn send_notification(state: &ServerState, node: &NodeInfo, event: NotificationEvent, action: &str) {
    let platform = node.platform.as_deref().unwrap_or("unknown");
    let title = match event {
        NotificationEvent::NodeOnline => format!("Node Online: {}", node.name),
        NotificationEvent::NodeOffline => format!("Node Offline: {}", node.name),
        _ => return,
    };

    let notification = Notification::new(
        event,
        title,
        format!(
            "{} {}\nPlatform: {}",
            md::bold(&node.name),
            action,
            md::code(platform)
        ),
    );

    if let Err(e) = state.notification_tx.send(notification) {
        tracing::error!(error = %e, "Failed to send notification");
    }
}
