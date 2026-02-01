//! Shared library for distributed simulation nodes.

pub mod auth;
pub mod cache;
pub mod claim;
pub mod config;
mod core;
pub mod queries;
pub mod realtime;
pub mod sentinel;
pub mod update;
pub mod utils;
pub mod worker;

pub use crate::core::{NodeCore, NodeCoreEvent};
pub use auth::NodeKeypair;
pub use claim::ClaimError;
pub use config::NodeConfig;
pub use queries::{ConfigRow, RotationRow};
pub use realtime::{ChunkPayload, NodePayload, NodeRealtime, RealtimeEvent};
pub use sentinel::{RegisterResponse, SentinelClient, SentinelError};
pub use worker::{WorkItem, WorkResult, WorkerPool};

use std::time::Instant;

/// Runtime statistics for UI display.
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

/// Log entry for UI display.
#[derive(Clone, Debug)]
pub struct LogEntry {
    pub timestamp: Instant,
    pub level: LogLevel,
    pub message: String,
}

/// Log level for UI display.
#[derive(Clone, Copy, PartialEq, Default, Debug)]
pub enum LogLevel {
    #[default]
    Info,
    Warn,
    Error,
    Debug,
}

/// Node lifecycle state.
#[derive(Clone, Debug)]
pub enum NodeState {
    /// Needs claim token to register.
    Setup,
    /// Verifying saved node is still valid.
    Verifying,
    /// Registering with the server.
    Registering,
    /// Fully operational.
    Running,
    /// Node not found in database (needs re-registration).
    NotFound,
    /// Server unavailable (maintenance/outage).
    Unavailable,
}

/// Realtime connection status.
#[derive(Clone, Copy, PartialEq, Debug, Default)]
pub enum ConnectionStatus {
    #[default]
    Connecting,
    Connected,
    Disconnected,
}
