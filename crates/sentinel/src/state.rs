use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::Instant;

use metrics_exporter_prometheus::PrometheusHandle;
use poise::serenity_prelude::{ConnectionStage, ShardManager};
use sqlx::PgPool;
use wowlab_centrifugo::CentrifugoApi;

use crate::ai::AiBackend;
use crate::config::Config;
use crate::notifications::NotificationSender;
use crate::utils::filter_refresh::FilterMap;

pub struct ServerState {
    pub config: Config,
    pub db: PgPool,
    pub filters: FilterMap,
    pub started_at: Instant,
    pub prometheus: PrometheusHandle,
    pub shard_manager: OnceLock<Arc<ShardManager>>,
    pub last_scheduler_tick: AtomicU64,
    pub last_presence_tick: AtomicU64,
    pub last_cron_tick: AtomicU64,
    pub notification_tx: NotificationSender,
    pub ai_client: Option<Box<dyn AiBackend>>,
    pub centrifugo: CentrifugoApi,
}

impl ServerState {
    pub fn set_shard_manager(&self, manager: Arc<ShardManager>) {
        let _ = self.shard_manager.set(manager);
    }

    pub fn touch_scheduler(&self) {
        self.last_scheduler_tick
            .store(epoch_secs(), Ordering::Relaxed);
    }

    pub fn touch_presence(&self) {
        self.last_presence_tick
            .store(epoch_secs(), Ordering::Relaxed);
    }

    pub fn touch_cron(&self) {
        self.last_cron_tick.store(epoch_secs(), Ordering::Relaxed);
    }

    pub async fn bot_healthy(&self) -> bool {
        let Some(manager) = self.shard_manager.get() else {
            return false;
        };
        let runners = manager.runners.lock().await;
        !runners.is_empty()
            && runners
                .values()
                .all(|r| r.stage == ConnectionStage::Connected)
    }

    pub fn scheduler_healthy(&self) -> bool {
        age_secs(self.last_scheduler_tick.load(Ordering::Relaxed)) < 60
    }

    pub fn presence_healthy(&self) -> bool {
        // Presence polls every 5s, allow 30s grace period
        age_secs(self.last_presence_tick.load(Ordering::Relaxed)) < 30
    }

    pub fn cron_healthy(&self) -> bool {
        // Cron runs jobs every 30s at minimum, allow 90s grace period
        age_secs(self.last_cron_tick.load(Ordering::Relaxed)) < 90
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
