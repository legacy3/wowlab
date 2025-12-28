//! Logs view - scrolling log display

use super::icons::{icon, Icon};
use super::theme::*;
use crate::app::{LogEntry, LogLevel};
use std::collections::VecDeque;

/// Show the scrolling logs panel
pub fn show(ui: &mut egui::Ui, logs: &VecDeque<LogEntry>) {
    ui.add_space(8.0);

    card_frame().show(ui, |ui| {
        // Header
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
                ui.label(
                    egui::RichText::new(format!("{} entries", logs.len()))
                        .color(TEXT_MUTED)
                        .size(11.0),
                );
            });
        });

        ui.add_space(8.0);
        ui.separator();
        ui.add_space(4.0);

        // Scrollable log area
        egui::ScrollArea::vertical()
            .auto_shrink([false, false])
            .stick_to_bottom(true)
            .max_height(280.0)
            .show(ui, |ui| {
                ui.style_mut().spacing.item_spacing.y = 1.0;

                if logs.is_empty() {
                    ui.add_space(20.0);
                    ui.vertical_centered(|ui| {
                        ui.label(
                            egui::RichText::new(icon(Icon::Inbox))
                                .color(ZINC_700)
                                .size(24.0),
                        );
                        ui.add_space(8.0);
                        ui.label(
                            egui::RichText::new("No activity yet")
                                .color(TEXT_MUTED)
                                .size(13.0),
                        );
                    });
                    ui.add_space(20.0);
                } else {
                    for entry in logs.iter() {
                        log_entry_row(ui, entry);
                    }
                }
            });
    });
}

fn log_entry_row(ui: &mut egui::Ui, entry: &LogEntry) {
    let (level_icon, level_color) = match entry.level {
        LogLevel::Info => (icon(Icon::Info), ZINC_500),
        LogLevel::Warn => (icon(Icon::TriangleAlert), YELLOW_500),
        LogLevel::Error => (icon(Icon::CircleX), RED_500),
        LogLevel::Debug => (icon(Icon::Bug), ZINC_600),
    };

    ui.horizontal(|ui| {
        ui.add_space(4.0);

        // Time
        let secs = entry.timestamp.elapsed().as_secs();
        let time_str = if secs < 60 {
            format!("{:>2}s", secs)
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

        // Level icon
        ui.label(egui::RichText::new(level_icon).size(12.0).color(level_color));

        ui.add_space(6.0);

        // Message
        let msg_color = match entry.level {
            LogLevel::Error => RED_500,
            LogLevel::Warn => YELLOW_500,
            _ => TEXT_SECONDARY,
        };

        let msg = if entry.message.len() > 60 {
            format!("{}...", &entry.message[..57])
        } else {
            entry.message.clone()
        };

        let label = ui.label(egui::RichText::new(&msg).size(12.0).color(msg_color));

        // Show full message on hover if truncated
        if entry.message.len() > 60 {
            label.on_hover_text(&entry.message);
        }
    });
}
