#[derive(Debug, Clone)]
pub struct Config {
    pub discord_token: String,
    pub database_url: String,
    pub centrifugo_url: String,
    pub centrifugo_key: String,
    pub http_port: u16,
    pub github_webhook_secret: Option<String>,
    pub vercel_webhook_secret: Option<String>,
    pub mcp_enabled: bool,
    pub ai_enabled: bool,
    pub ai_api_key: Option<String>,
    pub ai_model: String,
    pub ai_max_input_tokens: usize,
    pub ai_diff_output_tokens: u32,
    pub ai_commit_output_tokens: u32,
    /// 6-field cron: sec min hour day month weekday
    pub cron_presence: String,
    pub cron_reclaim: String,
    pub cron_uptime: String,
    pub centrifugo_token_secret: String,
}

impl Config {
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

            // MCP Server
            mcp_enabled: parse_bool("SENTINEL_MCP_ENABLED", false),

            // AI Summaries
            ai_enabled: parse_bool("SENTINEL_AI_ENABLED", false),
            ai_api_key: std::env::var("SENTINEL_AI_API_KEY").ok(),
            ai_model: std::env::var("SENTINEL_AI_MODEL")
                .unwrap_or_else(|_| "anthropic/claude-haiku-4.5".into()),
            ai_max_input_tokens: parse_or("SENTINEL_AI_MAX_INPUT_TOKENS", 4000),
            ai_diff_output_tokens: parse_or("SENTINEL_AI_DIFF_OUTPUT_TOKENS", 500),
            ai_commit_output_tokens: parse_or("SENTINEL_AI_COMMIT_OUTPUT_TOKENS", 300),

            // Cron Schedules
            cron_presence: env_or("SENTINEL_CRON_PRESENCE", "*/5 * * * * *"),
            cron_reclaim: env_or("SENTINEL_CRON_RECLAIM", "*/30 * * * * *"),
            cron_uptime: env_or("SENTINEL_CRON_UPTIME", "*/30 * * * * *"),

            // Centrifugo Token
            centrifugo_token_secret: require("SENTINEL_CENTRIFUGO_TOKEN_SECRET"),
        }
    }

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

fn parse_bool(name: &str, default: bool) -> bool {
    match std::env::var(name) {
        Ok(v) => match v.to_lowercase().as_str() {
            "true" | "1" | "yes" => true,
            "false" | "0" | "no" => false,
            _ => default,
        },
        Err(_) => default,
    }
}

fn env_or(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.to_string())
}

fn ensure_ssl(url: String) -> String {
    if url.contains("sslmode=") {
        return url;
    }

    let separator = if url.contains('?') { '&' } else { '?' };
    format!("{}{}sslmode=require", url, separator)
}
