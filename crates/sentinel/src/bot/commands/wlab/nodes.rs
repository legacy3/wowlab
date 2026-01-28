use poise::serenity_prelude as serenity;

use crate::bot::{Context, Error};
use crate::utils::{colors, markdown as md};

/// Show online nodes and their current load
#[poise::command(slash_command, guild_only, user_cooldown = 5)]
pub async fn nodes(ctx: Context<'_>) -> Result<(), Error> {
    ctx.defer().await?;

    let db = &ctx.data().state.db;

    let rows = sqlx::query_as::<_, NodeRow>(
        "SELECT n.name, n.total_cores, n.max_parallel, n.platform, n.version,
                COUNT(jc.id) FILTER (WHERE jc.status = 'running') AS running
         FROM public.nodes n
         LEFT JOIN public.jobs_chunks jc ON jc.node_id = n.id AND jc.status = 'running'
         WHERE n.status = 'online'
         GROUP BY n.id
         ORDER BY n.name",
    )
    .fetch_all(db)
    .await?;

    if rows.is_empty() {
        ctx.send(
            poise::CreateReply::default().embed(
                serenity::CreateEmbed::new()
                    .title("No Nodes Online")
                    .description("No compute nodes are currently connected.")
                    .color(colors::YELLOW),
            ),
        )
        .await?;
        return Ok(());
    }

    let mut lines = Vec::new();
    for node in &rows {
        let capacity = (node.max_parallel as usize).min(node.total_cores as usize);
        let running = node.running.unwrap_or(0) as usize;
        let bar = capacity_bar(running, capacity);
        lines.push(format!(
            "{} — {}/{} chunks {}\n{}",
            md::bold(&node.name),
            running,
            capacity,
            bar,
            md::code(format!(
                "{} · {} cores · v{}",
                node.platform, node.total_cores, node.version
            )),
        ));
    }

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title(format!("Online Nodes ({})", rows.len()))
                .description(lines.join("\n\n"))
                .color(colors::GREEN),
        ),
    )
    .await?;

    Ok(())
}

fn capacity_bar(used: usize, total: usize) -> String {
    if total == 0 {
        return String::from("[empty]");
    }
    let filled = (used * 10) / total;
    let empty = 10 - filled;
    format!("[{}{}]", "█".repeat(filled), "░".repeat(empty))
}

#[derive(Debug, sqlx::FromRow)]
struct NodeRow {
    name: String,
    total_cores: i32,
    max_parallel: i32,
    platform: String,
    version: String,
    running: Option<i64>,
}
