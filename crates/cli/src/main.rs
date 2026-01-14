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

    // Initialize tracing with RUST_LOG env var support
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Snapshot { command } => command.run().await,
    }
}
