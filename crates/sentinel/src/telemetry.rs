use async_trait::async_trait;

use crate::cron::CronJob;
use crate::state::ServerState;

pub const CHUNKS_ASSIGNED: &str = "sentinel_chunks_assigned_total";
pub const CHUNKS_PENDING: &str = "sentinel_chunks_pending";
pub const CHUNKS_RECLAIMED: &str = "sentinel_chunks_reclaimed_total";
pub const CHUNKS_RUNNING: &str = "sentinel_chunks_running";
pub const NODES_ONLINE: &str = "sentinel_nodes_online";
pub const NODES_MARKED_OFFLINE: &str = "sentinel_nodes_marked_offline_total";
pub const STALE_DATA_CLEANUPS: &str = "sentinel_stale_data_cleanups_total";
pub const UPTIME_SECONDS: &str = "sentinel_uptime_seconds";

pub fn init() {
    for name in [CHUNKS_PENDING, CHUNKS_RUNNING, NODES_ONLINE, UPTIME_SECONDS] {
        metrics::gauge!(name).set(0.0);
    }

    for name in [
        CHUNKS_ASSIGNED,
        CHUNKS_RECLAIMED,
        NODES_MARKED_OFFLINE,
        STALE_DATA_CLEANUPS,
    ] {
        metrics::counter!(name).absolute(0);
    }
}

pub struct RecordGaugesJob;

#[async_trait]
impl CronJob for RecordGaugesJob {
    fn name(&self) -> &'static str {
        "record_gauges"
    }

    fn schedule(&self) -> &'static str {
        "*/30 * * * * *"
    }

    async fn run(&self, state: &ServerState) {
        metrics::gauge!(UPTIME_SECONDS).set(state.started_at.elapsed().as_secs() as f64);

        let running: Result<(i64,), _> =
            sqlx::query_as("SELECT COUNT(*) FROM public.jobs_chunks WHERE status = 'running'")
                .fetch_one(&state.db)
                .await;

        if let Ok((count,)) = running {
            metrics::gauge!(CHUNKS_RUNNING).set(count as f64);
        }

        let online: Result<(i64,), _> =
            sqlx::query_as("SELECT COUNT(*) FROM public.nodes WHERE status = 'online'")
                .fetch_one(&state.db)
                .await;

        if let Ok((count,)) = online {
            metrics::gauge!(NODES_ONLINE).set(count as f64);
        }
    }
}
