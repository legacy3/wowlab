//! Realtime subscription for node updates, chunk assignments, and presence tracking.

use std::time::Duration;

use serde::Deserialize;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_centrifuge::{Client, ClientConfig, ClientEvent, SubscriptionConfig, SubscriptionEvent};

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
            config: ClientConfig::new(url, token).name(name).version(version),
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
            let mut events = client.events().await;
            client.connect();

            let connected = tokio::time::timeout(CONNECT_TIMEOUT, async {
                while let Some(event) = events.recv().await {
                    if matches!(event, ClientEvent::Connected(_)) {
                        return true;
                    }
                    if let ClientEvent::Error(e) = event {
                        tracing::warn!("Connection error: {}", e);
                    }
                }
                false
            })
            .await;

            if connected != Ok(true) {
                let _ = tx.send(RealtimeEvent::Error("Connection timeout".into())).await;
                client.disconnect();
                return;
            }

            if let Err(e) = run_subscriptions(&client, node_id, &tx, shutdown).await {
                let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
            }

            let _ = tx.send(RealtimeEvent::Disconnected).await;
            client.disconnect();
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
) -> Result<(), wowlab_centrifuge::Error> {
    let mut node_sub = client
        .subscribe(SubscriptionConfig::new(format!("nodes:{node_id}")))
        .await?;
    let mut chunks_sub = client
        .subscribe(SubscriptionConfig::new(format!("chunks:{node_id}")))
        .await?;
    let mut presence_sub = client
        .subscribe(SubscriptionConfig::new("nodes:online").join_leave(true))
        .await?;

    tracing::debug!("Subscribed to node:{node_id}, chunks:{node_id}, nodes:online");
    let _ = tx.send(RealtimeEvent::Connected).await;

    loop {
        tokio::select! {
            _ = shutdown.cancelled() => break,
            Some(event) = node_sub.recv() => {
                if let Some(payload) = extract_publication::<NodePayload>(&event) {
                    let _ = tx.send(RealtimeEvent::NodeUpdated(payload)).await;
                }
            }
            Some(event) = chunks_sub.recv() => {
                if let Some(payload) = extract_publication::<ChunkPayload>(&event) {
                    let _ = tx.send(RealtimeEvent::ChunkAssigned(payload)).await;
                }
            }
            Some(event) = presence_sub.recv() => {
                log_presence_event(&event);
            }
            else => break,
        }
    }

    Ok(())
}

fn extract_publication<T: for<'de> Deserialize<'de>>(event: &SubscriptionEvent) -> Option<T> {
    let SubscriptionEvent::Publication(pub_) = event else {
        return None;
    };
    parse_json(&pub_.data)
}

fn log_presence_event(event: &SubscriptionEvent) {
    match event {
        SubscriptionEvent::Join(info) => {
            tracing::debug!(user = %info.user, client = %info.client, "Node joined");
        }
        SubscriptionEvent::Leave(info) => {
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
