use async_trait::async_trait;
use sqlx::PgPool;

use crate::cron::CronJob;
use crate::state::ServerState;

pub struct CleanupStaleDataJob;

#[async_trait]
impl CronJob for CleanupStaleDataJob {
    fn name(&self) -> &'static str {
        "cleanup_stale_data"
    }

    fn schedule(&self) -> &'static str {
        "0 0 * * * *"
    }

    async fn run(&self, state: &ServerState) {
        cleanup_stale_data(&state.db).await;
    }
}

/// Clean up stale data:
/// - Unclaimed pending nodes older than 1 hour
/// - Offline nodes not seen in 30 days
/// - Unused configs older than 7 days
pub async fn cleanup_stale_data(db: &PgPool) {
    if let Err(e) = do_cleanup(db).await {
        tracing::error!(error = %e, "Failed to cleanup stale data");
        return;
    }
    tracing::debug!("Stale data cleanup complete");
    metrics::counter!(crate::telemetry::STALE_DATA_CLEANUPS).increment(1);
}

async fn do_cleanup(db: &PgPool) -> Result<(), sqlx::Error> {
    // Delete unclaimed pending nodes older than 1 hour
    sqlx::query(
        "DELETE FROM public.nodes
         WHERE status = 'pending'
           AND user_id IS NULL
           AND created_at < now() - interval '1 hour'",
    )
    .execute(db)
    .await?;

    // Delete offline nodes not seen in 30 days
    sqlx::query(
        "DELETE FROM public.nodes
         WHERE status = 'offline'
           AND last_seen_at < now() - interval '30 days'",
    )
    .execute(db)
    .await?;

    // Delete unused configs older than 7 days
    sqlx::query(
        "DELETE FROM public.jobs_configs
         WHERE last_used_at < now() - interval '7 days'
           AND hash NOT IN (SELECT DISTINCT config_hash FROM public.jobs)",
    )
    .execute(db)
    .await?;

    Ok(())
}
