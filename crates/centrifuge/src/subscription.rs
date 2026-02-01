//! Subscription management.

use std::time::Duration;

use tokio::sync::mpsc;

use crate::proto;
use crate::types::{StreamPosition, SubscribeResult, SubscriptionEvent};

pub const FLAG_CHANNEL_COMPACTION: i64 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SubscriptionState {
    #[default]
    Unsubscribed,
    Subscribing,
    Subscribed,
}

#[derive(Debug, Clone)]
pub struct SubscriptionConfig {
    pub channel: String,
    pub token: Option<String>,
    pub data: Option<Vec<u8>>,
    pub positioned: bool,
    pub recoverable: bool,
    pub join_leave: bool,
    pub delta: Option<String>,
    pub tags_filter: Option<proto::FilterNode>,
    pub min_resubscribe_delay: Duration,
    pub max_resubscribe_delay: Duration,
}

impl SubscriptionConfig {
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

    pub fn token(mut self, token: impl Into<String>) -> Self {
        self.token = Some(token.into());
        self
    }

    pub fn data(mut self, data: Vec<u8>) -> Self {
        self.data = Some(data);
        self
    }

    pub fn positioned(mut self, enabled: bool) -> Self {
        self.positioned = enabled;
        self
    }

    pub fn recoverable(mut self, enabled: bool) -> Self {
        self.recoverable = enabled;
        self
    }

    pub fn join_leave(mut self, enabled: bool) -> Self {
        self.join_leave = enabled;
        self
    }

    pub fn delta(mut self, format: impl Into<String>) -> Self {
        self.delta = Some(format.into());
        self
    }

    pub fn tags_filter(mut self, filter: proto::FilterNode) -> Self {
        self.tags_filter = Some(filter);
        self
    }
}

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

    pub fn on_subscribed(&mut self, result: &SubscribeResult) {
        self.state = SubscriptionState::Subscribed;

        if result.recoverable {
            self.stream_position = Some(StreamPosition {
                offset: result.offset,
                epoch: result.epoch.clone(),
            });
        }
    }

    pub fn update_position(&mut self, offset: u64) {
        if let Some(ref mut pos) = self.stream_position {
            pos.offset = offset;
        }
    }

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

#[derive(Debug)]
pub struct Subscription {
    pub channel: String,
    event_rx: mpsc::Receiver<SubscriptionEvent>,
}

impl Subscription {
    pub(crate) fn new(channel: String, event_rx: mpsc::Receiver<SubscriptionEvent>) -> Self {
        Self { channel, event_rx }
    }

    pub async fn recv(&mut self) -> Option<SubscriptionEvent> {
        self.event_rx.recv().await
    }

    pub fn try_recv(&mut self) -> Option<SubscriptionEvent> {
        self.event_rx.try_recv().ok()
    }
}
