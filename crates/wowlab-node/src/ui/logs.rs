//! Logs view - scrolling log display

use super::icons::{icon, Icon};
use crate::app::LogEntry;
use std::collections::VecDeque;

/// Show the scrolling logs panel
pub fn show(ui: &mut egui::Ui, logs: &VecDeque<LogEntry>) {
    egui::ScrollArea::vertical()
        .auto_shrink([false, false])
        .stick_to_bottom(true)
        .show(ui, |ui| {
            ui.style_mut().spacing.item_spacing.y = 2.0;

            for entry in logs.iter() {
                ui.horizontal(|ui| {
                    // Time ago (compact)
                    let secs = entry.timestamp.elapsed().as_secs();
                    let time_str = if secs < 60 {
                        format!("{:>3}s", secs)
                    } else if secs < 3600 {
                        format!("{:>3}m", secs / 60)
                    } else {
                        format!("{:>3}h", secs / 3600)
                    };
                    ui.label(
                        egui::RichText::new(time_str)
                            .small()
                            .monospace()
                            .color(egui::Color32::DARK_GRAY),
                    );

                    // Level icon
                    let (level_icon, level_color) = match entry.level {
                        crate::app::LogLevel::Info => (icon(Icon::Info), egui::Color32::GRAY),
                        crate::app::LogLevel::Warn => {
                            (icon(Icon::TriangleAlert), egui::Color32::YELLOW)
                        }
                        crate::app::LogLevel::Error => {
                            (icon(Icon::CircleX), egui::Color32::from_rgb(255, 100, 100))
                        }
                        crate::app::LogLevel::Debug => (icon(Icon::Bug), egui::Color32::DARK_GRAY),
                    };
                    ui.label(egui::RichText::new(level_icon).small().color(level_color));

                    // Message (truncated if too long)
                    let msg = if entry.message.len() > 80 {
                        format!("{}...", &entry.message[..77])
                    } else {
                        entry.message.clone()
                    };
                    ui.label(egui::RichText::new(msg).small().color(
                        if matches!(entry.level, crate::app::LogLevel::Error) {
                            egui::Color32::from_rgb(255, 100, 100)
                        } else {
                            egui::Color32::LIGHT_GRAY
                        },
                    ));
                });
            }

            if logs.is_empty() {
                ui.label(
                    egui::RichText::new("No logs yet...")
                        .small()
                        .color(egui::Color32::DARK_GRAY)
                        .italics(),
                );
            }
        });
}
