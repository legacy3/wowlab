use async_trait::async_trait;

use crate::cron::CronJob;
use crate::state::ServerState;

pub struct ReclaimChunksJob {
    schedule: String,
}

impl ReclaimChunksJob {
    pub fn new(schedule: &str) -> Self {
        Self {
            schedule: schedule.to_string(),
        }
    }
}

#[async_trait]
impl CronJob for ReclaimChunksJob {
    fn name(&self) -> &'static str {
        "reclaim_stale_chunks"
    }

    fn schedule(&self) -> &str {
        &self.schedule
    }

    async fn run(&self, state: &ServerState) {
        reclaim_stale_chunks(state).await;
    }
}

/// Resets chunks running >5min back to pending for reassignment.
pub async fn reclaim_stale_chunks(state: &ServerState) {
    match do_reclaim(state).await {
        Ok(count) if count > 0 => {
            tracing::info!(count, "Reclaimed stale chunks");
            metrics::counter!(crate::telemetry::CHUNKS_RECLAIMED).increment(count);
            // Chunks transitioned from 'running' to 'pending'
            metrics::gauge!(crate::telemetry::CHUNKS_RUNNING).decrement(count as f64);
        }
        Ok(_) => {}
        Err(e) => {
            tracing::error!(error = %e, "Failed to reclaim stale chunks");
        }
    }
}

async fn do_reclaim(state: &ServerState) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE public.jobs_chunks
         SET node_id = NULL, status = 'pending', claimed_at = NULL
         WHERE status = 'running'
           AND claimed_at < now() - interval '5 minutes'",
    )
    .execute(&state.db)
    .await?;

    Ok(result.rows_affected())
}
