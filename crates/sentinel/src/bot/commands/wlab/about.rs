use poise::serenity_prelude as serenity;

use crate::bot::{Context, Error};
use crate::utils::{colors, meta};

/// About WoW Lab
#[poise::command(slash_command)]
pub async fn about(ctx: Context<'_>) -> Result<(), Error> {
    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title(format!("{} v{}", meta::APP_NAME, env!("CARGO_PKG_VERSION")))
                .description(meta::DESCRIPTION)
                .field("Website", format!("[wowlab.gg]({})", meta::WEBSITE), true)
                .field("GitHub", format!("[GitHub]({})", meta::GITHUB), true)
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}
