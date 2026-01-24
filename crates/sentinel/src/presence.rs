//! Track node online/offline status via Supabase Realtime presence.
//!
//! Nodes join the `nodes:presence` channel with their node ID as presence key.
//! The sentinel subscribes and reconciles the database status accordingly.

use std::sync::Arc;

use sqlx::PgPool;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_supabase::{
    ChannelEvent, EventPayload, RealtimeChannelOptions, RealtimeClient, RealtimeManager,
    SupabaseError,
};

use crate::state::ServerState;

pub async fn run(
    state: Arc<ServerState>,
    shutdown: CancellationToken,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let supabase_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL required");
    let anon_key = std::env::var("SUPABASE_ANON_KEY").expect("SUPABASE_ANON_KEY required");

    let manager = RealtimeManager::new(&supabase_url, &anon_key);
    let db = state.db.clone();

    manager
        .run_with_shutdown(shutdown, |client| {
            let db = db.clone();
            async move { run_session(client, &db).await }
        })
        .await?;

    Ok(())
}

async fn run_session(client: RealtimeClient, db: &PgPool) -> Result<(), SupabaseError> {
    let channel = client
        .channel("nodes:presence", RealtimeChannelOptions::default())
        .await;

    let mut state_rx = channel.on(ChannelEvent::PresenceState).await;
    let mut diff_rx = channel.on(ChannelEvent::PresenceDiff).await;

    channel.subscribe().await?;
    tracing::info!("Subscribed to nodes:presence");

    loop {
        tokio::select! {
            Some(payload) = state_rx.recv() => {
                if let EventPayload::PresenceState(value) = payload {
                    handle_state(db, &value).await;
                }
            }
            Some(payload) = diff_rx.recv() => {
                if let EventPayload::PresenceDiff(value) = payload {
                    handle_diff(db, &value).await;
                }
            }
            else => break,
        }
    }

    Ok(())
}

/// Full state sync. Mark present nodes online, absent nodes offline.
async fn handle_state(db: &PgPool, value: &serde_json::Value) {
    let ids = extract_uuids(value);

    if ids.is_empty() {
        // On reconnect, initial state is empty until nodes re-track.
        // Don't sweep — diffs will handle leaves individually.
        tracing::debug!("Presence state empty, skipping offline sweep");
        return;
    }

    set_online(db, &ids).await;

    let offline = sqlx::query(
        "UPDATE public.nodes SET status = 'offline'
         WHERE status = 'online' AND id != ALL($1)",
    )
    .bind(&ids)
    .execute(db)
    .await;

    if let Ok(r) = offline {
        if r.rows_affected() > 0 {
            tracing::info!(count = r.rows_affected(), "Marked absent nodes offline");
            metrics::counter!(crate::telemetry::NODES_MARKED_OFFLINE)
                .increment(r.rows_affected());
        }
    }

    metrics::gauge!(crate::telemetry::NODES_ONLINE).set(ids.len() as f64);
}

/// Incremental diff: process individual joins and leaves.
async fn handle_diff(db: &PgPool, value: &serde_json::Value) {
    let joins = value.get("joins").map(extract_uuids).unwrap_or_default();
    let leaves = value.get("leaves").map(extract_uuids).unwrap_or_default();

    if !joins.is_empty() {
        set_online(db, &joins).await;
    }

    if !leaves.is_empty() {
        let result = sqlx::query(
            "UPDATE public.nodes SET status = 'offline' WHERE id = ANY($1)",
        )
        .bind(&leaves)
        .execute(db)
        .await;

        if let Ok(r) = result {
            if r.rows_affected() > 0 {
                tracing::info!(count = r.rows_affected(), "Nodes left");
                metrics::counter!(crate::telemetry::NODES_MARKED_OFFLINE)
                    .increment(r.rows_affected());
            }
        }
    }
}

/// Mark nodes online and update last_seen_at.
async fn set_online(db: &PgPool, ids: &[Uuid]) {
    let result = sqlx::query(
        "UPDATE public.nodes SET status = 'online', last_seen_at = now() WHERE id = ANY($1)",
    )
    .bind(ids)
    .execute(db)
    .await;

    if let Ok(r) = result {
        if r.rows_affected() > 0 {
            tracing::info!(count = r.rows_affected(), "Nodes online");
        }
    }
}

/// Extract UUID keys from a JSON object (presence keys are node IDs).
fn extract_uuids(value: &serde_json::Value) -> Vec<Uuid> {
    value
        .as_object()
        .map(|obj| obj.keys().filter_map(|k| k.parse().ok()).collect())
        .unwrap_or_default()
}
