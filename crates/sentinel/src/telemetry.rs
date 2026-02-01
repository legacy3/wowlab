pub const CHUNKS_ASSIGNED: &str = "sentinel_chunks_assigned_total";
pub const CHUNKS_COMPLETED: &str = "sentinel_chunks_completed_total";
pub const CHUNKS_PENDING: &str = "sentinel_chunks_pending";
pub const CHUNKS_RECLAIMED: &str = "sentinel_chunks_reclaimed_total";
pub const CHUNKS_RUNNING: &str = "sentinel_chunks_running";
pub const NODES_ONLINE: &str = "sentinel_nodes_online";
pub const NODES_MARKED_OFFLINE: &str = "sentinel_nodes_marked_offline_total";
pub const PRESENCE_POLLS: &str = "sentinel_presence_polls_total";
const WEBHOOKS_RECEIVED: &str = "sentinel_webhooks_received_total";
const AI_SUMMARIES: &str = "sentinel_ai_summaries_total";
pub const UPTIME_SECONDS: &str = "sentinel_uptime_seconds";
const MCP_REQUESTS: &str = "sentinel_mcp_requests_total";
const MCP_REQUEST_DURATION: &str = "sentinel_mcp_request_duration_seconds";
const MCP_QUERY_ROWS: &str = "sentinel_mcp_query_rows_total";
const MCP_ERRORS: &str = "sentinel_mcp_errors_total";

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

#[derive(Clone, Copy)]
pub enum McpTool {
    GetSchema,
    Query,
}

impl McpTool {
    const ALL: &[Self] = &[Self::GetSchema, Self::Query];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::GetSchema => "get_schema",
            Self::Query => "query",
        }
    }
}

#[derive(Clone, Copy)]
pub enum McpErrorType {
    InvalidParams,
    Timeout,
    Database,
    Internal,
}

impl McpErrorType {
    const ALL: &[Self] = &[
        Self::InvalidParams,
        Self::Timeout,
        Self::Database,
        Self::Internal,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::InvalidParams => "invalid_params",
            Self::Timeout => "timeout",
            Self::Database => "database",
            Self::Internal => "internal",
        }
    }
}

pub fn record_github_webhook(event: GitHubEvent) {
    metrics::counter!(WEBHOOKS_RECEIVED, "source" => "github", "event" => event.as_str())
        .increment(1);
}

pub fn record_vercel_webhook(event: VercelEvent) {
    metrics::counter!(WEBHOOKS_RECEIVED, "source" => "vercel", "event" => event.as_str())
        .increment(1);
}

pub fn record_ai_summary(status: AiSummaryStatus) {
    metrics::counter!(AI_SUMMARIES, "status" => status.as_str()).increment(1);
}

pub fn record_mcp_request(tool: McpTool) {
    metrics::counter!(MCP_REQUESTS, "tool" => tool.as_str()).increment(1);
}

pub fn record_mcp_duration(tool: McpTool, duration_secs: f64) {
    metrics::histogram!(MCP_REQUEST_DURATION, "tool" => tool.as_str()).record(duration_secs);
}

pub fn record_mcp_query_rows(count: u64) {
    metrics::counter!(MCP_QUERY_ROWS).increment(count);
}

pub fn record_mcp_error(tool: McpTool, error_type: McpErrorType) {
    metrics::counter!(MCP_ERRORS, "tool" => tool.as_str(), "error_type" => error_type.as_str())
        .increment(1);
}

pub fn init() {
    init_gauges();
    init_counters();
    init_webhook_counters();
    init_ai_counters();
    init_mcp_counters();
}

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

fn init_mcp_counters() {
    // Request counters per tool
    for tool in McpTool::ALL {
        metrics::counter!(MCP_REQUESTS, "tool" => tool.as_str()).absolute(0);
    }

    // Error counters per tool and error type
    for tool in McpTool::ALL {
        for error_type in McpErrorType::ALL {
            metrics::counter!(MCP_ERRORS, "tool" => tool.as_str(), "error_type" => error_type.as_str())
                .absolute(0);
        }
    }

    // Query rows counter
    metrics::counter!(MCP_QUERY_ROWS).absolute(0);
}
