mod commands;
mod events;

use std::sync::Arc;

use poise::serenity_prelude as serenity;
use tokio_util::sync::CancellationToken;

use crate::notifications::{self, NotificationReceiver};
use crate::state::ServerState;
use crate::utils::filter_refresh;

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Context<'a> = poise::Context<'a, Data, Error>;

pub struct Data {
    pub state: Arc<ServerState>,
}

pub async fn run(
    state: Arc<ServerState>,
    notification_rx: NotificationReceiver,
    shutdown: CancellationToken,
) -> Result<(), Error> {
    let token = state.config.discord_token.clone();

    let intents = serenity::GatewayIntents::non_privileged()
        | serenity::GatewayIntents::GUILD_MEMBERS
        | serenity::GatewayIntents::MESSAGE_CONTENT;

    let shared = state.clone();
    let db_for_receiver = state.db.clone();
    // Wrap in Option so we can take() it in the setup closure
    let mut notification_rx = Some(notification_rx);
    let framework = poise::Framework::builder()
        .options(poise::FrameworkOptions {
            commands: commands::all(),
            on_error: |error| Box::pin(on_error(error)),
            pre_command: |ctx| Box::pin(pre_command(ctx)),
            post_command: |ctx| Box::pin(post_command(ctx)),
            event_handler: |ctx, event, framework, data| {
                Box::pin(events::handle(ctx, event, framework, data))
            },
            ..Default::default()
        })
        .setup(move |ctx, ready, framework| {
            let http = ctx.http.clone();
            let db = db_for_receiver.clone();
            let rx = notification_rx.take().expect("setup called twice");
            Box::pin(async move {
                tracing::info!("Logged in as {}", ready.user.name);
                poise::builtins::register_globally(ctx, &framework.options().commands).await?;
                tracing::info!(
                    "Registered {} slash commands globally",
                    framework.options().commands.len()
                );

                let guild_ids: Vec<serenity::GuildId> = ready.guilds.iter().map(|g| g.id).collect();
                tracing::info!(count = guild_ids.len(), "Tracking guilds");

                // Build filters for all guilds once at startup
                filter_refresh::build_initial(ctx.http.clone(), guild_ids, shared.filters.clone());

                // Spawn notification receiver task
                tokio::spawn(notifications::run_receiver(rx, http, db));

                Ok(Data { state: shared })
            })
        })
        .build();

    let mut client = serenity::ClientBuilder::new(token, intents)
        .framework(framework)
        .await?;

    tracing::info!("Starting bot...");

    state.set_shard_manager(client.shard_manager.clone());
    tokio::spawn({
        let manager = client.shard_manager.clone();
        let shutdown = shutdown.clone();
        async move {
            tokio::select! {
                _ = tokio::signal::ctrl_c() => {}
                _ = shutdown.cancelled() => {}
            }
            tracing::info!("Received shutdown signal");
            manager.shutdown_all().await;
            shutdown.cancel();
        }
    });

    client.start().await?;

    Ok(())
}

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
            let _ = ctx
                .say("An error occurred while executing the command.")
                .await;
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
        poise::FrameworkError::ArgumentParse {
            error, input, ctx, ..
        } => {
            tracing::warn!(
                command = ctx.command().name,
                input = ?input,
                "Argument parse error: {}",
                error
            );
            let _ = ctx.say(format!("Invalid argument: {}", error)).await;
        }
        poise::FrameworkError::CooldownHit {
            remaining_cooldown,
            ctx,
            ..
        } => {
            let _ = ctx
                .say(format!(
                    "Please wait {:.1}s before using this command again.",
                    remaining_cooldown.as_secs_f32()
                ))
                .await;
        }
        poise::FrameworkError::MissingBotPermissions {
            missing_permissions,
            ctx,
            ..
        } => {
            tracing::warn!(
                command = ctx.command().name,
                permissions = %missing_permissions,
                "Bot missing permissions"
            );
            let _ = ctx
                .say(format!("I'm missing permissions: {}", missing_permissions))
                .await;
        }
        poise::FrameworkError::MissingUserPermissions {
            missing_permissions,
            ctx,
            ..
        } => {
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
    tracing::debug!(
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
