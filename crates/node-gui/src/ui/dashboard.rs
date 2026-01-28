use super::icons::Icon;
use super::theme::{
    card_frame, progress_bar, section_header, stat_card, text, two_columns, AMBER_9, BLUE_9,
    FG_DEFAULT, FG_SUBTLE, GREEN_9, RED_9, SPACE_MD, SPACE_SM,
};
use egui_plot::{Line, Plot, PlotPoints};
use std::collections::VecDeque;
use wowlab_node::NodeStats;

pub fn show(
    ui: &mut egui::Ui,
    stats: &NodeStats,
    sims_history: &VecDeque<f64>,
    cpu_history: &VecDeque<f32>,
) {
    ui.add_space(SPACE_SM);

    card_frame().show(ui, |ui| {
        // Stats grid
        two_columns(ui, |ui, idx| {
            let (icon, label, value, color) = match idx {
                0 => (
                    Icon::Cpu,
                    "Workers",
                    format!(
                        "{}/{} ({})",
                        stats.busy_workers, stats.max_workers, stats.total_cores
                    ),
                    if stats.busy_workers > 0 {
                        GREEN_9
                    } else {
                        FG_DEFAULT
                    },
                ),
                1 => (
                    Icon::Layers,
                    "Jobs",
                    stats.active_jobs.to_string(),
                    if stats.active_jobs > 0 {
                        BLUE_9
                    } else {
                        FG_DEFAULT
                    },
                ),
                2 => (
                    Icon::CircleCheck,
                    "Completed",
                    format_number(stats.completed_chunks),
                    FG_DEFAULT,
                ),
                3 => (
                    Icon::Zap,
                    "Sims/sec",
                    format!("{:.0}", stats.sims_per_second),
                    if stats.sims_per_second > 0.0 {
                        AMBER_9
                    } else {
                        FG_DEFAULT
                    },
                ),
                _ => return,
            };
            stat_card(ui, icon, label, &value, color);
        });

        ui.add_space(SPACE_MD);
        ui.separator();
        ui.add_space(SPACE_SM);

        // CPU bar
        let cpu_color = if stats.cpu_usage > 0.8 {
            RED_9
        } else if stats.cpu_usage > 0.5 {
            AMBER_9
        } else {
            GREEN_9
        };
        progress_bar(ui, Icon::Gauge, "CPU", stats.cpu_usage, cpu_color);

        // Sparklines
        if !sims_history.is_empty() || !cpu_history.is_empty() {
            ui.add_space(SPACE_MD);
            ui.separator();
            ui.add_space(SPACE_SM);

            section_header(ui, Icon::Activity, "Metrics");
            ui.add_space(SPACE_SM);

            let width = (ui.available_width() - SPACE_SM) / 2.0;
            ui.horizontal(|ui| {
                sparkline_card(ui, "Sims/sec", sims_history, AMBER_9, width, None);
                ui.add_space(SPACE_SM);
                sparkline_card(ui, "CPU %", cpu_history, GREEN_9, width, Some(100.0));
            });
        }
    });
}

fn sparkline_card<T: Into<f64> + Copy>(
    ui: &mut egui::Ui,
    label: &str,
    data: &VecDeque<T>,
    color: egui::Color32,
    width: f32,
    max_y: Option<f64>,
) {
    ui.vertical(|ui| {
        ui.set_width(width);
        ui.label(text(label).size(10.0).color(FG_SUBTLE));
        sparkline(ui, data, color, width, 40.0, max_y);
    });
}

fn sparkline<T: Into<f64> + Copy>(
    ui: &mut egui::Ui,
    data: &VecDeque<T>,
    color: egui::Color32,
    width: f32,
    height: f32,
    max_y: Option<f64>,
) {
    if data.is_empty() {
        return;
    }

    let points: PlotPoints = data
        .iter()
        .enumerate()
        .map(|(i, v)| [i as f64, (*v).into()])
        .collect();

    let mut plot = Plot::new(ui.next_auto_id())
        .height(height)
        .width(width)
        .show_axes([false, false])
        .show_grid(false)
        .allow_zoom(false)
        .allow_drag(false)
        .allow_scroll(false)
        .show_x(false)
        .show_y(false)
        .include_y(0.0)
        .show_background(false);

    if let Some(max) = max_y {
        plot = plot.include_y(max);
    }

    plot.show(ui, |plot_ui| {
        plot_ui.line(
            Line::new("", points)
                .color(color)
                .stroke(egui::Stroke::new(1.5, color)),
        );
    });
}

#[allow(clippy::cast_precision_loss)]
fn format_number(n: u64) -> String {
    if n >= 1_000_000 {
        format!("{:.1}M", n as f64 / 1_000_000.0)
    } else if n >= 1_000 {
        format!("{:.1}K", n as f64 / 1_000.0)
    } else {
        n.to_string()
    }
}
