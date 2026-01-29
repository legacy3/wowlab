//! Centrifuge client for Rust.
//!
//! Accurate port of the official centrifuge-js client.
//!
//! # Example
//!
//! ```ignore
//! use centrifuge::{Client, ClientConfig};
//!
//! #[tokio::main]
//! async fn main() {
//!     let config = ClientConfig::new("wss://example.com", "token");
//!     let client = Client::new(config);
//!
//!     let mut events = client.events().await;
//!     client.connect();
//!
//!     while let Some(event) = events.recv().await {
//!         println!("Event: {:?}", event);
//!     }
//! }
//! ```

/// Result type alias for this crate.
pub type Result<T> = std::result::Result<T, Error>;

mod backoff;
mod client;
mod codes;
mod error;
mod presence;
mod subscription;
pub mod token;
mod transport;
mod types;

pub(crate) mod proto {
    #![allow(dead_code)] // Proto generates types we don't use
    include!(concat!(env!("OUT_DIR"), "/centrifugal.centrifuge.protocol.rs"));
}

pub use backoff::Backoff;
pub use client::{Client, ClientConfig, ClientState};
pub use codes::{disconnect, error as error_codes, unsubscribe, ws_close};
pub use error::Error;
pub use presence::Presence;
pub use subscription::{Subscription, SubscriptionConfig, SubscriptionState};
pub use types::*;
