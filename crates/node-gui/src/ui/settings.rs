use super::icons::{icon, Icon};
use super::theme::{card_frame, FG_DEFAULT, FG_SUBTLE, GREEN_9, RADIUS_SM, RED_9, SLATE_1};
use uuid::Uuid;

const VERSION: &str = env!("CARGO_PKG_VERSION");

pub enum SettingsAction {
    None,
    Unlink,
}

pub fn show(ui: &mut egui::Ui, node_name: &str, node_id: Option<Uuid>) -> SettingsAction {
    let mut action = SettingsAction::None;

    ui.add_space(8.0);

    // Node info card
    card_frame().show(ui, |ui| {
        ui.set_width(ui.available_width());

        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(icon(Icon::Server))
                    .size(14.0)
                    .color(GREEN_9),
            );
            ui.label(
                egui::RichText::new("Node Info")
                    .size(13.0)
                    .strong()
                    .color(FG_DEFAULT),
            );
        });

        ui.add_space(12.0);

        info_row(ui, "Name", node_name);
        ui.add_space(6.0);
        info_row(
            ui,
            "Node ID",
            &node_id.map_or_else(|| "Not registered".to_string(), |id| id.to_string()),
        );
        ui.add_space(6.0);
        info_row(ui, "Version", &format!("v{VERSION}"));
    });

    ui.add_space(8.0);

    // Danger zone card
    card_frame().show(ui, |ui| {
        ui.set_width(ui.available_width());

        ui.horizontal(|ui| {
            ui.vertical(|ui| {
                ui.horizontal(|ui| {
                    ui.label(
                        egui::RichText::new(icon(Icon::Unlink))
                            .size(13.0)
                            .color(FG_SUBTLE),
                    );
                    ui.label(
                        egui::RichText::new("Unlink Node")
                            .size(13.0)
                            .color(FG_DEFAULT),
                    );
                });
                ui.label(
                    egui::RichText::new("You'll need to re-claim this node to use it again")
                        .size(11.0)
                        .color(FG_SUBTLE),
                );
            });

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                let unlink_button = egui::Button::new(
                    egui::RichText::new("Unlink")
                        .size(12.0)
                        .color(SLATE_1),
                )
                .fill(RED_9)
                .rounding(egui::Rounding::same(RADIUS_SM));

                if ui.add(unlink_button).clicked() {
                    action = SettingsAction::Unlink;
                }
            });
        });
    });

    action
}

fn info_row(ui: &mut egui::Ui, label: &str, value: &str) {
    ui.horizontal(|ui| {
        ui.label(
            egui::RichText::new(label)
                .size(12.0)
                .color(FG_SUBTLE),
        );
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            ui.label(
                egui::RichText::new(value)
                    .size(12.0)
                    .color(FG_DEFAULT),
            );
        });
    });
}
