//! Shared library for distributed simulation nodes.
//!
//! Used by both the GUI (`node-gui`) and headless (`node-headless`) binaries.

pub mod auth;
pub mod cache;
pub mod claim;
pub mod config;
mod core;
pub mod supabase;
pub mod update;
pub mod utils;
pub mod worker;

pub use auth::NodeKeypair;
pub use crate::core::{NodeCore, NodeCoreEvent};
pub use claim::ClaimError;
pub use config::NodeConfig;
pub use supabase::{
    ApiClient, ApiError, ChunkPayload, NodePayload, RealtimeEvent, RotationResponse,
};
pub use worker::{WorkItem, WorkResult, WorkerPool};

use std::time::Instant;

/// Statistics about node operation.
#[derive(Default, Clone, Debug)]
pub struct NodeStats {
    pub active_jobs: u32,
    pub completed_chunks: u64,
    pub sims_per_second: f64,
    pub busy_workers: u32,
    pub max_workers: u32,
    pub total_cores: u32,
    pub cpu_usage: f32,
}

/// Log entry for display.
#[derive(Clone, Debug)]
pub struct LogEntry {
    pub timestamp: Instant,
    pub level: LogLevel,
    pub message: String,
}

/// Log level for display.
#[derive(Clone, Copy, PartialEq, Default, Debug)]
pub enum LogLevel {
    #[default]
    Info,
    Warn,
    Error,
    Debug,
}

/// Current state of the node.
#[derive(Clone, Debug)]
pub enum NodeState {
    /// Verifying saved node is still valid.
    Verifying,
    /// Registering with the server.
    Registering,
    /// Waiting to be claimed by a user.
    Claiming { code: String },
    /// Fully operational.
    Running,
    /// Server unavailable (maintenance/outage).
    Unavailable,
}

/// Connection status to the realtime server.
#[derive(Clone, Copy, PartialEq, Debug, Default)]
pub enum ConnectionStatus {
    #[default]
    Connecting,
    Connected,
    Disconnected,
}
