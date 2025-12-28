use crate::{
    claim,
    config::NodeConfig,
    logging::UiLogEntry,
    supabase::{ApiClient, NodePayload, RealtimeEvent, SupabaseRealtime},
    ui::{
        claim_view, dashboard,
        icons::{icon, Icon},
        logs::{self, LogFilter},
        settings::{self, SettingsAction},
        theme,
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
use tracing::Level;

const MAX_LOGS: usize = 100;
const MAX_EVENTS_PER_FRAME: usize = 10;
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5 * 60);
const CLAIM_POLL_INTERVAL: Duration = Duration::from_secs(3);

#[derive(Clone)]
pub struct LogEntry {
    pub timestamp: Instant,
    pub level: LogLevel,
    pub message: String,
}

#[derive(Clone, Copy, PartialEq, Default)]
pub enum LogLevel {
    #[default]
    Info,
    Warn,
    Error,
    #[allow(dead_code)]
    Debug,
}

#[derive(Default, Clone)]
pub struct NodeStats {
    pub active_jobs: u32,
    pub completed_chunks: u64,
    pub sims_per_second: f64,
    pub busy_workers: u32,
    pub max_workers: u32,
    pub cpu_usage: f32,
}

pub enum AppState {
    Registering,
    Claiming { code: String },
    Dashboard,
}

#[derive(Clone, Copy, PartialEq)]
pub enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
}

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
    Settings,
}

enum RegisterResult {
    Success { id: uuid::Uuid, code: String },
    Failed(String),
}

pub struct NodeApp {
    runtime: Arc<Runtime>,
    state: AppState,
    config: NodeConfig,
    api: ApiClient,
    worker_pool: WorkerPool,
    logs: VecDeque<LogEntry>,
    log_filter: LogFilter,
    log_rx: mpsc::Receiver<UiLogEntry>,
    register_rx: Option<mpsc::Receiver<RegisterResult>>,
    realtime_rx: Option<mpsc::Receiver<RealtimeEvent>>,
    node_id: Option<uuid::Uuid>,
    current_tab: Tab,
    started: bool,
    logo: Option<egui::TextureHandle>,
    node_name: String,
    max_parallel: u32,
    connection_status: ConnectionStatus,
    last_heartbeat: Option<Instant>,
    last_claim_poll: Option<Instant>,
    claim_rx: Option<mpsc::Receiver<bool>>,
}

impl NodeApp {
    pub fn new(
        _cc: &eframe::CreationContext<'_>,
        runtime: Arc<Runtime>,
        log_rx: mpsc::Receiver<UiLogEntry>,
    ) -> Self {
        let config = NodeConfig::load_or_create();
        let api = ApiClient::new(config.api_url.clone());
        let default_cores = claim::default_cores().unsigned_abs();

        let state = if config.node_id.is_some() {
            AppState::Dashboard
        } else {
            AppState::Registering
        };

        Self {
            runtime,
            state,
            api,
            worker_pool: WorkerPool::new(default_cores as usize),
            logs: VecDeque::with_capacity(MAX_LOGS),
            log_filter: LogFilter::default(),
            log_rx,
            register_rx: None,
            realtime_rx: None,
            node_id: config.node_id,
            current_tab: Tab::Status,
            started: false,
            logo: None,
            node_name: claim::default_name(),
            max_parallel: default_cores,
            connection_status: ConnectionStatus::Connecting,
            last_heartbeat: None,
            last_claim_poll: None,
            claim_rx: None,
            config,
        }
    }

    fn start_async_tasks(&mut self) {
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
        self.realtime_rx = Some(realtime.subscribe(node_id, self.runtime.handle()));
    }

    fn poll_log_entries(&mut self) {
        while let Ok(entry) = self.log_rx.try_recv() {
            if self.logs.len() >= MAX_LOGS {
                self.logs.pop_front();
            }
            let level = match entry.level {
                Level::ERROR => LogLevel::Error,
                Level::WARN => LogLevel::Warn,
                Level::DEBUG | Level::TRACE => LogLevel::Debug,
                _ => LogLevel::Info,
            };
            self.logs.push_back(LogEntry {
                timestamp: Instant::now(),
                level,
                message: entry.message,
            });
        }
    }

    fn check_registration(&mut self) {
        let Some(ref mut rx) = self.register_rx else {
            return;
        };

        match rx.try_recv() {
            Ok(RegisterResult::Success { id, code }) => {
                self.node_id = Some(id);
                self.config.set_node_id(id);
                self.state = AppState::Claiming { code: code.clone() };
                tracing::info!("Registered! Claim code: {code}");
                self.register_rx = None;
                self.start_realtime(id);
            }
            Ok(RegisterResult::Failed(ref err)) => {
                tracing::error!("Registration failed: {err}");
                self.register_rx = None;
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
        for _ in 0..MAX_EVENTS_PER_FRAME {
            match rx.try_recv() {
                Ok(event) => events.push(event),
                Err(mpsc::error::TryRecvError::Empty) => break,
                Err(mpsc::error::TryRecvError::Disconnected) => {
                    self.realtime_rx = None;
                    self.connection_status = ConnectionStatus::Disconnected;
                    return;
                }
            }
        }

        for event in &events {
            self.handle_realtime_event(event);
        }
    }

    fn handle_realtime_event(&mut self, event: &RealtimeEvent) {
        match event {
            RealtimeEvent::Connected => {
                self.connection_status = ConnectionStatus::Connected;
                tracing::info!("Connected");
                self.send_heartbeat();
            }
            RealtimeEvent::Disconnected => {
                self.connection_status = ConnectionStatus::Disconnected;
                tracing::info!("Disconnected, reconnecting...");
            }
            RealtimeEvent::NodeUpdated(ref payload) => self.handle_node_update(payload),
            RealtimeEvent::ChunkAssigned(ref payload) => {
                tracing::info!(
                    "Chunk assigned: {} ({} iterations)",
                    payload.id,
                    payload.iterations
                );
            }
            RealtimeEvent::Error(ref err) => {
                tracing::warn!("Connection error: {err}");
            }
        }
    }

    fn handle_node_update(&mut self, payload: &NodePayload) {
        if payload.user_id.is_some() && matches!(self.state, AppState::Claiming { .. }) {
            tracing::info!("Node claimed successfully!");
            self.state = AppState::Dashboard;
        }

        self.node_name.clone_from(&payload.name);
        self.max_parallel = payload.max_parallel.unsigned_abs();
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
        if !matches!(self.state, AppState::Claiming { .. }) {
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
        let Some(ref mut rx) = self.claim_rx else { return };

        match rx.try_recv() {
            Ok(true) => {
                tracing::info!("Node claimed successfully!");
                self.state = AppState::Dashboard;
                self.claim_rx = None;
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

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text, icon_char) = match (&self.state, self.connection_status) {
            (AppState::Registering, _) => (theme::ZINC_500, "Registering", icon(Icon::Loader)),
            (AppState::Claiming { .. }, _) => (theme::YELLOW_500, "Pending", icon(Icon::Clock)),
            (AppState::Dashboard, ConnectionStatus::Connected) => {
                (theme::GREEN_500, "Online", icon(Icon::Wifi))
            }
            (AppState::Dashboard, ConnectionStatus::Connecting) => {
                (theme::YELLOW_500, "Connecting", icon(Icon::Loader))
            }
            (AppState::Dashboard, ConnectionStatus::Disconnected) => {
                (theme::RED_500, "Offline", icon(Icon::WifiOff))
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

        let bytes = include_bytes!("../assets/icon.png");
        let Ok(image) = image::load_from_memory(bytes) else {
            return;
        };

        let rgba = image.into_rgba8();
        let (width, height) = (rgba.width() as usize, rgba.height() as usize);
        let color_image =
            egui::ColorImage::from_rgba_unmultiplied([width, height], &rgba.into_raw());
        self.logo = Some(ctx.load_texture("logo", color_image, egui::TextureOptions::LINEAR));
    }

    fn stats(&self) -> NodeStats {
        let mut stats = self.worker_pool.stats();
        stats.max_workers = self.max_parallel;
        stats
    }
}

impl eframe::App for NodeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.start_async_tasks();
        self.load_logo(ctx);
        self.poll_log_entries();
        self.check_registration();
        self.check_realtime_events();
        self.check_heartbeat();
        self.poll_claim_status();
        self.check_claim_result();

        egui::TopBottomPanel::top("header")
            .frame(
                egui::Frame::none()
                    .fill(theme::ZINC_900)
                    .stroke(egui::Stroke::new(1.0, theme::ZINC_800))
                    .inner_margin(egui::Margin::symmetric(16.0, 12.0)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    if let Some(logo) = &self.logo {
                        ui.add(egui::Image::new(logo).fit_to_exact_size(egui::vec2(22.0, 22.0)));
                    }
                    ui.add_space(4.0);
                    ui.label(
                        egui::RichText::new("WoW Lab Node")
                            .size(16.0)
                            .strong()
                            .color(theme::TEXT_PRIMARY),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        self.show_status_indicator(ui);
                    });
                });
            });

        egui::CentralPanel::default()
            .frame(
                egui::Frame::none()
                    .fill(theme::ZINC_950)
                    .inner_margin(egui::Margin::same(16.0)),
            )
            .show(ctx, |ui| match &self.state {
                AppState::Registering => {
                    ui.vertical_centered(|ui| {
                        ui.add_space(60.0);
                        ui.add(
                            egui::widgets::Spinner::new()
                                .size(32.0)
                                .color(theme::GREEN_500),
                        );
                        ui.add_space(16.0);
                        ui.label(
                            egui::RichText::new("Connecting to server...")
                                .size(14.0)
                                .color(theme::TEXT_MUTED),
                        );
                    });
                }
                AppState::Claiming { code } => {
                    claim_view::show(ui, code);
                }
                AppState::Dashboard => {
                    ui.horizontal(|ui| {
                        tab_button(
                            ui,
                            &mut self.current_tab,
                            Tab::Status,
                            &icon(Icon::LayoutDashboard),
                            "Status",
                        );
                        ui.add_space(4.0);
                        let logs_label = format!("Logs ({})", self.logs.len());
                        tab_button(
                            ui,
                            &mut self.current_tab,
                            Tab::Logs,
                            &icon(Icon::ScrollText),
                            &logs_label,
                        );
                        ui.add_space(4.0);
                        tab_button(
                            ui,
                            &mut self.current_tab,
                            Tab::Settings,
                            &icon(Icon::Settings),
                            "Settings",
                        );
                    });

                    ui.add_space(4.0);

                    match self.current_tab {
                        Tab::Status => dashboard::show(ui, &self.stats()),
                        Tab::Logs => logs::show(ui, &self.logs, &mut self.log_filter),
                        Tab::Settings => {
                            let action = settings::show(ui, &self.node_name, self.node_id);
                            if matches!(action, SettingsAction::Unlink) {
                                NodeConfig::delete();
                                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                            }
                        }
                    }
                }
            });

        ctx.request_repaint_after(Duration::from_millis(100));
    }
}

fn tab_button(ui: &mut egui::Ui, current: &mut Tab, tab: Tab, icon_char: &str, label: &str) {
    let is_active = *current == tab;
    let (bg, text_color) = if is_active {
        (theme::ZINC_800, theme::TEXT_PRIMARY)
    } else {
        (egui::Color32::TRANSPARENT, theme::TEXT_MUTED)
    };

    let button = egui::Button::new(
        egui::RichText::new(format!("{icon_char}  {label}"))
            .size(13.0)
            .color(text_color),
    )
    .fill(bg)
    .stroke(if is_active {
        egui::Stroke::new(1.0, theme::ZINC_700)
    } else {
        egui::Stroke::NONE
    })
    .rounding(egui::Rounding::same(6.0))
    .min_size(egui::vec2(0.0, 32.0));

    if ui.add(button).clicked() {
        *current = tab;
    }
}
