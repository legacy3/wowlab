//! Headless simulation node for servers.

use node_core::{utils::logging, ConnectionStatus, NodeCore, NodeCoreEvent, NodeState};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

fn main() {
    logging::init_headless();

    tracing::info!("Starting WoW Lab Node (headless)");
    tracing::info!("Version: {}", env!("CARGO_PKG_VERSION"));

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
