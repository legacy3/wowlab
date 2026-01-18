mod app;
mod ui;

use app::NodeApp;
use clap::{Parser, Subcommand};
use node::utils::logging;
use std::sync::Arc;

#[derive(Parser)]
#[command(name = "node-gui")]
#[command(author = "wowlab")]
#[command(version)]
#[command(about = "WoW Lab distributed simulation node", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Skip automatic update check on startup
    #[arg(long, global = true)]
    no_update: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Update to the latest version
    Update {
        /// Check for updates without installing
        #[arg(long)]
        check: bool,
    },
    /// Start the node GUI (default behavior)
    Run,
}

fn setup_egui(ctx: &egui::Context) {
    let mut fonts = egui::FontDefinitions::default();
    fonts.font_data.insert(
        "lucide".to_owned(),
        egui::FontData::from_static(lucide_icons::LUCIDE_FONT_BYTES),
    );
    fonts
        .families
        .entry(egui::FontFamily::Proportional)
        .or_default()
        .push("lucide".to_owned());
    ctx.set_fonts(fonts);
    ui::theme::apply_theme(ctx);
}

fn load_icon() -> Option<egui::IconData> {
    let bytes = include_bytes!("../assets/icon.png");
    let image = image::load_from_memory(bytes).ok()?.into_rgba8();
    let (width, height) = image.dimensions();
    Some(egui::IconData {
        rgba: image.into_raw(),
        width,
        height,
    })
}

fn main() -> eframe::Result<()> {
    let cli = Cli::parse();

    const VERSION: &str = env!("CARGO_PKG_VERSION");

    match cli.command {
        Some(Commands::Update { check }) => {
            if check {
                match node::update::check_for_update(VERSION) {
                    Ok(Some(version)) => {
                        println!("New version available: {}", version);
                        println!("Run `node-gui update` to install");
                    }
                    Ok(None) => println!("Already on latest version"),
                    Err(e) => {
                        eprintln!("Failed to check for updates: {}", e);
                        std::process::exit(1);
                    }
                }
            } else if let Err(e) = node::update::update("node-gui", VERSION) {
                eprintln!("Update failed: {}", e);
                std::process::exit(1);
            }
            return Ok(());
        }
        Some(Commands::Run) | None => {}
    }

    let skip_update = cli.no_update;
    let log_rx = logging::init_with_ui();

    let runtime = Arc::new(tokio::runtime::Runtime::new().expect("Failed to create runtime"));

    let mut viewport = egui::ViewportBuilder::default()
        .with_inner_size([480.0, 600.0])
        .with_min_inner_size([400.0, 500.0])
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
        Box::new(move |cc| {
            setup_egui(&cc.egui_ctx);
            Ok(Box::new(NodeApp::new(cc, runtime, log_rx, skip_update)))
        }),
    )
}
