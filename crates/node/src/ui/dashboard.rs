use super::icons::{icon, Icon};
use super::theme::{
    card_frame, BLUE_500, BORDER, GREEN_500, RED_500, SURFACE, TEXT_MUTED, TEXT_PRIMARY,
    YELLOW_500, ZINC_800,
};
use crate::app::NodeStats;

#[allow(clippy::too_many_lines)]
pub fn show(ui: &mut egui::Ui, stats: &NodeStats) {
    ui.add_space(12.0);

    card_frame().show(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(icon(Icon::Activity))
                    .color(GREEN_500)
                    .size(16.0),
            );
            ui.add_space(4.0);
            ui.label(
                egui::RichText::new("Online")
                    .color(GREEN_500)
                    .size(14.0)
                    .strong(),
            );

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label(
                    egui::RichText::new("Ready for work")
                        .color(TEXT_MUTED)
                        .size(12.0),
                );
            });
        });
    });

    ui.add_space(12.0);

    ui.horizontal(|ui| {
        ui.with_layout(egui::Layout::left_to_right(egui::Align::TOP), |ui| {
            stat_card(
                ui,
                &icon(Icon::Cpu),
                "Workers",
                &format!("{}/{}", stats.busy_workers, stats.max_workers),
                if stats.busy_workers > 0 {
                    Some(GREEN_500)
                } else {
                    None
                },
            );
            ui.add_space(8.0);
            stat_card(
                ui,
                &icon(Icon::Layers),
                "Active Jobs",
                &stats.active_jobs.to_string(),
                if stats.active_jobs > 0 {
                    Some(BLUE_500)
                } else {
                    None
                },
            );
        });
    });

    ui.add_space(8.0);

    ui.horizontal(|ui| {
        ui.with_layout(egui::Layout::left_to_right(egui::Align::TOP), |ui| {
            stat_card(
                ui,
                &icon(Icon::CircleCheck),
                "Completed",
                &format_number(stats.completed_chunks),
                None,
            );
            ui.add_space(8.0);
            stat_card(
                ui,
                &icon(Icon::Zap),
                "Sims/sec",
                &format!("{:.0}", stats.sims_per_second),
                if stats.sims_per_second > 0.0 {
                    Some(YELLOW_500)
                } else {
                    None
                },
            );
        });
    });

    ui.add_space(16.0);

    card_frame().show(ui, |ui| {
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new(icon(Icon::Gauge))
                    .color(TEXT_MUTED)
                    .size(14.0),
            );
            ui.add_space(4.0);
            ui.label(
                egui::RichText::new("CPU Usage")
                    .color(TEXT_MUTED)
                    .size(13.0),
            );

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label(
                    egui::RichText::new(format!("{:.0}%", stats.cpu_usage * 100.0))
                        .color(TEXT_PRIMARY)
                        .size(13.0)
                        .strong()
                        .monospace(),
                );
            });
        });

        ui.add_space(8.0);

        let available_width = ui.available_width();
        let (rect, _) =
            ui.allocate_exact_size(egui::vec2(available_width, 8.0), egui::Sense::hover());

        ui.painter().rect_filled(rect, 4.0, ZINC_800);

        let fill_width = rect.width() * stats.cpu_usage;
        if fill_width > 0.0 {
            let fill_rect =
                egui::Rect::from_min_size(rect.min, egui::vec2(fill_width, rect.height()));
            let fill_color = if stats.cpu_usage > 0.8 {
                RED_500
            } else if stats.cpu_usage > 0.5 {
                YELLOW_500
            } else {
                GREEN_500
            };
            ui.painter().rect_filled(fill_rect, 4.0, fill_color);
        }
    });
}

fn stat_card(
    ui: &mut egui::Ui,
    icon_char: &str,
    label: &str,
    value: &str,
    accent: Option<egui::Color32>,
) {
    let width = (ui.available_width() - 8.0) / 2.0;

    egui::Frame::none()
        .fill(SURFACE)
        .stroke(egui::Stroke::new(1.0, BORDER))
        .rounding(egui::Rounding::same(10.0))
        .inner_margin(egui::Margin::same(14.0))
        .show(ui, |ui| {
            ui.set_width(width);

            ui.vertical(|ui| {
                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new(icon_char).color(TEXT_MUTED).size(14.0));
                    ui.label(egui::RichText::new(label).color(TEXT_MUTED).size(12.0));
                });

                ui.add_space(6.0);

                ui.label(
                    egui::RichText::new(value)
                        .color(accent.unwrap_or(TEXT_PRIMARY))
                        .size(22.0)
                        .strong()
                        .monospace(),
                );
            });
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
