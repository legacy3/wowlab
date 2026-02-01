//! Core node logic and state machine.

use crate::sentinel::SentinelClient;
use crate::{
    cache::{CachedConfig, ConfigCache},
    claim,
    config::NodeConfig,
    queries,
    realtime::NodeRealtime,
    utils::backoff::ExponentialBackoff,
    ChunkPayload, ConnectionStatus, NodePayload, NodeState, NodeStats, RealtimeEvent, WorkItem,
    WorkResult, WorkerPool,
};
use std::sync::Arc;
use std::time::Duration;
use tokio::runtime::Handle;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
use wowlab_supabase::SupabaseClient;

/// Events emitted by `NodeCore`.
#[derive(Debug, Clone)]
pub enum NodeCoreEvent {
    /// State transition.
    StateChanged(NodeState),
    /// Realtime connection change.
    ConnectionChanged(ConnectionStatus),
    /// Chunk assigned.
    ChunkAssigned { id: Uuid, iterations: i32 },
    /// Chunk completed.
    ChunkCompleted { id: Uuid, mean_dps: f32 },
    /// Chunk failed.
    ChunkFailed { id: Uuid, error: String },
    /// Error.
    Error(String),
}

enum RegisterResult {
    Success { id: Uuid, token: Option<String> },
    Failed(String),
}

/// Main node controller with event-driven architecture.
pub struct NodeCore {
    runtime: Arc<tokio::runtime::Runtime>,
    config: NodeConfig,
    sentinel: SentinelClient,
    supabase: SupabaseClient,
    worker_pool: WorkerPool,
    state: NodeState,
    connection_status: ConnectionStatus,
    node_id: Option<Uuid>,
    node_name: String,
    max_parallel: u32,
    total_cores: u32,

    app_name: String,
    app_version: String,

    cache: Arc<ConfigCache>,

    verify_rx: Option<mpsc::Receiver<Option<bool>>>,
    register_rx: Option<mpsc::Receiver<RegisterResult>>,
    realtime_rx: Option<mpsc::Receiver<RealtimeEvent>>,
    realtime_shutdown: Option<CancellationToken>,
    result_rx: Option<mpsc::Receiver<WorkResult>>,

    backoff: ExponentialBackoff,

    event_tx: mpsc::Sender<NodeCoreEvent>,

    started: bool,
}

impl NodeCore {
    pub fn new(
        runtime: Arc<tokio::runtime::Runtime>,
        app_name: impl Into<String>,
        app_version: impl Into<String>,
    ) -> Result<(Self, mpsc::Receiver<NodeCoreEvent>), crate::sentinel::SentinelError> {
        let config = NodeConfig::load_or_create();
        let keypair = crate::auth::NodeKeypair::load_or_create();
        let sentinel = SentinelClient::new(config.sentinel_url.clone(), Arc::new(keypair))?;
        let supabase = SupabaseClient::new(&config.api_url, &config.anon_key)
            .map_err(|e| crate::sentinel::SentinelError::ClientBuild(e.to_string()))?;
        let total_cores = claim::total_cores().unsigned_abs();
        let enabled_cores = claim::default_enabled_cores().unsigned_abs();

        if let Err(e) = rayon::ThreadPoolBuilder::new()
            .num_threads(enabled_cores as usize)
            .build_global()
        {
            tracing::warn!("Failed to configure rayon thread pool: {e}");
        }

        let state = if config.node_id.is_some() {
            NodeState::Verifying
        } else if config.claim_token.is_some() {
            NodeState::Registering
        } else {
            NodeState::Setup
        };

        let (event_tx, event_rx) = mpsc::channel(32);

        let core = Self {
            runtime,
            state,
            sentinel,
            supabase,
            worker_pool: WorkerPool::new(enabled_cores as usize),
            node_id: config.node_id,
            node_name: claim::default_name(),
            max_parallel: enabled_cores,
            total_cores,
            app_name: app_name.into(),
            app_version: app_version.into(),
            cache: Arc::new(ConfigCache::new()),
            connection_status: ConnectionStatus::Connecting,
            verify_rx: None,
            register_rx: None,
            realtime_rx: None,
            realtime_shutdown: None,
            result_rx: None,
            backoff: ExponentialBackoff::new(Duration::from_secs(5), Duration::from_secs(5 * 60)),
            event_tx,
            config,
            started: false,
        };

        Ok((core, event_rx))
    }

    /// Start async tasks. Call once after creation.
    pub fn start(&mut self) {
        if self.started {
            return;
        }
        self.started = true;

        self.worker_pool.start(self.runtime.handle());
        self.result_rx = self.worker_pool.result_rx();

        match self.state {
            NodeState::Verifying => self.start_verification(),
            NodeState::Registering => self.start_registration(),
            NodeState::Setup | NodeState::Running | NodeState::Unavailable => {}
        }
    }

    /// Set claim token and start registration.
    pub fn set_claim_token(&mut self, token: String) {
        self.config.claim_token = Some(token);
        self.state = NodeState::Registering;
        let _ = self
            .event_tx
            .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
        self.start_registration();
    }

    /// Poll for updates. Call periodically.
    pub fn poll(&mut self) -> bool {
        self.check_verification();
        self.check_registration();
        self.check_realtime_events();
        self.check_work_results();
        self.check_retry();

        true
    }

    pub fn state(&self) -> &NodeState {
        &self.state
    }

    pub fn connection_status(&self) -> ConnectionStatus {
        self.connection_status
    }

    pub fn node_id(&self) -> Option<Uuid> {
        self.node_id
    }

    pub fn node_name(&self) -> &str {
        &self.node_name
    }

    pub fn stats(&self) -> NodeStats {
        let mut stats = self.worker_pool.stats();
        stats.max_workers = self.max_parallel;
        stats.total_cores = self.total_cores;
        stats
    }

    pub fn time_until_retry(&self) -> Option<Duration> {
        self.backoff.time_until_retry()
    }

    pub fn unlink(&self) -> bool {
        NodeConfig::delete()
    }

    pub fn runtime_handle(&self) -> &Handle {
        self.runtime.handle()
    }

    fn start_verification(&mut self) {
        let (tx, rx) = mpsc::channel(1);
        self.verify_rx = Some(rx);
        let sentinel = self.sentinel.clone();

        tracing::info!("Verifying node...");

        self.runtime.spawn(async move {
            // Some(true) = valid, Some(false) = invalid/not claimed, None = server unavailable
            let result: Option<bool> = match sentinel.verify().await {
                Ok(()) => Some(true),
                Err(e) => {
                    let err_str = e.to_string();
                    if err_str.contains("not found") || err_str.contains("not claimed") {
                        Some(false)
                    } else {
                        None
                    }
                }
            };
            let _ = tx.send(result).await;
        });
    }

    fn check_verification(&mut self) {
        let Some(ref mut rx) = self.verify_rx else {
            return;
        };

        match rx.try_recv() {
            Ok(Some(true)) => {
                tracing::info!("Node verified, starting...");
                self.verify_rx = None;
                self.backoff.reset();
                self.state = NodeState::Running;
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
                if let Some(id) = self.node_id {
                    self.start_realtime(id);
                }
            }
            Ok(Some(false)) => {
                tracing::warn!("Node invalid or not claimed, re-registering...");
                self.verify_rx = None;
                self.node_id = None;
                self.config.clear_node_id();
                self.state = NodeState::Registering;
                let _ = self
                    .event_tx
                    .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
                self.start_registration();
            }
            Ok(None) => {
                tracing::error!("Server unavailable, please check https://wowlab.gg/status");
                self.verify_rx = None;
                self.set_unavailable();
            }
            Err(mpsc::error::TryRecvError::Empty) => {}
            Err(mpsc::error::TryRecvError::Disconnected) => {
                self.verify_rx = None;
            }
        }
    }

    fn set_unavailable(&mut self) {
        self.state = NodeState::Unavailable;
        let _ = self.backoff.next_retry_at();
        tracing::info!(
            "Will retry in {} seconds",
            self.backoff.current_backoff().as_secs()
        );
        let _ = self
            .event_tx
            .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
    }

    fn check_retry(&mut self) {
        if !matches!(self.state, NodeState::Unavailable) {
            return;
        }

        if !self.backoff.should_retry() {
            return;
        }

        self.backoff.on_retry();

        tracing::info!("Retrying connection...");

        if self.node_id.is_some() {
            self.state = NodeState::Verifying;
            let _ = self
                .event_tx
                .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
            self.start_verification();
        } else {
            self.state = NodeState::Registering;
            let _ = self
                .event_tx
                .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
            self.start_registration();
        }
    }

    fn start_registration(&mut self) {
        let (tx, rx) = mpsc::channel(1);
        self.register_rx = Some(rx);
        let sentinel = self.sentinel.clone();
        let claim_token = self.config.claim_token.clone();

        self.runtime.spawn(async move {
            match claim::register(&sentinel, claim_token.as_deref()).await {
                Ok((id, token)) => {
                    let _ = tx.send(RegisterResult::Success { id, token }).await;
                }
                Err(e) => {
                    tracing::error!("Registration failed: {}", e);
                    let _ = tx.send(RegisterResult::Failed(e.to_string())).await;
                }
            }
        });
    }

    fn start_realtime(&mut self, node_id: Uuid) {
        if let Some(token) = self.realtime_shutdown.take() {
            token.cancel();
        }

        let Some(beacon_token) = self.config.beacon_token.as_ref() else {
            tracing::warn!("No beacon token available, skipping realtime connection");
            return;
        };

        let shutdown = CancellationToken::new();
        let realtime = NodeRealtime::new(
            &self.config.beacon_url,
            beacon_token,
            &self.app_name,
            &self.app_version,
        );
        self.realtime_rx =
            Some(realtime.subscribe(node_id, self.runtime.handle(), shutdown.clone()));
        self.realtime_shutdown = Some(shutdown);
    }

    fn check_registration(&mut self) {
        let Some(ref mut rx) = self.register_rx else {
            return;
        };

        match rx.try_recv() {
            Ok(RegisterResult::Success { id, token }) => {
                self.node_id = Some(id);
                self.config.set_node_id(id);

                if let Some(t) = token {
                    self.config.set_beacon_token(t);
                }

                self.backoff.reset();
                self.state = NodeState::Running;
                tracing::info!("Registered node {id}, now running");
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

                // Invalid token -> back to setup, otherwise treat as unavailable
                if err.contains("Invalid claim token") || err.contains("401") {
                    self.config.claim_token = None;
                    self.state = NodeState::Setup;
                    let _ = self
                        .event_tx
                        .try_send(NodeCoreEvent::StateChanged(self.state.clone()));
                } else {
                    self.set_unavailable();
                }
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
                    if let Some(id) = self.node_id {
                        tracing::info!("Realtime channel dropped, restarting subscription");
                        self.start_realtime(id);
                    }
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
            RealtimeEvent::Error(ref err) => {
                tracing::warn!("Connection error: {err}");
                let _ = self.event_tx.try_send(NodeCoreEvent::Error(err.clone()));
            }
        }
    }

    fn handle_node_update(&mut self, payload: &NodePayload) {
        self.node_name.clone_from(&payload.name);
        self.max_parallel = payload.max_parallel.unsigned_abs();
        self.total_cores = payload.total_cores.unsigned_abs();
    }

    fn process_chunk(&mut self, payload: &ChunkPayload) {
        let chunk_id = payload.id;
        let config_hash = payload.config_hash.clone();
        let iterations = payload.iterations as u32;
        let seed_offset = payload.seed_offset as u64;
        let supabase = self.supabase.clone();
        let cache = Arc::clone(&self.cache);
        let work_tx = self.worker_pool.work_tx();

        self.runtime.spawn(async move {
            let config_json = match cache.get_config(&config_hash) {
                Some(c) => {
                    tracing::debug!("Config cache hit: {}", &config_hash[..8]);
                    c
                }
                None => {
                    tracing::debug!("Config cache miss, fetching: {}", &config_hash[..8]);
                    match queries::fetch_config(&supabase, &config_hash).await {
                        Ok(row) => {
                            let rotation_id = row
                                .config
                                .get("rotationId")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .to_string();

                            let cached = CachedConfig {
                                config_json: row.config,
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

            let rotation_script =
                match queries::fetch_rotation(&supabase, &config_json.rotation_id).await {
                    Ok(rotation) => {
                        match cache.get_rotation(&config_json.rotation_id, &rotation.checksum) {
                            Some(script) => script,
                            None => {
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

            let mut combined = config_json.config_json.clone();
            if let Some(obj) = combined.as_object_mut() {
                obj.insert(
                    "rotation".to_string(),
                    serde_json::Value::String(rotation_script),
                );
            }

            let work_item = WorkItem {
                chunk_id,
                config_json: combined.to_string(),
                iterations,
                seed_offset,
            };

            if let Some(tx) = work_tx {
                if let Err(e) = tx.send(work_item).await {
                    tracing::error!("Failed to submit work: {}", e);
                }
            }
        });
    }

    fn check_work_results(&mut self) {
        let Some(ref mut rx) = self.result_rx else {
            return;
        };

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

        for result in results {
            self.handle_work_result(result);
        }
    }

    fn handle_work_result(&self, result: WorkResult) {
        let chunk_id = result.chunk_id;
        let sentinel = self.sentinel.clone();
        let event_tx = self.event_tx.clone();

        let mean_dps = result
            .result
            .get("meanDps")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0) as f32;

        self.runtime.spawn(async move {
            match sentinel.complete_chunk(chunk_id, result.result).await {
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
