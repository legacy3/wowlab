use super::icons::{icon, Icon};
use super::theme::{
    card_frame, subtitle, text, title_lg, BG_SUBTLE, BORDER, FG_SUBTLE, GREEN_9, RADIUS_SM, RED_9,
    SLATE_1, SPACE_SM,
};

pub enum SetupAction {
    None,
    Submit(String),
}

pub fn show(ui: &mut egui::Ui, token_input: &mut String, error: Option<&str>) -> SetupAction {
    let mut action = SetupAction::None;

    let available = ui.available_rect_before_wrap();

    ui.scope_builder(egui::UiBuilder::new().max_rect(available), |ui| {
        ui.vertical_centered(|ui| {
            let top_space = ((available.height() - 300.0) / 3.0).max(20.0);
            ui.add_space(top_space);

            card_frame().show(ui, |ui| {
                ui.set_width(320.0);

                ui.vertical_centered(|ui| {
                    ui.label(title_lg("Setup Node"));
                    ui.add_space(SPACE_SM);
                    ui.label(subtitle("Enter your claim token from the portal"));
                    ui.add_space(24.0);

                    let input = egui::TextEdit::singleline(token_input)
                        .hint_text("ct_...")
                        .font(egui::TextStyle::Monospace)
                        .desired_width(280.0)
                        .margin(egui::Margin::symmetric(12, 10))
                        .frame(true);

                    let response = ui.add(input);

                    if response.lost_focus()
                        && ui.input(|i| i.key_pressed(egui::Key::Enter))
                        && is_valid_token(token_input)
                    {
                        action = SetupAction::Submit(token_input.clone());
                    }

                    if let Some(err) = error {
                        ui.add_space(SPACE_SM);
                        ui.label(text(err).size(12.0).color(RED_9));
                    }

                    ui.add_space(20.0);

                    let is_valid = is_valid_token(token_input);
                    let button_text = format!("{}  Register", icon(Icon::Check));

                    let button = if is_valid {
                        egui::Button::new(text(button_text).size(13.0).color(SLATE_1))
                            .fill(GREEN_9)
                            .corner_radius(RADIUS_SM)
                            .min_size(egui::vec2(140.0, 36.0))
                    } else {
                        egui::Button::new(text(button_text).size(13.0).color(FG_SUBTLE))
                            .fill(BG_SUBTLE)
                            .stroke(egui::Stroke::new(1.0, BORDER))
                            .corner_radius(RADIUS_SM)
                            .min_size(egui::vec2(140.0, 36.0))
                    };

                    let button_response = ui.add_enabled(is_valid, button);
                    if button_response.clicked() {
                        action = SetupAction::Submit(token_input.clone());
                    }

                    ui.add_space(24.0);

                    let link = ui.add(
                        egui::Label::new(
                            text(format!(
                                "{} Get token from portal",
                                icon(Icon::ExternalLink)
                            ))
                            .size(12.0)
                            .color(FG_SUBTLE),
                        )
                        .sense(egui::Sense::click()),
                    );
                    if link.clicked() {
                        let _ = open::that("https://wowlab.gg/account/nodes");
                    }
                    if link.hovered() {
                        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                    }
                });
            });
        });
    });

    action
}

fn is_valid_token(token: &str) -> bool {
    token.starts_with("ct_") && token.len() == 35
}

pub fn show_reregister(
    ui: &mut egui::Ui,
    token_input: &mut String,
    error: Option<&str>,
) -> SetupAction {
    let mut action = SetupAction::None;

    let available = ui.available_rect_before_wrap();

    ui.scope_builder(egui::UiBuilder::new().max_rect(available), |ui| {
        ui.vertical_centered(|ui| {
            let top_space = ((available.height() - 340.0) / 3.0).max(20.0);
            ui.add_space(top_space);

            card_frame().show(ui, |ui| {
                ui.set_width(340.0);

                ui.vertical_centered(|ui| {
                    ui.label(text(icon(Icon::CircleAlert)).size(32.0).color(super::theme::AMBER_9));
                    ui.add_space(12.0);
                    ui.label(title_lg("Node Not Found"));
                    ui.add_space(SPACE_SM);
                    ui.label(subtitle("This node is no longer registered."));
                    ui.label(subtitle("Re-register it with a new claim token."));
                    ui.add_space(24.0);

                    let input = egui::TextEdit::singleline(token_input)
                        .hint_text("ct_...")
                        .font(egui::TextStyle::Monospace)
                        .desired_width(300.0)
                        .margin(egui::Margin::symmetric(12, 10))
                        .frame(true);

                    let response = ui.add(input);

                    if response.lost_focus()
                        && ui.input(|i| i.key_pressed(egui::Key::Enter))
                        && is_valid_token(token_input)
                    {
                        action = SetupAction::Submit(token_input.clone());
                    }

                    if let Some(err) = error {
                        ui.add_space(SPACE_SM);
                        ui.label(text(err).size(12.0).color(RED_9));
                    }

                    ui.add_space(20.0);

                    let is_valid = is_valid_token(token_input);
                    let button_text = format!("{}  Re-register", icon(Icon::RefreshCw));

                    let button = if is_valid {
                        egui::Button::new(text(button_text).size(13.0).color(SLATE_1))
                            .fill(GREEN_9)
                            .corner_radius(RADIUS_SM)
                            .min_size(egui::vec2(160.0, 36.0))
                    } else {
                        egui::Button::new(text(button_text).size(13.0).color(FG_SUBTLE))
                            .fill(BG_SUBTLE)
                            .stroke(egui::Stroke::new(1.0, BORDER))
                            .corner_radius(RADIUS_SM)
                            .min_size(egui::vec2(160.0, 36.0))
                    };

                    let button_response = ui.add_enabled(is_valid, button);
                    if button_response.clicked() {
                        action = SetupAction::Submit(token_input.clone());
                    }

                    ui.add_space(24.0);

                    let link = ui.add(
                        egui::Label::new(
                            text(format!(
                                "{} Get token from portal",
                                icon(Icon::ExternalLink)
                            ))
                            .size(12.0)
                            .color(FG_SUBTLE),
                        )
                        .sense(egui::Sense::click()),
                    );
                    if link.clicked() {
                        let _ = open::that("https://wowlab.gg/account/nodes");
                    }
                    if link.hovered() {
                        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
                    }
                });
            });
        });
    });

    action
}
