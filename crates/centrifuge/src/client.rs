//! Centrifuge client.

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use prost::Message;
use tokio::sync::{mpsc, oneshot, RwLock};
use tokio_util::sync::CancellationToken;

/// Boxed future for async callbacks.
pub type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

/// Token provider callback type.
pub type TokenCallback = Arc<dyn Fn() -> BoxFuture<'static, Result<String, Error>> + Send + Sync>;

use crate::backoff::Backoff;
use crate::error::Error;
use crate::proto;
use crate::subscription::{SubscriptionConfig, SubscriptionInner, SubscriptionState};
use crate::transport::Transport;
use crate::types::*;
use crate::Subscription;

const DEFAULT_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_SERVER_PING_DELAY: Duration = Duration::from_secs(10);
const EVENT_CHANNEL_BUFFER: usize = 64;
const COMMAND_CHANNEL_BUFFER: usize = 32;
const BACKOFF_RESET_THRESHOLD: Duration = Duration::from_secs(30);

/// Client state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum ClientState {
    /// Disconnected.
    #[default]
    Disconnected,
    /// Connecting.
    Connecting,
    /// Connected.
    Connected,
}

/// Client configuration.
#[derive(Clone)]
pub struct ClientConfig {
    /// WebSocket URL.
    pub url: String,
    /// Connection token.
    pub token: String,
    /// Client name.
    pub name: String,
    /// Client version.
    pub version: String,
    /// Custom data to send with connect.
    pub data: Option<Vec<u8>>,
    /// Custom headers to send with connect.
    pub headers: HashMap<String, String>,
    /// Minimum reconnect delay.
    pub min_reconnect_delay: Duration,
    /// Maximum reconnect delay.
    pub max_reconnect_delay: Duration,
    /// Callback to get a new token when refresh is needed.
    pub get_token: Option<TokenCallback>,
}

impl std::fmt::Debug for ClientConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ClientConfig")
            .field("url", &self.url)
            .field("token", &"[redacted]")
            .field("name", &self.name)
            .field("version", &self.version)
            .field("data", &self.data)
            .field("headers", &self.headers)
            .field("min_reconnect_delay", &self.min_reconnect_delay)
            .field("max_reconnect_delay", &self.max_reconnect_delay)
            .field("get_token", &self.get_token.as_ref().map(|_| "<callback>"))
            .finish()
    }
}

impl ClientConfig {
    /// Create a new client config.
    pub fn new(url: impl Into<String>, token: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            token: token.into(),
            name: "rust".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            data: None,
            headers: HashMap::new(),
            min_reconnect_delay: Duration::from_millis(500),
            max_reconnect_delay: Duration::from_secs(20),
            get_token: None,
        }
    }

    /// Set client name.
    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = name.into();
        self
    }

    /// Set client version.
    pub fn version(mut self, version: impl Into<String>) -> Self {
        self.version = version.into();
        self
    }

    /// Set custom data.
    pub fn data(mut self, data: Vec<u8>) -> Self {
        self.data = Some(data);
        self
    }

    /// Set custom headers.
    pub fn headers(mut self, headers: HashMap<String, String>) -> Self {
        self.headers = headers;
        self
    }

    /// Set a header.
    pub fn header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into(), value.into());
        self
    }

    /// Set token refresh callback.
    pub fn get_token<F, Fut>(mut self, f: F) -> Self
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = Result<String, Error>> + Send + 'static,
    {
        self.get_token = Some(Arc::new(move || Box::pin(f())));
        self
    }
}

type PendingRequest = oneshot::Sender<Result<proto::Reply, Error>>;

struct ClientInner {
    config: ClientConfig,
    state: ClientState,
    subscriptions: HashMap<String, SubscriptionInner>,
    pending: HashMap<u32, PendingRequest>,
    next_id: AtomicU32,
    event_tx: mpsc::Sender<ClientEvent>,
    cmd_tx: Option<mpsc::Sender<CommandRequest>>,
    /// Server ping interval (from ConnectResult).
    server_ping: Option<Duration>,
    /// Whether to respond with pong.
    send_pong: bool,
    /// Whether token refresh is required on next connect.
    refresh_required: bool,
}

struct CommandRequest {
    cmd: proto::Command,
    reply_tx: PendingRequest,
}

/// Centrifuge client.
#[derive(Clone)]
pub struct Client {
    inner: Arc<RwLock<ClientInner>>,
    shutdown: CancellationToken,
}

impl Client {
    /// Create a new client.
    pub fn new(config: ClientConfig) -> Self {
        let (event_tx, _) = mpsc::channel(EVENT_CHANNEL_BUFFER);

        Self {
            inner: Arc::new(RwLock::new(ClientInner {
                config,
                state: ClientState::Disconnected,
                subscriptions: HashMap::new(),
                pending: HashMap::new(),
                next_id: AtomicU32::new(1),
                event_tx,
                cmd_tx: None,
                server_ping: None,
                send_pong: false,
                refresh_required: false,
            })),
            shutdown: CancellationToken::new(),
        }
    }

    /// Get the event receiver.
    ///
    /// Call this before `connect()` to receive events.
    pub async fn events(&self) -> mpsc::Receiver<ClientEvent> {
        let (tx, rx) = mpsc::channel(EVENT_CHANNEL_BUFFER);
        self.inner.write().await.event_tx = tx;
        rx
    }

    /// Get current state.
    pub async fn state(&self) -> ClientState {
        self.inner.read().await.state
    }

    /// Check if connected.
    pub async fn is_connected(&self) -> bool {
        self.inner.read().await.state == ClientState::Connected
    }

    /// Connect to the server with automatic reconnection.
    ///
    /// This spawns a background task that maintains the connection.
    pub fn connect(&self) {
        let client = self.clone();
        tokio::spawn(async move {
            client.run().await;
        });
    }

    /// Run the client (blocking).
    pub async fn run(&self) {
        let mut backoff = {
            let inner = self.inner.read().await;
            Backoff::new(
                inner.config.min_reconnect_delay,
                inner.config.max_reconnect_delay,
            )
        };

        loop {
            if self.shutdown.is_cancelled() {
                return;
            }

            // Emit connecting event
            {
                let mut inner = self.inner.write().await;
                inner.state = ClientState::Connecting;
                let _ = inner.event_tx.send(ClientEvent::Connecting).await;
            }

            let start = Instant::now();

            match self.connect_and_run().await {
                Ok(()) => {
                    tracing::debug!("Connection closed normally");
                }
                Err(e) => {
                    tracing::warn!("Connection error: {}", e);

                    // Check if token refresh is needed for next connect
                    if e.requires_token_refresh() {
                        self.inner.write().await.refresh_required = true;
                    }

                    let inner = self.inner.read().await;
                    let _ = inner.event_tx.send(ClientEvent::Error(e.to_string())).await;
                }
            }

            // Cleanup
            {
                let mut inner = self.inner.write().await;
                inner.state = ClientState::Disconnected;
                inner.cmd_tx = None;
                let _ = inner
                    .event_tx
                    .send(ClientEvent::Disconnected {
                        code: 0,
                        reason: "Connection closed".to_string(),
                        reconnect: true,
                    })
                    .await;
            }

            if self.shutdown.is_cancelled() {
                return;
            }

            if start.elapsed() > BACKOFF_RESET_THRESHOLD {
                backoff.reset();
            }

            let delay = backoff.next_delay();
            tracing::debug!("Reconnecting in {:?}", delay);

            tokio::select! {
                _ = tokio::time::sleep(delay) => {}
                _ = self.shutdown.cancelled() => return,
            }
        }
    }

    async fn connect_and_run(&self) -> Result<(), Error> {
        let mut config = self.inner.read().await.config.clone();

        // Refresh token if required
        let refresh_required = self.inner.read().await.refresh_required;
        if refresh_required {
            if let Some(ref get_token) = config.get_token {
                match get_token().await {
                    Ok(new_token) => {
                        config.token = new_token.clone();
                        let mut inner = self.inner.write().await;
                        inner.config.token = new_token;
                        inner.refresh_required = false;
                    }
                    Err(e) => {
                        tracing::error!("Token refresh failed: {}", e);
                        return Err(e);
                    }
                }
            }
        }

        // Connect transport
        let mut transport = Transport::connect(&config.url).await?;

        // Build connect request with recovery subs
        let subs = self.build_recovery_subs().await;

        let connect_req = proto::ConnectRequest {
            token: config.token.clone(),
            name: config.name.clone(),
            version: config.version.clone(),
            data: config.data.clone().unwrap_or_default(),
            headers: config.headers.clone(),
            subs,
            ..Default::default()
        };

        let cmd = proto::Command {
            id: 1,
            connect: Some(connect_req),
            ..Default::default()
        };

        // Send connect and wait for result
        let reply = transport.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let connect_result = reply
            .connect
            .ok_or_else(|| Error::Protocol("No connect result".into()))?;

        // Extract server ping settings
        let server_ping = if connect_result.ping > 0 {
            Some(Duration::from_secs(connect_result.ping as u64))
        } else {
            None
        };
        let send_pong = connect_result.pong;

        tracing::info!(
            "Connected: client={}, version={}, ping={:?}",
            connect_result.client,
            connect_result.version,
            server_ping
        );

        let refresh_at = ttl_to_instant(connect_result.ttl, connect_result.expires);

        // Process server-side subscriptions from connect result
        let server_subs = connect_result.subs.clone();
        self.process_server_subs(server_subs).await;

        let (cmd_tx, mut cmd_rx) = mpsc::channel::<CommandRequest>(COMMAND_CHANNEL_BUFFER);
        {
            let mut inner = self.inner.write().await;
            inner.state = ClientState::Connected;
            inner.cmd_tx = Some(cmd_tx);
            inner.server_ping = server_ping;
            inner.send_pong = send_pong;
            let _ = inner
                .event_tx
                .send(ClientEvent::Connected(ConnectResult::from(connect_result)))
                .await;
        }

        // Resubscribe to client-side subscriptions
        self.resubscribe_all().await;

        // Main loop
        let ping_timeout = server_ping.map(|p| p + MAX_SERVER_PING_DELAY);
        let mut last_data = Instant::now();
        let mut refresh_at = refresh_at;

        loop {
            let timeout_future = async {
                if let Some(timeout) = ping_timeout {
                    tokio::time::sleep_until((last_data + timeout).into()).await;
                } else {
                    std::future::pending::<()>().await;
                }
            };

            let refresh_future = async {
                if let Some(at) = refresh_at {
                    tokio::time::sleep_until(at.into()).await;
                } else {
                    std::future::pending::<()>().await;
                }
            };

            tokio::select! {
                _ = self.shutdown.cancelled() => {
                    break;
                }

                // Ping timeout - no data from server
                _ = timeout_future => {
                    tracing::warn!("No ping from server, disconnecting");
                    return Err(Error::NoPing);
                }

                // Token refresh timer
                _ = refresh_future => {
                    match self.refresh_token(&mut transport).await {
                        Ok(new_refresh_at) => {
                            refresh_at = new_refresh_at;
                        }
                        Err(e) => {
                            tracing::warn!("Token refresh failed: {}", e);
                            // Mark for refresh on next reconnect
                            self.inner.write().await.refresh_required = true;
                            break;
                        }
                    }
                }

                // Outgoing commands
                Some(req) = cmd_rx.recv() => {
                    let mut cmd = req.cmd;
                    let id = self.inner.read().await.next_id.fetch_add(1, Ordering::Relaxed);
                    cmd.id = id;

                    // Store pending request
                    self.inner.write().await.pending.insert(id, req.reply_tx);

                    // Send command
                    let data = cmd.encode_length_delimited_to_vec();
                    if let Err(e) = transport.send_raw(data).await {
                        tracing::error!("Failed to send command: {}", e);
                        break;
                    }
                }

                // Incoming messages
                result = transport.read_message() => {
                    let reply = result?;
                    last_data = Instant::now();

                    self.handle_reply(reply, &mut transport).await?;
                }
            }
        }

        transport.close().await;
        Ok(())
    }

    async fn handle_reply(&self, reply: proto::Reply, transport: &mut Transport) -> Result<(), Error> {
        // Check if this is a reply to a pending request
        if reply.id > 0 {
            let tx = self.inner.write().await.pending.remove(&reply.id);
            if let Some(tx) = tx {
                let _ = tx.send(Ok(reply));
            }
            return Ok(());
        }

        // ID=0 means either a push or a server ping
        if let Some(push) = reply.push {
            self.handle_push(push).await;
            return Ok(());
        }

        // Empty reply with id=0 is a server ping - respond with pong
        let send_pong = self.inner.read().await.send_pong;
        if send_pong {
            let pong = proto::Command::default();
            let data = pong.encode_length_delimited_to_vec();
            transport.send_raw(data).await?;
            tracing::trace!("Sent pong");
        }

        Ok(())
    }

    async fn handle_push(&self, push: proto::Push) {
        let channel = push.channel.clone();

        // Handle different push types
        if let Some(pub_) = push.r#pub {
            let publication = Publication::from(pub_);
            let offset = publication.offset;

            // Update stream position
            {
                let mut inner = self.inner.write().await;
                if let Some(sub) = inner.subscriptions.get_mut(&channel) {
                    sub.update_position(offset);
                    let _ = sub
                        .event_tx
                        .send(SubscriptionEvent::Publication(publication))
                        .await;
                }
            }
        } else if let Some(join) = push.join {
            if let Some(info) = join.info {
                let inner = self.inner.read().await;
                if let Some(sub) = inner.subscriptions.get(&channel) {
                    let _ = sub
                        .event_tx
                        .send(SubscriptionEvent::Join(ClientInfo::from(info)))
                        .await;
                }
            }
        } else if let Some(leave) = push.leave {
            if let Some(info) = leave.info {
                let inner = self.inner.read().await;
                if let Some(sub) = inner.subscriptions.get(&channel) {
                    let _ = sub
                        .event_tx
                        .send(SubscriptionEvent::Leave(ClientInfo::from(info)))
                        .await;
                }
            }
        } else if let Some(unsub) = push.unsubscribe {
            let mut inner = self.inner.write().await;
            if let Some(sub) = inner.subscriptions.get_mut(&channel) {
                sub.state = SubscriptionState::Unsubscribed;
                let _ = sub
                    .event_tx
                    .send(SubscriptionEvent::Unsubscribed {
                        code: unsub.code,
                        reason: unsub.reason,
                    })
                    .await;
            }
        } else if let Some(msg) = push.message {
            let inner = self.inner.read().await;
            let _ = inner.event_tx.send(ClientEvent::Message(msg.data)).await;
        } else if let Some(disconnect) = push.disconnect {
            let inner = self.inner.read().await;
            let _ = inner
                .event_tx
                .send(ClientEvent::Disconnected {
                    code: disconnect.code,
                    reason: disconnect.reason.clone(),
                    reconnect: disconnect.reconnect,
                })
                .await;
        }
    }

    async fn build_recovery_subs(&self) -> HashMap<String, proto::SubscribeRequest> {
        let inner = self.inner.read().await;
        inner
            .subscriptions
            .iter()
            .filter(|(_, sub)| {
                sub.config.recoverable && sub.stream_position.is_some()
            })
            .map(|(channel, sub)| {
                (channel.clone(), sub.build_subscribe_request(true))
            })
            .collect()
    }

    async fn process_server_subs(&self, subs: HashMap<String, proto::SubscribeResult>) {
        let mut inner = self.inner.write().await;

        for (channel, result) in subs {
            if let Some(sub) = inner.subscriptions.get_mut(&channel) {
                let subscribe_result = SubscribeResult::from(result);
                sub.on_subscribed(&subscribe_result);

                // Emit subscribed event with recovered publications
                let _ = sub
                    .event_tx
                    .send(SubscriptionEvent::Subscribed(subscribe_result))
                    .await;
            }
        }
    }

    async fn resubscribe_all(&self) {
        let channels: Vec<String> = {
            let inner = self.inner.read().await;
            inner
                .subscriptions
                .iter()
                .filter(|(_, sub)| sub.state != SubscriptionState::Subscribed)
                .map(|(channel, _)| channel.clone())
                .collect()
        };

        for channel in channels {
            if let Err(e) = self.subscribe_internal(&channel).await {
                tracing::warn!("Failed to resubscribe to {}: {}", channel, e);
            }
        }
    }

    async fn subscribe_internal(&self, channel: &str) -> Result<SubscribeResult, Error> {
        let req = {
            let mut inner = self.inner.write().await;
            let sub = inner
                .subscriptions
                .get_mut(channel)
                .ok_or_else(|| Error::SubscriptionNotFound(channel.to_string()))?;

            sub.state = SubscriptionState::Subscribing;
            let _ = sub.event_tx.send(SubscriptionEvent::Subscribing).await;

            sub.build_subscribe_request(false)
        };

        let cmd = proto::Command {
            subscribe: Some(req),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .subscribe
            .ok_or_else(|| Error::Protocol("No subscribe result".into()))?;

        let subscribe_result = SubscribeResult::from(result);

        // Update subscription state
        {
            let mut inner = self.inner.write().await;
            if let Some(sub) = inner.subscriptions.get_mut(channel) {
                sub.on_subscribed(&subscribe_result);
                let _ = sub
                    .event_tx
                    .send(SubscriptionEvent::Subscribed(subscribe_result.clone()))
                    .await;
            }
        }

        Ok(subscribe_result)
    }

    async fn send_command(&self, cmd: proto::Command) -> Result<proto::Reply, Error> {
        let cmd_tx = {
            let inner = self.inner.read().await;
            inner.cmd_tx.clone().ok_or(Error::NotConnected)?
        };

        let (tx, rx) = oneshot::channel();
        cmd_tx
            .send(CommandRequest { cmd, reply_tx: tx })
            .await
            .map_err(|_| Error::NotConnected)?;

        tokio::time::timeout(DEFAULT_TIMEOUT, rx)
            .await
            .map_err(|_| Error::Timeout)?
            .map_err(|_| Error::ConnectionClosed)?
    }

    /// Subscribe to a channel.
    pub async fn subscribe(&self, config: SubscriptionConfig) -> Result<Subscription, Error> {
        let channel = config.channel.clone();

        {
            let inner = self.inner.read().await;
            if inner.subscriptions.contains_key(&channel) {
                return Err(Error::AlreadySubscribed(channel));
            }
        }

        let (event_tx, event_rx) = mpsc::channel(EVENT_CHANNEL_BUFFER);
        let sub_inner = SubscriptionInner::new(config, event_tx);

        {
            let mut inner = self.inner.write().await;
            inner.subscriptions.insert(channel.clone(), sub_inner);
        }

        // Subscribe if connected
        if self.is_connected().await {
            self.subscribe_internal(&channel).await?;
        }

        Ok(Subscription::new(channel, event_rx))
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
            return Err(Error::from_proto(err));
        }

        // Remove subscription
        {
            let mut inner = self.inner.write().await;
            inner.subscriptions.remove(channel);
        }

        Ok(())
    }

    /// Get presence for a channel.
    pub async fn presence(&self, channel: &str) -> Result<PresenceResult, Error> {
        let cmd = proto::Command {
            presence: Some(proto::PresenceRequest {
                channel: channel.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .presence
            .ok_or_else(|| Error::Protocol("No presence result".into()))?;

        Ok(PresenceResult::from(result))
    }

    /// Get presence stats for a channel.
    pub async fn presence_stats(&self, channel: &str) -> Result<PresenceStats, Error> {
        let cmd = proto::Command {
            presence_stats: Some(proto::PresenceStatsRequest {
                channel: channel.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .presence_stats
            .ok_or_else(|| Error::Protocol("No presence stats result".into()))?;

        Ok(PresenceStats::from(result))
    }

    /// Get history for a channel.
    pub async fn history(
        &self,
        channel: &str,
        limit: i32,
        since: Option<StreamPosition>,
        reverse: bool,
    ) -> Result<HistoryResult, Error> {
        let cmd = proto::Command {
            history: Some(proto::HistoryRequest {
                channel: channel.to_string(),
                limit,
                since: since.map(|p| proto::StreamPosition {
                    offset: p.offset,
                    epoch: p.epoch,
                }),
                reverse,
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .history
            .ok_or_else(|| Error::Protocol("No history result".into()))?;

        Ok(HistoryResult::from(result))
    }

    /// Publish to a channel.
    pub async fn publish(&self, channel: &str, data: Vec<u8>) -> Result<(), Error> {
        let cmd = proto::Command {
            publish: Some(proto::PublishRequest {
                channel: channel.to_string(),
                data,
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        Ok(())
    }

    /// Call a server-side RPC method.
    pub async fn rpc(&self, method: &str, data: Vec<u8>) -> Result<RpcResult, Error> {
        let cmd = proto::Command {
            rpc: Some(proto::RpcRequest {
                method: method.to_string(),
                data,
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .rpc
            .ok_or_else(|| Error::Protocol("No RPC result".into()))?;

        Ok(RpcResult::from(result))
    }

    /// Send asynchronous message to the server (no response expected).
    pub async fn send(&self, data: Vec<u8>) -> Result<(), Error> {
        let cmd = proto::Command {
            send: Some(proto::SendRequest { data }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        Ok(())
    }

    /// Refresh subscription token.
    pub async fn sub_refresh(&self, channel: &str, token: &str) -> Result<SubRefreshResult, Error> {
        let cmd = proto::Command {
            sub_refresh: Some(proto::SubRefreshRequest {
                channel: channel.to_string(),
                token: token.to_string(),
            }),
            ..Default::default()
        };

        let reply = self.send_command(cmd).await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .sub_refresh
            .ok_or_else(|| Error::Protocol("No sub refresh result".into()))?;

        Ok(SubRefreshResult::from(result))
    }

    /// Disconnect and stop reconnecting.
    pub fn disconnect(&self) {
        self.shutdown.cancel();
    }

    /// Refresh the connection token.
    async fn refresh_token(&self, transport: &mut Transport) -> Result<Option<Instant>, Error> {
        let get_token = {
            let inner = self.inner.read().await;
            inner.config.get_token.clone()
        };

        let Some(get_token) = get_token else {
            tracing::warn!("Token refresh requested but no get_token callback configured");
            return Ok(None);
        };

        // Get new token
        let new_token = get_token().await?;

        // Send refresh request
        let refresh_req = proto::RefreshRequest {
            token: new_token.clone(),
        };

        let cmd = proto::Command {
            id: self.inner.read().await.next_id.fetch_add(1, Ordering::Relaxed),
            refresh: Some(refresh_req),
            ..Default::default()
        };

        let data = cmd.encode_length_delimited_to_vec();
        transport.send_raw(data).await?;

        // Wait for reply
        let reply = transport.read_message().await?;

        if let Some(err) = reply.error {
            return Err(Error::from_proto(err));
        }

        let result = reply
            .refresh
            .ok_or_else(|| Error::Protocol("No refresh result".into()))?;

        // Update stored token
        {
            let mut inner = self.inner.write().await;
            inner.config.token = new_token;
            inner.refresh_required = false;
        }

        tracing::debug!("Token refreshed, expires={}, ttl={}", result.expires, result.ttl);

        Ok(ttl_to_instant(result.ttl, result.expires))
    }
}

/// Convert TTL seconds to an Instant, capping at i32::MAX ms to match centrifuge-js.
fn ttl_to_instant(ttl: u32, expires: bool) -> Option<Instant> {
    if expires && ttl > 0 {
        let ttl_ms = (ttl as u64 * 1000).min(i32::MAX as u64);
        Some(Instant::now() + Duration::from_millis(ttl_ms))
    } else {
        None
    }
}
