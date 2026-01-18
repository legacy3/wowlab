use clap::Parser;
use engine::cli::{Args, Command, Runner};
use engine::core::{configure_thread_pool, get_optimal_concurrency};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

// Use mimalloc for faster allocations (significant speedup for clone-heavy batch sims)
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

fn main() {
    // Only show warnings by default; use RUST_LOG=engine=info for more
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("engine=warn"));

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(true))
        .init();

    let args = Args::parse();

    // Configure thread pool before any rayon operations
    let num_threads = match &args.command {
        Command::Sim { threads, .. } => threads.unwrap_or_else(get_optimal_concurrency),
        _ => get_optimal_concurrency(),
    };

    if let Err(e) = configure_thread_pool(num_threads) {
        eprintln!("Warning: Failed to configure thread pool: {}", e);
    }

    if let Err(e) = Runner::run(args) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
