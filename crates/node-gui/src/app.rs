use crate::ui::{
    claim_view, dashboard,
    icons::{icon, Icon},
    logs::{self, LogFilter},
    settings::{self, SettingsAction},
    theme::{
        header_frame, AMBER_9, BG_CANVAS, BG_SUBTLE, BG_SURFACE, BORDER, FG_DEFAULT, FG_MUTED,
        FG_SUBTLE, GREEN_9, RADIUS_SM, RED_9, SLATE_1, SLATE_8,
    },
};
use egui_modal::Modal;
use egui_notify::Toasts;
use node::{
    utils::logging::UiLogEntry, ConnectionStatus, LogEntry, LogLevel, NodeConfig, NodeCore,
    NodeCoreEvent, NodeState,
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
const VERSION: &str = env!("CARGO_PKG_VERSION");
const METRICS_HISTORY_SIZE: usize = 60; // 60 samples = 1 minute at 1 sample/sec

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
    Settings,
}

/// Update modal state.
#[derive(Default)]
enum UpdateState {
    #[default]
    Downloading,
    Success,
    Failed(String),
}

fn release_url(version: &str) -> String {
    format!("https://github.com/legacy3/wowlab/releases/tag/v{version}")
}

pub struct NodeApp {
    core: NodeCore,
    event_rx: mpsc::Receiver<NodeCoreEvent>,
    logs: VecDeque<LogEntry>,
    log_filter: LogFilter,
    log_rx: mpsc::Receiver<UiLogEntry>,
    current_tab: Tab,
    logo: Option<egui::TextureHandle>,
    // Update notification
    update_rx: mpsc::Receiver<String>,
    update_available: Option<String>,
    show_update_modal: bool,
    update_state: UpdateState,
    update_result_rx: Option<mpsc::Receiver<Result<(), String>>>,
    // Toast notifications
    toasts: Toasts,
    last_connection_status: Option<ConnectionStatus>,
    last_node_state: Option<NodeState>,
    // Unlink confirmation
    confirm_unlink: bool,
    // Metrics history for sparklines
    sims_per_second_history: VecDeque<f64>,
    cpu_usage_history: VecDeque<f32>,
    last_metrics_sample: Instant,
}

impl NodeApp {
    pub fn new(
        _cc: &eframe::CreationContext<'_>,
        runtime: Arc<Runtime>,
        log_rx: mpsc::Receiver<UiLogEntry>,
        skip_update: bool,
    ) -> Self {
        let (mut core, event_rx) =
            NodeCore::new(Arc::clone(&runtime)).expect("Failed to create node core");
        core.start();

        // Spawn background update check
        let (update_tx, update_rx) = mpsc::channel(1);
        if !skip_update {
            std::thread::spawn(move || {
                match node::update::check_for_update(VERSION) {
                    Ok(Some(version)) => {
                        let _ = update_tx.blocking_send(version);
                    }
                    Ok(None) => {}
                    Err(e) => {
                        tracing::debug!("Update check failed: {}", e);
                    }
                }
            });
        }

        Self {
            core,
            event_rx,
            logs: VecDeque::with_capacity(MAX_LOGS),
            log_filter: LogFilter::default(),
            log_rx,
            current_tab: Tab::Status,
            logo: None,
            update_rx,
            update_available: None,
            show_update_modal: false,
            update_state: UpdateState::default(),
            update_result_rx: None,
            toasts: Toasts::default()
                .with_anchor(egui_notify::Anchor::BottomRight)
                .with_margin(egui::vec2(12.0, 12.0)),
            last_connection_status: None,
            last_node_state: None,
            confirm_unlink: false,
            sims_per_second_history: VecDeque::with_capacity(METRICS_HISTORY_SIZE),
            cpu_usage_history: VecDeque::with_capacity(METRICS_HISTORY_SIZE),
            last_metrics_sample: Instant::now(),
        }
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

    fn poll_core_events(&mut self) {
        while self.event_rx.try_recv().is_ok() {}
    }

    fn poll_update_check(&mut self) {
        if let Ok(version) = self.update_rx.try_recv() {
            self.update_available = Some(version);
            self.show_update_modal = true;
            self.start_update();
        }
    }

    fn sample_metrics(&mut self) {
        // Sample every second
        if self.last_metrics_sample.elapsed() < Duration::from_secs(1) {
            return;
        }
        self.last_metrics_sample = Instant::now();

        let stats = self.core.stats();

        // Keep history capped at METRICS_HISTORY_SIZE
        if self.sims_per_second_history.len() >= METRICS_HISTORY_SIZE {
            self.sims_per_second_history.pop_front();
        }
        self.sims_per_second_history.push_back(stats.sims_per_second);

        if self.cpu_usage_history.len() >= METRICS_HISTORY_SIZE {
            self.cpu_usage_history.pop_front();
        }
        self.cpu_usage_history.push_back(stats.cpu_usage);
    }

    pub fn metrics_history(&self) -> (&VecDeque<f64>, &VecDeque<f32>) {
        (&self.sims_per_second_history, &self.cpu_usage_history)
    }

    fn poll_update_result(&mut self) {
        if let Some(rx) = &mut self.update_result_rx {
            if let Ok(result) = rx.try_recv() {
                match result {
                    Ok(()) => self.update_state = UpdateState::Success,
                    Err(e) => self.update_state = UpdateState::Failed(e),
                }
                self.update_result_rx = None;
            }
        }
    }

    fn check_status_changes(&mut self) {
        let current_status = self.core.connection_status();
        let current_state = self.core.state().clone();

        // Check connection status changes
        if let Some(last_status) = &self.last_connection_status {
            if *last_status != current_status {
                match (&last_status, &current_status) {
                    (ConnectionStatus::Disconnected, ConnectionStatus::Connected) => {
                        self.toasts
                            .success("Connected to server")
                            .duration(Some(Duration::from_secs(3)));
                    }
                    (ConnectionStatus::Connected, ConnectionStatus::Disconnected) => {
                        self.toasts
                            .warning("Disconnected from server")
                            .duration(Some(Duration::from_secs(3)));
                    }
                    (ConnectionStatus::Connecting, ConnectionStatus::Connected) => {
                        self.toasts
                            .success("Connected to server")
                            .duration(Some(Duration::from_secs(3)));
                    }
                    _ => {}
                }
            }
        }
        self.last_connection_status = Some(current_status);

        // Check state changes (e.g., claiming -> running = node linked)
        if let Some(last_state) = &self.last_node_state {
            match (&last_state, &current_state) {
                (NodeState::Claiming { .. }, NodeState::Running) => {
                    self.toasts
                        .success("Node linked successfully!")
                        .duration(Some(Duration::from_secs(4)));
                }
                (_, NodeState::Unavailable) if !matches!(last_state, NodeState::Unavailable) => {
                    self.toasts
                        .error("Server unavailable")
                        .duration(Some(Duration::from_secs(4)));
                }
                _ => {}
            }
        }
        self.last_node_state = Some(current_state);
    }

    fn start_update(&mut self) {
        self.update_state = UpdateState::Downloading;
        let (tx, rx) = mpsc::channel(1);
        self.update_result_rx = Some(rx);

        std::thread::spawn(move || {
            let result = node::update::update("node-gui", VERSION)
                .map(|_| ())
                .map_err(|e| e.to_string());
            let _ = tx.blocking_send(result);
        });
    }

    fn show_update_modal(&mut self, ctx: &egui::Context) {
        let Some(new_version) = &self.update_available else {
            return;
        };
        if !self.show_update_modal {
            return;
        }

        let (title, stroke_color) = match &self.update_state {
            UpdateState::Downloading => ("Updating", GREEN_9),
            UpdateState::Success => ("Update Complete", GREEN_9),
            UpdateState::Failed(_) => ("Update Failed", RED_9),
        };
        let url = release_url(new_version);

        egui::Window::new(title)
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([320.0, 0.0])
            .frame(
                egui::Frame::window(&ctx.style())
                    .fill(BG_SURFACE)
                    .stroke(egui::Stroke::new(1.0, stroke_color)),
            )
            .show(ctx, |ui| {
                ui.vertical_centered(|ui| {
                    ui.add_space(12.0);

                    match &self.update_state {
                        UpdateState::Downloading => {
                            ui.add(egui::Spinner::new().size(32.0).color(GREEN_9));
                            ui.add_space(12.0);
                            ui.label(
                                egui::RichText::new("Downloading update...")
                                    .size(16.0)
                                    .strong()
                                    .color(FG_DEFAULT),
                            );
                            ui.add_space(4.0);
                            ui.label(
                                egui::RichText::new(format!("{VERSION} → {new_version}"))
                                    .size(14.0)
                                    .color(FG_SUBTLE),
                            );
                        }
                        UpdateState::Success => {
                            ui.label(
                                egui::RichText::new(icon(Icon::Check))
                                    .size(32.0)
                                    .color(GREEN_9),
                            );
                            ui.add_space(12.0);
                            ui.label(
                                egui::RichText::new("Update installed!")
                                    .size(16.0)
                                    .strong()
                                    .color(FG_DEFAULT),
                            );
                            ui.add_space(4.0);
                            ui.label(
                                egui::RichText::new(format!("Version {new_version}"))
                                    .size(14.0)
                                    .color(FG_SUBTLE),
                            );
                            ui.add_space(16.0);

                            if ui
                                .add(
                                    egui::Button::new(
                                        egui::RichText::new(format!(
                                            "{} Restart",
                                            icon(Icon::RefreshCw)
                                        ))
                                        .color(SLATE_1),
                                    )
                                    .fill(GREEN_9)
                                    .min_size(egui::vec2(120.0, 32.0)),
                                )
                                .clicked()
                            {
                                if let Ok(exe) = std::env::current_exe() {
                                    let _ = std::process::Command::new(&exe).spawn();
                                }
                                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                            }
                        }
                        UpdateState::Failed(error) => {
                            ui.label(
                                egui::RichText::new(icon(Icon::CircleX))
                                    .size(32.0)
                                    .color(RED_9),
                            );
                            ui.add_space(12.0);
                            ui.label(
                                egui::RichText::new("Update failed")
                                    .size(16.0)
                                    .strong()
                                    .color(FG_DEFAULT),
                            );
                            ui.add_space(4.0);
                            ui.label(
                                egui::RichText::new(error).size(12.0).color(FG_SUBTLE),
                            );
                            ui.add_space(16.0);

                            ui.horizontal(|ui| {
                                if ui
                                    .add(
                                        egui::Button::new(
                                            egui::RichText::new("Close").color(FG_MUTED),
                                        )
                                        .fill(BG_SUBTLE)
                                        .min_size(egui::vec2(100.0, 32.0)),
                                    )
                                    .clicked()
                                {
                                    self.show_update_modal = false;
                                }

                                ui.add_space(8.0);

                                if ui
                                    .add(
                                        egui::Button::new(
                                            egui::RichText::new(format!(
                                                "{} Download",
                                                icon(Icon::ExternalLink)
                                            ))
                                            .color(SLATE_1),
                                        )
                                        .fill(GREEN_9)
                                        .min_size(egui::vec2(100.0, 32.0)),
                                    )
                                    .clicked()
                                {
                                    let _ = open::that(&url);
                                    self.show_update_modal = false;
                                }
                            });
                        }
                    }

                    // Fallback link
                    ui.add_space(8.0);
                    ui.separator();
                    ui.add_space(4.0);
                    let link = ui.add(
                        egui::Label::new(
                            egui::RichText::new(format!(
                                "{} Open in browser",
                                icon(Icon::ExternalLink)
                            ))
                            .size(11.0)
                            .color(SLATE_8),
                        )
                        .sense(egui::Sense::click()),
                    );
                    if link.clicked() {
                        let _ = open::that(&url);
                    }
                    if link.hovered() {
                        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                    }

                    ui.add_space(8.0);
                });
            });
    }

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text, icon_char) = match (self.core.state(), self.core.connection_status()) {
            (NodeState::Verifying, _) => (FG_SUBTLE, "Verifying", icon(Icon::Loader)),
            (NodeState::Registering, _) => (FG_SUBTLE, "Registering", icon(Icon::Loader)),
            (NodeState::Claiming { .. }, _) => (AMBER_9, "Pending", icon(Icon::Clock)),
            (NodeState::Unavailable, _) => (RED_9, "Unavailable", icon(Icon::CircleX)),
            (NodeState::Running, ConnectionStatus::Connected) => {
                (GREEN_9, "Online", icon(Icon::Wifi))
            }
            (NodeState::Running, ConnectionStatus::Connecting) => {
                (AMBER_9, "Connecting", icon(Icon::Loader))
            }
            (NodeState::Running, ConnectionStatus::Disconnected) => {
                (RED_9, "Offline", icon(Icon::WifiOff))
            }
        };

        ui.horizontal(|ui| {
            ui.label(egui::RichText::new(icon_char).size(14.0).color(color));
            ui.label(egui::RichText::new(text).size(13.0).color(color));
        });
    }

    fn handle_keyboard_shortcuts(&mut self, ctx: &egui::Context) {
        // Only handle shortcuts when running (not during claiming, etc.)
        if !matches!(self.core.state(), NodeState::Running) {
            return;
        }

        ctx.input(|i| {
            // Tab switching: Cmd/Ctrl + 1/2/3
            if i.modifiers.command {
                if i.key_pressed(egui::Key::Num1) {
                    self.current_tab = Tab::Status;
                } else if i.key_pressed(egui::Key::Num2) {
                    self.current_tab = Tab::Logs;
                } else if i.key_pressed(egui::Key::Num3) {
                    self.current_tab = Tab::Settings;
                } else if i.key_pressed(egui::Key::L) {
                    // Cmd/Ctrl+L - Open log folder
                    if let Some(dir) = node::utils::logging::log_dir() {
                        let _ = open::that(dir);
                    }
                }
            }
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

    fn show_unlink_modal(&mut self, ctx: &egui::Context) -> bool {
        let mut should_unlink = false;
        let modal = Modal::new(ctx, "unlink_confirmation");

        modal.show(|ui| {
            modal.title(ui, "Unlink Node");
            modal.frame(ui, |ui| {
                modal.body(
                    ui,
                    "Are you sure you want to unlink this node?\n\nYou will need to re-claim it to use it again.",
                );
            });
            modal.buttons(ui, |ui| {
                if modal.caution_button(ui, "Unlink").clicked() {
                    should_unlink = true;
                }
                if modal.button(ui, "Cancel").clicked() {
                    self.confirm_unlink = false;
                }
            });
        });

        if self.confirm_unlink {
            modal.open();
            self.confirm_unlink = false;
        }

        should_unlink
    }
}

impl eframe::App for NodeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.load_logo(ctx);
        self.poll_log_entries();
        self.core.poll();
        self.poll_core_events();
        self.poll_update_check();
        self.poll_update_result();
        self.sample_metrics();
        self.check_status_changes();
        self.handle_keyboard_shortcuts(ctx);
        self.show_update_modal(ctx);
        if self.show_unlink_modal(ctx) {
            NodeConfig::delete();
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
        }
        self.toasts.show(ctx);

        egui::TopBottomPanel::top("header")
            .frame(header_frame())
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
                            .color(FG_DEFAULT),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        self.show_status_indicator(ui);
                    });
                });
            });

        egui::CentralPanel::default()
            .frame(
                egui::Frame::none()
                    .fill(BG_CANVAS)
                    .inner_margin(egui::Margin::same(16.0)),
            )
            .show(ctx, |ui| match self.core.state() {
                NodeState::Verifying => {
                    ui.vertical_centered(|ui| {
                        ui.add_space(60.0);
                        ui.add(
                            egui::widgets::Spinner::new()
                                .size(32.0)
                                .color(GREEN_9),
                        );
                        ui.add_space(16.0);
                        ui.label(
                            egui::RichText::new("Verifying node...")
                                .size(14.0)
                                .color(FG_SUBTLE),
                        );
                    });
                }
                NodeState::Registering => {
                    ui.vertical_centered(|ui| {
                        ui.add_space(60.0);
                        ui.add(
                            egui::widgets::Spinner::new()
                                .size(32.0)
                                .color(GREEN_9),
                        );
                        ui.add_space(16.0);
                        ui.label(
                            egui::RichText::new("Connecting to server...")
                                .size(14.0)
                                .color(FG_SUBTLE),
                        );
                    });
                }
                NodeState::Claiming { code } => {
                    claim_view::show(ui, code);
                }
                NodeState::Unavailable => {
                    ui.vertical_centered(|ui| {
                        ui.add_space(60.0);
                        ui.label(
                            egui::RichText::new(icon(Icon::CloudOff))
                                .size(48.0)
                                .color(FG_SUBTLE),
                        );
                        ui.add_space(16.0);
                        ui.label(
                            egui::RichText::new("Server Unavailable")
                                .size(18.0)
                                .strong()
                                .color(FG_DEFAULT),
                        );
                        ui.add_space(8.0);
                        ui.label(
                            egui::RichText::new("The server is temporarily unavailable.")
                                .size(14.0)
                                .color(FG_SUBTLE),
                        );
                        ui.add_space(24.0);

                        // Retry countdown
                        if let Some(remaining) = self.core.time_until_retry() {
                            let secs = remaining.as_secs();
                            let text = if secs == 0 {
                                "Retrying now...".to_string()
                            } else if secs == 1 {
                                "Retrying in 1 second".to_string()
                            } else {
                                format!("Retrying in {secs} seconds")
                            };
                            ui.with_layout(
                                egui::Layout::top_down(egui::Align::Center),
                                |ui| {
                                    ui.horizontal(|ui| {
                                        ui.add(
                                            egui::widgets::Spinner::new()
                                                .size(14.0)
                                                .color(FG_SUBTLE),
                                        );
                                        ui.add_space(8.0);
                                        ui.label(
                                            egui::RichText::new(text)
                                                .size(13.0)
                                                .color(FG_SUBTLE),
                                        );
                                    });
                                },
                            );
                        }

                        ui.add_space(24.0);
                        let link = ui.add(
                            egui::Label::new(
                                egui::RichText::new(format!(
                                    "{} Check status page",
                                    icon(Icon::ExternalLink)
                                ))
                                .size(13.0)
                                .color(FG_SUBTLE),
                            )
                            .sense(egui::Sense::click()),
                        );
                        if link.clicked() {
                            let _ = open::that("https://wowlab.gg/status");
                        }
                        if link.hovered() {
                            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                        }
                    });
                }
                NodeState::Running => {
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
                        Tab::Status => {
                            let (sims_history, cpu_history) = self.metrics_history();
                            dashboard::show(ui, &self.core.stats(), sims_history, cpu_history);
                        }
                        Tab::Logs => logs::show(ui, &self.logs, &mut self.log_filter),
                        Tab::Settings => {
                            let action =
                                settings::show(ui, self.core.node_name(), self.core.node_id());
                            if matches!(action, SettingsAction::Unlink) {
                                self.confirm_unlink = true;
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
        (BG_SUBTLE, FG_DEFAULT)
    } else {
        (egui::Color32::TRANSPARENT, FG_SUBTLE)
    };

    let button = egui::Button::new(
        egui::RichText::new(format!("{icon_char}  {label}"))
            .size(13.0)
            .color(text_color),
    )
    .fill(bg)
    .stroke(if is_active {
        egui::Stroke::new(1.0, BORDER)
    } else {
        egui::Stroke::NONE
    })
    .rounding(egui::Rounding::same(RADIUS_SM))
    .min_size(egui::vec2(0.0, 32.0));

    if ui.add(button).clicked() {
        *current = tab;
    }
}
