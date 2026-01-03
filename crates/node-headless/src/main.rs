//! Headless simulation node for servers.

use clap::{Parser, Subcommand};
use node::{utils::logging, ConnectionStatus, NodeCore, NodeCoreEvent, NodeState};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Parser)]
#[command(name = "node-headless")]
#[command(author = "wowlab")]
#[command(version)]
#[command(about = "Headless WoW Lab simulation node for servers", long_about = None)]
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
    /// Start the node (default behavior)
    Run,
}

fn main() {
    logging::init_headless();
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Update { check }) => {
            if check {
                match node::update::check_for_update(VERSION) {
                    Ok(Some(version)) => {
                        tracing::info!("Update available: v{VERSION} → v{version}");
                        tracing::info!("Run `node-headless update` to install");
                    }
                    Ok(None) => tracing::info!("Already on latest version (v{VERSION})"),
                    Err(e) => {
                        tracing::error!("Failed to check for updates: {e}");
                        std::process::exit(1);
                    }
                }
            } else {
                tracing::info!("Updating node-headless...");
                match node::update::update("node-headless", VERSION) {
                    Ok(true) => tracing::info!("Updated successfully. Please restart."),
                    Ok(false) => tracing::info!("Already on latest version."),
                    Err(e) => {
                        tracing::error!("Update failed: {e}");
                        std::process::exit(1);
                    }
                }
            }
        }
        Some(Commands::Run) | None => {
            if !cli.no_update {
                check_and_apply_update();
            }
            run_node();
        }
    }
}

/// Check for updates on startup and auto-apply if available.
fn check_and_apply_update() {
    match node::update::check_for_update(VERSION) {
        Ok(Some(new_version)) => {
            tracing::info!("Update available: v{VERSION} → v{new_version}");
            tracing::info!("Downloading...");

            match node::update::update("node-headless", VERSION) {
                Ok(true) => {
                    tracing::info!("Update installed. Restarting...");
                    restart();
                }
                Ok(false) => {} // Already up to date (race condition, ignore)
                Err(e) => {
                    tracing::warn!("Auto-update failed: {e}");
                    tracing::warn!("Continuing with current version. Run `node-headless update` manually.");
                }
            }
        }
        Ok(None) => {} // Already on latest
        Err(e) => {
            tracing::debug!("Update check failed: {e}");
        }
    }
}

/// Restart the current process by re-executing the binary.
fn restart() -> ! {
    let exe = std::env::current_exe().expect("Failed to get current executable path");
    let args: Vec<String> = std::env::args().skip(1).collect();

    // On Unix, use exec to replace the current process
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        let err = std::process::Command::new(&exe)
            .args(&args)
            .arg("--no-update") // Prevent update loop
            .exec();
        tracing::error!("Failed to restart: {err}");
        std::process::exit(1);
    }

    // On Windows, spawn new process and exit
    #[cfg(windows)]
    {
        let mut cmd = std::process::Command::new(&exe);
        cmd.args(&args).arg("--no-update");
        match cmd.spawn() {
            Ok(_) => std::process::exit(0),
            Err(e) => {
                tracing::error!("Failed to restart: {e}");
                std::process::exit(1);
            }
        }
    }

    #[cfg(not(any(unix, windows)))]
    {
        tracing::error!("Restart not supported on this platform. Please restart manually.");
        std::process::exit(0);
    }
}

fn run_node() {
    tracing::info!("Starting WoW Lab Node (headless) v{VERSION}");

    let runtime = Arc::new(tokio::runtime::Runtime::new().expect("Failed to create tokio runtime"));
    let (mut core, mut event_rx) = NodeCore::new(Arc::clone(&runtime));

    let running = Arc::new(AtomicBool::new(true));
    let r = Arc::clone(&running);
    ctrlc::set_handler(move || {
        tracing::info!("Shutdown signal received");
        r.store(false, Ordering::SeqCst);
    })
    .expect("Failed to set Ctrl-C handler");

    core.start();
    print_status(&core);

    while running.load(Ordering::SeqCst) {
        core.poll();

        while let Ok(event) = event_rx.try_recv() {
            handle_event(&event, &core);
        }

        std::thread::sleep(Duration::from_millis(100));
    }

    tracing::info!("Shutting down");
}

fn handle_event(event: &NodeCoreEvent, core: &NodeCore) {
    match event {
        NodeCoreEvent::StateChanged(state) => match state {
            NodeState::Registering => {
                tracing::info!("State: Registering with server...");
            }
            NodeState::Claiming { code } => {
                tracing::info!("State: Waiting to be claimed");
                tracing::info!("Claim code: {}", code);
                tracing::info!("Visit https://wowlab.gg/nodes to claim this node");
            }
            NodeState::Running => {
                tracing::info!("State: Running");
            }
        },
        NodeCoreEvent::ConnectionChanged(status) => {
            let status_str = match status {
                ConnectionStatus::Connecting => "Connecting",
                ConnectionStatus::Connected => "Connected",
                ConnectionStatus::Disconnected => "Disconnected",
            };
            tracing::info!("Connection: {}", status_str);
        }
        NodeCoreEvent::Claimed => {
            tracing::info!("Node has been claimed by a user!");
        }
        NodeCoreEvent::ChunkAssigned { id, iterations } => {
            tracing::info!("Chunk assigned: {} ({} iterations)", id, iterations);
        }
        NodeCoreEvent::ChunkCompleted { id, mean_dps } => {
            tracing::info!("Chunk completed: {} ({:.0} DPS)", id, mean_dps);
        }
        NodeCoreEvent::ChunkFailed { id, error } => {
            tracing::error!("Chunk failed: {} - {}", id, error);
        }
        NodeCoreEvent::Error(err) => {
            tracing::error!("Error: {}", err);
        }
    }

    let stats = core.stats();
    if stats.active_jobs > 0 || stats.completed_chunks > 0 {
        tracing::debug!(
            "Stats: {} active, {} completed, {:.1} sims/sec",
            stats.active_jobs,
            stats.completed_chunks,
            stats.sims_per_second
        );
    }
}

fn print_status(core: &NodeCore) {
    let stats = core.stats();

    tracing::info!("Node: {}", core.node_name());
    tracing::info!(
        "Cores: {} total, {} max parallel",
        stats.total_cores,
        stats.max_workers
    );

    match core.state() {
        NodeState::Registering => {
            tracing::info!("Status: Registering...");
        }
        NodeState::Claiming { code } => {
            tracing::info!("Status: Pending claim");
            tracing::info!("Claim code: {}", code);
            tracing::info!("Visit https://wowlab.gg/nodes to claim this node");
        }
        NodeState::Running => {
            tracing::info!("Status: Ready");
        }
    }
}
