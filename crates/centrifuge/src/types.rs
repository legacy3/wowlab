//! Public types for the Centrifuge client.

use std::collections::HashMap;

/// Information about a connected client.
#[derive(Debug, Clone, Default)]
pub struct ClientInfo {
    /// User ID.
    pub user: String,
    /// Client ID.
    pub client: String,
    /// Connection info (custom data).
    pub conn_info: Vec<u8>,
    /// Channel info (custom data).
    pub chan_info: Vec<u8>,
}

impl From<crate::proto::ClientInfo> for ClientInfo {
    fn from(info: crate::proto::ClientInfo) -> Self {
        Self {
            user: info.user,
            client: info.client,
            conn_info: info.conn_info,
            chan_info: info.chan_info,
        }
    }
}

/// A publication in a channel.
#[derive(Debug, Clone)]
pub struct Publication {
    /// Publication data.
    pub data: Vec<u8>,
    /// Publisher info (if available).
    pub info: Option<ClientInfo>,
    /// Stream offset.
    pub offset: u64,
    /// Publication tags.
    pub tags: HashMap<String, String>,
    /// Whether data is a delta from previous.
    pub delta: bool,
    /// Publication timestamp (Unix ms).
    pub time: i64,
    /// Channel name (for wildcard subscriptions).
    pub channel: Option<String>,
}

impl From<crate::proto::Publication> for Publication {
    fn from(pub_: crate::proto::Publication) -> Self {
        Self {
            data: pub_.data,
            info: pub_.info.map(ClientInfo::from),
            offset: pub_.offset,
            tags: pub_.tags,
            delta: pub_.delta,
            time: pub_.time,
            channel: if pub_.channel.is_empty() {
                None
            } else {
                Some(pub_.channel)
            },
        }
    }
}

/// Stream position for recovery.
#[derive(Debug, Clone, Default)]
pub struct StreamPosition {
    /// Stream offset.
    pub offset: u64,
    /// Stream epoch.
    pub epoch: String,
}

impl From<crate::proto::StreamPosition> for StreamPosition {
    fn from(pos: crate::proto::StreamPosition) -> Self {
        Self {
            offset: pos.offset,
            epoch: pos.epoch,
        }
    }
}

/// Connection information from server.
#[derive(Debug, Clone)]
pub struct ConnectResult {
    /// Client ID assigned by server.
    pub client: String,
    /// Server version.
    pub version: String,
    /// Whether token expires.
    pub expires: bool,
    /// TTL in seconds (if expires).
    pub ttl: u32,
    /// Custom data from server.
    pub data: Vec<u8>,
    /// Server ping interval in seconds.
    pub ping: u32,
    /// Whether to respond with pong.
    pub pong: bool,
    /// Session ID.
    pub session: String,
    /// Node ID.
    pub node: String,
    /// Server time (Unix ms).
    pub time: i64,
}

impl From<crate::proto::ConnectResult> for ConnectResult {
    fn from(result: crate::proto::ConnectResult) -> Self {
        Self {
            client: result.client,
            version: result.version,
            expires: result.expires,
            ttl: result.ttl,
            data: result.data,
            ping: result.ping,
            pong: result.pong,
            session: result.session,
            node: result.node,
            time: result.time,
        }
    }
}

/// Subscription result from server.
#[derive(Debug, Clone)]
pub struct SubscribeResult {
    /// Whether subscription expires.
    pub expires: bool,
    /// TTL in seconds (if expires).
    pub ttl: u32,
    /// Whether subscription is recoverable.
    pub recoverable: bool,
    /// Stream epoch.
    pub epoch: String,
    /// Initial publications (for recovery).
    pub publications: Vec<Publication>,
    /// Whether recovery was successful.
    pub recovered: bool,
    /// Current stream offset.
    pub offset: u64,
    /// Whether positioning is enabled.
    pub positioned: bool,
    /// Custom data from server.
    pub data: Vec<u8>,
    /// Whether client was recovering.
    pub was_recovering: bool,
    /// Whether delta compression is enabled.
    pub delta: bool,
}

impl From<crate::proto::SubscribeResult> for SubscribeResult {
    fn from(result: crate::proto::SubscribeResult) -> Self {
        Self {
            expires: result.expires,
            ttl: result.ttl,
            recoverable: result.recoverable,
            epoch: result.epoch,
            publications: result.publications.into_iter().map(Publication::from).collect(),
            recovered: result.recovered,
            offset: result.offset,
            positioned: result.positioned,
            data: result.data,
            was_recovering: result.was_recovering,
            delta: result.delta,
        }
    }
}

/// Client event.
#[derive(Debug, Clone)]
pub enum ClientEvent {
    /// Client is connecting.
    Connecting,
    /// Client connected.
    Connected(ConnectResult),
    /// Client disconnected.
    Disconnected {
        code: u32,
        reason: String,
        reconnect: bool,
    },
    /// Error occurred.
    Error(String),
    /// Server-to-client message (not pub/sub).
    Message(Vec<u8>),
}

/// Subscription event.
#[derive(Debug, Clone)]
pub enum SubscriptionEvent {
    /// Subscription is subscribing.
    Subscribing,
    /// Subscription succeeded.
    Subscribed(SubscribeResult),
    /// Subscription ended.
    Unsubscribed { code: u32, reason: String },
    /// Publication received.
    Publication(Publication),
    /// Client joined channel.
    Join(ClientInfo),
    /// Client left channel.
    Leave(ClientInfo),
    /// Error occurred.
    Error(String),
}

/// Presence information for a channel.
#[derive(Debug, Clone, Default)]
pub struct PresenceResult {
    /// Map of client ID to client info.
    pub presence: HashMap<String, ClientInfo>,
}

impl From<crate::proto::PresenceResult> for PresenceResult {
    fn from(result: crate::proto::PresenceResult) -> Self {
        Self {
            presence: result
                .presence
                .into_iter()
                .map(|(k, v)| (k, ClientInfo::from(v)))
                .collect(),
        }
    }
}

/// Presence statistics for a channel.
#[derive(Debug, Clone, Default)]
pub struct PresenceStats {
    /// Number of clients.
    pub num_clients: u32,
    /// Number of unique users.
    pub num_users: u32,
}

impl From<crate::proto::PresenceStatsResult> for PresenceStats {
    fn from(result: crate::proto::PresenceStatsResult) -> Self {
        Self {
            num_clients: result.num_clients,
            num_users: result.num_users,
        }
    }
}

/// History result for a channel.
#[derive(Debug, Clone, Default)]
pub struct HistoryResult {
    /// Publications in history.
    pub publications: Vec<Publication>,
    /// Stream epoch.
    pub epoch: String,
    /// Current stream offset.
    pub offset: u64,
}

impl From<crate::proto::HistoryResult> for HistoryResult {
    fn from(result: crate::proto::HistoryResult) -> Self {
        Self {
            publications: result.publications.into_iter().map(Publication::from).collect(),
            epoch: result.epoch,
            offset: result.offset,
        }
    }
}

/// RPC result from server.
#[derive(Debug, Clone, Default)]
pub struct RpcResult {
    /// Response data.
    pub data: Vec<u8>,
}

impl From<crate::proto::RpcResult> for RpcResult {
    fn from(result: crate::proto::RpcResult) -> Self {
        Self { data: result.data }
    }
}

/// Subscription refresh result from server.
#[derive(Debug, Clone, Default)]
pub struct SubRefreshResult {
    /// Whether subscription expires.
    pub expires: bool,
    /// TTL in seconds (if expires).
    pub ttl: u32,
}

impl From<crate::proto::SubRefreshResult> for SubRefreshResult {
    fn from(result: crate::proto::SubRefreshResult) -> Self {
        Self {
            expires: result.expires,
            ttl: result.ttl,
        }
    }
}
