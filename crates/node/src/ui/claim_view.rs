use super::icons::{icon, Icon};
use super::theme::{BORDER, GREEN_500, SURFACE, TEXT_MUTED, TEXT_PRIMARY, ZINC_700, ZINC_950};

pub fn show(ui: &mut egui::Ui, code: &str) {
    let full_url = format!("https://wowlab.gg/account/nodes/claim?token={code}");
    let chars: Vec<char> = code.chars().collect();

    ui.vertical_centered(|ui| {
        ui.add_space(40.0);

        egui::Frame::none()
            .fill(SURFACE)
            .stroke(egui::Stroke::new(1.0, BORDER))
            .rounding(egui::Rounding::same(12.0))
            .inner_margin(egui::Margin::symmetric(40.0, 32.0))
            .show(ui, |ui| {
                ui.vertical_centered(|ui| {
                    ui.label(
                        egui::RichText::new("Claim Your Node")
                            .size(22.0)
                            .strong()
                            .color(TEXT_PRIMARY),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        egui::RichText::new("Enter this code on the website")
                            .size(13.0)
                            .color(TEXT_MUTED),
                    );
                    ui.add_space(28.0);

                    ui.horizontal(|ui| {
                        ui.spacing_mut().item_spacing.x = 8.0;

                        for i in 0..3 {
                            if let Some(&ch) = chars.get(i) {
                                char_slot(ui, ch);
                            }
                        }

                        ui.add_space(4.0);
                        ui.label(egui::RichText::new("•").size(20.0).color(TEXT_MUTED));
                        ui.add_space(4.0);

                        for i in 3..6 {
                            if let Some(&ch) = chars.get(i) {
                                char_slot(ui, ch);
                            }
                        }
                    });

                    ui.add_space(8.0);

                    if ui
                        .add(
                            egui::Label::new(
                                egui::RichText::new(format!("{} Click to copy", icon(Icon::Copy)))
                                    .size(11.0)
                                    .color(TEXT_MUTED),
                            )
                            .sense(egui::Sense::click()),
                        )
                        .on_hover_cursor(egui::CursorIcon::PointingHand)
                        .clicked()
                    {
                        ui.output_mut(|o| o.copied_text = code.to_string());
                    }

                    ui.add_space(28.0);

                    let button = egui::Button::new(
                        egui::RichText::new(format!(
                            "{}  Open Claim Page",
                            icon(Icon::ExternalLink)
                        ))
                        .size(14.0)
                        .color(TEXT_PRIMARY),
                    )
                    .fill(GREEN_500)
                    .stroke(egui::Stroke::NONE)
                    .rounding(egui::Rounding::same(8.0))
                    .min_size(egui::vec2(220.0, 40.0));

                    let response = ui.add(button);
                    if response.hovered() {
                        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                    }
                    if response.clicked() {
                        let _ = open::that(&full_url);
                    }

                    ui.add_space(12.0);

                    if ui
                        .add(
                            egui::Label::new(
                                egui::RichText::new("or copy link manually")
                                    .size(12.0)
                                    .color(TEXT_MUTED),
                            )
                            .sense(egui::Sense::click()),
                        )
                        .on_hover_text(&full_url)
                        .on_hover_cursor(egui::CursorIcon::PointingHand)
                        .clicked()
                    {
                        ui.output_mut(|o| o.copied_text.clone_from(&full_url));
                    }
                });
            });

        ui.add_space(24.0);

        ui.horizontal(|ui| {
            ui.add(egui::widgets::Spinner::new().size(14.0).color(GREEN_500));
            ui.add_space(8.0);
            ui.label(
                egui::RichText::new("Waiting for claim...")
                    .size(13.0)
                    .color(TEXT_MUTED),
            );
        });
    });
}

fn char_slot(ui: &mut egui::Ui, ch: char) {
    egui::Frame::none()
        .fill(ZINC_950)
        .stroke(egui::Stroke::new(1.0, ZINC_700))
        .rounding(egui::Rounding::same(8.0))
        .inner_margin(egui::Margin::symmetric(14.0, 10.0))
        .show(ui, |ui| {
            ui.label(
                egui::RichText::new(ch.to_string())
                    .size(26.0)
                    .monospace()
                    .strong()
                    .color(TEXT_PRIMARY),
            );
        });
}
