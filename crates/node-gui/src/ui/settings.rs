use super::icons::Icon;
use super::theme::{
    card_frame, icon_text, section_header, text, FG_DEFAULT, FG_SUBTLE, GREEN_9, RADIUS_SM, RED_9,
    SLATE_1, SPACE_MD, SPACE_SM, SPACE_XS,
};
use uuid::Uuid;

const VERSION: &str = env!("CARGO_PKG_VERSION");

pub enum SettingsAction {
    None,
    Unlink,
}

pub fn show(ui: &mut egui::Ui, node_name: &str, node_id: Option<Uuid>) -> SettingsAction {
    let mut action = SettingsAction::None;

    ui.add_space(SPACE_SM);

    card_frame().show(ui, |ui| {
        ui.set_width(ui.available_width());

        ui.horizontal(|ui| {
            ui.label(icon_text(Icon::Server).size(14.0).color(GREEN_9));
            ui.add_space(SPACE_XS);
            ui.label(text("Node Info").size(13.0).strong().color(FG_DEFAULT));
        });

        ui.add_space(SPACE_MD);

        info_row(ui, "Name", node_name);
        ui.add_space(SPACE_SM);
        info_row(
            ui,
            "Node ID",
            &node_id.map_or_else(|| "Not registered".to_string(), |id| id.to_string()),
        );
        ui.add_space(SPACE_SM);
        info_row(ui, "Version", &format!("v{VERSION}"));
    });

    ui.add_space(SPACE_SM);

    card_frame().show(ui, |ui| {
        ui.set_width(ui.available_width());

        ui.horizontal(|ui| {
            ui.vertical(|ui| {
                section_header(ui, Icon::Unlink, "Unlink Node");
                ui.label(
                    text("You'll need to re-register this node to use it again")
                        .size(11.0)
                        .color(FG_SUBTLE),
                );
            });

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                let button = egui::Button::new(text("Unlink").size(12.0).color(SLATE_1))
                    .fill(RED_9)
                    .corner_radius(RADIUS_SM);

                if ui.add(button).clicked() {
                    action = SettingsAction::Unlink;
                }
            });
        });
    });

    action
}

fn info_row(ui: &mut egui::Ui, label: &str, value: &str) {
    ui.horizontal(|ui| {
        ui.label(text(label).size(12.0).color(FG_SUBTLE));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            ui.label(text(value).size(12.0).monospace().color(FG_DEFAULT));
        });
    });
}
