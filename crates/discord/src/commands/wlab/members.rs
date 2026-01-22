use crate::{colors, Context, Error};
use poise::serenity_prelude as serenity;

/// Fetch and display member count
#[poise::command(slash_command, guild_only, user_cooldown = 10, guild_cooldown = 5)]
pub async fn members(ctx: Context<'_>) -> Result<(), Error> {
    let guild_id = ctx.guild_id().ok_or("Not in a guild")?;

    ctx.defer().await?;

    let members = guild_id.members(&ctx.http(), None, None).await?;

    let total = members.len();
    let bots = members.iter().filter(|m| m.user.bot).count();
    let humans = total - bots;

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title("Member List Fetch")
                .description(format!("Successfully fetched {} members", total))
                .field("Humans", humans.to_string(), true)
                .field("Bots", bots.to_string(), true)
                .field("Guild ID", guild_id.to_string(), false)
                .color(colors::GREEN),
        ),
    )
    .await?;

    Ok(())
}
