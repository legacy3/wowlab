//! Public types for the Centrifuge client.

use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct ClientInfo {
    pub user: String,
    pub client: String,
    pub conn_info: Vec<u8>,
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

#[derive(Debug, Clone)]
pub struct Publication {
    pub data: Vec<u8>,
    pub info: Option<ClientInfo>,
    pub offset: u64,
    pub tags: HashMap<String, String>,
    pub delta: bool,
    pub time: i64,
    /// For wildcard subscriptions.
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

#[derive(Debug, Clone, Default)]
pub struct StreamPosition {
    pub offset: u64,
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

#[derive(Debug, Clone)]
pub struct ConnectResult {
    pub client: String,
    pub version: String,
    pub expires: bool,
    pub ttl: u32,
    pub data: Vec<u8>,
    pub ping: u32,
    pub pong: bool,
    pub session: String,
    pub node: String,
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

#[derive(Debug, Clone)]
pub struct SubscribeResult {
    pub expires: bool,
    pub ttl: u32,
    pub recoverable: bool,
    pub epoch: String,
    pub publications: Vec<Publication>,
    pub recovered: bool,
    pub offset: u64,
    pub positioned: bool,
    pub data: Vec<u8>,
    pub was_recovering: bool,
    pub delta: bool,
}

impl From<crate::proto::SubscribeResult> for SubscribeResult {
    fn from(result: crate::proto::SubscribeResult) -> Self {
        Self {
            expires: result.expires,
            ttl: result.ttl,
            recoverable: result.recoverable,
            epoch: result.epoch,
            publications: result
                .publications
                .into_iter()
                .map(Publication::from)
                .collect(),
            recovered: result.recovered,
            offset: result.offset,
            positioned: result.positioned,
            data: result.data,
            was_recovering: result.was_recovering,
            delta: result.delta,
        }
    }
}

#[derive(Debug, Clone)]
pub enum ClientEvent {
    Connecting,
    Connected(ConnectResult),
    Disconnected {
        code: u32,
        reason: String,
        reconnect: bool,
    },
    Error(String),
    Message(Vec<u8>),
}

#[derive(Debug, Clone)]
pub enum SubscriptionEvent {
    Subscribing,
    Subscribed(SubscribeResult),
    Unsubscribed { code: u32, reason: String },
    Publication(Publication),
    Join(ClientInfo),
    Leave(ClientInfo),
    Error(String),
}

#[derive(Debug, Clone, Default)]
pub struct PresenceResult {
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

#[derive(Debug, Clone, Default)]
pub struct PresenceStats {
    pub num_clients: u32,
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

#[derive(Debug, Clone, Default)]
pub struct HistoryResult {
    pub publications: Vec<Publication>,
    pub epoch: String,
    pub offset: u64,
}

impl From<crate::proto::HistoryResult> for HistoryResult {
    fn from(result: crate::proto::HistoryResult) -> Self {
        Self {
            publications: result
                .publications
                .into_iter()
                .map(Publication::from)
                .collect(),
            epoch: result.epoch,
            offset: result.offset,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct RpcResult {
    pub data: Vec<u8>,
}

impl From<crate::proto::RpcResult> for RpcResult {
    fn from(result: crate::proto::RpcResult) -> Self {
        Self { data: result.data }
    }
}

#[derive(Debug, Clone, Default)]
pub struct SubRefreshResult {
    pub expires: bool,
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
