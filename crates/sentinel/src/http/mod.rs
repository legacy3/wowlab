use std::sync::Arc;

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::{json, Value};

use crate::state::ServerState;

pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app = Router::new()
        .route("/status", get(status))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("HTTP server listening on :8080");
    axum::serve(listener, app).await?;
    Ok(())
}

async fn status(State(state): State<Arc<ServerState>>) -> Json<Value> {
    let uptime = state.started_at.elapsed().as_secs();
    let memory_mb = read_memory_mb();

    let db_status = match state.db.acquire().await {
        Ok(_) => "OK",
        Err(_) => "ERROR",
    };

    Json(json!({
        "status": "success",
        "data": {
            "uptime": uptime,
            "memory_mb": memory_mb,
            "services": [
                { "name": "Bot", "status": "OK" },
                { "name": "Scheduler", "status": "OK" },
                { "name": "Database", "status": db_status },
            ]
        }
    }))
}

fn read_memory_mb() -> f64 {
    std::fs::read_to_string("/proc/self/statm")
        .ok()
        .and_then(|s| s.split_whitespace().nth(1).and_then(|p| p.parse::<u64>().ok()))
        .map(|pages| pages as f64 * 4.0 / 1024.0)
        .unwrap_or(0.0)
}
