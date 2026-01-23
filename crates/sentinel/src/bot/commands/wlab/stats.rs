use poise::serenity_prelude as serenity;

use crate::bot::{Context, Error};
use crate::utils::colors;
use crate::utils::embed::EmbedContent;

/// Show sentinel stats: uptime, memory, scheduler throughput, bloom filters
#[poise::command(slash_command, user_cooldown = 5)]
pub async fn stats(ctx: Context<'_>) -> Result<(), Error> {
    ctx.defer().await?;

    let state = &ctx.data().state;
    let db = &state.db;

    // Uptime
    let uptime_secs = state.started_at.elapsed().as_secs();
    let uptime = format_uptime(uptime_secs);

    // Memory (Linux /proc/self/statm, returns 0 on other platforms)
    let memory_mb = read_memory_mb();

    // Scheduler throughput: chunks completed in last hour
    let throughput = sqlx::query_as::<_, ThroughputRow>(
        "SELECT
            COUNT(*) FILTER (WHERE status = 'done') AS completed,
            COUNT(*) FILTER (WHERE status = 'running') AS running,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending,
            AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at)))
                FILTER (WHERE status = 'done' AND claimed_at IS NOT NULL) AS avg_duration_secs
         FROM public.jobs_chunks
         WHERE created_at > now() - interval '1 hour'",
    )
    .fetch_one(db)
    .await?;

    // Bloom filter stats
    let filters = state.filters.read().await;
    let guild_count = filters.len();
    let total_members: usize = filters.values().map(|gf| gf.member_count).sum();
    let total_filter_bytes: usize = filters.values().map(|gf| gf.filter.as_bytes().len()).sum();
    drop(filters);

    // Online nodes count
    let online_nodes: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM public.nodes WHERE last_seen_at > now() - interval '30 seconds'",
    )
    .fetch_one(db)
    .await?;

    let completed = throughput.completed.unwrap_or(0);
    let running = throughput.running.unwrap_or(0);
    let pending = throughput.pending.unwrap_or(0);
    let avg_duration = throughput
        .avg_duration_secs
        .map(|s| format!("{:.1}s", s))
        .unwrap_or_else(|| "—".to_string());

    let description = EmbedContent::new()
        .field("Uptime", &uptime)
        .field("Memory", format!("{:.1} MB", memory_mb))
        .field("Nodes online", online_nodes.0)
        .section("Last Hour")
        .field("Completed", format!("{} chunks", completed))
        .line(format!("Running: {} · Pending: {}", running, pending))
        .field("Avg completion", &avg_duration)
        .section("Bloom Filters")
        .kv("Guilds tracked", guild_count)
        .kv("Total members", total_members)
        .kv("Filter memory", format!("{:.1} KB", total_filter_bytes as f64 / 1024.0))
        .build();

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title("Sentinel Stats")
                .description(description)
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}

fn format_uptime(secs: u64) -> String {
    let days = secs / 86400;
    let hours = (secs % 86400) / 3600;
    let minutes = (secs % 3600) / 60;

    if days > 0 {
        format!("{}d {}h {}m", days, hours, minutes)
    } else if hours > 0 {
        format!("{}h {}m", hours, minutes)
    } else {
        format!("{}m", minutes)
    }
}

fn read_memory_mb() -> f64 {
    std::fs::read_to_string("/proc/self/statm")
        .ok()
        .and_then(|s| s.split_whitespace().nth(1).and_then(|p| p.parse::<u64>().ok()))
        .map(|pages| pages as f64 * 4.0 / 1024.0)
        .unwrap_or(0.0)
}

#[derive(Debug, sqlx::FromRow)]
struct ThroughputRow {
    completed: Option<i64>,
    running: Option<i64>,
    pending: Option<i64>,
    avg_duration_secs: Option<f64>,
}
