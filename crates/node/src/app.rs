//! Main application state and egui App implementation

use crate::{
    cache::ConfigCache,
    claim,
    config::NodeConfig,
    supabase::SupabaseClient,
    ui::{
        claim_view, dashboard,
        icons::{icon, Icon},
        logs, settings,
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
    /// First boot - showing claim code, waiting for user to claim
    Claiming { code: String },
    /// Normal operation - dashboard view
    Dashboard { stats: NodeStats },
    /// Settings configuration view
    Settings,
}

/// Main application struct
pub struct NodeApp {
    runtime: Arc<Runtime>,
    state: AppState,
    config: NodeConfig,
    supabase: SupabaseClient,
    worker_pool: WorkerPool,
    #[allow(dead_code)]
    config_cache: ConfigCache,
    logs: VecDeque<LogEntry>,
    max_logs: usize,

    // Async communication
    claim_rx: Option<mpsc::Receiver<ClaimResult>>,
    #[allow(dead_code)]
    node_id: Option<uuid::Uuid>,

    // UI state
    settings_name: String,
    settings_max_parallel: u32,
    #[allow(dead_code)]
    show_settings: bool,
    current_tab: Tab,

    // Track if we've started async tasks
    started: bool,

    // Logo texture
    logo: Option<egui::TextureHandle>,
}

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
}

enum ClaimResult {
    Success(uuid::Uuid),
    Failed(String),
}

impl NodeApp {
    pub fn new(_cc: &eframe::CreationContext<'_>, runtime: Arc<Runtime>) -> Self {
        let config = NodeConfig::load_or_create();
        let supabase = SupabaseClient::new(
            config.supabase_url.clone(),
            config.supabase_anon_key.clone(),
        );

        let state = if config.node_id.is_some() {
            // Already claimed, go to dashboard
            AppState::Dashboard {
                stats: NodeStats {
                    max_workers: config.max_parallel,
                    ..Default::default()
                },
            }
        } else {
            // Generate claim code - will start claiming flow on first update
            let code = claim::generate_code();
            AppState::Claiming { code }
        };

        let worker_pool = WorkerPool::new(config.max_parallel as usize);
        let config_cache = ConfigCache::new();

        let mut app = Self {
            runtime,
            state,
            settings_name: config.name.clone(),
            settings_max_parallel: config.max_parallel,
            config,
            supabase,
            worker_pool,
            config_cache,
            logs: VecDeque::with_capacity(100),
            max_logs: 100,
            claim_rx: None,
            node_id: None,
            show_settings: false,
            current_tab: Tab::Status,
            started: false,
            logo: None,
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

        // If we're in claiming state, start the claim flow
        if let AppState::Claiming { ref code } = self.state {
            let (tx, rx) = mpsc::channel(1);
            self.claim_rx = Some(rx);

            let supabase = self.supabase.clone();
            let code = code.clone();

            self.runtime.spawn(async move {
                match claim::register_and_wait(&supabase, &code).await {
                    Ok(id) => {
                        tracing::info!("Node claimed with ID: {}", id);
                        let _ = tx.send(ClaimResult::Success(id)).await;
                    }
                    Err(e) => {
                        tracing::error!("Claim failed: {}", e);
                        let _ = tx.send(ClaimResult::Failed(e.to_string())).await;
                    }
                }
            });
        }
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
                Ok(ClaimResult::Success(id)) => {
                    // Claimed successfully - reload config
                    self.config = NodeConfig::load_or_create();
                    self.node_id = Some(id);
                    self.state = AppState::Dashboard {
                        stats: NodeStats {
                            max_workers: self.config.max_parallel,
                            ..Default::default()
                        },
                    };
                    self.claim_rx = None;
                    self.log(LogLevel::Info, "Node claimed successfully!");
                }
                Ok(ClaimResult::Failed(err)) => {
                    self.log(LogLevel::Error, format!("Claim failed: {}", err));
                    self.claim_rx = None;
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

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text) = match &self.state {
            AppState::Claiming { .. } => (egui::Color32::YELLOW, "Pending"),
            AppState::Dashboard { .. } => (egui::Color32::GREEN, "Online"),
            AppState::Settings => (egui::Color32::GRAY, "Settings"),
        };

        ui.horizontal(|ui| {
            ui.add(egui::widgets::Spinner::new().size(12.0).color(color));
            ui.label(egui::RichText::new(text).color(color));
        });
    }

    fn toggle_settings(&mut self) {
        match &self.state {
            AppState::Dashboard { stats } => {
                let stats_clone = stats.clone();
                self.state = AppState::Settings;
                self.show_settings = true;
                // Store stats to restore later
                self.worker_pool.set_cached_stats(stats_clone);
            }
            AppState::Settings => {
                let stats = self.worker_pool.get_cached_stats();
                self.state = AppState::Dashboard { stats };
                self.show_settings = false;
            }
            _ => {}
        }
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

        // Top bar with status
        egui::TopBottomPanel::top("header").show(ctx, |ui| {
            ui.horizontal(|ui| {
                // Logo
                if let Some(logo) = &self.logo {
                    ui.add(egui::Image::new(logo).fit_to_exact_size(egui::vec2(20.0, 20.0)));
                }
                ui.heading("WoW Lab Node");

                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    self.show_status_indicator(ui);

                    // Settings button (only in dashboard mode)
                    if matches!(self.state, AppState::Dashboard { .. } | AppState::Settings) {
                        if ui.button(icon(Icon::Settings)).clicked() {
                            self.toggle_settings();
                        }
                    }
                });
            });
        });

        // Main content
        egui::CentralPanel::default().show(ctx, |ui| {
            match &self.state {
                AppState::Claiming { code } => {
                    claim_view::show(ui, code);
                }
                AppState::Dashboard { stats } => {
                    // Tab bar
                    ui.horizontal(|ui| {
                        ui.selectable_value(&mut self.current_tab, Tab::Status, "Status");
                        ui.selectable_value(
                            &mut self.current_tab,
                            Tab::Logs,
                            format!("Logs ({})", self.logs.len()),
                        );
                    });
                    ui.separator();

                    match self.current_tab {
                        Tab::Status => dashboard::show(ui, stats.clone()),
                        Tab::Logs => logs::show(ui, &self.logs),
                    }
                }
                AppState::Settings => {
                    let result = settings::show(
                        ui,
                        &mut self.settings_name,
                        &mut self.settings_max_parallel,
                    );
                    if result.save {
                        self.config.name = self.settings_name.clone();
                        self.config.max_parallel = self.settings_max_parallel;
                        self.config.save();
                        self.log(LogLevel::Info, "Settings saved");
                    }
                    if result.back {
                        self.toggle_settings();
                    }
                }
            }
        });

        // Request repaint for real-time updates
        ctx.request_repaint_after(Duration::from_millis(100));
    }
}
