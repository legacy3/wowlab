use std::sync::Arc;

use axum::extract::State;
use axum::Json;
use serde_json::{json, Value};

use crate::state::ServerState;
use crate::utils::sys;

pub async fn handler(State(state): State<Arc<ServerState>>) -> Json<Value> {
    let uptime = state.started_at.elapsed().as_secs();
    let memory_mb = sys::read_memory_mb();
    let (os_mem_total, os_mem_available) = sys::read_os_memory_mb();
    let load = sys::read_load_average();
    let cpu = sys::cpu_usage_percent().await;

    // Measure actual DB ping
    let db_start = std::time::Instant::now();
    let db_status = match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => "OK",
        Err(_) => "ERROR",
    };
    let db_ping_ms = db_start.elapsed().as_millis() as u64;

    Json(json!({
        "status": "success",
        "data": {
            "uptime": uptime,
            "load": load,
            "cpu_percent": (cpu * 10.0).round() / 10.0,
            "memory_mb": (memory_mb * 10.0).round() / 10.0,
            "os_memory_mb": {
                "total": (os_mem_total * 10.0).round() / 10.0,
                "available": (os_mem_available * 10.0).round() / 10.0,
            },
            "services": [
                { "name": "Bot", "status": "OK" },
                { "name": "Scheduler", "status": "OK" },
                { "name": "Database", "status": db_status, "ping": db_ping_ms },
            ]
        }
    }))
}
