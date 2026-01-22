use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;
use wowlab_api::SupabaseClient;

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

    let supabase = Arc::new(
        SupabaseClient::from_env_service_role()
            .expect("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"),
    );
    let filters = Arc::new(RwLock::new(HashMap::new()));
    let state = Arc::new(ServerState { supabase, filters });

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
