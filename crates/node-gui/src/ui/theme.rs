use egui::{Color32, Rounding, Shadow, Stroke, Vec2};

// =============================================================================
// SLATE COLOR SCALE (matches portal's dark mode)
// 12-step scale from Radix Colors
// =============================================================================

/// Darkest background - app canvas
pub const SLATE_1: Color32 = Color32::from_rgb(17, 17, 19); // #111113
/// Panel/card backgrounds
pub const SLATE_2: Color32 = Color32::from_rgb(24, 25, 27); // #18191b
/// Subtle background
pub const SLATE_3: Color32 = Color32::from_rgb(33, 34, 37); // #212225
/// Subtle background hover
pub const SLATE_4: Color32 = Color32::from_rgb(39, 42, 45); // #272a2d
/// Subtle background active
pub const SLATE_5: Color32 = Color32::from_rgb(46, 49, 53); // #2e3135
/// Border default
pub const SLATE_6: Color32 = Color32::from_rgb(54, 58, 63); // #363a3f
/// Border hover
pub const SLATE_7: Color32 = Color32::from_rgb(67, 72, 78); // #43484e
/// Stronger UI element
pub const SLATE_8: Color32 = Color32::from_rgb(90, 97, 105); // #5a6169
/// Muted text / placeholder
pub const SLATE_9: Color32 = Color32::from_rgb(105, 110, 119); // #696e77
/// Muted text hover
pub const SLATE_10: Color32 = Color32::from_rgb(119, 123, 132); // #777b84
/// Secondary text
pub const SLATE_11: Color32 = Color32::from_rgb(176, 180, 186); // #b0b4ba
/// Primary text
pub const SLATE_12: Color32 = Color32::from_rgb(237, 238, 240); // #edeef0

// =============================================================================
// ACCENT COLORS
// =============================================================================

/// Success / Primary CTA - grass green
pub const GREEN_9: Color32 = Color32::from_rgb(70, 167, 88); // #46a758
pub const GREEN_10: Color32 = Color32::from_rgb(60, 151, 77); // #3c974d (hover)

/// Warning - amber
pub const AMBER_9: Color32 = Color32::from_rgb(255, 197, 61); // #ffc53d
pub const AMBER_11: Color32 = Color32::from_rgb(171, 105, 0); // #ab6900 (text)

/// Error - red
pub const RED_9: Color32 = Color32::from_rgb(229, 72, 77); // #e5484d
pub const RED_10: Color32 = Color32::from_rgb(220, 62, 66); // #dc3e42 (hover)

/// Info - blue
pub const BLUE_9: Color32 = Color32::from_rgb(0, 144, 255); // #0090ff
pub const BLUE_11: Color32 = Color32::from_rgb(82, 169, 255); // #52a9ff (text)

// =============================================================================
// SEMANTIC TOKENS
// =============================================================================

/// Primary foreground text
pub const FG_DEFAULT: Color32 = SLATE_12;
/// Secondary text
pub const FG_MUTED: Color32 = SLATE_11;
/// Tertiary/placeholder text
pub const FG_SUBTLE: Color32 = SLATE_9;

/// App background
pub const BG_CANVAS: Color32 = SLATE_1;
/// Surface background (cards, panels)
pub const BG_SURFACE: Color32 = SLATE_2;
/// Subtle background for nested elements
pub const BG_SUBTLE: Color32 = SLATE_3;
/// Subtle hover
pub const BG_SUBTLE_HOVER: Color32 = SLATE_4;
/// Subtle active
pub const BG_SUBTLE_ACTIVE: Color32 = SLATE_5;

/// Default border
pub const BORDER: Color32 = SLATE_6;
/// Hover border
pub const BORDER_HOVER: Color32 = SLATE_7;

// =============================================================================
// RADIUS SCALE (matches portal's l1/l2/l3)
// =============================================================================

/// Small radius - inputs, small buttons
pub const RADIUS_SM: f32 = 6.0;
/// Medium radius - buttons, badges
pub const RADIUS_MD: f32 = 8.0;
/// Large radius - cards, panels, modals
pub const RADIUS_LG: f32 = 12.0;

// =============================================================================
// SHADOWS
// =============================================================================

/// Small shadow for subtle depth
pub fn shadow_sm() -> Shadow {
    Shadow {
        offset: [0.0, 2.0].into(),
        blur: 4.0,
        spread: 0.0,
        color: Color32::from_black_alpha(60),
    }
}

/// Medium shadow for cards
pub fn shadow_md() -> Shadow {
    Shadow {
        offset: [0.0, 4.0].into(),
        blur: 8.0,
        spread: 0.0,
        color: Color32::from_black_alpha(80),
    }
}

/// Large shadow for modals/popovers
pub fn shadow_lg() -> Shadow {
    Shadow {
        offset: [0.0, 8.0].into(),
        blur: 16.0,
        spread: 0.0,
        color: Color32::from_black_alpha(100),
    }
}

// =============================================================================
// THEME APPLICATION
// =============================================================================

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

        // Window styling
        window_rounding: Rounding::same(RADIUS_LG),
        window_shadow: shadow_lg(),
        window_stroke: Stroke::new(1.0, BORDER),

        // Popup styling
        menu_rounding: Rounding::same(RADIUS_MD),
        popup_shadow: shadow_md(),

        selection: Selection {
            bg_fill: GREEN_9.gamma_multiply(0.25),
            stroke: Stroke::new(1.0, GREEN_9),
        },

        widgets: egui::style::Widgets {
            // Non-interactive: labels, static content
            noninteractive: egui::style::WidgetVisuals {
                bg_fill: BG_SURFACE,
                weak_bg_fill: BG_SURFACE,
                bg_stroke: Stroke::new(1.0, BORDER),
                fg_stroke: Stroke::new(1.0, FG_MUTED),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            // Inactive: buttons at rest
            inactive: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE,
                weak_bg_fill: BG_SUBTLE,
                bg_stroke: Stroke::new(1.0, BORDER),
                fg_stroke: Stroke::new(1.0, FG_MUTED),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            // Hovered: mouse over
            hovered: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE_HOVER,
                weak_bg_fill: BG_SUBTLE_HOVER,
                bg_stroke: Stroke::new(1.0, BORDER_HOVER),
                fg_stroke: Stroke::new(1.0, FG_DEFAULT),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            // Active: pressed
            active: egui::style::WidgetVisuals {
                bg_fill: BG_SUBTLE_ACTIVE,
                weak_bg_fill: BG_SUBTLE_ACTIVE,
                bg_stroke: Stroke::new(1.0, BORDER_HOVER),
                fg_stroke: Stroke::new(1.0, FG_DEFAULT),
                rounding: Rounding::same(RADIUS_SM),
                expansion: 0.0,
            },
            // Open: expanded dropdown/menu
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
        // Spacing - matches portal's spacing scale
        style.spacing.item_spacing = Vec2::new(8.0, 6.0);
        style.spacing.button_padding = Vec2::new(14.0, 8.0);
        style.spacing.window_margin = egui::Margin::same(16.0);
        style.spacing.menu_margin = egui::Margin::same(6.0);

        // Disable text selection on labels for cleaner UI
        style.interaction.selectable_labels = false;
    });
}

// =============================================================================
// FRAME HELPERS
// =============================================================================

/// Card frame - primary container with border and shadow
pub fn card_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .rounding(Rounding::same(RADIUS_LG))
        .inner_margin(egui::Margin::same(16.0))
        .shadow(shadow_sm())
}

/// Elevated card - more prominent with larger shadow
pub fn card_frame_elevated() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .rounding(Rounding::same(RADIUS_LG))
        .inner_margin(egui::Margin::same(16.0))
        .shadow(shadow_md())
}

/// Subtle card - nested elements, less prominent
pub fn card_frame_subtle() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SUBTLE)
        .rounding(Rounding::same(RADIUS_MD))
        .inner_margin(egui::Margin::same(12.0))
}

/// Header frame - top panel styling
pub fn header_frame() -> egui::Frame {
    egui::Frame::none()
        .fill(BG_SURFACE)
        .stroke(Stroke::new(1.0, BORDER))
        .inner_margin(egui::Margin::symmetric(16.0, 12.0))
}
