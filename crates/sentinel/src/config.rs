//! Centralized configuration for the sentinel service.
//!
//! All configuration is loaded from environment variables with the `SENTINEL_` prefix.

/// Application configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct Config {
    // -------------------------------------------------------------------------
    // Required
    // -------------------------------------------------------------------------
    /// Discord bot token.
    pub discord_token: String,

    /// PostgreSQL database URL.
    pub database_url: String,

    /// Centrifugo API URL.
    pub centrifugo_url: String,

    /// Centrifugo HTTP API key.
    pub centrifugo_key: String,

    // -------------------------------------------------------------------------
    // HTTP Server
    // -------------------------------------------------------------------------
    /// HTTP server port (default: 8080).
    pub http_port: u16,

    // -------------------------------------------------------------------------
    // Webhooks
    // -------------------------------------------------------------------------
    /// GitHub webhook secret (optional).
    pub github_webhook_secret: Option<String>,

    /// Vercel webhook secret (optional).
    pub vercel_webhook_secret: Option<String>,

    // -------------------------------------------------------------------------
    // AI Summaries
    // -------------------------------------------------------------------------
    /// Whether AI summaries are enabled.
    pub ai_enabled: bool,

    /// OpenRouter API key (required if ai_enabled).
    pub ai_api_key: Option<String>,

    /// AI model for summaries (default: anthropic/claude-haiku-4.5).
    pub ai_model: String,

    /// Max input tokens before truncation (default: 4000).
    pub ai_max_input_tokens: usize,

    /// Max output tokens for diff summaries (default: 500).
    pub ai_diff_output_tokens: u32,

    /// Max output tokens for commit summaries (default: 300).
    pub ai_commit_output_tokens: u32,

    // -------------------------------------------------------------------------
    // Cron Schedules (6-field: sec min hour day month weekday)
    // -------------------------------------------------------------------------
    /// Presence sync schedule (default: every 5 seconds).
    pub cron_presence: String,

    /// Reclaim stale chunks schedule (default: every 30 seconds).
    pub cron_reclaim: String,

    /// Cleanup stale data schedule (default: every hour).
    pub cron_cleanup: String,

    /// Record uptime schedule (default: every 30 seconds).
    pub cron_uptime: String,

    // -------------------------------------------------------------------------
    // Centrifugo Token
    // -------------------------------------------------------------------------
    /// HMAC secret for signing Centrifugo client tokens.
    pub centrifugo_token_secret: String,
}

impl Config {
    /// Load configuration from environment variables.
    ///
    /// # Panics
    /// Panics if required environment variables are missing.
    pub fn from_env() -> Self {
        Self {
            // Required
            discord_token: require("SENTINEL_DISCORD_TOKEN"),
            database_url: ensure_ssl(require("SENTINEL_DATABASE_URL")),
            centrifugo_url: require("SENTINEL_CENTRIFUGO_URL"),
            centrifugo_key: require("SENTINEL_CENTRIFUGO_KEY"),

            // HTTP Server
            http_port: parse_or("SENTINEL_HTTP_PORT", 8080),

            // Webhooks
            github_webhook_secret: std::env::var("SENTINEL_GITHUB_WEBHOOK_SECRET").ok(),
            vercel_webhook_secret: std::env::var("SENTINEL_VERCEL_WEBHOOK_SECRET").ok(),

            // AI Summaries
            ai_enabled: parse_bool("SENTINEL_AI_ENABLED"),
            ai_api_key: std::env::var("SENTINEL_AI_API_KEY").ok(),
            ai_model: std::env::var("SENTINEL_AI_MODEL")
                .unwrap_or_else(|_| "anthropic/claude-haiku-4.5".into()),
            ai_max_input_tokens: parse_or("SENTINEL_AI_MAX_INPUT_TOKENS", 4000),
            ai_diff_output_tokens: parse_or("SENTINEL_AI_DIFF_OUTPUT_TOKENS", 500),
            ai_commit_output_tokens: parse_or("SENTINEL_AI_COMMIT_OUTPUT_TOKENS", 300),

            // Cron Schedules
            cron_presence: env_or("SENTINEL_CRON_PRESENCE", "*/5 * * * * *"),
            cron_reclaim: env_or("SENTINEL_CRON_RECLAIM", "*/30 * * * * *"),
            cron_cleanup: env_or("SENTINEL_CRON_CLEANUP", "0 0 * * * *"),
            cron_uptime: env_or("SENTINEL_CRON_UPTIME", "*/30 * * * * *"),

            // Centrifugo Token
            centrifugo_token_secret: require("SENTINEL_CENTRIFUGO_TOKEN_SECRET"),
        }
    }

    /// Validate configuration consistency.
    pub fn validate(&self) -> Result<(), String> {
        if self.ai_enabled && self.ai_api_key.is_none() {
            return Err("SENTINEL_AI_API_KEY is required when SENTINEL_AI_ENABLED=true".into());
        }
        Ok(())
    }
}

fn require(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{} environment variable is required", name))
}

fn parse_or<T: std::str::FromStr>(name: &str, default: T) -> T {
    std::env::var(name)
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(default)
}

fn parse_bool(name: &str) -> bool {
    std::env::var(name)
        .map(|v| matches!(v.to_lowercase().as_str(), "true" | "1" | "yes"))
        .unwrap_or(false)
}

fn env_or(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.to_string())
}

/// Ensure the database URL has sslmode=require if not already set.
fn ensure_ssl(url: String) -> String {
    if url.contains("sslmode=") {
        return url;
    }

    let separator = if url.contains('?') { '&' } else { '?' };
    format!("{}{}sslmode=require", url, separator)
}
