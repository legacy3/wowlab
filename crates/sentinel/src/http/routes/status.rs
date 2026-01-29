use std::sync::Arc;

use axum::extract::State;
use axum::Json;
use serde_json::{json, Value};

use crate::state::ServerState;
use crate::utils::sys;

fn status_str(healthy: bool) -> &'static str {
    if healthy {
        "OK"
    } else {
        "DEGRADED"
    }
}

pub async fn handler(State(state): State<Arc<ServerState>>) -> Json<Value> {
    let uptime = state.started_at.elapsed().as_secs();
    let memory_mb = sys::read_memory_mb();
    let (os_mem_total, os_mem_available) = sys::read_os_memory_mb();
    let load = sys::read_load_average();
    let cpu = sys::cpu_usage_percent().await;

    let db_start = std::time::Instant::now();
    let db_healthy = sqlx::query("SELECT 1").execute(&state.db).await.is_ok();
    let db_ping_ms = db_start.elapsed().as_millis() as u64;

    Json(json!({
        "status": "success",
        "data": {
            "version": env!("CARGO_PKG_VERSION"),
            "uptime": uptime,
            "load": load,
            "cpu_percent": (cpu * 10.0).round() / 10.0,
            "memory_mb": (memory_mb * 10.0).round() / 10.0,
            "os_memory_mb": {
                "total": (os_mem_total * 10.0).round() / 10.0,
                "available": (os_mem_available * 10.0).round() / 10.0,
            },
            "services": [
                { "name": "Bot", "status": status_str(state.bot_healthy().await) },
                { "name": "Scheduler", "status": status_str(state.scheduler_healthy()) },
                { "name": "Presence", "status": status_str(state.presence_healthy()) },
                { "name": "Cron", "status": status_str(state.cron_healthy()) },
                { "name": "Centrifuge", "status": status_str(state.centrifuge_healthy().await) },
                { "name": "Database", "status": status_str(db_healthy), "ping_ms": db_ping_ms },
            ]
        }
    }))
}
