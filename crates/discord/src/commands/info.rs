use crate::{Context, Error};
use poise::serenity_prelude as serenity;

/// Show available commands
#[poise::command(slash_command)]
pub async fn help(
    ctx: Context<'_>,
    #[description = "Command to get help for"] command: Option<String>,
) -> Result<(), Error> {
    let config = poise::builtins::HelpConfiguration::default();

    if let Some(cmd) = command {
        let commands = &ctx.framework().options().commands;
        if let Some(found) = commands.iter().find(|c| c.name == cmd) {
            let desc = found
                .description
                .as_deref()
                .unwrap_or("No description available");

            ctx.send(
                poise::CreateReply::default().embed(
                    serenity::CreateEmbed::new()
                        .title(format!("/{}", found.name))
                        .description(desc)
                        .color(0x5865F2),
                ),
            )
            .await?;
        } else {
            ctx.say(format!("Command `{}` not found", cmd)).await?;
        }
    } else {
        poise::builtins::help(ctx, command.as_deref(), config).await?;
    }

    Ok(())
}

/// About WoW Lab bot
#[poise::command(slash_command)]
pub async fn about(ctx: Context<'_>) -> Result<(), Error> {
    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title("WoW Lab")
                .description("WoW combat simulation platform")
                .field("Website", "[wowlab.gg](https://wowlab.gg)", true)
                .field("GitHub", "[github.com/legacy3/wowlab](https://github.com/legacy3/wowlab)", true)
                .color(0x5865F2),
        ),
    )
    .await?;

    Ok(())
}

/// Show server information
#[poise::command(slash_command, guild_only)]
pub async fn serverinfo(ctx: Context<'_>) -> Result<(), Error> {
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
                .color(0x5865F2),
        ),
    )
    .await?;

    Ok(())
}
