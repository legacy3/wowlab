//! Subscription management.

use std::time::Duration;

use tokio::sync::mpsc;

use crate::proto;
use crate::types::{StreamPosition, SubscribeResult, SubscriptionEvent};

/// Subscription flag for channel compaction optimization.
pub const FLAG_CHANNEL_COMPACTION: i64 = 1;

/// Subscription state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SubscriptionState {
    /// Not subscribed.
    #[default]
    Unsubscribed,
    /// Subscription in progress.
    Subscribing,
    /// Subscribed.
    Subscribed,
}

/// Configuration for a subscription.
#[derive(Debug, Clone)]
pub struct SubscriptionConfig {
    /// Channel name.
    pub channel: String,
    /// Subscription token (if required).
    pub token: Option<String>,
    /// Custom data to send with subscribe.
    pub data: Option<Vec<u8>>,
    /// Enable positioning (offset tracking).
    pub positioned: bool,
    /// Enable recovery.
    pub recoverable: bool,
    /// Receive join/leave events.
    pub join_leave: bool,
    /// Delta compression format (e.g., "fossil").
    pub delta: Option<String>,
    /// Tags filter for server-side filtering.
    pub tags_filter: Option<proto::FilterNode>,
    /// Minimum resubscribe delay.
    pub min_resubscribe_delay: Duration,
    /// Maximum resubscribe delay.
    pub max_resubscribe_delay: Duration,
}

impl SubscriptionConfig {
    /// Create a new subscription config for a channel.
    pub fn new(channel: impl Into<String>) -> Self {
        Self {
            channel: channel.into(),
            token: None,
            data: None,
            positioned: false,
            recoverable: false,
            join_leave: false,
            delta: None,
            tags_filter: None,
            min_resubscribe_delay: Duration::from_millis(500),
            max_resubscribe_delay: Duration::from_secs(20),
        }
    }

    /// Set subscription token.
    pub fn token(mut self, token: impl Into<String>) -> Self {
        self.token = Some(token.into());
        self
    }

    /// Set custom data.
    pub fn data(mut self, data: Vec<u8>) -> Self {
        self.data = Some(data);
        self
    }

    /// Enable positioning.
    pub fn positioned(mut self, enabled: bool) -> Self {
        self.positioned = enabled;
        self
    }

    /// Enable recovery.
    pub fn recoverable(mut self, enabled: bool) -> Self {
        self.recoverable = enabled;
        self
    }

    /// Enable join/leave events.
    pub fn join_leave(mut self, enabled: bool) -> Self {
        self.join_leave = enabled;
        self
    }

    /// Set delta compression format.
    pub fn delta(mut self, format: impl Into<String>) -> Self {
        self.delta = Some(format.into());
        self
    }

    /// Set tags filter for server-side filtering.
    pub fn tags_filter(mut self, filter: proto::FilterNode) -> Self {
        self.tags_filter = Some(filter);
        self
    }
}

/// Internal subscription state.
pub(crate) struct SubscriptionInner {
    pub config: SubscriptionConfig,
    pub state: SubscriptionState,
    pub stream_position: Option<StreamPosition>,
    pub event_tx: mpsc::Sender<SubscriptionEvent>,
}

impl SubscriptionInner {
    pub fn new(config: SubscriptionConfig, event_tx: mpsc::Sender<SubscriptionEvent>) -> Self {
        Self {
            config,
            state: SubscriptionState::Unsubscribed,
            stream_position: None,
            event_tx,
        }
    }

    /// Update state after successful subscribe.
    pub fn on_subscribed(&mut self, result: &SubscribeResult) {
        self.state = SubscriptionState::Subscribed;

        if result.recoverable {
            self.stream_position = Some(StreamPosition {
                offset: result.offset,
                epoch: result.epoch.clone(),
            });
        }
    }

    /// Update stream position from publication.
    pub fn update_position(&mut self, offset: u64) {
        if let Some(ref mut pos) = self.stream_position {
            pos.offset = offset;
        }
    }

    /// Build subscribe request.
    pub fn build_subscribe_request(&self, recover: bool) -> proto::SubscribeRequest {
        let mut req = proto::SubscribeRequest {
            channel: self.config.channel.clone(),
            token: self.config.token.clone().unwrap_or_default(),
            data: self.config.data.clone().unwrap_or_default(),
            positioned: self.config.positioned,
            recoverable: self.config.recoverable,
            join_leave: self.config.join_leave,
            delta: self.config.delta.clone().unwrap_or_default(),
            tf: self.config.tags_filter.clone(),
            flag: FLAG_CHANNEL_COMPACTION,
            ..Default::default()
        };

        if recover {
            if let Some(ref pos) = self.stream_position {
                req.recover = true;
                req.offset = pos.offset;
                req.epoch = pos.epoch.clone();
            }
        }

        req
    }
}

/// Handle to a subscription.
///
/// Use this to receive events from the subscription.
#[derive(Debug)]
pub struct Subscription {
    /// Channel name.
    pub channel: String,
    /// Event receiver.
    event_rx: mpsc::Receiver<SubscriptionEvent>,
}

impl Subscription {
    pub(crate) fn new(channel: String, event_rx: mpsc::Receiver<SubscriptionEvent>) -> Self {
        Self { channel, event_rx }
    }

    /// Receive the next event.
    pub async fn recv(&mut self) -> Option<SubscriptionEvent> {
        self.event_rx.recv().await
    }

    /// Try to receive an event without blocking.
    pub fn try_recv(&mut self) -> Option<SubscriptionEvent> {
        self.event_rx.try_recv().ok()
    }
}
