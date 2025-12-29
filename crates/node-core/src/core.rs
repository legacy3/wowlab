//! Core node logic that can be used by both GUI and headless binaries.

use crate::{
    claim, config::NodeConfig, supabase::SupabaseRealtime, ApiClient, ConnectionStatus,
    NodePayload, NodeState, NodeStats, RealtimeEvent, WorkerPool,
};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use uuid::Uuid;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5 * 60);
const CLAIM_POLL_INTERVAL: Duration = Duration::from_secs(3);

/// Events emitted by `NodeCore` for the UI/CLI to handle.
#[derive(Debug, Clone)]
pub enum NodeCoreEvent {
    /// State changed (registering -> claiming -> running).
    StateChanged(NodeState),
    /// Connection status changed.
    ConnectionChanged(ConnectionStatus),
    /// Node was claimed by a user.
    Claimed,
    /// Chunk was assigned to this node.
    ChunkAssigned { id: Uuid, iterations: i32 },
    /// Error occurred.
    Error(String),
}

enum RegisterResult {
    Success { id: Uuid, code: String },
    Failed(String),
}

/// Core node logic, independent of GUI.
pub struct NodeCore {
    runtime: Arc<tokio::runtime::Runtime>,
    config: NodeConfig,
    api: ApiClient,
    worker_pool: WorkerPool,
    state: NodeState,
    connection_status: ConnectionStatus,
    node_id: Option<Uuid>,
    node_name: String,
    max_parallel: u32,
    total_cores: u32,

    // Async task receivers
    register_rx: Option<mpsc::Receiver<RegisterResult>>,
    realtime_rx: Option<mpsc::Receiver<RealtimeEvent>>,
    claim_rx: Option<mpsc::Receiver<bool>>,

    // Timing
    last_heartbeat: Option<Instant>,
    last_claim_poll: Option<Instant>,

    // Event output
    event_tx: mpsc::Sender<NodeCoreEvent>,

    started: bool,
}

impl NodeCore {
    /// Creates a new instance and returns it with an event receiver.
    pub fn new(runtime: Arc<tokio::runtime::Runtime>) -> (Self, mpsc::Receiver<NodeCoreEvent>) {
        let config = NodeConfig::load_or_create();
        let api = ApiClient::new(config.api_url.clone());
        let total_cores = claim::total_cores().unsigned_abs();
        let enabled_cores = claim::default_enabled_cores().unsigned_abs();

        let state = if config.node_id.is_some() {
            NodeState::Running
        } else {
            NodeState::Registering
        };

        let (event_tx, event_rx) = mpsc::channel(32);

        let core = Self {
            runtime,
            state,
            api,
            worker_pool: WorkerPool::new(enabled_cores as usize),
            node_id: config.node_id,
            node_name: claim::default_name(),
            max_parallel: enabled_cores,
            total_cores,
            connection_status: ConnectionStatus::Connecting,
            register_rx: None,
            realtime_rx: None,
            claim_rx: None,
            last_heartbeat: None,
            last_claim_poll: None,
            event_tx,
            config,
            started: false,
        };

        (core, event_rx)
    }

    /// Start async tasks (registration, realtime, worker pool).
    /// Call this once after creation.
    pub fn start(&mut self) {
        if self.started {
            return;
        }
        self.started = true;

        self.worker_pool.start(self.runtime.handle());

        match self.node_id {
            Some(id) => self.start_realtime(id),
            None => self.start_registration(),
        }
    }

    /// Poll for updates. Call this periodically (e.g., every 100ms).
    /// Returns true if there are pending events.
    pub fn poll(&mut self) -> bool {
        self.check_registration();
        self.check_realtime_events();
        self.check_heartbeat();
        self.poll_claim_status();
        self.check_claim_result();

        // Return whether we made progress
        true
    }

    /// Get current node state.
    pub fn state(&self) -> &NodeState {
        &self.state
    }

    /// Get connection status.
    pub fn connection_status(&self) -> ConnectionStatus {
        self.connection_status
    }

    /// Get node ID if registered.
    pub fn node_id(&self) -> Option<Uuid> {
        self.node_id
    }

    /// Get node name.
    pub fn node_name(&self) -> &str {
        &self.node_name
    }

    /// Get current stats.
    pub fn stats(&self) -> NodeStats {
        let mut stats = self.worker_pool.stats();
        stats.max_workers = self.max_parallel;
        stats.total_cores = self.total_cores;
        stats
    }

    /// Get the claim code if in claiming state.
    pub fn claim_code(&self) -> Option<&str> {
        match &self.state {
            NodeState::Claiming { code } => Some(code),
            _ => None,
        }
    }

    /// Unlink this node (delete config).
    pub fn unlink(&self) -> bool {
        NodeConfig::delete()
    }

    /// Get the runtime handle.
    pub fn runtime_handle(&self) -> &Handle {
        self.runtime.handle()
    }

    fn start_registration(&mut self) {
        let (tx, rx) = mpsc::channel(1);
        self.register_rx = Some(rx);
        let api = self.api.clone();

        self.runtime.spawn(async move {
            match claim::register(&api).await {
                Ok((id, code)) => {
                    let _ = tx.send(RegisterResult::Success { id, code }).await;
                }
                Err(e) => {
                    tracing::error!("Registration failed: {}", e);
                    let _ = tx.send(RegisterResult::Failed(e.to_string())).await;
                }
            }
        });
    }

    fn start_realtime(&mut self, node_id: Uuid) {
        let realtime = Arc::new(SupabaseRealtime::new(
            self.config.api_url.clone(),
            self.config.anon_key.clone(),
        ));
        self.realtime_rx = Some(realtime.subscribe(node_id, self.runtime.handle()));
    }

    fn check_registration(&mut self) {
        let Some(ref mut rx) = self.register_rx else {
            return;
        };

        match rx.try_recv() {
            Ok(RegisterResult::Success { id, code }) => {
                self.node_id = Some(id);
                self.config.set_node_id(id);
                self.state = NodeState::Claiming { code: code.clone() };
                tracing::info!("Registered! Claim code: {code}");
                self.register_rx = None;
                self.start_realtime(id);
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
            }
            Ok(RegisterResult::Failed(ref err)) => {
                tracing::error!("Registration failed: {err}");
                self.register_rx = None;
                let _ = self.event_tx.try_send(NodeCoreEvent::Error(err.clone()));
            }
            Err(mpsc::error::TryRecvError::Empty) => {}
            Err(mpsc::error::TryRecvError::Disconnected) => {
                self.register_rx = None;
            }
        }
    }

    fn check_realtime_events(&mut self) {
        let Some(ref mut rx) = self.realtime_rx else {
            return;
        };

        let mut events = Vec::new();
        for _ in 0..10 {
            match rx.try_recv() {
                Ok(event) => events.push(event),
                Err(mpsc::error::TryRecvError::Empty) => break,
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    self.realtime_rx = None;
                    self.connection_status = ConnectionStatus::Disconnected;
                    let _ = self
                        .event_tx
                        .try_send(NodeCoreEvent::ConnectionChanged(self.connection_status));
                    return;
                }
            }
        }

        for event in events {
            self.handle_realtime_event(&event);
        }
    }

    fn handle_realtime_event(&mut self, event: &RealtimeEvent) {
        match event {
            RealtimeEvent::Connected => {
                self.connection_status = ConnectionStatus::Connected;
                tracing::info!("Connected");
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::ConnectionChanged(self.connection_status));
                self.send_heartbeat();
            }
            RealtimeEvent::Disconnected => {
                self.connection_status = ConnectionStatus::Disconnected;
                tracing::info!("Disconnected, reconnecting...");
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::ConnectionChanged(self.connection_status));
            }
            RealtimeEvent::NodeUpdated(ref payload) => self.handle_node_update(payload),
            RealtimeEvent::ChunkAssigned(ref payload) => {
                tracing::info!(
                    "Chunk assigned: {} ({} iterations)",
                    payload.id,
                    payload.iterations
                );
                let _ = self.event_tx.try_send(NodeCoreEvent::ChunkAssigned {
                    id: payload.id,
                    iterations: payload.iterations,
                });
            }
            RealtimeEvent::Error(ref err) => {
                tracing::warn!("Connection error: {err}");
                let _ = self.event_tx.try_send(NodeCoreEvent::Error(err.clone()));
            }
        }
    }

    fn handle_node_update(&mut self, payload: &NodePayload) {
        if payload.user_id.is_some() && matches!(self.state, NodeState::Claiming { .. }) {
            tracing::info!("Node claimed successfully!");
            self.state = NodeState::Running;
            let _ = self
                .event_tx
                .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
            let _ = self.event_tx.try_send(NodeCoreEvent::Claimed);
        }

        self.node_name.clone_from(&payload.name);
        self.max_parallel = payload.max_parallel.unsigned_abs();
        self.total_cores = payload.total_cores.unsigned_abs();
    }

    fn send_heartbeat(&mut self) {
        let Some(node_id) = self.node_id else { return };
        self.last_heartbeat = Some(Instant::now());
        let api = self.api.clone();

        self.runtime.spawn(async move {
            if let Err(e) = api.set_online(node_id).await {
                tracing::debug!("Heartbeat failed: {}", e);
            }
        });
    }

    fn check_heartbeat(&mut self) {
        if self.connection_status != ConnectionStatus::Connected {
            return;
        }

        let should_send = match self.last_heartbeat {
            Some(last) => last.elapsed() >= HEARTBEAT_INTERVAL,
            None => true,
        };

        if should_send {
            self.send_heartbeat();
        }
    }

    fn poll_claim_status(&mut self) {
        if !matches!(self.state, NodeState::Claiming { .. }) {
            return;
        }

        let should_poll = match self.last_claim_poll {
            Some(last) => last.elapsed() >= CLAIM_POLL_INTERVAL,
            None => true,
        };

        if !should_poll || self.claim_rx.is_some() {
            return;
        }

        let Some(node_id) = self.node_id else { return };
        self.last_claim_poll = Some(Instant::now());

        let (tx, rx) = mpsc::channel(1);
        self.claim_rx = Some(rx);
        let api = self.api.clone();

        self.runtime.spawn(async move {
            let claimed = api.set_online(node_id).await.is_ok();
            let _ = tx.send(claimed).await;
        });
    }

    fn check_claim_result(&mut self) {
        let Some(ref mut rx) = self.claim_rx else {
            return;
        };

        match rx.try_recv() {
            Ok(true) => {
                tracing::info!("Node claimed successfully!");
                self.state = NodeState::Running;
                self.claim_rx = None;
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
                let _ = self.event_tx.try_send(NodeCoreEvent::Claimed);
            }
            Ok(false) => {
                self.claim_rx = None;
            }
            Err(mpsc::error::TryRecvError::Empty) => {}
            Err(mpsc::error::TryRecvError::Disconnected) => {
                self.claim_rx = None;
            }
        }
    }
}
