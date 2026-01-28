use super::icons::{icon, Icon};
use super::theme::{
    subtitle, text, title, BG_CANVAS, BG_SURFACE, BORDER, BORDER_HOVER, FG_DEFAULT, FG_SUBTLE,
    GREEN_9, RADIUS_LG, RADIUS_MD, SPACE_SM, SPACE_XS,
};
use std::time::Instant;

const COPIED_FEEDBACK_DURATION: f64 = 2.0;

pub fn show(ui: &mut egui::Ui, code: &str) {
    let available = ui.available_rect_before_wrap();

    ui.scope_builder(egui::UiBuilder::new().max_rect(available), |ui| {
        ui.vertical_centered(|ui| {
            let top_space = ((available.height() - 350.0) / 3.0).max(20.0);
            ui.add_space(top_space);
            claim_card(ui, code);
            ui.add_space(24.0);
            waiting_spinner(ui);
        });
    });
}

fn claim_card(ui: &mut egui::Ui, code: &str) {
    let full_url = format!("https://wowlab.gg/account/nodes/claim?token={code}");
    let chars: Vec<char> = code.chars().collect();

    egui::Frame::new()
        .fill(BG_SURFACE)
        .stroke(egui::Stroke::new(1.0, BORDER))
        .corner_radius(RADIUS_LG)
        .inner_margin(egui::Margin::symmetric(40, 32))
        .show(ui, |ui| {
            ui.vertical_centered(|ui| {
                ui.label(
                    text("Claim Your Node")
                        .size(22.0)
                        .strong()
                        .color(FG_DEFAULT),
                );
                ui.add_space(SPACE_SM);
                ui.label(subtitle("Enter this code on the website"));
                ui.add_space(28.0);

                code_display(ui, &chars);

                ui.add_space(SPACE_SM);
                copy_code_button(ui, code);
                ui.add_space(28.0);
                open_claim_button(ui, &full_url);
            });
        });
}

fn code_display(ui: &mut egui::Ui, chars: &[char]) {
    ui.horizontal(|ui| {
        let code_width = 6.0 * 54.0 + 5.0 * SPACE_SM + 24.0;
        let offset = (ui.available_width() - code_width) / 2.0;
        if offset > 0.0 {
            ui.add_space(offset);
        }

        ui.spacing_mut().item_spacing.x = SPACE_SM;

        for ch in chars.iter().take(3) {
            char_slot(ui, *ch);
        }

        ui.add_space(SPACE_XS);
        ui.label(text("•").size(20.0).color(FG_SUBTLE));
        ui.add_space(SPACE_XS);

        for ch in chars.iter().skip(3).take(3) {
            char_slot(ui, *ch);
        }
    });
}

fn copy_code_button(ui: &mut egui::Ui, code: &str) {
    let copied_at = ui.ctx().memory_mut(|mem| {
        mem.data
            .get_temp::<Instant>(egui::Id::new("code_copied_at"))
    });

    let show_copied =
        copied_at.is_some_and(|t| t.elapsed().as_secs_f64() < COPIED_FEEDBACK_DURATION);

    let (label, color) = if show_copied {
        (format!("{} Copied!", icon(Icon::Check)), GREEN_9)
    } else {
        (format!("{} Click to copy", icon(Icon::Copy)), FG_SUBTLE)
    };

    if ui
        .add(egui::Label::new(text(label).size(11.0).color(color)).sense(egui::Sense::click()))
        .on_hover_cursor(egui::CursorIcon::PointingHand)
        .clicked()
    {
        ui.ctx().copy_text(code.to_string());
        ui.ctx().memory_mut(|mem| {
            mem.data
                .insert_temp(egui::Id::new("code_copied_at"), Instant::now());
        });
    }
}

fn open_claim_button(ui: &mut egui::Ui, url: &str) {
    let button = egui::Button::new(
        title(format!("{}  Open Claim Page", icon(Icon::ExternalLink))).size(14.0),
    )
    .fill(GREEN_9)
    .stroke(egui::Stroke::NONE)
    .corner_radius(RADIUS_MD)
    .min_size(egui::vec2(220.0, 40.0));

    let response = ui.add(button);
    if response.hovered() {
        ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
    }
    if response.clicked() {
        let _ = open::that(url);
    }
}

fn waiting_spinner(ui: &mut egui::Ui) {
    ui.horizontal(|ui| {
        let spinner_width = 150.0;
        let offset = (ui.available_width() - spinner_width) / 2.0;
        if offset > 0.0 {
            ui.add_space(offset);
        }
        ui.add(egui::widgets::Spinner::new().size(14.0).color(GREEN_9));
        ui.add_space(SPACE_SM);
        ui.label(text("Waiting for claim...").size(13.0).color(FG_SUBTLE));
    });
}

fn char_slot(ui: &mut egui::Ui, ch: char) {
    egui::Frame::new()
        .fill(BG_CANVAS)
        .stroke(egui::Stroke::new(1.0, BORDER_HOVER))
        .corner_radius(RADIUS_MD)
        .inner_margin(egui::Margin::symmetric(14, 10))
        .show(ui, |ui| {
            ui.label(
                text(ch.to_string())
                    .size(26.0)
                    .monospace()
                    .strong()
                    .color(FG_DEFAULT),
            );
        });
}
