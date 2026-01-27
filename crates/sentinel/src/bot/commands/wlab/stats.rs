use poise::serenity_prelude as serenity;

use crate::bot::{Context, Error};
use crate::utils::colors;
use crate::utils::embed::EmbedContent;
use crate::utils::sys;

/// Show sentinel stats: uptime, memory, scheduler throughput, bloom filters
#[poise::command(slash_command, guild_only, user_cooldown = 5)]
pub async fn stats(ctx: Context<'_>) -> Result<(), Error> {
    ctx.defer().await?;

    let state = &ctx.data().state;
    let db = &state.db;

    // Uptime
    let uptime_secs = state.started_at.elapsed().as_secs();
    let uptime = sys::format_uptime(uptime_secs);

    // Memory (Linux /proc/self/statm, returns 0 on other platforms)
    let memory_mb = sys::read_memory_mb();

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
    let online_nodes: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM public.nodes WHERE status = 'online'")
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
        .kv("Filter memory", sys::format_bytes(total_filter_bytes))
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

#[derive(Debug, sqlx::FromRow)]
struct ThroughputRow {
    completed: Option<i64>,
    running: Option<i64>,
    pending: Option<i64>,
    avg_duration_secs: Option<f64>,
}
