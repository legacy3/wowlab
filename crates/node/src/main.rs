//! WoW Lab Node - Distributed simulation compute node
//!
//! A GUI application that connects to the WoW Lab backend and runs simulations.

mod app;
mod cache;
mod claim;
mod config;
mod supabase;
mod ui;
mod worker;

use app::NodeApp;
use std::sync::Arc;

fn setup_egui(ctx: &egui::Context) {
    // Setup fonts
    let mut fonts = egui::FontDefinitions::default();

    // Add Lucide icon font
    fonts.font_data.insert(
        "lucide".to_owned(),
        egui::FontData::from_static(lucide_icons::LUCIDE_FONT_BYTES),
    );

    // Add lucide to the end of proportional fonts for fallback
    fonts
        .families
        .entry(egui::FontFamily::Proportional)
        .or_default()
        .push("lucide".to_owned());

    ctx.set_fonts(fonts);

    // Apply custom theme
    ui::theme::apply_theme(ctx);
}

fn load_icon() -> Option<egui::IconData> {
    let icon_bytes = include_bytes!("../assets/icon.png");
    let image = image::load_from_memory(icon_bytes).ok()?.into_rgba8();
    let (width, height) = image.dimensions();
    Some(egui::IconData {
        rgba: image.into_raw(),
        width,
        height,
    })
}

fn main() -> eframe::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("wowlab_node=info".parse().unwrap())
                .add_directive("eframe=warn".parse().unwrap())
                .add_directive("egui=warn".parse().unwrap()),
        )
        .init();

    tracing::info!("Starting WoW Lab Node");

    // Start async runtime in background for network ops
    let runtime = Arc::new(tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime"));

    let mut viewport = egui::ViewportBuilder::default()
        .with_inner_size([400.0, 500.0])
        .with_min_inner_size([350.0, 400.0])
        .with_title("WoW Lab Node");

    if let Some(icon) = load_icon() {
        viewport = viewport.with_icon(Arc::new(icon));
    }

    let options = eframe::NativeOptions {
        viewport,
        ..Default::default()
    };

    eframe::run_native(
        "WoW Lab Node",
        options,
        Box::new(|cc| {
            setup_egui(&cc.egui_ctx);
            Ok(Box::new(NodeApp::new(cc, runtime)))
        }),
    )
}
