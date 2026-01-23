use poise::serenity_prelude as serenity;
use sqlx::PgPool;
use uuid::Uuid;

use crate::bot::{Context, Error};
use crate::utils::colors;

/// Show your running and pending jobs
#[poise::command(slash_command, user_cooldown = 5)]
pub async fn jobs(ctx: Context<'_>) -> Result<(), Error> {
    ctx.defer().await?;

    let db = &ctx.data().state.db;
    let discord_id = ctx.author().id.to_string();

    let user_id = match resolve_user_id(db, &discord_id).await? {
        Some(id) => id,
        None => {
            ctx.send(
                poise::CreateReply::default().embed(
                    serenity::CreateEmbed::new()
                        .title("No Account Linked")
                        .description("Your Discord account is not linked to a WoW Lab account.")
                        .color(colors::YELLOW),
                ),
            )
            .await?;
            return Ok(());
        }
    };

    let rows = sqlx::query_as::<_, JobRow>(
        "SELECT j.id, j.access_type,
                COUNT(*) FILTER (WHERE jc.status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE jc.status = 'running') AS running,
                COUNT(*) FILTER (WHERE jc.status = 'done') AS done
         FROM public.jobs j
         LEFT JOIN public.jobs_chunks jc ON jc.job_id = j.id
         WHERE j.user_id = $1
         GROUP BY j.id
         ORDER BY j.created_at DESC
         LIMIT 10",
    )
    .bind(user_id)
    .fetch_all(db)
    .await?;

    if rows.is_empty() {
        ctx.send(
            poise::CreateReply::default().embed(
                serenity::CreateEmbed::new()
                    .title("No Jobs")
                    .description("You don't have any jobs.")
                    .color(colors::YELLOW),
            ),
        )
        .await?;
        return Ok(());
    }

    let mut lines = Vec::new();
    for row in &rows {
        let id_short = &row.id.to_string()[..8];
        let access = row.access_type.as_deref().unwrap_or("private");
        lines.push(format!(
            "`{}` ({}) — {} done / {} running / {} pending",
            id_short,
            access,
            row.done.unwrap_or(0),
            row.running.unwrap_or(0),
            row.pending.unwrap_or(0),
        ));
    }

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title("Your Jobs")
                .description(lines.join("\n"))
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}

async fn resolve_user_id(db: &PgPool, discord_id: &str) -> Result<Option<Uuid>, sqlx::Error> {
    let row = sqlx::query_scalar::<_, Uuid>(
        "SELECT user_id FROM auth.identities WHERE provider = 'discord' AND provider_id = $1",
    )
    .bind(discord_id)
    .fetch_optional(db)
    .await?;

    Ok(row)
}

#[derive(Debug, sqlx::FromRow)]
struct JobRow {
    id: Uuid,
    access_type: Option<String>,
    pending: Option<i64>,
    running: Option<i64>,
    done: Option<i64>,
}
