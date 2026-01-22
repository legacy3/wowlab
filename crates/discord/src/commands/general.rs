use crate::{Context, Error};

/// Check bot latency
#[poise::command(slash_command)]
pub async fn ping(ctx: Context<'_>) -> Result<(), Error> {
    let start = std::time::Instant::now();
    let reply = ctx.say("Pong!").await?;
    let elapsed = start.elapsed();

    reply
        .edit(ctx, poise::CreateReply::default().content(format!("Pong! `{:.1}ms`", elapsed.as_secs_f64() * 1000.0)))
        .await?;

    Ok(())
}

/// Echo a message back
#[poise::command(slash_command)]
pub async fn echo(
    ctx: Context<'_>,
    #[description = "Message to echo"] message: String,
) -> Result<(), Error> {
    ctx.say(&message).await?;
    Ok(())
}
