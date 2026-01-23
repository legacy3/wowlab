use std::collections::HashMap;
use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::RwLock;

use wowlab_server::state::ServerState;
use wowlab_server::{bot, scheduler};

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
                .add_directive("wowlab_server=info".parse().unwrap()),
        )
        .init();

    let db_url = std::env::var("SUPABASE_DB_URL")
        .expect("SUPABASE_DB_URL required");
    let db = PgPool::connect(&db_url)
        .await
        .expect("Failed to connect to database");

    let filters = Arc::new(RwLock::new(HashMap::new()));
    let state = Arc::new(ServerState { db, filters });

    tracing::info!("Starting wowlab-server (bot + scheduler)");

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
    }

    tracing::error!("Server shutting down unexpectedly");
    std::process::exit(1);
}
