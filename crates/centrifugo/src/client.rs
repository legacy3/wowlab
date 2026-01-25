//! Centrifugo WebSocket client.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use prost::Message;
use tokio::sync::{mpsc, oneshot, RwLock};
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tokio_util::sync::CancellationToken;

use crate::error::Error;
use crate::events::{ClientInfo, Event, Publication};
use crate::proto;

const DEFAULT_TIMEOUT: Duration = Duration::from_secs(10);
const RECONNECT_DELAY_INITIAL: Duration = Duration::from_secs(1);
const RECONNECT_DELAY_MAX: Duration = Duration::from_secs(30);

/// Client configuration.
#[derive(Clone)]
pub struct ClientConfig {
    pub url: String,
    pub token: String,
    pub name: String,
    pub version: String,
}

impl ClientConfig {
    pub fn new(url: impl Into<String>, token: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            token: token.into(),
            name: "wowlab".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

/// A subscription handle.
#[derive(Clone)]
pub struct Subscription {
    channel: String,
    client: Client,
}

impl Subscription {
    /// Get the channel name.
    pub fn channel(&self) -> &str {
        &self.channel
    }

    /// Unsubscribe from the channel.
    pub async fn unsubscribe(&self) -> Result<(), Error> {
        self.client.unsubscribe(&self.channel).await
    }
}

type PendingRequest = oneshot::Sender<Result<proto::Reply, Error>>;

struct ClientInner {
    config: ClientConfig,
    cmd_tx: Option<mpsc::Sender<(proto::Command, PendingRequest)>>,
    subscriptions: HashMap<String, mpsc::Sender<Event>>,
    next_id: AtomicU32,
}

/// Centrifugo client.
#[derive(Clone)]
pub struct Client {
    inner: Arc<RwLock<ClientInner>>,
}

impl Client {
    /// Create a new client.
    pub fn new(config: ClientConfig) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ClientInner {
                config,
                cmd_tx: None,
                subscriptions: HashMap::new(),
                next_id: AtomicU32::new(1),
            })),
        }
    }

    /// Run the client with automatic reconnection.
    /// Returns when the shutdown token is cancelled.
    pub async fn run(&self, shutdown: CancellationToken) -> Result<(), Error> {
        let mut delay = RECONNECT_DELAY_INITIAL;

        loop {
            if shutdown.is_cancelled() {
                return Ok(());
            }

            let start = tokio::time::Instant::now();

            match self.connect_and_run(&shutdown).await {
                Ok(()) => {
                    tracing::debug!("Connection closed normally");
                }
                Err(e) => {
                    tracing::warn!("Connection error: {}", e);
                }
            }

            if shutdown.is_cancelled() {
                return Ok(());
            }

            // Reset backoff if connection lasted > 30s
            if start.elapsed() > Duration::from_secs(30) {
                delay = RECONNECT_DELAY_INITIAL;
            }

            tracing::debug!("Reconnecting in {:?}", delay);

            tokio::select! {
                _ = tokio::time::sleep(delay) => {}
                _ = shutdown.cancelled() => return Ok(()),
            }

            delay = (delay * 2).min(RECONNECT_DELAY_MAX);
        }
    }

    async fn connect_and_run(&self, shutdown: &CancellationToken) -> Result<(), Error> {
        let config = self.inner.read().await.config.clone();
        let url = format!("{}?format=protobuf", config.url);

        tracing::debug!("Connecting to {}", url);

        let (ws, _) = tokio_tungstenite::connect_async(&url).await?;
        let (mut write, mut read) = ws.split();

        // Create command channel
        let (cmd_tx, mut cmd_rx) = mpsc::channel::<(proto::Command, PendingRequest)>(32);

        // Store command sender
        {
            let mut inner = self.inner.write().await;
            inner.cmd_tx = Some(cmd_tx.clone());
        }

        // Send connect request
        let connect_result = {
            let connect_req = proto::ConnectRequest {
                token: config.token.clone(),
                name: config.name.clone(),
                version: config.version.clone(),
                ..Default::default()
            };

            let cmd = proto::Command {
                id: 1,
                connect: Some(connect_req),
                ..Default::default()
            };

            let data = cmd.encode_length_delimited_to_vec();
            write.send(WsMessage::Binary(data.into())).await?;

            // Wait for connect reply
            let msg = read.next().await.ok_or(Error::ConnectionClosed)??;
            let data = msg.into_data();
            let reply = proto::Reply::decode_length_delimited(&*data)
                .map_err(|e| Error::Protocol(e.to_string()))?;

            if let Some(err) = reply.error {
                return Err(Error::Server {
                    code: err.code,
                    message: err.message,
                });
            }

            reply.connect.ok_or_else(|| Error::Protocol("No connect result".into()))?
        };

        tracing::info!(
            "Connected to Centrifugo: client={}, version={}",
            connect_result.client,
            connect_result.version
        );

        // Notify subscriptions of connection
        self.broadcast_event(Event::Connected).await;

        // Pending requests waiting for replies
        let pending: Arc<RwLock<HashMap<u32, PendingRequest>>> =
            Arc::new(RwLock::new(HashMap::new()));

        let pending_write = pending.clone();

        // Main loop
        loop {
            tokio::select! {
                _ = shutdown.cancelled() => {
                    break;
                }

                // Handle outgoing commands
                Some((mut cmd, reply_tx)) = cmd_rx.recv() => {
                    let id = self.inner.read().await.next_id.fetch_add(1, Ordering::Relaxed);
                    cmd.id = id;

                    pending_write.write().await.insert(id, reply_tx);

                    let data = cmd.encode_length_delimited_to_vec();
                    if let Err(e) = write.send(WsMessage::Binary(data.into())).await {
                        tracing::error!("Failed to send command: {}", e);
                        break;
                    }
                }

                // Handle incoming messages
                msg = read.next() => {
                    let msg = match msg {
                        Some(Ok(msg)) => msg,
                        Some(Err(e)) => {
                            tracing::error!("WebSocket error: {}", e);
                            break;
                        }
                        None => break,
                    };

                    if let WsMessage::Binary(data) = msg {
                        if let Err(e) = self.handle_message(&data, &pending).await {
                            tracing::warn!("Failed to handle message: {}", e);
                        }
                    } else if let WsMessage::Close(_) = msg {
                        break;
                    }
                }
            }
        }

        // Cleanup
        {
            let mut inner = self.inner.write().await;
            inner.cmd_tx = None;
        }

        self.broadcast_event(Event::Disconnected).await;

        Ok(())
    }

    async fn handle_message(
        &self,
        data: &[u8],
        pending: &RwLock<HashMap<u32, PendingRequest>>,
    ) -> Result<(), Error> {
        let reply =
            proto::Reply::decode_length_delimited(data).map_err(|e| Error::Protocol(e.to_string()))?;

        // Check if this is a reply to a pending request
        if reply.id > 0 {
            if let Some(tx) = pending.write().await.remove(&reply.id) {
                let _ = tx.send(Ok(reply));
            }
            return Ok(());
        }

        // Handle push messages
        if let Some(push) = reply.push {
            self.handle_push(push).await;
        }

        Ok(())
    }

    async fn handle_push(&self, push: proto::Push) {
        let channel = push.channel;
        let inner = self.inner.read().await;

        let Some(tx) = inner.subscriptions.get(&channel) else {
            return;
        };

        let event = if let Some(pub_) = push.r#pub {
            Event::Publication(Publication::from(pub_))
        } else if let Some(join) = push.join {
            if let Some(info) = join.info {
                Event::Join(ClientInfo::from(info))
            } else {
                return;
            }
        } else if let Some(leave) = push.leave {
            if let Some(info) = leave.info {
                Event::Leave(ClientInfo::from(info))
            } else {
                return;
            }
        } else if let Some(unsub) = push.unsubscribe {
            Event::Unsubscribed {
                code: unsub.code,
                reason: unsub.reason,
            }
        } else {
            return;
        };

        if tx.send(event).await.is_err() {
            tracing::trace!(channel = %channel, "Subscription receiver dropped");
        }
    }

    async fn broadcast_event(&self, event: Event) {
        let inner = self.inner.read().await;
        for (channel, tx) in inner.subscriptions.iter() {
            if tx.send(event.clone()).await.is_err() {
                tracing::trace!(channel = %channel, "Subscription receiver dropped during broadcast");
            }
        }
    }

    async fn send_command(&self, cmd: proto::Command) -> Result<proto::Reply, Error> {
        let cmd_tx = {
            let inner = self.inner.read().await;
            inner.cmd_tx.clone().ok_or(Error::NotConnected)?
        };

        let (tx, rx) = oneshot::channel();
        cmd_tx
            .send((cmd, tx))
            .await
            .map_err(|_| Error::NotConnected)?;

        tokio::time::timeout(DEFAULT_TIMEOUT, rx)
            .await
            .map_err(|_| Error::Timeout)?
            .map_err(|_| Error::ConnectionClosed)?
    }

    /// Subscribe to a channel.
    /// Returns a subscription handle and a receiver for events.
    pub async fn subscribe(
        &self,
        channel: &str,
        join_leave: bool,
    ) -> Result<(Subscription, mpsc::Receiver<Event>), Error> {
        let (tx, rx) = mpsc::channel(64);

        // Store subscription
        {
            let mut inner = self.inner.write().await;
            inner.subscriptions.insert(channel.to_string(), tx.clone());
        }

        // Send subscribe request
        let cmd = proto::Command {
            subscribe: Some(proto::SubscribeRequest {
                channel: channel.to_string(),
                join_leave,
                ..Default::default()
            }),
            ..Default::default()
        };

        let reply = match self.send_command(cmd).await {
            Ok(reply) => reply,
            Err(e) => {
                // Clean up subscription on any error (timeout, connection closed, etc.)
                self.inner.write().await.subscriptions.remove(channel);
                return Err(e);
            }
        };

        if let Some(err) = reply.error {
            // Remove subscription on server error
            self.inner.write().await.subscriptions.remove(channel);
            return Err(Error::Server {
                code: err.code,
                message: err.message,
            });
        }

        let _ = tx.send(Event::Subscribed).await;

        Ok((
            Subscription {
                channel: channel.to_string(),
                client: self.clone(),
            },
            rx,
        ))
    }

    /// Unsubscribe from a channel.
    pub async fn unsubscribe(&self, channel: &str) -> Result<(), Error> {
        let cmd = proto::Command {
            unsubscribe: Some(proto::UnsubscribeRequest {
                channel: channel.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::Server {
                code: err.code,
                message: err.message,
            });
        }

        self.inner.write().await.subscriptions.remove(channel);

        Ok(())
    }

    /// Get presence information for a channel.
    pub async fn presence(&self, channel: &str) -> Result<proto::PresenceResult, Error> {
        let cmd = proto::Command {
            presence: Some(proto::PresenceRequest {
                channel: channel.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::Server {
                code: err.code,
                message: err.message,
            });
        }

        reply
            .presence
            .ok_or_else(|| Error::Protocol("No presence result".into()))
    }

    /// Get presence stats for a channel.
    pub async fn presence_stats(&self, channel: &str) -> Result<proto::PresenceStatsResult, Error> {
        let cmd = proto::Command {
            presence_stats: Some(proto::PresenceStatsRequest {
                channel: channel.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::Server {
                code: err.code,
                message: err.message,
            });
        }

        reply
            .presence_stats
            .ok_or_else(|| Error::Protocol("No presence stats result".into()))
    }
}
