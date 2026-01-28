mod about;
mod help;
mod jobs;
mod members;
mod nodes;
mod ping;
mod server;
mod stats;

use crate::bot::{Context, Error};

/// WoW Lab bot commands
#[poise::command(
    slash_command,
    subcommands(
        "ping::ping",
        "about::about",
        "help::help",
        "server::server",
        "members::members",
        "jobs::jobs",
        "nodes::nodes",
        "stats::stats",
    )
)]
pub async fn wlab(_ctx: Context<'_>) -> Result<(), Error> {
    Ok(())
}
