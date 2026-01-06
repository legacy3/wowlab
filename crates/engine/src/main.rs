use engine::cli::{Args, Runner};
use clap::Parser;
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

fn main() {
    // Only show warnings by default; use RUST_LOG=engine=info for more
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("engine=warn"));

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(true))
        .init();

    let args = Args::parse();

    if let Err(e) = Runner::run(args) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
