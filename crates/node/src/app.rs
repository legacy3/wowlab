//! Main application state and egui App implementation

use crate::{
    claim,
    config::NodeConfig,
    supabase::{ApiClient, NodePayload, RealtimeEvent, SupabaseRealtime},
    ui::{
        claim_view, dashboard,
        icons::{icon, Icon},
        logs,
        theme::*,
    },
    worker::WorkerPool,
};
use std::{
    collections::VecDeque,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::runtime::Runtime;
use tokio::sync::mpsc;

/// Log entry for the scrolling log view
#[derive(Clone)]
pub struct LogEntry {
    pub timestamp: Instant,
    pub level: LogLevel,
    pub message: String,
}

#[derive(Clone, Copy, PartialEq)]
#[allow(dead_code)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
    Debug,
}

impl LogLevel {
    #[allow(dead_code)]
    pub fn color(&self) -> egui::Color32 {
        match self {
            LogLevel::Info => egui::Color32::WHITE,
            LogLevel::Warn => egui::Color32::YELLOW,
            LogLevel::Error => egui::Color32::from_rgb(255, 100, 100),
            LogLevel::Debug => egui::Color32::GRAY,
        }
    }
}

/// Statistics about node operation
#[derive(Default, Clone)]
pub struct NodeStats {
    pub active_jobs: u32,
    pub completed_chunks: u64,
    pub sims_per_second: f64,
    pub busy_workers: u32,
    pub max_workers: u32,
    pub cpu_usage: f32,
}

/// Application state enum
pub enum AppState {
    /// Registering with server
    Registering,
    /// Showing claim code, waiting for user to claim via Realtime
    Claiming { code: String },
    /// Normal operation - dashboard view
    Dashboard { stats: NodeStats },
}

/// Connection status for the Realtime WebSocket
#[derive(Clone, Copy, PartialEq)]
pub enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
}

/// Main application struct
pub struct NodeApp {
    runtime: Arc<Runtime>,
    state: AppState,
    config: NodeConfig,
    api: ApiClient,
    worker_pool: WorkerPool,
    logs: VecDeque<LogEntry>,
    max_logs: usize,

    // Async communication
    register_rx: Option<mpsc::Receiver<RegisterResult>>,
    realtime_rx: Option<mpsc::Receiver<RealtimeEvent>>,
    node_id: Option<uuid::Uuid>,

    // UI state
    current_tab: Tab,

    // Track if we've started async tasks
    started: bool,

    // Logo texture
    logo: Option<egui::TextureHandle>,

    // Node settings (from Realtime updates)
    node_name: String,
    max_parallel: u32,

    // Connection status
    connection_status: ConnectionStatus,

    // Heartbeat tracking (5 min interval)
    last_heartbeat: Option<Instant>,
}

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
}

enum RegisterResult {
    Success { id: uuid::Uuid, code: String },
    Failed(String),
}

impl NodeApp {
    pub fn new(_cc: &eframe::CreationContext<'_>, runtime: Arc<Runtime>) -> Self {
        let config = NodeConfig::load_or_create();
        let api = ApiClient::new(config.api_url.clone());

        // Use OS defaults until we get server settings via Realtime
        let default_cores = claim::get_default_cores() as u32;

        let state = if config.node_id.is_some() {
            // Already registered, go to dashboard (will connect to Realtime)
            AppState::Dashboard {
                stats: NodeStats {
                    max_workers: default_cores,
                    ..Default::default()
                },
            }
        } else {
            // Need to register with server
            AppState::Registering
        };

        let worker_pool = WorkerPool::new(default_cores as usize);
        let node_id = config.node_id;

        let mut app = Self {
            runtime,
            state,
            config,
            api,
            worker_pool,
            logs: VecDeque::with_capacity(100),
            max_logs: 100,
            register_rx: None,
            realtime_rx: None,
            node_id,
            current_tab: Tab::Status,
            started: false,
            logo: None,
            node_name: claim::get_default_name(),
            max_parallel: default_cores,
            connection_status: ConnectionStatus::Connecting,
            last_heartbeat: None,
        };

        app.log(LogLevel::Info, "WoW Lab Node started");
        app
    }

    /// Start async tasks (called on first update when we're in the runtime context)
    fn start_async_tasks(&mut self) {
        if self.started {
            return;
        }
        self.started = true;

        // Start the worker pool
        self.worker_pool.start(self.runtime.handle());

        if let Some(node_id) = self.node_id {
            // Already registered, connect to Realtime
            self.start_realtime(node_id);
        } else {
            // Need to register first
            self.start_registration();
        }
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

    fn start_realtime(&mut self, node_id: uuid::Uuid) {
        let realtime = Arc::new(SupabaseRealtime::new(
            self.config.api_url.clone(),
            self.config.anon_key.clone(),
        ));

        let (tx, rx) = mpsc::channel(32);
        self.realtime_rx = Some(rx);

        let rt = self.runtime.clone();
        rt.spawn(async move {
            match realtime.subscribe(node_id).await {
                Ok(mut event_rx) => {
                    while let Some(event) = event_rx.recv().await {
                        if tx.send(event).await.is_err() {
                            break;
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to start Realtime: {}", e);
                    let _ = tx.send(RealtimeEvent::Error(e.to_string())).await;
                }
            }
        });
    }

    pub fn log(&mut self, level: LogLevel, message: impl Into<String>) {
        let entry = LogEntry {
            timestamp: Instant::now(),
            level,
            message: message.into(),
        };

        if self.logs.len() >= self.max_logs {
            self.logs.pop_front();
        }
        self.logs.push_back(entry);
    }

    fn check_registration(&mut self) {
        if let Some(ref mut rx) = self.register_rx {
            match rx.try_recv() {
                Ok(RegisterResult::Success { id, code }) => {
                    self.node_id = Some(id);
                    self.config.set_node_id(id);
                    self.state = AppState::Claiming { code: code.clone() };
                    self.log(LogLevel::Info, format!("Registered! Claim code: {}", code));
                    self.register_rx = None;

                    // Start Realtime to listen for claim
                    self.start_realtime(id);
                }
                Ok(RegisterResult::Failed(err)) => {
                    self.log(LogLevel::Error, format!("Registration failed: {}", err));
                    self.register_rx = None;
                }
                Err(mpsc::error::TryRecvError::Empty) => {
                    // Still waiting
                }
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    self.register_rx = None;
                }
            }
        }
    }

    fn check_realtime_events(&mut self) {
        // Collect events first to avoid borrow issues
        let mut events = Vec::new();
        let mut disconnected = false;

        if let Some(ref mut rx) = self.realtime_rx {
            loop {
                match rx.try_recv() {
                    Ok(event) => events.push(event),
                    Err(mpsc::error::TryRecvError::Empty) => break,
                    Err(mpsc::error::TryRecvError::Disconnected) => {
                        disconnected = true;
                        break;
                    }
                }
            }
        }

        // Process collected events
        for event in events {
            self.handle_realtime_event(event);
        }

        if disconnected {
            self.realtime_rx = None;
            self.connection_status = ConnectionStatus::Disconnected;
        }
    }

    fn handle_realtime_event(&mut self, event: RealtimeEvent) {
        match event {
            RealtimeEvent::Connected => {
                self.connection_status = ConnectionStatus::Connected;
                self.log(LogLevel::Info, "Connected to Realtime");
                // Update status to online (sets lastSeenAt)
                self.send_online_status();
            }
            RealtimeEvent::Disconnected => {
                self.connection_status = ConnectionStatus::Disconnected;
                self.log(LogLevel::Warn, "Disconnected from Realtime, reconnecting...");
            }
            RealtimeEvent::NodeUpdated(payload) => {
                self.handle_node_update(payload);
            }
            RealtimeEvent::ChunkAssigned(payload) => {
                self.log(
                    LogLevel::Info,
                    format!("Chunk assigned: {} ({} iterations)", payload.id, payload.iterations),
                );
                // TODO: Queue chunk for processing
            }
            RealtimeEvent::Error(err) => {
                self.log(LogLevel::Error, format!("Realtime error: {}", err));
            }
        }
    }

    fn send_online_status(&mut self) {
        if let Some(node_id) = self.node_id {
            self.last_heartbeat = Some(Instant::now());
            let api = self.api.clone();
            self.runtime.spawn(async move {
                if let Err(e) = api.set_online(node_id).await {
                    tracing::warn!("Failed to set online status: {}", e);
                }
            });
        }
    }

    /// Send heartbeat every 5 minutes while connected
    fn check_heartbeat(&mut self) {
        const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5 * 60);

        if self.connection_status != ConnectionStatus::Connected {
            return;
        }

        let should_send = match self.last_heartbeat {
            Some(last) => last.elapsed() >= HEARTBEAT_INTERVAL,
            None => true,
        };

        if should_send {
            self.send_online_status();
        }
    }

    fn handle_node_update(&mut self, payload: NodePayload) {
        // Check if this is a claim event (user_id became set)
        if payload.user_id.is_some() {
            if matches!(self.state, AppState::Claiming { .. }) {
                // Node was just claimed!
                self.log(LogLevel::Info, "Node claimed successfully!");
                self.state = AppState::Dashboard {
                    stats: NodeStats {
                        max_workers: payload.max_parallel as u32,
                        ..Default::default()
                    },
                };
            }
        }

        // Always sync settings from server
        self.node_name = payload.name;
        self.max_parallel = payload.max_parallel as u32;

        // Update dashboard stats if in that state
        if let AppState::Dashboard { ref mut stats } = self.state {
            stats.max_workers = payload.max_parallel as u32;
        }
    }

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text, icon_char) = match (&self.state, self.connection_status) {
            (AppState::Registering, _) => (ZINC_500, "Registering", icon(Icon::Loader)),
            (AppState::Claiming { .. }, _) => (YELLOW_500, "Pending", icon(Icon::Clock)),
            (AppState::Dashboard { .. }, ConnectionStatus::Connected) => {
                (GREEN_500, "Online", icon(Icon::Wifi))
            }
            (AppState::Dashboard { .. }, ConnectionStatus::Connecting) => {
                (YELLOW_500, "Connecting", icon(Icon::Loader))
            }
            (AppState::Dashboard { .. }, ConnectionStatus::Disconnected) => {
                (RED_500, "Offline", icon(Icon::WifiOff))
            }
        };

        ui.horizontal(|ui| {
            ui.label(egui::RichText::new(icon_char).size(14.0).color(color));
            ui.label(egui::RichText::new(text).size(13.0).color(color));
        });
    }

    fn load_logo(&mut self, ctx: &egui::Context) {
        if self.logo.is_some() {
            return;
        }

        let icon_bytes = include_bytes!("../assets/icon.png");
        if let Ok(image) = image::load_from_memory(icon_bytes) {
            let rgba = image.into_rgba8();
            let (width, height) = (rgba.width() as usize, rgba.height() as usize);
            let pixels = rgba.into_raw();

            let color_image = egui::ColorImage::from_rgba_unmultiplied([width, height], &pixels);
            self.logo = Some(ctx.load_texture("logo", color_image, egui::TextureOptions::LINEAR));
        }
    }
}

impl eframe::App for NodeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Start async tasks on first update
        self.start_async_tasks();

        // Load logo texture on first frame
        self.load_logo(ctx);

        // Check for registration result
        self.check_registration();

        // Check for Realtime events
        self.check_realtime_events();

        // Periodic heartbeat (every 5 min)
        self.check_heartbeat();

        // Top bar with status
        egui::TopBottomPanel::top("header")
            .frame(
                egui::Frame::none()
                    .fill(ZINC_900)
                    .stroke(egui::Stroke::new(1.0, ZINC_800))
                    .inner_margin(egui::Margin::symmetric(16.0, 12.0)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    // Logo
                    if let Some(logo) = &self.logo {
                        ui.add(egui::Image::new(logo).fit_to_exact_size(egui::vec2(22.0, 22.0)));
                    }
                    ui.add_space(4.0);
                    ui.label(
                        egui::RichText::new("WoW Lab Node")
                            .size(16.0)
                            .strong()
                            .color(TEXT_PRIMARY),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        self.show_status_indicator(ui);
                    });
                });
            });

        // Main content
        egui::CentralPanel::default()
            .frame(
                egui::Frame::none()
                    .fill(ZINC_950)
                    .inner_margin(egui::Margin::same(16.0)),
            )
            .show(ctx, |ui| {
                match &self.state {
                    AppState::Registering => {
                        ui.vertical_centered(|ui| {
                            ui.add_space(60.0);
                            ui.add(egui::widgets::Spinner::new().size(32.0).color(GREEN_500));
                            ui.add_space(16.0);
                            ui.label(
                                egui::RichText::new("Connecting to server ...")
                                    .size(14.0)
                                    .color(TEXT_MUTED),
                            );
                        });
                    }
                    AppState::Claiming { code } => {
                        claim_view::show(ui, code);
                    }
                    AppState::Dashboard { stats } => {
                        // Tab bar with custom styling
                        ui.horizontal(|ui| {
                            tab_button(
                                ui,
                                &mut self.current_tab,
                                Tab::Status,
                                icon(Icon::LayoutDashboard),
                                "Status",
                            );
                            ui.add_space(4.0);
                            tab_button(
                                ui,
                                &mut self.current_tab,
                                Tab::Logs,
                                icon(Icon::ScrollText),
                                &format!("Logs ({})", self.logs.len()),
                            );
                        });

                        ui.add_space(4.0);

                        match self.current_tab {
                            Tab::Status => dashboard::show(ui, stats.clone()),
                            Tab::Logs => logs::show(ui, &self.logs),
                        }
                    }
                }
            });

        // Request repaint for real-time updates
        ctx.request_repaint_after(Duration::from_millis(100));
    }
}

/// Custom tab button with icon
fn tab_button(ui: &mut egui::Ui, current: &mut Tab, tab: Tab, icon_char: String, label: &str) {
    let is_active = *current == tab;
    let (bg, text_color) = if is_active {
        (ZINC_800, TEXT_PRIMARY)
    } else {
        (egui::Color32::TRANSPARENT, TEXT_MUTED)
    };

    let button = egui::Button::new(
        egui::RichText::new(format!("{}  {}", icon_char, label))
            .size(13.0)
            .color(text_color),
    )
    .fill(bg)
    .stroke(if is_active {
        egui::Stroke::new(1.0, ZINC_700)
    } else {
        egui::Stroke::NONE
    })
    .rounding(egui::Rounding::same(6.0))
    .min_size(egui::vec2(0.0, 32.0));

    if ui.add(button).clicked() {
        *current = tab;
    }
}
