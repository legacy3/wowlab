use super::icons::{icon, Icon};
use egui::{Color32, RichText, Rounding, Shadow, Stroke, Vec2};

// Radix Colors - Slate scale (dark mode)
pub const SLATE_1: Color32 = Color32::from_rgb(17, 17, 19);
pub const SLATE_2: Color32 = Color32::from_rgb(24, 25, 27);
pub const SLATE_3: Color32 = Color32::from_rgb(33, 34, 37);
pub const SLATE_4: Color32 = Color32::from_rgb(39, 42, 45);
pub const SLATE_5: Color32 = Color32::from_rgb(46, 49, 53);
pub const SLATE_6: Color32 = Color32::from_rgb(54, 58, 63);
pub const SLATE_7: Color32 = Color32::from_rgb(67, 72, 78);
pub const SLATE_8: Color32 = Color32::from_rgb(90, 97, 105);
pub const SLATE_9: Color32 = Color32::from_rgb(105, 110, 119);
pub const SLATE_11: Color32 = Color32::from_rgb(176, 180, 186);
pub const SLATE_12: Color32 = Color32::from_rgb(237, 238, 240);

// Accent colors
pub const GREEN_9: Color32 = Color32::from_rgb(70, 167, 88);
pub const AMBER_9: Color32 = Color32::from_rgb(255, 197, 61);
pub const AMBER_11: Color32 = Color32::from_rgb(171, 105, 0);
pub const RED_9: Color32 = Color32::from_rgb(229, 72, 77);
pub const BLUE_9: Color32 = Color32::from_rgb(0, 144, 255);
pub const BLUE_11: Color32 = Color32::from_rgb(82, 169, 255);

// Semantic tokens
pub const FG_DEFAULT: Color32 = SLATE_12;
pub const FG_MUTED: Color32 = SLATE_11;
pub const FG_SUBTLE: Color32 = SLATE_9;
pub const BG_CANVAS: Color32 = SLATE_1;
pub const BG_SURFACE: Color32 = SLATE_2;
pub const BG_SUBTLE: Color32 = SLATE_3;
pub const BG_SUBTLE_HOVER: Color32 = SLATE_4;
pub const BG_SUBTLE_ACTIVE: Color32 = SLATE_5;
pub const BORDER: Color32 = SLATE_6;
pub const BORDER_HOVER: Color32 = SLATE_7;

// Radius
pub const RADIUS_SM: f32 = 6.0;
pub const RADIUS_MD: f32 = 8.0;
pub const RADIUS_LG: f32 = 12.0;

// Spacing constants
pub const SPACE_XS: f32 = 4.0;
pub const SPACE_SM: f32 = 8.0;
pub const SPACE_MD: f32 = 12.0;
pub const SPACE_LG: f32 = 16.0;

// Shadows
pub fn shadow_sm() -> Shadow {
    Shadow {
        offset: [0.0, 2.0].into(),
        blur: 4.0,
        spread: 0.0,
        color: Color32::from_black_alpha(60),
    }
}

pub fn shadow_md() -> Shadow {
    Shadow {
        offset: [0.0, 4.0].into(),
        blur: 8.0,
        spread: 0.0,
        color: Color32::from_black_alpha(80),
    }
}

pub fn shadow_lg() -> Shadow {
    Shadow {
        offset: [0.0, 8.0].into(),
        blur: 16.0,
        spread: 0.0,
        color: Color32::from_black_alpha(100),
    }
}

// Theme application
pub fn apply_theme(ctx: &egui::Context) {
    use egui::{style::Selection, Visuals};

    ctx.set_visuals(Visuals {
        dark_mode: true,
        override_text_color: Some(FG_DEFAULT),
        panel_fill: BG_CANVAS,
        window_fill: BG_SURFACE,
        extreme_bg_color: SLATE_1,
        faint_bg_color: SLATE_3,
        code_bg_color: SLATE_3,
        hyperlink_color: BLUE_11,
        warn_fg_color: AMBER_11,
        error_fg_color: RED_9,
        window_rounding: Rounding::same(RADIUS_LG),
        window_shadow: shadow_lg(),
        window_stroke: Stroke::new(1.0, BORDER),
        menu_rounding: Rounding::same(RADIUS_MD),
        popup_shadow: shadow_md(),
        selection: Selection {
            bg_fill: GREEN_9.gamma_multiply(0.25),
            stroke: Stroke::new(1.0, GREEN_9),
        },
        widgets: egui::style::Widgets {
            noninteractive: egui::style::WidgetVisuals {
                bg_fill: BG_SURFACE,
                weak_bg_fill: BG_SURFACE,
                bg_stroke: Stroke::new(1.0, BORDER),
                fg_stroke: Stroke::new(1.0, FG_MUTED),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            inactive: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE,
                weak_bg_fill: BG_SUBTLE,
                bg_stroke: Stroke::new(1.0, BORDER),
                fg_stroke: Stroke::new(1.0, FG_MUTED),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            hovered: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE_HOVER,
                weak_bg_fill: BG_SUBTLE_HOVER,
                bg_stroke: Stroke::new(1.0, BORDER_HOVER),
                fg_stroke: Stroke::new(1.0, FG_DEFAULT),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            active: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE_ACTIVE,
                weak_bg_fill: BG_SUBTLE_ACTIVE,
                bg_stroke: Stroke::new(1.0, BORDER_HOVER),
                fg_stroke: Stroke::new(1.0, FG_DEFAULT),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            open: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE,
                weak_bg_fill: BG_SURFACE,
                bg_stroke: Stroke::new(1.0, BORDER),
                fg_stroke: Stroke::new(1.0, FG_DEFAULT),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
        },
        ..Visuals::dark()
    });

    ctx.style_mut(|style| {
        style.spacing.item_spacing = Vec2::new(8.0, 6.0);
        style.spacing.button_padding = Vec2::new(14.0, 8.0);
        style.spacing.window_margin = egui::Margin::same(16.0);
        style.spacing.menu_margin = egui::Margin::same(6.0);
        style.interaction.selectable_labels = false;
    });
}

// Frame helpers
pub fn card_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .rounding(Rounding::same(RADIUS_LG))
        .inner_margin(egui::Margin::same(SPACE_LG))
        .shadow(shadow_sm())
}

pub fn inner_card() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SUBTLE)
        .stroke(Stroke::new(1.0, BORDER))
        .rounding(Rounding::same(RADIUS_MD))
        .inner_margin(egui::Margin::same(SPACE_MD))
}

pub fn header_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .inner_margin(egui::Margin::symmetric(SPACE_LG, SPACE_MD))
}

// Text helpers - basic building blocks
pub fn text(s: impl Into<String>) -> RichText {
    RichText::new(s)
}

pub fn icon_text(i: Icon) -> RichText {
    text(icon(i))
}

pub fn title(s: impl Into<String>) -> RichText {
    text(s).size(16.0).strong().color(FG_DEFAULT)
}

pub fn title_lg(s: impl Into<String>) -> RichText {
    text(s).size(18.0).strong().color(FG_DEFAULT)
}

pub fn subtitle(s: impl Into<String>) -> RichText {
    text(s).size(14.0).color(FG_SUBTLE)
}

// Layout components - these render complete UI elements

/// Row with icon, label, and optional right-aligned value
pub fn labeled_row(ui: &mut egui::Ui, i: Icon, label: &str, value: Option<&str>) {
    ui.horizontal(|ui| {
        ui.add_space(SPACE_XS);
        ui.label(icon_text(i).size(12.0).color(FG_SUBTLE));
        ui.add_space(SPACE_XS);
        ui.label(text(label).size(11.0).color(FG_MUTED));
        if let Some(v) = value {
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label(text(v).size(11.0).monospace().color(FG_DEFAULT));
            });
        }
    });
}

/// Section header - icon + label
pub fn section_header(ui: &mut egui::Ui, i: Icon, label: &str) {
    ui.horizontal(|ui| {
        ui.label(icon_text(i).size(14.0).color(FG_SUBTLE));
        ui.add_space(SPACE_XS);
        ui.label(text(label).size(13.0).color(FG_MUTED));
    });
}

/// Stat card with icon, label on top and large value below
pub fn stat_card(ui: &mut egui::Ui, i: Icon, label: &str, value: &str, color: Color32) {
    inner_card().show(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(icon_text(i).size(12.0).color(FG_SUBTLE));
            ui.add_space(SPACE_XS);
            ui.label(text(label).size(11.0).color(FG_MUTED));
        });
        ui.add_space(SPACE_XS);
        ui.label(text(value).size(18.0).strong().monospace().color(color));
    });
}

/// Progress bar with label and percentage
pub fn progress_bar(ui: &mut egui::Ui, i: Icon, label: &str, value: f32, color: Color32) {
    labeled_row(ui, i, label, Some(&format!("{:.0}%", value * 100.0)));
    ui.add_space(SPACE_XS);

    let width = ui.available_width();
    let height = 6.0;
    let (rect, _) = ui.allocate_exact_size(egui::vec2(width, height), egui::Sense::hover());

    ui.painter().rect_filled(rect, height / 2.0, SLATE_5);

    let fill = rect.width() * value;
    if fill > 0.0 {
        let fill_rect = egui::Rect::from_min_size(rect.min, egui::vec2(fill, rect.height()));
        ui.painter().rect_filled(fill_rect, height / 2.0, color);
    }
}

/// Two-column grid layout
pub fn two_columns<F>(ui: &mut egui::Ui, mut content: F)
where
    F: FnMut(&mut egui::Ui, usize),
{
    let width = (ui.available_width() - SPACE_SM) / 2.0;
    egui::Grid::new(ui.next_auto_id())
        .num_columns(2)
        .spacing([SPACE_SM, SPACE_SM])
        .min_col_width(width)
        .max_col_width(width)
        .show(ui, |ui| {
            content(ui, 0);
            content(ui, 1);
            ui.end_row();
            content(ui, 2);
            content(ui, 3);
            ui.end_row();
        });
}

