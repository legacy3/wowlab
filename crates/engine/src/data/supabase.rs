//! SupabaseResolver: Loads data from Supabase PostgREST API.
//!
//! This resolver requires the `supabase` feature and network access.
//! It uses GameDataCache for efficient caching (memory + disk).

#![cfg(feature = "supabase")]

use crate::data::resolver::{DataResolver, ResolverError};
use async_trait::async_trait;
use snapshot_parser::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TalentTreeFlat};
use supabase_client::{GameDataCache, SupabaseClient, SupabaseError};

/// Resolver that loads data from Supabase PostgREST API.
///
/// Uses GameDataCache for efficient multi-layer caching:
/// - L1: In-memory (moka cache)
/// - L2: Disk cache (JSON files)
/// - L3: Network fetch from Supabase
pub struct SupabaseResolver {
    cache: GameDataCache,
}

impl SupabaseResolver {
    /// Create a new SupabaseResolver with a pre-configured cache.
    pub fn new(cache: GameDataCache) -> Self {
        Self { cache }
    }

    /// Create a new SupabaseResolver from environment variables.
    ///
    /// Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` to be set.
    pub fn from_env(patch: Option<&str>) -> Result<Self, ResolverError> {
        let client = SupabaseClient::from_env().map_err(|e| match e {
            SupabaseError::EnvVar { name } => ResolverError::EnvVar(name),
            other => ResolverError::Supabase(other),
        })?;

        let patch_version = patch.unwrap_or("unknown");
        let cache =
            GameDataCache::new(client, patch_version).map_err(ResolverError::Supabase)?;

        Ok(Self { cache })
    }

    /// Get cache statistics for diagnostics.
    pub fn cache_stats(&self) -> supabase_client::CacheStats {
        self.cache.stats()
    }

    /// Clear all caches (memory and disk).
    pub fn clear_cache(&self) -> Result<(), ResolverError> {
        self.cache.clear_all().map_err(ResolverError::Supabase)
    }

    /// Invalidate a specific spell from cache.
    pub fn invalidate_spell(&self, id: i32) {
        self.cache.invalidate_spell(id);
    }

    /// Invalidate a specific talent tree from cache.
    pub fn invalidate_talent(&self, spec_id: i32) {
        self.cache.invalidate_talent(spec_id);
    }

    /// Get the underlying client for uncached operations.
    pub fn client(&self) -> &SupabaseClient {
        self.cache.client()
    }
}

#[async_trait]
impl DataResolver for SupabaseResolver {
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError> {
        self.cache
            .get_spell(id)
            .await
            .map_err(ResolverError::Supabase)
    }

    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Fetch each spell through the cache
        // Could be optimized with parallel requests
        let mut results = Vec::with_capacity(ids.len());
        for &id in ids {
            match self.cache.get_spell(id).await {
                Ok(spell) => results.push(spell),
                Err(SupabaseError::NotFound { .. }) => continue, // Skip not found
                Err(e) => return Err(ResolverError::Supabase(e)),
            }
        }
        Ok(results)
    }

    async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, ResolverError> {
        self.cache
            .get_talent_tree(spec_id)
            .await
            .map_err(ResolverError::Supabase)
    }

    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError> {
        self.cache
            .get_item(id)
            .await
            .map_err(ResolverError::Supabase)
    }

    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError> {
        self.cache
            .get_aura(spell_id)
            .await
            .map_err(ResolverError::Supabase)
    }

    async fn search_spells(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Search doesn't go through cache (results vary)
        self.cache
            .client()
            .search_spells(query, limit)
            .await
            .map_err(ResolverError::Supabase)
    }
}
