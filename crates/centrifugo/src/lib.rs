//! Centrifugo client for WoW Lab.
//!
//! Clean async implementation supporting:
//! - WebSocket connection with auto-reconnect
//! - Channel subscriptions with publications, join/leave events
//! - Presence queries
//! - HTTP API for server-side publish

mod proto {
    include!(concat!(env!("OUT_DIR"), "/centrifugo.rs"));
}

mod api;
mod client;
mod error;
mod events;

pub use api::CentrifugoApi;
pub use client::{Client, ClientConfig, Subscription};
pub use error::Error;
pub use events::{ClientInfo, Event, Publication};
pub use proto::{PresenceResult, PresenceStatsResult};
