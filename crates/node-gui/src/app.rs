use crate::ui::{
    claim_view, dashboard,
    icons::{icon, Icon},
    logs::{self, LogFilter},
    settings::{self, SettingsAction},
    theme,
};
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

#[derive(Clone, Copy, PartialEq, Default)]
pub enum Tab {
    #[default]
    Status,
    Logs,
    Settings,
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
}

impl NodeApp {
    pub fn new(
        _cc: &eframe::CreationContext<'_>,
        runtime: Arc<Runtime>,
        log_rx: mpsc::Receiver<UiLogEntry>,
    ) -> Self {
        let (mut core, event_rx) = NodeCore::new(Arc::clone(&runtime));
        core.start();

        // Spawn background update check
        let (update_tx, update_rx) = mpsc::channel(1);
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
        }
    }

    fn show_update_modal(&mut self, ctx: &egui::Context) {
        let Some(new_version) = &self.update_available else {
            return;
        };

        if !self.show_update_modal {
            return;
        }

        egui::Window::new("Update Available")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([320.0, 0.0])
            .frame(
                egui::Frame::window(&ctx.style())
                    .fill(theme::ZINC_900)
                    .stroke(egui::Stroke::new(1.0, theme::GREEN_500)),
            )
            .show(ctx, |ui| {
                ui.vertical_centered(|ui| {
                    ui.add_space(8.0);
                    ui.label(
                        egui::RichText::new(icon(Icon::Download))
                            .size(32.0)
                            .color(theme::GREEN_500),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        egui::RichText::new("A new version is available!")
                            .size(16.0)
                            .strong()
                            .color(theme::TEXT_PRIMARY),
                    );
                    ui.add_space(4.0);
                    ui.label(
                        egui::RichText::new(format!("{} → {}", VERSION, new_version))
                            .size(14.0)
                            .color(theme::TEXT_MUTED),
                    );
                    ui.add_space(16.0);

                    ui.horizontal(|ui| {
                        if ui
                            .add(
                                egui::Button::new(
                                    egui::RichText::new("Later").color(theme::TEXT_MUTED),
                                )
                                .fill(theme::ZINC_800)
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
                                    egui::RichText::new(format!("{} Update", icon(Icon::Download)))
                                        .color(theme::ZINC_950),
                                )
                                .fill(theme::GREEN_500)
                                .min_size(egui::vec2(100.0, 32.0)),
                            )
                            .clicked()
                        {
                            // Open release page in browser
                            let url = format!(
                                "https://github.com/legacy3/wowlab/releases/tag/v{}",
                                new_version
                            );
                            let _ = open::that(&url);
                            self.show_update_modal = false;
                        }
                    });
                    ui.add_space(8.0);
                });
            });
    }

    fn show_status_indicator(&self, ui: &mut egui::Ui) {
        let (color, text, icon_char) = match (self.core.state(), self.core.connection_status()) {
            (NodeState::Registering, _) => (theme::ZINC_500, "Registering", icon(Icon::Loader)),
            (NodeState::Claiming { .. }, _) => (theme::YELLOW_500, "Pending", icon(Icon::Clock)),
            (NodeState::Running, ConnectionStatus::Connected) => {
                (theme::GREEN_500, "Online", icon(Icon::Wifi))
            }
            (NodeState::Running, ConnectionStatus::Connecting) => {
                (theme::YELLOW_500, "Connecting", icon(Icon::Loader))
            }
            (NodeState::Running, ConnectionStatus::Disconnected) => {
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
}

impl eframe::App for NodeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.load_logo(ctx);
        self.poll_log_entries();
        self.core.poll();
        self.poll_core_events();
        self.poll_update_check();
        self.show_update_modal(ctx);

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
            .show(ctx, |ui| match self.core.state() {
                NodeState::Registering => {
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
                NodeState::Claiming { code } => {
                    claim_view::show(ui, code);
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
                        Tab::Status => dashboard::show(ui, &self.core.stats()),
                        Tab::Logs => logs::show(ui, &self.logs, &mut self.log_filter),
                        Tab::Settings => {
                            let action =
                                settings::show(ui, self.core.node_name(), self.core.node_id());
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
