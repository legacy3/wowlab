use super::icons::{icon, Icon};
use super::theme::{
    card_frame, BLUE_500, GREEN_500, RED_500, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY, YELLOW_500,
    ZINC_700, ZINC_800,
};
use node_core::NodeStats;

pub fn show(ui: &mut egui::Ui, stats: &NodeStats) {
    ui.add_space(8.0);

    card_frame().show(ui, |ui| {
        // Calculate card width inside the frame
        let total_width = ui.available_width();
        let card_width = (total_width - 8.0) / 2.0;

        // Stats grid - 2x2
        egui::Grid::new("stats_grid")
            .num_columns(2)
            .spacing([8.0, 8.0])
            .show(ui, |ui| {
                stat_card(
                    ui,
                    card_width,
                    &icon(Icon::Cpu),
                    "Workers",
                    &format!(
                        "{}/{} ({})",
                        stats.busy_workers, stats.max_workers, stats.total_cores
                    ),
                    if stats.busy_workers > 0 {
                        Some(GREEN_500)
                    } else {
                        None
                    },
                );
                stat_card(
                    ui,
                    card_width,
                    &icon(Icon::Layers),
                    "Jobs",
                    &stats.active_jobs.to_string(),
                    if stats.active_jobs > 0 {
                        Some(BLUE_500)
                    } else {
                        None
                    },
                );
                ui.end_row();

                stat_card(
                    ui,
                    card_width,
                    &icon(Icon::CircleCheck),
                    "Completed",
                    &format_number(stats.completed_chunks),
                    None,
                );
                stat_card(
                    ui,
                    card_width,
                    &icon(Icon::Zap),
                    "Sims/sec",
                    &format!("{:.0}", stats.sims_per_second),
                    if stats.sims_per_second > 0.0 {
                        Some(YELLOW_500)
                    } else {
                        None
                    },
                );
                ui.end_row();
            });

        ui.add_space(12.0);
        ui.separator();
        ui.add_space(8.0);

        // CPU progress bar inline
        cpu_bar(ui, stats.cpu_usage);
    });
}

fn stat_card(
    ui: &mut egui::Ui,
    width: f32,
    icon_char: &str,
    label: &str,
    value: &str,
    accent: Option<egui::Color32>,
) {
    egui::Frame::none()
        .fill(ZINC_800)
        .rounding(egui::Rounding::same(6.0))
        .inner_margin(egui::Margin::same(10.0))
        .show(ui, |ui| {
            ui.set_width(width - 22.0);

            ui.horizontal(|ui| {
                ui.label(egui::RichText::new(icon_char).color(TEXT_MUTED).size(12.0));
                ui.label(egui::RichText::new(label).color(TEXT_MUTED).size(11.0));
            });

            ui.add_space(2.0);

            ui.label(
                egui::RichText::new(value)
                    .color(accent.unwrap_or(TEXT_PRIMARY))
                    .size(18.0)
                    .strong()
                    .monospace(),
            );
        });
}

fn cpu_bar(ui: &mut egui::Ui, usage: f32) {
    ui.horizontal(|ui| {
        ui.label(
            egui::RichText::new(icon(Icon::Gauge))
                .color(TEXT_MUTED)
                .size(12.0),
        );
        ui.label(egui::RichText::new("CPU").color(TEXT_SECONDARY).size(11.0));

        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            ui.label(
                egui::RichText::new(format!("{:.0}%", usage * 100.0))
                    .color(TEXT_PRIMARY)
                    .size(11.0)
                    .monospace(),
            );
        });
    });

    ui.add_space(4.0);

    let bar_width = ui.available_width();
    let (rect, _) = ui.allocate_exact_size(egui::vec2(bar_width, 4.0), egui::Sense::hover());

    ui.painter().rect_filled(rect, 2.0, ZINC_700);

    let fill_width = rect.width() * usage;
    if fill_width > 0.0 {
        let fill_rect = egui::Rect::from_min_size(rect.min, egui::vec2(fill_width, rect.height()));
        let fill_color = if usage > 0.8 {
            RED_500
        } else if usage > 0.5 {
            YELLOW_500
        } else {
            GREEN_500
        };
        ui.painter().rect_filled(fill_rect, 2.0, fill_color);
    }
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
