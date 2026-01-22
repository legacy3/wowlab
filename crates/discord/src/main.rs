use std::collections::HashMap;
use std::env;
use std::sync::Arc;

use poise::serenity_prelude as serenity;
use tokio::sync::RwLock;
use wowlab_api::SupabaseClient;

pub mod bloom;
pub mod colors;
mod commands;
mod discord;
mod filter_refresh;
pub mod meta;

fn load_env() {
    // Try .env in current dir, then in crate dir
    if dotenvy::dotenv().is_err() {
        let crate_dir = env!("CARGO_MANIFEST_DIR");
        let _ = dotenvy::from_path(format!("{}/.env", crate_dir));
    }
}

pub struct Data {
    pub filters: filter_refresh::FilterMap,
    pub supabase: Arc<SupabaseClient>,
}

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

async fn on_error(error: poise::FrameworkError<'_, Data, Error>) {
    match error {
        poise::FrameworkError::Setup { error, .. } => {
            tracing::error!("Failed to start bot: {}", error);
        }
        poise::FrameworkError::Command { error, ctx, .. } => {
            tracing::error!(
                command = ctx.command().name,
                user = %ctx.author().name,
                "Command error: {}",
                error
            );
            let _ = ctx.say("An error occurred while executing the command.").await;
        }
        poise::FrameworkError::CommandPanic { ctx, payload, .. } => {
            tracing::error!(
                command = ctx.command().name,
                user = %ctx.author().name,
                "Command panicked: {:?}",
                payload
            );
            let _ = ctx.say("An internal error occurred.").await;
        }
        poise::FrameworkError::ArgumentParse { error, input, ctx, .. } => {
            tracing::warn!(
                command = ctx.command().name,
                input = ?input,
                "Argument parse error: {}",
                error
            );
            let _ = ctx
                .say(format!("Invalid argument: {}", error))
                .await;
        }
        poise::FrameworkError::CooldownHit { remaining_cooldown, ctx, .. } => {
            let _ = ctx
                .say(format!(
                    "Please wait {:.1}s before using this command again.",
                    remaining_cooldown.as_secs_f32()
                ))
                .await;
        }
        poise::FrameworkError::MissingBotPermissions { missing_permissions, ctx, .. } => {
            tracing::warn!(
                command = ctx.command().name,
                permissions = %missing_permissions,
                "Bot missing permissions"
            );
            let _ = ctx
                .say(format!("I'm missing permissions: {}", missing_permissions))
                .await;
        }
        poise::FrameworkError::MissingUserPermissions { missing_permissions, ctx, .. } => {
            let perms = missing_permissions
                .map(|p| p.to_string())
                .unwrap_or_else(|| "unknown".to_string());
            let _ = ctx
                .say(format!("You're missing permissions: {}", perms))
                .await;
        }
        poise::FrameworkError::GuildOnly { ctx, .. } => {
            let _ = ctx.say("This command can only be used in a server.").await;
        }
        poise::FrameworkError::DmOnly { ctx, .. } => {
            let _ = ctx.say("This command can only be used in DMs.").await;
        }
        poise::FrameworkError::NotAnOwner { ctx, .. } => {
            let _ = ctx.say("This command is owner-only.").await;
        }
        error => {
            if let Err(e) = poise::builtins::on_error(error).await {
                tracing::error!("Error while handling error: {}", e);
            }
        }
    }
}

async fn pre_command(ctx: Context<'_>) {
    tracing::info!(
        command = ctx.command().qualified_name,
        user = %ctx.author().name,
        user_id = %ctx.author().id,
        guild = ?ctx.guild_id().map(|g| g.get()),
        "Executing command"
    );
}

async fn post_command(ctx: Context<'_>) {
    tracing::debug!(
        command = ctx.command().qualified_name,
        user = %ctx.author().name,
        "Command completed"
    );
}

#[tokio::main]
async fn main() {
    load_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("wowlab_discord=info".parse().unwrap()),
        )
        .init();

    if let Err(e) = run().await {
        tracing::error!("Fatal error: {}", e);
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Error> {
    let token = env::var("DISCORD_TOKEN").expect("DISCORD_TOKEN env var required");

    let intents = serenity::GatewayIntents::non_privileged()
        | serenity::GatewayIntents::GUILD_MEMBERS
        | serenity::GatewayIntents::MESSAGE_CONTENT;

    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: commands::all(),
            on_error: |error| Box::pin(on_error(error)),
            pre_command: |ctx| Box::pin(pre_command(ctx)),
            post_command: |ctx| Box::pin(post_command(ctx)),
            event_handler: |ctx, event, framework, data| {
                Box::pin(event_handler(ctx, event, framework, data))
            },
            ..Default::default()
        })
        .setup(|ctx, ready, framework| {
            Box::pin(async move {
                tracing::info!("Logged in as {}", ready.user.name);
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                tracing::info!("Registered {} slash commands globally", framework.options().commands.len());

                let supabase = Arc::new(
                    SupabaseClient::from_env_service_role()
                        .expect("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"),
                );

                let guild_ids: Vec<serenity::GuildId> = ready
                    .guilds
                    .iter()
                    .map(|g| g.id)
                    .collect();
                tracing::info!(count = guild_ids.len(), "Tracking guilds");

                let filters: filter_refresh::FilterMap =
                    Arc::new(RwLock::new(HashMap::new()));

                // Build filters for all guilds once at startup
                filter_refresh::build_initial(
                    ctx.http.clone(),
                    guild_ids,
                    filters.clone(),
                    supabase.clone(),
                );

                Ok(Data { filters, supabase })
            })
        })
        .build();

    let mut client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .await?;

    tracing::info!("Starting bot...");

    let shard_manager = client.shard_manager.clone();
    tokio::spawn(async move {
        tokio::signal::ctrl_c().await.ok();
        tracing::info!("Received shutdown signal");
        shard_manager.shutdown_all().await;
    });

    client.start().await?;

    Ok(())
}

async fn event_handler(
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

                // Build filter for the new guild
                let http = ctx.http.clone();
                let filters = data.filters.clone();
                let supabase = data.supabase.clone();
                let guild_id = guild.id;
                tokio::spawn(async move {
                    filter_refresh::build_initial(http, vec![guild_id], filters, supabase);
                });

                if let Some(system_channel) = guild.system_channel_id {
                    let _ = system_channel
                        .say(
                            &ctx.http,
                            format!("Thanks for adding {}! Use `/wlab help` to get started.", meta::APP_NAME),
                        )
                        .await;
                }
            }
        }
        serenity::FullEvent::GuildDelete { incomplete, .. } => {
            tracing::info!("Left guild: {}", incomplete.id);
            data.filters.write().await.remove(&incomplete.id);

            let supabase = data.supabase.clone();
            let guild_id = incomplete.id;
            tokio::spawn(async move {
                filter_refresh::delete_guild_filter(&supabase, guild_id).await;
            });
        }
        serenity::FullEvent::GuildMemberAddition { new_member } => {
            if !new_member.user.bot {
                let discord_id = new_member.user.id.to_string();
                filter_refresh::handle_member_add(
                    &data.filters,
                    &data.supabase,
                    new_member.guild_id,
                    &discord_id,
                )
                .await;
            }
        }
        serenity::FullEvent::GuildMemberRemoval { guild_id, user, .. } => {
            if !user.bot {
                let http = ctx.http.clone();
                let filters = data.filters.clone();
                let supabase = data.supabase.clone();
                let gid = *guild_id;
                tokio::spawn(async move {
                    filter_refresh::handle_member_remove(&http, &filters, &supabase, gid).await;
                });
            }
        }
        _ => {}
    }
    Ok(())
}
