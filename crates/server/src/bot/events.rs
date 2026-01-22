use poise::serenity_prelude as serenity;

use super::{Data, Error};
use crate::utils::{filter_refresh, meta};

pub async fn handle(
    ctx: &serenity::Context,
    event: &serenity::FullEvent,
    _framework: poise::FrameworkContext<'_, Data, Error>,
    data: &Data,
) -> Result<(), Error> {
    match event {
        serenity::FullEvent::Ready { data_about_bot } => {
            tracing::info!(
                "Connected to {} guilds",
                data_about_bot.guilds.len()
            );
        }
        serenity::FullEvent::GuildCreate { guild, is_new } => {
            if is_new.unwrap_or(false) {
                tracing::info!("Joined new guild: {} ({})", guild.name, guild.id);

                filter_refresh::build_initial(
                    ctx.http.clone(),
                    vec![guild.id],
                    data.state.filters.clone(),
                );

                if let Some(system_channel) = guild.system_channel_id {
                    let _ = system_channel
                        .say(
                            &ctx.http,
                            format!(
                                "Thanks for adding {}! Use `/wlab help` to get started.",
                                meta::APP_NAME
                            ),
                        )
                        .await;
                }
            }
        }
        serenity::FullEvent::GuildDelete { incomplete, .. } => {
            tracing::info!("Left guild: {}", incomplete.id);
            data.state.filters.write().await.remove(&incomplete.id);
        }
        serenity::FullEvent::GuildMemberAddition { new_member } => {
            if !new_member.user.bot {
                let discord_id = new_member.user.id.to_string();
                filter_refresh::handle_member_add(
                    &data.state.filters,
                    new_member.guild_id,
                    &discord_id,
                );
            }
        }
        serenity::FullEvent::GuildMemberRemoval { guild_id, user, .. } => {
            if !user.bot {
                let http = ctx.http.clone();
                let filters = data.state.filters.clone();
                let gid = *guild_id;
                tokio::spawn(async move {
                    filter_refresh::handle_member_remove(&http, &filters, gid).await;
                });
            }
        }
        _ => {}
    }
    Ok(())
}
