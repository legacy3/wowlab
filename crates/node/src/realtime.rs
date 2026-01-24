//! Realtime subscription for node updates, chunk assignments, and presence tracking.

use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_supabase::{
    PostgresChangeEvent, PostgresChangesFilter, PostgresChangesPayload,
    RealtimeChannelOptions, RealtimeClient, RealtimeManager, SupabaseError,
};

#[derive(Debug, Clone)]
pub enum RealtimeEvent {
    NodeUpdated(NodePayload),
    ChunkAssigned(ChunkPayload),
    Connected,
    Disconnected,
    Error(String),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodePayload {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub total_cores: i32,
    #[serde(default)]
    pub max_parallel: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkPayload {
    pub id: Uuid,
    pub iterations: i32,
    pub config_hash: String,
    pub seed_offset: i32,
}

pub struct NodeRealtime {
    manager: Arc<RealtimeManager>,
}

impl NodeRealtime {
    pub fn new(api_url: &str, anon_key: &str) -> Self {
        Self {
            manager: Arc::new(RealtimeManager::new(api_url, anon_key)),
        }
    }

    pub fn subscribe(
        &self,
        node_id: Uuid,
        handle: &Handle,
        shutdown: CancellationToken,
    ) -> mpsc::Receiver<RealtimeEvent> {
        let (tx, rx) = mpsc::channel(32);
        let manager = Arc::clone(&self.manager);

        handle.spawn(async move {
            let _ = manager
                .run_with_shutdown(shutdown, |client| {
                    let tx = tx.clone();
                    async move {
                        let result = run_node_session(client, node_id, &tx).await;
                        let _ = tx.send(RealtimeEvent::Disconnected).await;
                        result
                    }
                })
                .await;
            tracing::debug!("Realtime subscription shut down");
        });

        rx
    }
}

async fn run_node_session(
    client: RealtimeClient,
    node_id: Uuid,
    tx: &mpsc::Sender<RealtimeEvent>,
) -> Result<(), SupabaseError> {
    // Subscribe to node updates
    let node_channel = client
        .channel(
            &format!("node:{node_id}"),
            RealtimeChannelOptions::default(),
        )
        .await;

    let mut node_rx = node_channel
        .on_postgres_changes(
            PostgresChangesFilter::new(PostgresChangeEvent::All, "public")
                .table("nodes")
                .filter(format!("id=eq.{node_id}")),
        )
        .await;

    node_channel.subscribe().await?;
    tracing::debug!("Subscribed to node updates");

    // Subscribe to chunk assignments
    let chunks_channel = client
        .channel(
            &format!("chunks:{node_id}"),
            RealtimeChannelOptions::default(),
        )
        .await;

    let mut chunks_rx = chunks_channel
        .on_postgres_changes(
            PostgresChangesFilter::new(PostgresChangeEvent::All, "public")
                .table("jobs_chunks")
                .filter(format!("node_id=eq.{node_id}")),
        )
        .await;

    chunks_channel.subscribe().await?;
    tracing::debug!("Subscribed to chunk assignments");

    // Track presence so sentinel knows this node is online
    let presence_channel = client
        .channel(
            "nodes:presence",
            RealtimeChannelOptions {
                presence_key: Some(node_id.to_string()),
                ..Default::default()
            },
        )
        .await;

    presence_channel.subscribe().await?;
    presence_channel
        .track(json!({ "node_id": node_id.to_string() }))
        .await?;
    tracing::debug!("Tracking presence on nodes:presence");

    let _ = tx.send(RealtimeEvent::Connected).await;

    loop {
        tokio::select! {
            Some(change) = node_rx.recv() => {
                if let Some(payload) = parse_change::<NodePayload>(&change) {
                    let _ = tx.send(RealtimeEvent::NodeUpdated(payload)).await;
                }
            }
            Some(change) = chunks_rx.recv() => {
                if let Some(payload) = parse_change::<ChunkPayload>(&change) {
                    let _ = tx.send(RealtimeEvent::ChunkAssigned(payload)).await;
                }
            }
            else => break,
        }
    }

    Ok(())
}

fn parse_change<T: for<'de> Deserialize<'de> + std::fmt::Debug>(
    change: &PostgresChangesPayload,
) -> Option<T> {
    let record = match change {
        PostgresChangesPayload::Insert(p) => Some(&p.new),
        PostgresChangesPayload::Update(p) => Some(&p.new),
        PostgresChangesPayload::Delete(_) => None,
    };

    record.and_then(|map| {
        let value = serde_json::to_value(map).ok()?;
        match serde_json::from_value::<T>(value.clone()) {
            Ok(parsed) => {
                tracing::debug!("Parsed change: {:?}", parsed);
                Some(parsed)
            }
            Err(e) => {
                tracing::warn!("Failed to parse change: {} - raw: {}", e, value);
                None
            }
        }
    })
}
