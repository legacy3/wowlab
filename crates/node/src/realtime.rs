//! Realtime subscription for node updates, chunk assignments, and presence tracking.

use serde::Deserialize;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_centrifugo::{Client, ClientConfig, Event, Publication};

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
    config: ClientConfig,
}

impl NodeRealtime {
    pub fn new(url: &str, token: &str) -> Self {
        Self {
            config: ClientConfig::new(url, token),
        }
    }

    pub fn subscribe(
        &self,
        node_id: Uuid,
        handle: &Handle,
        shutdown: CancellationToken,
    ) -> mpsc::Receiver<RealtimeEvent> {
        let (tx, rx) = mpsc::channel(32);
        let config = self.config.clone();

        handle.spawn(async move {
            let client = Client::new(config);
            let client_clone = client.clone();
            let tx_clone = tx.clone();
            let shutdown_clone = shutdown.clone();

            // Spawn the client run loop
            let run_handle = tokio::spawn(async move {
                client_clone.run(shutdown_clone).await
            });

            // Subscribe to channels
            let result = run_subscriptions(client, node_id, &tx, shutdown).await;
            if let Err(e) = result {
                let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
            }

            let _ = tx_clone.send(RealtimeEvent::Disconnected).await;
            let _ = run_handle.await;
            tracing::debug!("Realtime subscription shut down");
        });

        rx
    }
}

async fn run_subscriptions(
    client: Client,
    node_id: Uuid,
    tx: &mpsc::Sender<RealtimeEvent>,
    shutdown: CancellationToken,
) -> Result<(), wowlab_centrifugo::Error> {
    // Subscribe to node updates
    let node_channel = format!("nodes:{node_id}");
    let (_, mut node_rx) = client.subscribe(&node_channel, false).await?;
    tracing::debug!("Subscribed to node updates on {}", node_channel);

    // Subscribe to chunk assignments
    let chunks_channel = format!("chunks:{node_id}");
    let (_, mut chunks_rx) = client.subscribe(&chunks_channel, false).await?;
    tracing::debug!("Subscribed to chunk assignments on {}", chunks_channel);

    // Subscribe to presence channel with join/leave events
    let (_, mut presence_rx) = client.subscribe("nodes:online", true).await?;
    tracing::debug!("Subscribed to nodes:online presence");

    let _ = tx.send(RealtimeEvent::Connected).await;

    loop {
        tokio::select! {
            _ = shutdown.cancelled() => {
                tracing::debug!("Shutdown requested");
                break;
            }
            Some(event) = node_rx.recv() => {
                handle_node_event(event, tx).await;
            }
            Some(event) = chunks_rx.recv() => {
                handle_chunk_event(event, tx).await;
            }
            Some(event) = presence_rx.recv() => {
                handle_presence_event(event);
            }
            else => break,
        }
    }

    Ok(())
}

async fn handle_node_event(event: Event, tx: &mpsc::Sender<RealtimeEvent>) {
    match event {
        Event::Publication(pub_) => {
            if let Some(payload) = parse_publication::<NodePayload>(&pub_) {
                let _ = tx.send(RealtimeEvent::NodeUpdated(payload)).await;
            }
        }
        Event::Connected => {
            tracing::debug!("Node channel connected");
        }
        Event::Disconnected => {
            tracing::debug!("Node channel disconnected");
        }
        Event::Error(e) => {
            tracing::warn!("Node channel error: {}", e);
        }
        _ => {}
    }
}

async fn handle_chunk_event(event: Event, tx: &mpsc::Sender<RealtimeEvent>) {
    match event {
        Event::Publication(pub_) => {
            if let Some(payload) = parse_publication::<ChunkPayload>(&pub_) {
                let _ = tx.send(RealtimeEvent::ChunkAssigned(payload)).await;
            }
        }
        Event::Connected => {
            tracing::debug!("Chunks channel connected");
        }
        Event::Disconnected => {
            tracing::debug!("Chunks channel disconnected");
        }
        Event::Error(e) => {
            tracing::warn!("Chunks channel error: {}", e);
        }
        _ => {}
    }
}

fn handle_presence_event(event: Event) {
    match event {
        Event::Join(info) => {
            tracing::debug!("Node joined: user={}, client={}", info.user, info.client);
        }
        Event::Leave(info) => {
            tracing::debug!("Node left: user={}, client={}", info.user, info.client);
        }
        Event::Connected => {
            tracing::debug!("Presence channel connected");
        }
        Event::Disconnected => {
            tracing::debug!("Presence channel disconnected");
        }
        Event::Error(e) => {
            tracing::warn!("Presence channel error: {}", e);
        }
        Event::Publication(_) | Event::Subscribed | Event::Unsubscribed { .. } => {}
    }
}

fn parse_publication<T: for<'de> Deserialize<'de> + std::fmt::Debug>(
    pub_: &Publication,
) -> Option<T> {
    match serde_json::from_slice::<T>(&pub_.data) {
        Ok(parsed) => {
            tracing::debug!("Parsed publication: {:?}", parsed);
            Some(parsed)
        }
        Err(e) => {
            tracing::warn!(
                "Failed to parse publication: {} - raw: {}",
                e,
                String::from_utf8_lossy(&pub_.data)
            );
            None
        }
    }
}
