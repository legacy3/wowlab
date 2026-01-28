use std::collections::HashMap;
use std::sync::atomic::AtomicU64;
use std::sync::{Arc, OnceLock};
use std::time::Instant;

use metrics_exporter_prometheus::PrometheusBuilder;
use sqlx::postgres::PgPoolOptions;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

use wowlab_sentinel::notifications;
use wowlab_sentinel::state::ServerState;
use wowlab_sentinel::{bot, cron, http, presence, scheduler};

fn load_env() {
    if dotenvy::dotenv().is_err() {
        let crate_dir = env!("CARGO_MANIFEST_DIR");
        let _ = dotenvy::from_path(format!("{}/.env", crate_dir));
    }
}

#[tokio::main]
async fn main() {
    load_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("wowlab_sentinel=info".parse().unwrap()),
        )
        .init();

    let prometheus = PrometheusBuilder::new()
        .install_recorder()
        .expect("Failed to install prometheus recorder");

    let db_url = std::env::var("SUPABASE_DB_URL").expect("SUPABASE_DB_URL required");
    let db = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .idle_timeout(std::time::Duration::from_secs(600))
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    let filters = Arc::new(RwLock::new(HashMap::new()));
    let (notification_tx, notification_rx) = notifications::channel();
    let state = Arc::new(ServerState {
        db,
        filters,
        started_at: Instant::now(),
        prometheus,
        shard_manager: OnceLock::new(),
        last_scheduler_tick: AtomicU64::new(0),
        notification_tx,
    });

    wowlab_sentinel::telemetry::init();

    tracing::info!("Starting wowlab-sentinel (bot + scheduler + http)");

    let shutdown = CancellationToken::new();

    tokio::select! {
        result = bot::run(state.clone(), notification_rx, shutdown.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Bot exited with error");
            }
        }
        result = scheduler::run(state.clone(), shutdown.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Scheduler exited with error");
            }
        }
        result = cron::run(state.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Cron scheduler exited with error");
            }
        }
        result = http::run(state.clone(), shutdown.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "HTTP server exited with error");
            }
        }
        result = presence::run(state.clone(), shutdown.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Presence subscriber exited with error");
            }
        }
    }

    shutdown.cancel();
    tracing::error!("Server shutting down");
    std::process::exit(1);
}
