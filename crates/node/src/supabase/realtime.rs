use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;
use supabase_realtime_rs::{
    PostgresChangeEvent, PostgresChangesFilter, PostgresChangesPayload,
    RealtimeChannelOptions, RealtimeClient, RealtimeClientOptions,
    RealtimeError as SbRealtimeError,
};
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use uuid::Uuid;

const MAX_RECONNECT_DELAY: Duration = Duration::from_secs(60);
const INITIAL_RECONNECT_DELAY: Duration = Duration::from_secs(1);

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

    pub fn subscribe(
        self: Arc<Self>,
        node_id: Uuid,
        handle: &Handle,
    ) -> mpsc::Receiver<RealtimeEvent> {
        let (tx, rx) = mpsc::channel(32);
        let ws_url = self.ws_url();
        let anon_key = self.anon_key.clone();

        handle.spawn(async move {
            run_with_reconnect(ws_url, anon_key, node_id, tx).await;
        });

        rx
    }
}

async fn run_with_reconnect(
    ws_url: String,
    anon_key: String,
    node_id: Uuid,
    tx: mpsc::Sender<RealtimeEvent>,
) {
    let mut delay = INITIAL_RECONNECT_DELAY;

    loop {
        let start = tokio::time::Instant::now();

        match run_realtime(&ws_url, &anon_key, node_id, &tx).await {
            Ok(()) => tracing::debug!("Realtime connection closed normally"),
            Err(e) => {
                tracing::debug!("Realtime error: {e}");
                let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
            }
        }

        let _ = tx.send(RealtimeEvent::Disconnected).await;

        // Reset backoff if the connection was alive long enough to have been useful
        if start.elapsed() > Duration::from_secs(10) {
            delay = INITIAL_RECONNECT_DELAY;
        }

        let jitter_ms = (std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .subsec_nanos()
            % 1000) as u64;
        let jittered_delay = delay + Duration::from_millis(jitter_ms);

        tracing::debug!("Reconnecting in {jittered_delay:?}");
        tokio::time::sleep(jittered_delay).await;

        delay = (delay * 2).min(MAX_RECONNECT_DELAY);
    }
}

async fn run_realtime(
    ws_url: &str,
    anon_key: &str,
    node_id: Uuid,
    tx: &mpsc::Sender<RealtimeEvent>,
) -> Result<(), RealtimeError> {
    tracing::debug!("Connecting to Realtime: {ws_url}");

    let client = RealtimeClient::new(
        ws_url,
        RealtimeClientOptions {
            api_key: anon_key.to_string(),
            ..RealtimeClientOptions::default()
        },
    )?;

    client.connect().await?;
    let _ = tx.send(RealtimeEvent::Connected).await;

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

#[derive(Debug, thiserror::Error)]
pub enum RealtimeError {
    #[error("Realtime client error: {0}")]
    Client(#[from] SbRealtimeError),
}
