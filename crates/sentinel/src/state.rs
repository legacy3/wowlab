use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::{Duration, Instant};

use metrics_exporter_prometheus::PrometheusHandle;
use poise::serenity_prelude::{ConnectionStage, ShardManager};
use serde::Serialize;
use sqlx::PgPool;
use wowlab_centrifuge::{Client as CentrifugeClient, Presence};

use crate::ai::AiBackend;
use crate::config::Config;
use crate::notifications::NotificationSender;
use crate::utils::filter_refresh::FilterMap;

const PUBLISH_RETRIES: u32 = 3;
const PUBLISH_RETRY_DELAY: Duration = Duration::from_millis(100);
const SCHEDULER_GRACE_PERIOD_SECS: u64 = 60;
const PRESENCE_GRACE_PERIOD_SECS: u64 = 30;
const CRON_GRACE_PERIOD_SECS: u64 = 90;

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
    pub centrifuge: CentrifugeClient,
    pub presence: Presence,
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
        age_secs(self.last_scheduler_tick.load(Ordering::Relaxed)) < SCHEDULER_GRACE_PERIOD_SECS
    }

    pub fn presence_healthy(&self) -> bool {
        age_secs(self.last_presence_tick.load(Ordering::Relaxed)) < PRESENCE_GRACE_PERIOD_SECS
    }

    pub fn cron_healthy(&self) -> bool {
        age_secs(self.last_cron_tick.load(Ordering::Relaxed)) < CRON_GRACE_PERIOD_SECS
    }

    pub async fn centrifuge_healthy(&self) -> bool {
        self.centrifuge.is_connected().await
    }

    pub async fn publish<T: Serialize>(&self, channel: &str, payload: &T) {
        let data = match serde_json::to_vec(payload) {
            Ok(d) => d,
            Err(e) => {
                tracing::error!(error = %e, channel, "Failed to serialize publish payload");
                return;
            }
        };

        for attempt in 0..PUBLISH_RETRIES {
            match self.centrifuge.publish(channel, data.clone()).await {
                Ok(()) => return,
                Err(e) if e.is_temporary() && attempt + 1 < PUBLISH_RETRIES => {
                    tracing::debug!(
                        error = %e,
                        channel,
                        attempt = attempt + 1,
                        "Publish failed, retrying"
                    );
                    tokio::time::sleep(PUBLISH_RETRY_DELAY).await;
                }
                Err(e) => {
                    tracing::warn!(error = %e, channel, "Failed to publish");
                    return;
                }
            }
        }
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
