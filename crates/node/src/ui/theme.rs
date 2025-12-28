//! Shared theme constants and styling utilities
//!
//! Uses Tailwind's zinc palette for consistency with the web portal.

use egui::{Color32, Rounding, Stroke, Vec2};

// Zinc palette (dark mode)
pub const ZINC_950: Color32 = Color32::from_rgb(9, 9, 11);
pub const ZINC_900: Color32 = Color32::from_rgb(24, 24, 27);
pub const ZINC_800: Color32 = Color32::from_rgb(39, 39, 42);
pub const ZINC_700: Color32 = Color32::from_rgb(63, 63, 70);
pub const ZINC_600: Color32 = Color32::from_rgb(82, 82, 91);
pub const ZINC_500: Color32 = Color32::from_rgb(113, 113, 122);
pub const ZINC_400: Color32 = Color32::from_rgb(161, 161, 170);
pub const ZINC_300: Color32 = Color32::from_rgb(212, 212, 216);

// Brand colors
pub const GREEN_500: Color32 = Color32::from_rgb(34, 197, 94);
pub const GREEN_600: Color32 = Color32::from_rgb(22, 163, 74);
pub const YELLOW_500: Color32 = Color32::from_rgb(234, 179, 8);
pub const RED_500: Color32 = Color32::from_rgb(239, 68, 68);
pub const BLUE_500: Color32 = Color32::from_rgb(59, 130, 246);

// Semantic colors
pub const TEXT_PRIMARY: Color32 = Color32::WHITE;
pub const TEXT_SECONDARY: Color32 = ZINC_400;
pub const TEXT_MUTED: Color32 = ZINC_500;
pub const BORDER: Color32 = ZINC_800;
pub const SURFACE: Color32 = ZINC_900;
pub const SURFACE_ELEVATED: Color32 = ZINC_800;

/// Apply global theme to egui context
pub fn apply_theme(ctx: &egui::Context) {
    use egui::{style::Selection, Visuals};

    ctx.set_visuals(Visuals {
        dark_mode: true,
        override_text_color: Some(TEXT_PRIMARY),
        panel_fill: ZINC_950,
        window_fill: ZINC_900,
        extreme_bg_color: ZINC_950,
        faint_bg_color: ZINC_900,
        hyperlink_color: GREEN_500,
        selection: Selection {
            bg_fill: Color32::from_rgb(34, 197, 94).gamma_multiply(0.3),
            stroke: Stroke::new(1.0, GREEN_500),
        },
        widgets: egui::style::Widgets {
            noninteractive: egui::style::WidgetVisuals {
                bg_fill: ZINC_900,
                weak_bg_fill: ZINC_900,
                bg_stroke: Stroke::new(1.0, ZINC_800),
                fg_stroke: Stroke::new(1.0, ZINC_400),
                rounding: Rounding::same(6.0),
                expansion: 0.0,
            },
            inactive: egui::style::WidgetVisuals {
                bg_fill: ZINC_800,
                weak_bg_fill: ZINC_800,
                bg_stroke: Stroke::new(1.0, ZINC_700),
                fg_stroke: Stroke::new(1.0, ZINC_300),
                rounding: Rounding::same(6.0),
                expansion: 0.0,
            },
            hovered: egui::style::WidgetVisuals {
                bg_fill: ZINC_700,
                weak_bg_fill: ZINC_700,
                bg_stroke: Stroke::new(1.0, ZINC_600),
                fg_stroke: Stroke::new(1.0, Color32::WHITE),
                rounding: Rounding::same(6.0),
                expansion: 1.0,
            },
            active: egui::style::WidgetVisuals {
                bg_fill: ZINC_600,
                weak_bg_fill: ZINC_600,
                bg_stroke: Stroke::new(1.0, ZINC_500),
                fg_stroke: Stroke::new(1.0, Color32::WHITE),
                rounding: Rounding::same(6.0),
                expansion: 1.0,
            },
            open: egui::style::WidgetVisuals {
                bg_fill: ZINC_800,
                weak_bg_fill: ZINC_800,
                bg_stroke: Stroke::new(1.0, ZINC_700),
                fg_stroke: Stroke::new(1.0, Color32::WHITE),
                rounding: Rounding::same(6.0),
                expansion: 0.0,
            },
        },
        ..Visuals::dark()
    });

    // Adjust spacing
    ctx.style_mut(|style| {
        style.spacing.item_spacing = Vec2::new(8.0, 6.0);
        style.spacing.button_padding = Vec2::new(12.0, 6.0);
        style.spacing.window_margin = egui::Margin::same(16.0);
    });
}

/// Create a card frame
pub fn card_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .rounding(Rounding::same(10.0))
        .inner_margin(egui::Margin::same(16.0))
}

/// Create an elevated card frame
pub fn elevated_card_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(SURFACE_ELEVATED)
        .stroke(Stroke::new(1.0, ZINC_700))
        .rounding(Rounding::same(8.0))
        .inner_margin(egui::Margin::same(12.0))
}

/// Stat display with label and value
pub fn stat_row(ui: &mut egui::Ui, label: &str, value: &str, accent: Option<Color32>) {
    ui.horizontal(|ui| {
        ui.label(egui::RichText::new(label).color(TEXT_MUTED).size(13.0));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            let color = accent.unwrap_or(TEXT_PRIMARY);
            ui.label(
                egui::RichText::new(value)
                    .color(color)
                    .size(14.0)
                    .strong()
                    .monospace(),
            );
        });
    });
}

/// Primary button style
pub fn primary_button(text: &str) -> egui::Button<'_> {
    egui::Button::new(egui::RichText::new(text).color(Color32::WHITE).size(14.0))
        .fill(GREEN_500)
        .stroke(Stroke::NONE)
        .rounding(Rounding::same(8.0))
        .min_size(Vec2::new(0.0, 36.0))
}

/// Secondary/ghost button style
pub fn ghost_button(text: &str) -> egui::Button<'_> {
    egui::Button::new(egui::RichText::new(text).color(TEXT_SECONDARY).size(13.0))
        .fill(Color32::TRANSPARENT)
        .stroke(Stroke::new(1.0, ZINC_700))
        .rounding(Rounding::same(6.0))
}
