use std::collections::HashMap;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::time::Instant;

use metrics_exporter_prometheus::PrometheusBuilder;
use sqlx::PgPool;
use tokio::sync::RwLock;

use wowlab_sentinel::state::ServerState;
use wowlab_sentinel::{bot, http, scheduler};

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

    let db_url = std::env::var("SUPABASE_DB_URL")
        .expect("SUPABASE_DB_URL required");
    let db = PgPool::connect(&db_url)
        .await
        .expect("Failed to connect to database");

    let filters = Arc::new(RwLock::new(HashMap::new()));
    let state = Arc::new(ServerState {
        db,
        filters,
        started_at: Instant::now(),
        prometheus,
        last_bot_event: AtomicU64::new(0),
        last_scheduler_tick: AtomicU64::new(0),
    });

    wowlab_sentinel::telemetry::init();

    tracing::info!("Starting wowlab-sentinel (bot + scheduler + http)");

    tokio::select! {
        result = bot::run(state.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Bot exited with error");
            }
        }
        result = scheduler::run(state.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "Scheduler exited with error");
            }
        }
        result = http::run(state.clone()) => {
            if let Err(e) = result {
                tracing::error!(error = %e, "HTTP server exited with error");
            }
        }
    }

    tracing::error!("Server shutting down unexpectedly");
    std::process::exit(1);
}
