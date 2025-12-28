//! Settings view - node configuration

use super::icons::{icon, Icon};

/// Result of settings interaction
pub struct SettingsResult {
    pub save: bool,
    pub back: bool,
}

/// Show the settings panel
pub fn show(ui: &mut egui::Ui, name: &mut String, max_parallel: &mut u32) -> SettingsResult {
    let mut result = SettingsResult {
        save: false,
        back: false,
    };

    ui.add_space(10.0);

    // Back button
    if ui
        .button(format!("{} Back", icon(Icon::ArrowLeft)))
        .clicked()
    {
        result.back = true;
    }

    ui.add_space(20.0);
    ui.heading("Settings");
    ui.add_space(15.0);

    // Node name
    ui.group(|ui| {
        ui.label("Node Name");
        ui.add_space(5.0);
        ui.add(egui::TextEdit::singleline(name).desired_width(200.0));
        ui.add_space(5.0);
        ui.label(
            egui::RichText::new("A friendly name for this node")
                .small()
                .color(egui::Color32::GRAY),
        );
    });

    ui.add_space(15.0);

    // Max parallel workers
    ui.group(|ui| {
        ui.label("Max Parallel Workers");
        ui.add_space(5.0);
        ui.add(egui::Slider::new(max_parallel, 1..=32));
        ui.add_space(5.0);
        ui.label(
            egui::RichText::new("Number of simulations to run in parallel")
                .small()
                .color(egui::Color32::GRAY),
        );
    });

    ui.add_space(20.0);

    // Save button
    if ui.button(format!("{} Save", icon(Icon::Save))).clicked() {
        result.save = true;
    }

    result
}
