use std::sync::Arc;

use async_trait::async_trait;
use tokio_cron_scheduler::{Job, JobScheduler};

use crate::presence;
use crate::scheduler::reclaim;
use crate::state::ServerState;
use crate::telemetry::UPTIME_SECONDS;

#[async_trait]
pub trait CronJob: Send + Sync + 'static {
    fn name(&self) -> &'static str;
    fn schedule(&self) -> &str;
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

pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let sched = JobScheduler::new().await?;

    let jobs: Vec<Arc<dyn CronJob>> = vec![
        Arc::new(reclaim::ReclaimChunksJob::new(&state.config.cron_reclaim)),
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
