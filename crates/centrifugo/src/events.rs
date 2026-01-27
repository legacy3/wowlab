//! Event types for subscriptions.

use serde::{Deserialize, Serialize};

/// Information about a connected client.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientInfo {
    pub user: String,
    pub client: String,
}

impl From<crate::proto::ClientInfo> for ClientInfo {
    fn from(info: crate::proto::ClientInfo) -> Self {
        Self {
            user: info.user,
            client: info.client,
        }
    }
}

/// A publication received on a channel.
#[derive(Debug, Clone)]
pub struct Publication {
    pub data: Vec<u8>,
    pub offset: u64,
    pub info: Option<ClientInfo>,
}

impl From<crate::proto::Publication> for Publication {
    fn from(pub_: crate::proto::Publication) -> Self {
        Self {
            data: pub_.data,
            offset: pub_.offset,
            info: pub_.info.map(Into::into),
        }
    }
}

/// Events received on a subscription.
#[derive(Debug, Clone)]
pub enum Event {
    /// A message was published to the channel.
    Publication(Publication),
    /// A client joined the channel (presence enabled).
    Join(ClientInfo),
    /// A client left the channel (presence enabled).
    Leave(ClientInfo),
    /// Subscription was established.
    Subscribed,
    /// Subscription ended.
    Unsubscribed {
        code: u32,
        reason: String,
    },
    /// Connection state changed.
    Connected,
    Disconnected,
    /// An error occurred.
    Error(String),
}
