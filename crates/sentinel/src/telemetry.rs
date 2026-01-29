// Scheduler metrics
pub const CHUNKS_ASSIGNED: &str = "sentinel_chunks_assigned_total";
pub const CHUNKS_COMPLETED: &str = "sentinel_chunks_completed_total";
pub const CHUNKS_PENDING: &str = "sentinel_chunks_pending";
pub const CHUNKS_RECLAIMED: &str = "sentinel_chunks_reclaimed_total";
pub const CHUNKS_RUNNING: &str = "sentinel_chunks_running";

// Node metrics
pub const NODES_ONLINE: &str = "sentinel_nodes_online";
pub const NODES_MARKED_OFFLINE: &str = "sentinel_nodes_marked_offline_total";

// Presence metrics
pub const PRESENCE_POLLS: &str = "sentinel_presence_polls_total";

// Webhook metrics
const WEBHOOKS_RECEIVED: &str = "sentinel_webhooks_received_total";

// AI metrics
const AI_SUMMARIES: &str = "sentinel_ai_summaries_total";

// Maintenance metrics
pub const STALE_DATA_CLEANUPS: &str = "sentinel_stale_data_cleanups_total";
pub const UPTIME_SECONDS: &str = "sentinel_uptime_seconds";

/// GitHub webhook event types.
#[derive(Clone, Copy)]
pub enum GitHubEvent {
    Push,
    PullRequest,
    Ping,
}

impl GitHubEvent {
    const ALL: &[Self] = &[Self::Push, Self::PullRequest, Self::Ping];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Push => "push",
            Self::PullRequest => "pull_request",
            Self::Ping => "ping",
        }
    }
}

/// Vercel webhook event types.
#[derive(Clone, Copy)]
pub enum VercelEvent {
    DeploymentReady,
    DeploymentSucceeded,
    DeploymentError,
    DeploymentCreated,
}

impl VercelEvent {
    const ALL: &[Self] = &[
        Self::DeploymentReady,
        Self::DeploymentSucceeded,
        Self::DeploymentError,
        Self::DeploymentCreated,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::DeploymentReady => "deployment.ready",
            Self::DeploymentSucceeded => "deployment.succeeded",
            Self::DeploymentError => "deployment.error",
            Self::DeploymentCreated => "deployment.created",
        }
    }
}

/// AI summary result status.
#[derive(Clone, Copy)]
pub enum AiSummaryStatus {
    Success,
    Error,
}

impl AiSummaryStatus {
    const ALL: &[Self] = &[Self::Success, Self::Error];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Success => "success",
            Self::Error => "error",
        }
    }
}

/// Record a GitHub webhook event.
pub fn record_github_webhook(event: GitHubEvent) {
    metrics::counter!(WEBHOOKS_RECEIVED, "source" => "github", "event" => event.as_str())
        .increment(1);
}

/// Record a Vercel webhook event.
pub fn record_vercel_webhook(event: VercelEvent) {
    metrics::counter!(WEBHOOKS_RECEIVED, "source" => "vercel", "event" => event.as_str())
        .increment(1);
}

/// Record an AI summary result.
pub fn record_ai_summary(status: AiSummaryStatus) {
    metrics::counter!(AI_SUMMARIES, "status" => status.as_str()).increment(1);
}

pub fn init() {
    init_gauges();
    init_counters();
    init_webhook_counters();
    init_ai_counters();
}

/// Initialize CHUNKS_RUNNING gauge from the current database state.
/// Call this at startup after the database connection is established.
pub async fn init_running_chunks_gauge(db: &sqlx::PgPool) {
    let running: Result<(i64,), _> =
        sqlx::query_as("SELECT COUNT(*) FROM public.jobs_chunks WHERE status = 'running'")
            .fetch_one(db)
            .await;

    if let Ok((count,)) = running {
        metrics::gauge!(CHUNKS_RUNNING).set(count as f64);
        tracing::info!(count, "Initialized CHUNKS_RUNNING gauge from database");
    }
}

fn init_gauges() {
    for name in [CHUNKS_PENDING, CHUNKS_RUNNING, NODES_ONLINE, UPTIME_SECONDS] {
        metrics::gauge!(name).set(0.0);
    }
}

fn init_counters() {
    for name in [
        CHUNKS_ASSIGNED,
        CHUNKS_COMPLETED,
        CHUNKS_RECLAIMED,
        NODES_MARKED_OFFLINE,
        PRESENCE_POLLS,
        STALE_DATA_CLEANUPS,
    ] {
        metrics::counter!(name).absolute(0);
    }
}

fn init_webhook_counters() {
    for event in GitHubEvent::ALL {
        metrics::counter!(WEBHOOKS_RECEIVED, "source" => "github", "event" => event.as_str())
            .absolute(0);
    }
    for event in VercelEvent::ALL {
        metrics::counter!(WEBHOOKS_RECEIVED, "source" => "vercel", "event" => event.as_str())
            .absolute(0);
    }
}

fn init_ai_counters() {
    for status in AiSummaryStatus::ALL {
        metrics::counter!(AI_SUMMARIES, "status" => status.as_str()).absolute(0);
    }
}
