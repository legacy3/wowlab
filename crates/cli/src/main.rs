//! wowlab CLI - Command line tools for WoW data processing
//!
//! Usage:
//!   wowlab snapshot sync --patch 11.2.0 --data-dir ~/Source/wowlab-data
//!   wowlab snapshot dump-spell 53351 --data-dir ~/Source/wowlab-data
//!   wowlab snapshot dump-talent 253 --data-dir ~/Source/wowlab-data

mod commands;

use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[derive(Parser)]
#[command(name = "wowlab")]
#[command(about = "WoW data processing tools")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Snapshot data processing commands
    Snapshot {
        #[command(subcommand)]
        command: commands::snapshot::SnapshotCommand,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load .env file if present
    dotenvy::dotenv().ok();

    // Initialize tracing - defaults to info, override with RUST_LOG
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Snapshot { command } => command.run().await,
    }
}
