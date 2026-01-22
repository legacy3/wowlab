use crate::{colors, meta, Context, Error};
use poise::serenity_prelude as serenity;

/// Show available commands
#[poise::command(slash_command)]
pub async fn help(ctx: Context<'_>) -> Result<(), Error> {
    let commands = &ctx.framework().options().commands;

    let mut embed = serenity::CreateEmbed::new()
        .title(format!("{} Commands", meta::APP_NAME))
        .color(colors::BLURPLE);

    for cmd in commands {
        for sub in &cmd.subcommands {
            let name = format!("/{} {}", cmd.name, sub.name);
            let desc = sub.description.as_deref().unwrap_or("No description");
            embed = embed.field(name, desc, false);
        }
    }

    ctx.send(poise::CreateReply::default().embed(embed)).await?;

    Ok(())
}
