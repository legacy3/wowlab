//! Claim view - shown on first boot while waiting for user to claim the node

use super::icons::{icon, Icon};

/// Show the claim view with the claim code
pub fn show(ui: &mut egui::Ui, code: &str) {
    let full_url = format!("https://wowlab.gg/account/nodes/claim?token={}", code);

    ui.vertical_centered(|ui| {
        ui.add_space(20.0);

        ui.label(egui::RichText::new("Claim this node").size(20.0).strong());

        ui.add_space(24.0);

        // Code display box
        egui::Frame::none()
            .fill(egui::Color32::from_gray(35))
            .rounding(egui::Rounding::same(8.0))
            .inner_margin(egui::Margin::symmetric(32.0, 20.0))
            .show(ui, |ui| {
                ui.vertical_centered(|ui| {
                    let code_text = egui::RichText::new(code)
                        .size(36.0)
                        .monospace()
                        .strong()
                        .color(egui::Color32::WHITE);

                    if ui
                        .add(egui::Label::new(code_text).sense(egui::Sense::click()))
                        .on_hover_text("Click to copy")
                        .on_hover_cursor(egui::CursorIcon::PointingHand)
                        .clicked()
                    {
                        ui.output_mut(|o| o.copied_text = code.to_string());
                    }
                });
            });

        ui.add_space(16.0);

        // Open link button
        if ui
            .add(
                egui::Button::new(
                    egui::RichText::new(format!("{} Open claim page", icon(Icon::ExternalLink)))
                        .size(14.0),
                )
                .min_size(egui::vec2(180.0, 32.0)),
            )
            .clicked()
        {
            let _ = open::that(&full_url);
        }

        ui.add_space(8.0);

        // Or copy link
        if ui
            .add(
                egui::Label::new(
                    egui::RichText::new(format!("{} copy link", icon(Icon::Copy)))
                        .size(12.0)
                        .color(egui::Color32::from_rgb(100, 149, 237)),
                )
                .sense(egui::Sense::click()),
            )
            .on_hover_cursor(egui::CursorIcon::PointingHand)
            .clicked()
        {
            ui.output_mut(|o| o.copied_text = full_url.clone());
        }

        ui.add_space(20.0);

        // Subtle waiting indicator
        ui.horizontal(|ui| {
            ui.add(
                egui::widgets::Spinner::new()
                    .size(12.0)
                    .color(egui::Color32::from_gray(90)),
            );
            ui.label(
                egui::RichText::new("Listening for claim...")
                    .size(12.0)
                    .color(egui::Color32::from_gray(90)),
            );
        });
    });
}
