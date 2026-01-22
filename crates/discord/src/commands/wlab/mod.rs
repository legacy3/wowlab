mod about;
mod help;
mod members;
mod ping;
mod server;

use crate::{Context, Error};

/// WoW Lab bot commands
#[poise::command(
    slash_command,
    subcommands("ping::ping", "about::about", "help::help", "server::server", "members::members")
)]
pub async fn wlab(_ctx: Context<'_>) -> Result<(), Error> {
    Ok(())
}
