//! Realtime subscription for node updates, chunk assignments, and presence tracking.

use std::time::Duration;

use serde::Deserialize;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_centrifugo::{Client, ClientConfig, Event};

const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

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
    pub fn new(url: &str, token: &str, name: &str, version: &str) -> Self {
        Self {
            config: ClientConfig::new(url, token, name, version),
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
            let shutdown_for_run = shutdown.clone();

            // Spawn the client run loop
            let client_for_run = client.clone();
            let run_handle =
                tokio::spawn(async move { client_for_run.run(shutdown_for_run).await });

            // Subscribe to channels and process events
            if let Err(e) = run_subscriptions(&client, node_id, &tx, shutdown).await {
                let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
            }

            let _ = tx.send(RealtimeEvent::Disconnected).await;
            let _ = run_handle.await;
            tracing::debug!("Realtime subscription shut down");
        });

        rx
    }
}

async fn run_subscriptions(
    client: &Client,
    node_id: Uuid,
    tx: &mpsc::Sender<RealtimeEvent>,
    shutdown: CancellationToken,
) -> Result<(), wowlab_centrifugo::Error> {
    client.wait_connected(CONNECT_TIMEOUT).await?;

    // Subscribe to channels
    let (_, mut node_rx) = client.subscribe(&format!("nodes:{node_id}"), false).await?;
    let (_, mut chunks_rx) = client.subscribe(&format!("chunks:{node_id}"), false).await?;
    let (_, mut presence_rx) = client.subscribe("nodes:online", true).await?;

    tracing::debug!("Subscribed to node:{node_id}, chunks:{node_id}, nodes:online");
    let _ = tx.send(RealtimeEvent::Connected).await;

    loop {
        tokio::select! {
            _ = shutdown.cancelled() => break,
            Some(event) = node_rx.recv() => {
                if let Some(payload) = extract_publication::<NodePayload>(&event) {
                    let _ = tx.send(RealtimeEvent::NodeUpdated(payload)).await;
                }
            }
            Some(event) = chunks_rx.recv() => {
                if let Some(payload) = extract_publication::<ChunkPayload>(&event) {
                    let _ = tx.send(RealtimeEvent::ChunkAssigned(payload)).await;
                }
            }
            Some(event) = presence_rx.recv() => {
                log_presence_event(&event);
            }
            else => break,
        }
    }

    Ok(())
}

/// Extract and parse a publication payload from an event.
fn extract_publication<T: for<'de> Deserialize<'de>>(event: &Event) -> Option<T> {
    let Event::Publication(pub_) = event else {
        return None;
    };
    parse_json(&pub_.data)
}

/// Log presence join/leave events for debugging.
fn log_presence_event(event: &Event) {
    match event {
        Event::Join(info) => {
            tracing::debug!(user = %info.user, client = %info.client, "Node joined");
        }
        Event::Leave(info) => {
            tracing::debug!(user = %info.user, client = %info.client, "Node left");
        }
        _ => {}
    }
}

fn parse_json<T: for<'de> Deserialize<'de>>(data: &[u8]) -> Option<T> {
    serde_json::from_slice(data)
        .inspect_err(|e| {
            tracing::warn!(
                error = %e,
                raw = %String::from_utf8_lossy(data),
                "Failed to parse publication"
            );
        })
        .ok()
}
