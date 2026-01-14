//! Core node logic that can be used by both GUI and headless binaries.

use crate::{
    cache::{CachedConfig, ConfigCache},
    claim,
    config::NodeConfig,
    supabase::SupabaseRealtime,
    ApiClient, ChunkPayload, ConnectionStatus, NodePayload, NodeState, NodeStats, RealtimeEvent,
    WorkItem, WorkResult, WorkerPool,
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
    /// Chunk simulation completed.
    ChunkCompleted { id: Uuid, mean_dps: f32 },
    /// Chunk simulation failed.
    ChunkFailed { id: Uuid, error: String },
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

    // Local cache for configs and rotations
    cache: Arc<ConfigCache>,

    // Async task receivers
    register_rx: Option<mpsc::Receiver<RegisterResult>>,
    realtime_rx: Option<mpsc::Receiver<RealtimeEvent>>,
    claim_rx: Option<mpsc::Receiver<bool>>,
    result_rx: Option<mpsc::Receiver<WorkResult>>,

    // Timing
    last_heartbeat: Option<Instant>,
    last_claim_poll: Option<Instant>,

    // Event output
    event_tx: mpsc::Sender<NodeCoreEvent>,

    started: bool,
}

impl NodeCore {
    /// Creates a new instance and returns it with an event receiver.
    pub fn new(
        runtime: Arc<tokio::runtime::Runtime>,
    ) -> Result<(Self, mpsc::Receiver<NodeCoreEvent>), crate::supabase::ApiError> {
        let config = NodeConfig::load_or_create();
        let api = ApiClient::new(config.api_url.clone())?;
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
            cache: Arc::new(ConfigCache::new()),
            connection_status: ConnectionStatus::Connecting,
            register_rx: None,
            realtime_rx: None,
            claim_rx: None,
            result_rx: None,
            last_heartbeat: None,
            last_claim_poll: None,
            event_tx,
            config,
            started: false,
        };

        Ok((core, event_rx))
    }

    /// Start async tasks (registration, realtime, worker pool).
    /// Call this once after creation.
    pub fn start(&mut self) {
        if self.started {
            return;
        }
        self.started = true;

        self.worker_pool.start(self.runtime.handle());
        self.result_rx = self.worker_pool.result_rx();

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
        self.check_work_results();

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
                // Claim any available work on connect (handles orphaned chunks)
                self.claim_work();
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
                self.process_chunk(payload);
            }
            RealtimeEvent::WorkAvailable(ref payload) => {
                tracing::info!(
                    "Work available broadcast: reason={:?}, chunks={:?}",
                    payload.reason,
                    payload.chunks
                );
                self.claim_work();
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

    fn process_chunk(&mut self, payload: &ChunkPayload) {
        let Some(node_id) = self.node_id else { return };
        let chunk_id = payload.id;
        let api = self.api.clone();

        // Clone what we need for the worker pool submission
        let work_tx = self.worker_pool.work_tx();

        self.runtime.spawn(async move {
            // 1. Claim the chunk and get config
            match api.claim_chunk(chunk_id, node_id).await {
                Ok(claim) => {
                    tracing::info!(
                        "Claimed chunk {} ({} iterations)",
                        chunk_id,
                        claim.iterations
                    );

                    // 2. Submit to worker pool
                    let work_item = WorkItem {
                        chunk_id,
                        config_json: claim.config.to_string(),
                        iterations: claim.iterations as u32,
                        seed_offset: claim.seed_offset as u64,
                    };

                    if let Some(tx) = work_tx {
                        if let Err(e) = tx.send(work_item).await {
                            tracing::error!("Failed to submit work: {}", e);
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to claim chunk {}: {}", chunk_id, e);
                }
            }
        });
    }

    fn check_work_results(&mut self) {
        let Some(ref mut rx) = self.result_rx else {
            return;
        };

        // Collect up to 10 results
        let mut results = Vec::new();
        let mut disconnected = false;
        for _ in 0..10 {
            match rx.try_recv() {
                Ok(result) => results.push(result),
                Err(mpsc::error::TryRecvError::Empty) => break,
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    disconnected = true;
                    break;
                }
            }
        }

        if disconnected {
            self.result_rx = None;
        }

        // Process results outside the borrow
        let had_results = !results.is_empty();
        for result in results {
            self.handle_work_result(result);
        }

        // After completing work, try to claim more
        if had_results {
            self.claim_work();
        }
    }

    /// Claim available work from the server using the pull-based API.
    /// Called on connect and when work-available broadcasts are received.
    fn claim_work(&mut self) {
        // Only claim if we're fully running and connected
        if !matches!(self.state, NodeState::Running) {
            return;
        }
        if self.connection_status != ConnectionStatus::Connected {
            return;
        }

        let Some(node_id) = self.node_id else { return };

        // Calculate available capacity
        let stats = self.worker_pool.stats();
        let available = stats.max_workers.saturating_sub(stats.busy_workers);
        if available == 0 {
            tracing::debug!("No available worker capacity, skipping claim");
            return;
        }

        let api = self.api.clone();
        let cache = Arc::clone(&self.cache);
        let work_tx = self.worker_pool.work_tx();
        let event_tx = self.event_tx.clone();

        self.runtime.spawn(async move {
            match api.claim_work(node_id, available).await {
                Ok(response) => {
                    if response.chunks.is_empty() {
                        tracing::debug!("No work available");
                        return;
                    }

                    // Get configHash from response
                    let Some(config_hash) = response.config_hash else {
                        tracing::warn!("Claim response missing configHash");
                        return;
                    };

                    tracing::info!(
                        "Claimed {} chunks (config_hash: {})",
                        response.chunks.len(),
                        &config_hash[..8]
                    );

                    // 1. Get config (from cache or fetch)
                    let cached_config = match cache.get_config(&config_hash) {
                        Some(c) => {
                            tracing::debug!("Config cache hit: {}", &config_hash[..8]);
                            c
                        }
                        None => {
                            tracing::debug!("Config cache miss, fetching: {}", &config_hash[..8]);
                            match api.fetch_config(&config_hash).await {
                                Ok(config_json) => {
                                    // Extract rotationId from config
                                    let rotation_id = config_json
                                        .get("rotationId")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or_default()
                                        .to_string();

                                    let cached = CachedConfig {
                                        config_json: config_json.clone(),
                                        rotation_id,
                                    };
                                    cache.insert_config(config_hash.clone(), cached.clone());
                                    cached
                                }
                                Err(e) => {
                                    tracing::error!("Failed to fetch config: {}", e);
                                    return;
                                }
                            }
                        }
                    };

                    // 2. Get rotation script (always fetch to get checksum, then check cache)
                    let rotation_script = match api.fetch_rotation(&cached_config.rotation_id).await
                    {
                        Ok(rotation) => {
                            // Check if we have it cached with matching checksum
                            match cache
                                .get_rotation(&cached_config.rotation_id, &rotation.checksum)
                            {
                                Some(script) => {
                                    tracing::debug!("Rotation cache hit: {}", &rotation.id[..8]);
                                    script
                                }
                                None => {
                                    tracing::debug!(
                                        "Rotation cache miss/stale, using fetched: {}",
                                        &rotation.id[..8]
                                    );
                                    cache.insert_rotation(
                                        rotation.id.clone(),
                                        rotation.script.clone(),
                                        rotation.checksum,
                                    );
                                    rotation.script
                                }
                            }
                        }
                        Err(e) => {
                            tracing::error!("Failed to fetch rotation: {}", e);
                            return;
                        }
                    };

                    // 3. Build combined JSON (config + rotation) for SimRunner
                    let mut combined = cached_config.config_json.clone();
                    if let Some(obj) = combined.as_object_mut() {
                        obj.insert(
                            "rotation".to_string(),
                            serde_json::Value::String(rotation_script),
                        );
                    }
                    let config_json = combined.to_string();

                    // 4. Submit each chunk to the worker pool
                    for chunk in response.chunks {
                        let _ = event_tx
                            .send(NodeCoreEvent::ChunkAssigned {
                                id: chunk.id,
                                iterations: chunk.iterations,
                            })
                            .await;

                        let work_item = WorkItem {
                            chunk_id: chunk.id,
                            config_json: config_json.clone(),
                            iterations: chunk.iterations as u32,
                            seed_offset: chunk.seed_offset as u64,
                        };

                        if let Some(ref tx) = work_tx {
                            if let Err(e) = tx.send(work_item).await {
                                tracing::error!("Failed to submit work: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::debug!("Failed to claim work: {}", e);
                }
            }
        });
    }

    fn handle_work_result(&self, result: WorkResult) {
        let chunk_id = result.chunk_id;
        let api = self.api.clone();
        let event_tx = self.event_tx.clone();

        // Extract mean_dps from result for the event
        let mean_dps = result
            .result
            .get("mean_dps")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0) as f32;

        self.runtime.spawn(async move {
            match api.complete_chunk(chunk_id, result.result).await {
                Ok(()) => {
                    tracing::info!("Chunk {} completed: {:.0} DPS", chunk_id, mean_dps);
                    let _ = event_tx
                        .send(NodeCoreEvent::ChunkCompleted {
                            id: chunk_id,
                            mean_dps,
                        })
                        .await;
                }
                Err(e) => {
                    tracing::error!("Failed to submit chunk {} result: {}", chunk_id, e);
                    let _ = event_tx
                        .send(NodeCoreEvent::ChunkFailed {
                            id: chunk_id,
                            error: e.to_string(),
                        })
                        .await;
                }
            }
        });
    }
}
