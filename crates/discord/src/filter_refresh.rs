use std::collections::HashMap;
use std::sync::Arc;

use poise::serenity_prelude::{GuildId, Http};
use serde::Serialize;
use tokio::sync::RwLock;
use wowlab_api::SupabaseClient;

use crate::bloom::{create_server_filter, filter_hash, BloomFilter};
use crate::discord;

pub struct GuildFilter {
    pub filter: BloomFilter,
    pub member_count: usize,
}

pub type FilterMap = Arc<RwLock<HashMap<GuildId, GuildFilter>>>;

#[derive(Serialize)]
struct FilterRow {
    server_id: String,
    filter: String,
    filter_hash: String,
    member_count: i32,
}

/// Spawns a one-time task to build filters for all guilds the bot is in at startup.
pub fn build_initial(
    http: Arc<Http>,
    guild_ids: Vec<GuildId>,
    filters: FilterMap,
    supabase: Arc<SupabaseClient>,
) {
    tokio::spawn(async move {
        tracing::info!(count = guild_ids.len(), "Building initial server filters");

        for guild_id in guild_ids {
            if let Err(e) = rebuild_guild(&http, &supabase, &filters, guild_id).await {
                tracing::warn!(guild_id = %guild_id, error = %e, "Failed to build filter");
            }
        }
    });
}

/// Called on GuildMemberAddition. Inserts the new member into the existing filter.
pub async fn handle_member_add(
    filters: &FilterMap,
    supabase: &SupabaseClient,
    guild_id: GuildId,
    discord_id: &str,
) {
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

    let bytes = entry.filter.as_bytes();
    let hash = filter_hash(bytes);
    let member_count = entry.member_count;

    tracing::debug!(guild_id = %guild_id, discord_id, "Inserted member into filter");

    if let Err(e) = upload_filter(supabase, &guild_id.to_string(), bytes, &hash, member_count).await
    {
        tracing::warn!(guild_id = %guild_id, error = %e, "Failed to upload filter after add");
    }
}

/// Called on GuildMemberRemoval. Rebuilds the filter from scratch since Bloom
/// filters don't support removal.
pub async fn handle_member_remove(
    http: &Http,
    filters: &FilterMap,
    supabase: &SupabaseClient,
    guild_id: GuildId,
) {
    if let Err(e) = rebuild_guild(http, supabase, filters, guild_id).await {
        tracing::warn!(guild_id = %guild_id, error = %e, "Failed to rebuild filter after remove");
    }
}

/// Delete a guild's filter from Supabase.
pub async fn delete_guild_filter(supabase: &SupabaseClient, guild_id: GuildId) {
    let path = format!("discord_server_filters?server_id=eq.{}", guild_id);
    if let Err(e) = supabase.delete(&path).await {
        tracing::warn!(guild_id = %guild_id, error = %e, "Failed to delete filter");
    }
}

/// Full rebuild: fetch all members, create a new filter, store it, upload it.
async fn rebuild_guild(
    http: &Http,
    supabase: &SupabaseClient,
    filters: &FilterMap,
    guild_id: GuildId,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let discord_ids = discord::fetch_all_member_ids(http, guild_id).await?;

    let filter = create_server_filter(&discord_ids);
    let bytes = filter.as_bytes();
    let hash = filter_hash(bytes);
    let member_count = discord_ids.len();

    tracing::info!(
        guild_id = %guild_id,
        members = member_count,
        filter_bytes = bytes.len(),
        "Filter built"
    );

    upload_filter(supabase, &guild_id.to_string(), bytes, &hash, member_count).await?;

    filters.write().await.insert(guild_id, GuildFilter { filter, member_count });

    Ok(())
}

async fn upload_filter(
    supabase: &SupabaseClient,
    server_id: &str,
    bytes: &[u8],
    hash: &str,
    member_count: usize,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let row = FilterRow {
        server_id: server_id.to_string(),
        filter: base64::Engine::encode(&base64::engine::general_purpose::STANDARD, bytes),
        filter_hash: hash.to_string(),
        member_count: member_count as i32,
    };

    supabase.upsert("discord_server_filters", &row).await?;
    Ok(())
}
