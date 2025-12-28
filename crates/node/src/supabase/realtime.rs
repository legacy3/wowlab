//! Supabase Realtime client using supabase-realtime-rs
//!
//! Subscribes to postgres changes for node updates and chunk assignments.

use serde::Deserialize;
use std::sync::Arc;
use supabase_realtime_rs::{
    PostgresChangeEvent, PostgresChangesFilter, PostgresChangesPayload, RealtimeClient,
    RealtimeClientOptions, RealtimeError as SbRealtimeError,
};
use tokio::sync::mpsc;
use uuid::Uuid;

/// Events received from Realtime subscriptions
#[derive(Debug, Clone)]
pub enum RealtimeEvent {
    /// Node row was updated (claim, settings change, etc.)
    NodeUpdated(NodePayload),
    /// A chunk was assigned to this node
    ChunkAssigned(ChunkPayload),
    /// Connection established
    Connected,
    /// Connection lost
    Disconnected,
    /// Error occurred
    Error(String),
}

/// Payload for node updates
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodePayload {
    pub id: Uuid,
    pub user_id: Option<String>,
    pub name: String,
    pub max_parallel: i32,
    pub status: String,
    pub claim_code: Option<String>,
}

/// Payload for chunk assignments
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkPayload {
    pub id: Uuid,
    pub job_id: Uuid,
    pub node_id: Option<Uuid>,
    pub config_hash: String,
    pub iterations: i32,
    pub seed_offset: i32,
    pub status: String,
}

/// Wrapper around supabase-realtime-rs client
pub struct SupabaseRealtime {
    api_url: String,
    anon_key: String,
}

impl SupabaseRealtime {
    pub fn new(api_url: String, anon_key: String) -> Self {
        Self { api_url, anon_key }
    }

    fn ws_url(&self) -> String {
        self.api_url
            .replace("https://", "wss://")
            .replace("http://", "ws://")
            + "/realtime/v1"
    }

    /// Subscribe to node updates and chunk assignments
    /// Returns a receiver for events
    pub async fn subscribe(
        self: Arc<Self>,
        node_id: Uuid,
    ) -> Result<mpsc::Receiver<RealtimeEvent>, RealtimeError> {
        let (tx, rx) = mpsc::channel(32);

        let ws_url = self.ws_url();
        let anon_key = self.anon_key.clone();

        tokio::spawn(async move {
            if let Err(e) = run_realtime(ws_url, anon_key, node_id, tx.clone()).await {
                tracing::error!("Realtime error: {}", e);
                let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
            }
        });

        Ok(rx)
    }
}

async fn run_realtime(
    ws_url: String,
    anon_key: String,
    node_id: Uuid,
    tx: mpsc::Sender<RealtimeEvent>,
) -> Result<(), RealtimeError> {
    tracing::info!("Connecting to Realtime: {}", ws_url);

    let client = RealtimeClient::new(
        &ws_url,
        RealtimeClientOptions {
            api_key: anon_key,
            ..Default::default()
        },
    )?;

    client.connect().await?;
    let _ = tx.send(RealtimeEvent::Connected).await;

    // Subscribe to node updates
    let node_channel = client
        .channel(&format!("node:{}", node_id), Default::default())
        .await;

    let mut node_rx = node_channel
        .on_postgres_changes(
            PostgresChangesFilter::new(PostgresChangeEvent::All, "public")
                .table("user_nodes")
                .filter(&format!("id=eq.{}", node_id)),
        )
        .await;

    node_channel.subscribe().await?;
    tracing::info!("Subscribed to node updates");

    // Subscribe to chunk assignments
    let chunks_channel = client
        .channel(&format!("chunks:{}", node_id), Default::default())
        .await;

    let mut chunks_rx = chunks_channel
        .on_postgres_changes(
            PostgresChangesFilter::new(PostgresChangeEvent::All, "public")
                .table("sim_chunks")
                .filter(&format!("nodeId=eq.{}", node_id)),
        )
        .await;

    chunks_channel.subscribe().await?;
    tracing::info!("Subscribed to chunk assignments");

    // Process events from both channels
    loop {
        tokio::select! {
            Some(change) = node_rx.recv() => {
                if let Some(event) = parse_node_change(&change) {
                    if tx.send(event).await.is_err() {
                        break;
                    }
                }
            }
            Some(change) = chunks_rx.recv() => {
                if let Some(event) = parse_chunk_change(&change) {
                    if tx.send(event).await.is_err() {
                        break;
                    }
                }
            }
            else => {
                let _ = tx.send(RealtimeEvent::Disconnected).await;
                break;
            }
        }
    }

    Ok(())
}

fn parse_node_change(change: &PostgresChangesPayload) -> Option<RealtimeEvent> {
    let record = match change {
        PostgresChangesPayload::Insert(p) => Some(&p.new),
        PostgresChangesPayload::Update(p) => Some(&p.new),
        PostgresChangesPayload::Delete(_) => None,
    };

    record.and_then(|map| {
        // Convert HashMap to serde_json::Value for deserialization
        let value = serde_json::to_value(map).ok()?;
        serde_json::from_value::<NodePayload>(value)
            .ok()
            .map(RealtimeEvent::NodeUpdated)
    })
}

fn parse_chunk_change(change: &PostgresChangesPayload) -> Option<RealtimeEvent> {
    let record = match change {
        PostgresChangesPayload::Insert(p) => Some(&p.new),
        PostgresChangesPayload::Update(p) => Some(&p.new),
        PostgresChangesPayload::Delete(_) => None,
    };

    record.and_then(|map| {
        // Convert HashMap to serde_json::Value for deserialization
        let value = serde_json::to_value(map).ok()?;
        serde_json::from_value::<ChunkPayload>(value)
            .ok()
            .map(RealtimeEvent::ChunkAssigned)
    })
}

#[derive(Debug, thiserror::Error)]
pub enum RealtimeError {
    #[error("Realtime client error: {0}")]
    Client(#[from] SbRealtimeError),
}
