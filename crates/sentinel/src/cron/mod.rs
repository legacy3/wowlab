use std::sync::Arc;

use async_trait::async_trait;
use tokio_cron_scheduler::{Job, JobScheduler};

use crate::presence;
use crate::scheduler::{maintenance, reclaim};
use crate::state::ServerState;
use crate::telemetry::UPTIME_SECONDS;

/// A periodic job managed by the cron scheduler.
/// Implement this on a struct in the module that owns the job's logic.
#[async_trait]
pub trait CronJob: Send + Sync + 'static {
    /// Human-readable job name (used in logs).
    fn name(&self) -> &'static str;

    /// Cron expression (6-field: sec min hour day month weekday).
    fn schedule(&self) -> &str;

    /// Execute the job.
    async fn run(&self, state: &ServerState);
}

struct RecordUptimeJob {
    schedule: String,
}

#[async_trait]
impl CronJob for RecordUptimeJob {
    fn name(&self) -> &'static str {
        "record_uptime"
    }

    fn schedule(&self) -> &str {
        &self.schedule
    }

    async fn run(&self, state: &ServerState) {
        metrics::gauge!(UPTIME_SECONDS).set(state.started_at.elapsed().as_secs() as f64);
    }
}

/// Start the cron scheduler with all registered jobs.
pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let sched = JobScheduler::new().await?;

    let jobs: Vec<Arc<dyn CronJob>> = vec![
        Arc::new(reclaim::ReclaimChunksJob::new(&state.config.cron_reclaim)),
        Arc::new(maintenance::CleanupStaleDataJob::new(&state.config.cron_cleanup)),
        Arc::new(presence::PresenceJob::new(&state.config.cron_presence)),
        Arc::new(RecordUptimeJob {
            schedule: state.config.cron_uptime.clone(),
        }),
    ];

    for job in &jobs {
        tracing::info!(
            job = job.name(),
            schedule = job.schedule(),
            "Registering cron job"
        );
    }

    for job in jobs {
        let s = state.clone();
        let schedule = job.schedule().to_string();

        sched
            .add(Job::new_async(&schedule, move |_, _| {
                let state = s.clone();
                let job = job.clone();
                Box::pin(async move {
                    job.run(&state).await;
                    state.touch_cron();
                })
            })?)
            .await?;
    }

    tracing::info!("Cron scheduler started");
    sched.start().await?;
    std::future::pending::<()>().await;
    Ok(())
}
