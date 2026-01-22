use poise::serenity_prelude as serenity;
use std::env;

mod commands;

fn load_env() {
    // Try .env in current dir, then in crate dir
    if dotenvy::dotenv().is_err() {
        let crate_dir = env!("CARGO_MANIFEST_DIR");
        let _ = dotenvy::from_path(format!("{}/.env", crate_dir));
    }
}

pub struct Data {}

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

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
                Ok(Data {})
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
    _data: &Data,
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

                if let Some(system_channel) = guild.system_channel_id {
                    let _ = system_channel
                        .say(&ctx.http, "Thanks for adding WoW Lab! Use `/help` to get started.")
                        .await;
                }
            }
        }
        serenity::FullEvent::GuildDelete { incomplete, .. } => {
            tracing::info!("Left guild: {}", incomplete.id);
        }
        _ => {}
    }
    Ok(())
}
