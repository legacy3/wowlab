use crate::bot::{Context, Error};
use crate::utils::markdown as md;

/// Check bot latency
#[poise::command(slash_command, user_cooldown = 3)]
pub async fn ping(ctx: Context<'_>) -> Result<(), Error> {
    let gw = ctx.ping().await;
    let gateway = format!("{:.0}ms", gw.as_secs_f64() * 1000.0);

    let start = std::time::Instant::now();
    let reply = ctx.say("Pong!").await?;
    let api = start.elapsed().as_secs_f64() * 1000.0;

    reply
        .edit(
            ctx,
            poise::CreateReply::default().content(format!(
                "Pong! Gateway: {} · API: {}",
                md::code(&gateway),
                md::code(format!("{api:.0}ms"))
            )),
        )
        .await?;

    Ok(())
}
