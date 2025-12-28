//! Main application state and egui App implementation

use crate::{
    claim,
    config::NodeConfig,
    supabase::ApiClient,
    ui::{claim_view, dashboard, icons::{icon, Icon}, logs, theme::*},
    worker::WorkerPool,
};
use std::{
    collections::VecDeque,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::runtime::Runtime;
use tokio::sync::mpsc;
use crate::supabase::HeartbeatResponse;

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
    /// Showing claim code, waiting for user to claim
    Claiming { code: String },
    /// Normal operation - dashboard view
    Dashboard { stats: NodeStats },
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
    claim_rx: Option<mpsc::Receiver<ClaimResult>>,
    heartbeat_rx: Option<mpsc::Receiver<HeartbeatResult>>,
    node_id: Option<uuid::Uuid>,

    // UI state
    current_tab: Tab,

    // Track if we've started async tasks
    started: bool,
    last_heartbeat: Option<Instant>,

    // Logo texture
    logo: Option<egui::TextureHandle>,

    // Server-provided settings (synced via heartbeat)
    node_name: String,
    max_parallel: u32,
}

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
}

enum ClaimResult {
    Registered { id: uuid::Uuid, code: String },
    Claimed { name: String },
    Failed(String),
}

enum HeartbeatResult {
    Success(HeartbeatResponse),
    Failed(String),
}

impl NodeApp {
    pub fn new(_cc: &eframe::CreationContext<'_>, runtime: Arc<Runtime>) -> Self {
        let config = NodeConfig::load_or_create();
        let api = ApiClient::new(config.api_url.clone());

        // Use OS defaults until we get server settings via heartbeat
        let default_cores = claim::get_default_cores() as u32;

        let state = if config.node_id.is_some() {
            // Already claimed, go to dashboard
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

        // Load persisted node_id if already claimed
        let node_id = config.node_id;

        let mut app = Self {
            runtime,
            state,
            config,
            api,
            worker_pool,
            logs: VecDeque::with_capacity(100),
            max_logs: 100,
            claim_rx: None,
            heartbeat_rx: None,
            node_id,
            current_tab: Tab::Status,
            started: false,
            last_heartbeat: None,
            logo: None,
            node_name: claim::get_default_name(),
            max_parallel: default_cores,
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

        // If we need to register, start that flow
        if matches!(self.state, AppState::Registering) {
            self.start_registration();
        }
    }

    fn start_registration(&mut self) {
        let (tx, rx) = mpsc::channel(1);
        self.claim_rx = Some(rx);

        let api = self.api.clone();

        self.runtime.spawn(async move {
            // Register with server (sends hostname + cores as defaults)
            match claim::register(&api).await {
                Ok((id, code)) => {
                    let _ = tx.send(ClaimResult::Registered { id, code }).await;

                    // Now wait for claim
                    match claim::wait_for_claim(&api, id).await {
                        Ok(name) => {
                            let _ = tx.send(ClaimResult::Claimed { name }).await;
                        }
                        Err(e) => {
                            let _ = tx.send(ClaimResult::Failed(e.to_string())).await;
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Registration failed: {}", e);
                    let _ = tx.send(ClaimResult::Failed(e.to_string())).await;
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

    fn check_claim_status(&mut self) {
        if let Some(ref mut rx) = self.claim_rx {
            match rx.try_recv() {
                Ok(ClaimResult::Registered { id, code }) => {
                    self.node_id = Some(id);
                    self.state = AppState::Claiming { code: code.clone() };
                    self.log(LogLevel::Info, format!("Registered! Claim code: {}", code));
                }
                Ok(ClaimResult::Claimed { name }) => {
                    // Save node ID to config
                    if let Some(id) = self.node_id {
                        self.config.set_node_id(id);
                    }
                    // Update local name (server may have changed it)
                    self.node_name = name;

                    self.state = AppState::Dashboard {
                        stats: NodeStats {
                            max_workers: self.max_parallel,
                            ..Default::default()
                        },
                    };
                    self.claim_rx = None;
                    self.log(LogLevel::Info, "Node claimed successfully!");
                    // Send initial heartbeat
                    self.send_heartbeat();
                }
                Ok(ClaimResult::Failed(err)) => {
                    self.log(LogLevel::Error, format!("Error: {}", err));
                    // Stay in current state, maybe retry
                }
                Err(mpsc::error::TryRecvError::Empty) => {
                    // Still waiting
                }
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    self.claim_rx = None;
                }
            }
        }
    }

    fn send_heartbeat(&mut self) {
        let node_id = match self.node_id {
            Some(id) => id,
            None => return,
        };

        let (tx, rx) = mpsc::channel(1);
        self.heartbeat_rx = Some(rx);
        self.last_heartbeat = Some(Instant::now());

        let api = self.api.clone();

        self.runtime.spawn(async move {
            match api.heartbeat(node_id, "online").await {
                Ok(response) => {
                    let _ = tx.send(HeartbeatResult::Success(response)).await;
                }
                Err(e) => {
                    let _ = tx.send(HeartbeatResult::Failed(e.to_string())).await;
                }
            }
        });
    }

    fn check_heartbeat(&mut self) {
        // Check for heartbeat response
        if let Some(ref mut rx) = self.heartbeat_rx {
            match rx.try_recv() {
                Ok(HeartbeatResult::Success(response)) => {
                    // Sync settings from server
                    self.node_name = response.name;
                    self.max_parallel = response.max_parallel as u32;
                    self.heartbeat_rx = None;
                }
                Ok(HeartbeatResult::Failed(err)) => {
                    self.log(LogLevel::Warn, format!("Heartbeat failed: {}", err));
                    self.heartbeat_rx = None;
                }
                Err(mpsc::error::TryRecvError::Empty) => {
                    // Still waiting
                }
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    self.heartbeat_rx = None;
                }
            }
        }

        // Send periodic heartbeat (every 60 seconds) when in Dashboard state
        if matches!(self.state, AppState::Dashboard { .. }) && self.heartbeat_rx.is_none() {
            let should_send = match self.last_heartbeat {
                None => true,
                Some(last) => last.elapsed() > Duration::from_secs(60),
            };
            if should_send {
                self.send_heartbeat();
            }
        }
    }

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text, icon_char) = match &self.state {
            AppState::Registering => (ZINC_500, "Connecting", icon(Icon::Loader)),
            AppState::Claiming { .. } => (YELLOW_500, "Pending", icon(Icon::Clock)),
            AppState::Dashboard { .. } => (GREEN_500, "Online", icon(Icon::Wifi)),
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

        // Check for async claim updates
        self.check_claim_status();

        // Check heartbeat status and send periodic heartbeats
        self.check_heartbeat();

        // Top bar with status
        egui::TopBottomPanel::top("header")
            .frame(egui::Frame::none()
                .fill(ZINC_900)
                .stroke(egui::Stroke::new(1.0, ZINC_800))
                .inner_margin(egui::Margin::symmetric(16.0, 12.0)))
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
            .frame(egui::Frame::none()
                .fill(ZINC_950)
                .inner_margin(egui::Margin::same(16.0)))
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
                            tab_button(ui, &mut self.current_tab, Tab::Status, icon(Icon::LayoutDashboard), "Status");
                            ui.add_space(4.0);
                            tab_button(ui, &mut self.current_tab, Tab::Logs, icon(Icon::ScrollText), &format!("Logs ({})", self.logs.len()));
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
