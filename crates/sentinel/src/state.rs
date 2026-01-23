use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use metrics_exporter_prometheus::PrometheusHandle;
use sqlx::PgPool;

use crate::utils::filter_refresh::FilterMap;

pub struct ServerState {
    pub db: PgPool,
    pub filters: FilterMap,
    pub started_at: Instant,
    pub prometheus: PrometheusHandle,
    pub last_bot_event: AtomicU64,
    pub last_scheduler_tick: AtomicU64,
}

impl ServerState {
    pub fn touch_bot(&self) {
        let now = epoch_secs();
        self.last_bot_event.store(now, Ordering::Relaxed);
    }

    pub fn touch_scheduler(&self) {
        let now = epoch_secs();
        self.last_scheduler_tick.store(now, Ordering::Relaxed);
    }

    pub fn bot_healthy(&self) -> bool {
        age_secs(self.last_bot_event.load(Ordering::Relaxed)) < 120
    }

    pub fn scheduler_healthy(&self) -> bool {
        age_secs(self.last_scheduler_tick.load(Ordering::Relaxed)) < 60
    }
}

fn epoch_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn age_secs(timestamp: u64) -> u64 {
    epoch_secs().saturating_sub(timestamp)
}
