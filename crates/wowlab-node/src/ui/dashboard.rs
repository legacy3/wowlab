//! Dashboard view - normal operation display

use super::icons::{icon, Icon};
use crate::app::NodeStats;

/// Show the main dashboard with node statistics
pub fn show(ui: &mut egui::Ui, stats: NodeStats) {
    ui.add_space(8.0);

    // Connection status line
    ui.horizontal(|ui| {
        ui.label(
            egui::RichText::new(icon(Icon::CircleCheck))
                .color(egui::Color32::GREEN)
                .size(14.0),
        );
        ui.label(egui::RichText::new("Connected").color(egui::Color32::GREEN));
        ui.label("-");
        ui.label(egui::RichText::new("Polling for work").color(egui::Color32::GRAY));
    });

    ui.add_space(12.0);

    // All stats in one grid
    egui::Grid::new("stats_grid")
        .num_columns(2)
        .spacing([40.0, 6.0])
        .show(ui, |ui| {
            ui.label("Workers");
            ui.label(
                egui::RichText::new(format!("{}/{}", stats.busy_workers, stats.max_workers))
                    .strong()
                    .monospace(),
            );
            ui.end_row();

            ui.label("Active jobs");
            ui.label(
                egui::RichText::new(stats.active_jobs.to_string())
                    .strong()
                    .monospace(),
            );
            ui.end_row();

            ui.label("Completed");
            ui.label(
                egui::RichText::new(stats.completed_chunks.to_string())
                    .strong()
                    .monospace(),
            );
            ui.end_row();

            ui.label("Sims/sec");
            ui.label(
                egui::RichText::new(format!("{:.0}", stats.sims_per_second))
                    .strong()
                    .monospace(),
            );
            ui.end_row();
        });

    ui.add_space(12.0);

    // CPU bar
    ui.horizontal(|ui| {
        ui.label("CPU");
        ui.add(
            egui::ProgressBar::new(stats.cpu_usage)
                .text(format!("{:.0}%", stats.cpu_usage * 100.0))
                .animate(true),
        );
    });
}
