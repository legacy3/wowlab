use super::icons::{icon, Icon};
use super::theme::{
    card_frame, RED_500, TEXT_MUTED, TEXT_SECONDARY, YELLOW_500, ZINC_500, ZINC_600, ZINC_700,
    ZINC_800, ZINC_900,
};
use node_core::{utils::logging, LogEntry, LogLevel};
use std::collections::VecDeque;

#[derive(Clone, PartialEq, Default)]
pub struct LogFilter {
    pub level: LogLevel,
    pub expanded_index: Option<usize>,
}

impl LogFilter {
    fn label(&self) -> &'static str {
        match self.level {
            LogLevel::Debug => "All",
            LogLevel::Info => "Info+",
            LogLevel::Warn => "Warn+",
            LogLevel::Error => "Errors",
        }
    }

    fn matches(&self, level: LogLevel) -> bool {
        match self.level {
            LogLevel::Debug => true,
            LogLevel::Info => !matches!(level, LogLevel::Debug),
            LogLevel::Warn => matches!(level, LogLevel::Warn | LogLevel::Error),
            LogLevel::Error => matches!(level, LogLevel::Error),
        }
    }
}

pub fn show(ui: &mut egui::Ui, logs: &VecDeque<LogEntry>, filter: &mut LogFilter) {
    ui.add_space(8.0);

    card_frame().show(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(icon(Icon::ScrollText))
                    .color(TEXT_MUTED)
                    .size(14.0),
            );
            ui.label(
                egui::RichText::new("Activity Log")
                    .color(TEXT_SECONDARY)
                    .size(13.0),
            );

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                egui::ComboBox::from_id_salt("log_filter")
                    .selected_text(filter.label())
                    .width(70.0)
                    .show_ui(ui, |ui| {
                        ui.selectable_value(&mut filter.level, LogLevel::Debug, "All");
                        ui.selectable_value(&mut filter.level, LogLevel::Info, "Info+");
                        ui.selectable_value(&mut filter.level, LogLevel::Warn, "Warn+");
                        ui.selectable_value(&mut filter.level, LogLevel::Error, "Errors");
                    });

                let visible = logs.iter().filter(|e| filter.matches(e.level)).count();
                ui.label(
                    egui::RichText::new(format!("{visible}"))
                        .color(TEXT_MUTED)
                        .size(11.0),
                );

                ui.add_space(8.0);

                let folder_btn = egui::Button::new(
                    egui::RichText::new(icon(Icon::FolderOpen))
                        .size(13.0)
                        .color(TEXT_MUTED),
                )
                .fill(egui::Color32::TRANSPARENT)
                .stroke(egui::Stroke::NONE);

                if ui
                    .add(folder_btn)
                    .on_hover_text("Open log folder")
                    .on_hover_cursor(egui::CursorIcon::PointingHand)
                    .clicked()
                {
                    if let Some(dir) = logging::log_dir() {
                        let _ = open::that(dir);
                    }
                }
            });
        });

        ui.add_space(8.0);
        ui.separator();
        ui.add_space(4.0);

        egui::ScrollArea::vertical()
            .auto_shrink([false, false])
            .stick_to_bottom(true)
            .show(ui, |ui| {
                ui.style_mut().spacing.item_spacing.y = 1.0;

                let filtered: Vec<_> = logs
                    .iter()
                    .enumerate()
                    .filter(|(_, e)| filter.matches(e.level))
                    .collect();

                if filtered.is_empty() {
                    ui.add_space(20.0);
                    ui.vertical_centered(|ui| {
                        ui.label(
                            egui::RichText::new(icon(Icon::Inbox))
                                .color(ZINC_700)
                                .size(24.0),
                        );
                        ui.add_space(8.0);
                        ui.label(
                            egui::RichText::new("No logs at this level")
                                .color(TEXT_MUTED)
                                .size(13.0),
                        );
                    });
                    ui.add_space(20.0);
                } else {
                    for (idx, entry) in filtered {
                        let is_expanded = filter.expanded_index == Some(idx);
                        if log_entry_row(ui, entry, ui.available_width(), is_expanded) {
                            filter.expanded_index = if is_expanded { None } else { Some(idx) };
                        }
                    }
                }
            });
    });
}

fn log_entry_row(
    ui: &mut egui::Ui,
    entry: &LogEntry,
    available_width: f32,
    is_expanded: bool,
) -> bool {
    let (level_icon, level_color) = match entry.level {
        LogLevel::Info => (icon(Icon::Info), ZINC_500),
        LogLevel::Warn => (icon(Icon::TriangleAlert), YELLOW_500),
        LogLevel::Error => (icon(Icon::CircleX), RED_500),
        LogLevel::Debug => (icon(Icon::Bug), ZINC_600),
    };

    let is_error = matches!(entry.level, LogLevel::Error | LogLevel::Warn);
    let bg_color = if is_expanded {
        ZINC_900
    } else if is_error {
        ZINC_800.gamma_multiply(0.3)
    } else {
        egui::Color32::TRANSPARENT
    };

    let mut clicked = false;

    egui::Frame::none()
        .fill(bg_color)
        .rounding(egui::Rounding::same(4.0))
        .inner_margin(egui::Margin::symmetric(4.0, 2.0))
        .show(ui, |ui| {
            clicked = render_log_row(
                ui,
                entry,
                &level_icon,
                level_color,
                available_width,
                is_expanded,
            );
        });

    clicked
}

fn render_log_row(
    ui: &mut egui::Ui,
    entry: &LogEntry,
    level_icon: &str,
    level_color: egui::Color32,
    available_width: f32,
    is_expanded: bool,
) -> bool {
    let mut clicked = false;

    let msg_color = match entry.level {
        LogLevel::Error => RED_500,
        LogLevel::Warn => YELLOW_500,
        _ => TEXT_SECONDARY,
    };

    // Measure actual text width using egui's font system
    let prefix_width = 80.0; // time + icon + spacing
    let max_msg_width = (available_width - prefix_width - 30.0).max(100.0);

    let font_id = egui::FontId::proportional(12.0);
    let full_text_width = ui.fonts(|f| {
        f.layout_no_wrap(entry.message.clone(), font_id.clone(), msg_color)
            .rect
            .width()
    });
    let needs_truncate = full_text_width > max_msg_width;

    ui.vertical(|ui| {
        let response = ui.horizontal(|ui| {
            ui.add_space(4.0);

            let secs = entry.timestamp.elapsed().as_secs();
            let time_str = if secs < 60 {
                format!("{secs:>2}s")
            } else if secs < 3600 {
                format!("{:>2}m", secs / 60)
            } else {
                format!("{:>2}h", secs / 3600)
            };

            ui.label(
                egui::RichText::new(time_str)
                    .size(11.0)
                    .monospace()
                    .color(ZINC_600),
            );
            ui.add_space(8.0);
            ui.label(
                egui::RichText::new(level_icon)
                    .size(12.0)
                    .color(level_color),
            );
            ui.add_space(6.0);

            if needs_truncate && !is_expanded {
                let msg = truncate_to_width(&entry.message, max_msg_width, ui, &font_id, msg_color);
                ui.label(egui::RichText::new(msg).size(12.0).color(msg_color));
            } else {
                ui.label(
                    egui::RichText::new(&entry.message)
                        .size(12.0)
                        .color(msg_color),
                );
            }

            if needs_truncate {
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let chevron = if is_expanded {
                        icon(Icon::ChevronUp)
                    } else {
                        icon(Icon::ChevronDown)
                    };
                    ui.label(egui::RichText::new(chevron).size(11.0).color(ZINC_600));
                });
            }
        });

        if response.response.interact(egui::Sense::click()).clicked() {
            clicked = true;
        }
        if response.response.hovered() {
            ui.ctx().set_cursor_icon(egui::CursorIcon::PointingHand);
        }
    });

    clicked
}

fn truncate_to_width(
    text: &str,
    max_width: f32,
    ui: &egui::Ui,
    font_id: &egui::FontId,
    color: egui::Color32,
) -> String {
    let char_indices: Vec<usize> = text.char_indices().map(|(i, _)| i).collect();
    let mut lo = 0;
    let mut hi = char_indices.len();

    while lo < hi {
        let mid = (lo + hi).div_ceil(2);
        let byte_idx = char_indices.get(mid).copied().unwrap_or(text.len());
        let truncated = format!("{}...", &text[..byte_idx]);
        let width = ui.fonts(|f| {
            f.layout_no_wrap(truncated, font_id.clone(), color)
                .rect
                .width()
        });

        if width <= max_width {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }

    let byte_idx = char_indices.get(lo).copied().unwrap_or(text.len());
    format!("{}...", &text[..byte_idx])
}
