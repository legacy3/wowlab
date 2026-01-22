use crate::{colors, meta, Context, Error};
use poise::serenity_prelude as serenity;

/// About WoW Lab
#[poise::command(slash_command)]
pub async fn about(ctx: Context<'_>) -> Result<(), Error> {
    ctx.send(
        poise::CreateReply::default().embed(
            serenity::CreateEmbed::new()
                .title(meta::APP_NAME)
                .description(meta::DESCRIPTION)
                .field("Website", format!("[wowlab.gg]({})", meta::WEBSITE), true)
                .field(
                    "GitHub",
                    format!("[GitHub]({})", meta::GITHUB),
                    true,
                )
                .color(colors::BLURPLE),
        ),
    )
    .await?;

    Ok(())
}
