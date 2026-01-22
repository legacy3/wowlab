use crate::{colors, Context, Error};
use poise::serenity_prelude as serenity;

/// Show server information
#[poise::command(slash_command, guild_only, user_cooldown = 5)]
pub async fn server(ctx: Context<'_>) -> Result<(), Error> {
    let (name, icon_url, member_count, owner_id, created_at) = {
        let guild = ctx.guild().ok_or("Not in a guild")?;
        (
            guild.name.clone(),
            guild.icon_url(),
            guild.member_count,
            guild.owner_id,
            guild.id.created_at().unix_timestamp(),
        )
    };

    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title(&name)
                .thumbnail(icon_url.unwrap_or_default())
                .field("Members", member_count.to_string(), true)
                .field("Owner", format!("<@{}>", owner_id), true)
                .field("Created", format!("<t:{}:R>", created_at), true)
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}
