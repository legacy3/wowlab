use super::icons::{icon, Icon};
use super::theme::{
    subtitle, text, title, BG_SUBTLE, BG_SURFACE, FG_MUTED, FG_SUBTLE, GREEN_9, RED_9, SLATE_1,
    SLATE_8,
};
use tokio::sync::mpsc;

#[derive(Default)]
pub enum UpdateState {
    #[default]
    Downloading,
    Success,
    Failed(String),
}

#[derive(Default)]
pub struct UpdateModal {
    pub available: Option<String>,
    pub show: bool,
    pub state: UpdateState,
    pub result_rx: Option<mpsc::Receiver<Result<(), String>>>,
}

impl UpdateModal {
    pub fn start(&mut self, version: &str) {
        self.available = Some(version.to_string());
        self.show = true;
        self.state = UpdateState::Downloading;

        let (tx, rx) = mpsc::channel(1);
        self.result_rx = Some(rx);

        let current_version = env!("CARGO_PKG_VERSION").to_string();
        std::thread::spawn(move || {
            let result = wowlab_node::update::update("node-gui", &current_version)
                .map(|_| ())
                .map_err(|e| e.to_string());
            let _ = tx.blocking_send(result);
        });
    }

    pub fn poll(&mut self) {
        if let Some(rx) = &mut self.result_rx {
            if let Ok(result) = rx.try_recv() {
                self.state = match result {
                    Ok(()) => UpdateState::Success,
                    Err(e) => UpdateState::Failed(e),
                };
                self.result_rx = None;
            }
        }
    }

    pub fn render(&mut self, ctx: &egui::Context) {
        let Some(new_version) = self.available.clone() else {
            return;
        };
        if !self.show {
            return;
        }

        let (window_title, stroke_color) = match &self.state {
            UpdateState::Downloading => ("Updating", GREEN_9),
            UpdateState::Success => ("Update Complete", GREEN_9),
            UpdateState::Failed(_) => ("Update Failed", RED_9),
        };
        let url = release_url(&new_version);

        egui::Window::new(window_title)
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
                    self.render_content(ui, &new_version, &url, ctx);
                    self.render_footer(ui, &url);
                    ui.add_space(8.0);
                });
            });
    }

    fn render_content(
        &mut self,
        ui: &mut egui::Ui,
        new_version: &str,
        url: &str,
        ctx: &egui::Context,
    ) {
        let version = env!("CARGO_PKG_VERSION");

        match &self.state {
            UpdateState::Downloading => {
                ui.add(egui::Spinner::new().size(32.0).color(GREEN_9));
                ui.add_space(12.0);
                ui.label(title("Downloading update..."));
                ui.add_space(4.0);
                ui.label(subtitle(format!("{version} → {new_version}")));
            }
            UpdateState::Success => {
                ui.label(text(icon(Icon::Check)).size(32.0).color(GREEN_9));
                ui.add_space(12.0);
                ui.label(title("Update installed!"));
                ui.add_space(4.0);
                ui.label(subtitle(format!("Version {new_version}")));
                ui.add_space(16.0);

                if ui
                    .add(
                        egui::Button::new(
                            text(format!("{} Restart", icon(Icon::RefreshCw))).color(SLATE_1),
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
                ui.label(text(icon(Icon::CircleX)).size(32.0).color(RED_9));
                ui.add_space(12.0);
                ui.label(title("Update failed"));
                ui.add_space(4.0);
                ui.label(text(error).size(12.0).color(FG_SUBTLE));
                ui.add_space(16.0);

                ui.horizontal(|ui| {
                    if ui
                        .add(
                            egui::Button::new(text("Close").color(FG_MUTED))
                                .fill(BG_SUBTLE)
                                .min_size(egui::vec2(100.0, 32.0)),
                        )
                        .clicked()
                    {
                        self.show = false;
                    }

                    ui.add_space(8.0);

                    if ui
                        .add(
                            egui::Button::new(
                                text(format!("{} Download", icon(Icon::ExternalLink)))
                                    .color(SLATE_1),
                            )
                            .fill(GREEN_9)
                            .min_size(egui::vec2(100.0, 32.0)),
                        )
                        .clicked()
                    {
                        let _ = open::that(url);
                        self.show = false;
                    }
                });
            }
        }
    }

    fn render_footer(&self, ui: &mut egui::Ui, url: &str) {
        ui.add_space(8.0);
        ui.separator();
        ui.add_space(4.0);

        let link = ui.add(
            egui::Label::new(
                text(format!("{} Open in browser", icon(Icon::ExternalLink)))
                    .size(11.0)
                    .color(SLATE_8),
            )
            .sense(egui::Sense::click()),
        );
        if link.clicked() {
            let _ = open::that(url);
        }
        if link.hovered() {
            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
        }
    }
}

fn release_url(version: &str) -> String {
    format!("https://github.com/legacy3/wowlab/releases/tag/v{version}")
}
