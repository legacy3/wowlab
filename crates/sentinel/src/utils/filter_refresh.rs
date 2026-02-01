use std::collections::HashMap;
use std::sync::Arc;

use poise::serenity_prelude::{GuildId, Http};
use tokio::sync::RwLock;

use super::bloom::{create_server_filter, BloomFilter};
use super::discord;

pub struct GuildFilter {
    pub filter: BloomFilter,
    pub member_count: usize,
}

pub type FilterMap = Arc<RwLock<HashMap<GuildId, GuildFilter>>>;

pub fn build_initial(http: Arc<Http>, guild_ids: Vec<GuildId>, filters: FilterMap) {
    tokio::spawn(async move {
        tracing::info!(count = guild_ids.len(), "Building initial server filters");

        let mut set = tokio::task::JoinSet::new();
        for guild_id in guild_ids {
            let http = http.clone();
            let filters = filters.clone();
            set.spawn(async move {
                if let Err(e) = rebuild_guild(&http, &filters, guild_id).await {
                    tracing::warn!(guild_id = %guild_id, error = %e, "Failed to build filter");
                }
            });
        }
        while set.join_next().await.is_some() {}

        tracing::info!("Initial server filters built");
    });
}

pub async fn handle_member_add(filters: &FilterMap, guild_id: GuildId, discord_id: &str) {
    let mut map = filters.write().await;
    let entry = match map.get_mut(&guild_id) {
        Some(e) => e,
        None => {
            tracing::warn!(guild_id = %guild_id, "No filter for guild, skipping add");
            return;
        }
    };

    entry.filter.insert(discord_id);
    entry.member_count += 1;
    tracing::debug!(guild_id = %guild_id, discord_id, "Inserted member into filter");
}

/// Bloom filters don't support removal, so we rebuild from scratch.
pub async fn handle_member_remove(http: &Http, filters: &FilterMap, guild_id: GuildId) {
    if let Err(e) = rebuild_guild(http, filters, guild_id).await {
        tracing::warn!(guild_id = %guild_id, error = %e, "Failed to rebuild filter after remove");
    }
}

async fn rebuild_guild(
    http: &Http,
    filters: &FilterMap,
    guild_id: GuildId,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let discord_ids = discord::fetch_all_member_ids(http, guild_id).await?;

    let filter = create_server_filter(&discord_ids);
    let member_count = discord_ids.len();

    tracing::debug!(
        guild_id = %guild_id,
        members = member_count,
        filter_bytes = filter.as_bytes().len(),
        "Filter built"
    );

    filters.write().await.insert(
        guild_id,
        GuildFilter {
            filter,
            member_count,
        },
    );

    Ok(())
}
