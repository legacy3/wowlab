//! SupabaseResolver: loads from Supabase API with L1/L2/L3 caching.

#![cfg(feature = "supabase")]

use crate::data::cache::GameDataCache;
use crate::data::resolver::{DataResolver, ResolverError};
use async_trait::async_trait;
use wowlab_common::types::data::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat};
use wowlab_supabase::{SupabaseClient, SupabaseError};

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
    pub fn from_env(patch: &str) -> Result<Self, ResolverError> {
        let client = SupabaseClient::from_env().map_err(|e| match e {
            SupabaseError::EnvVar { name } => ResolverError::EnvVar(name),
            other => ResolverError::Supabase(other),
        })?;

        let cache = GameDataCache::new(client, patch).map_err(ResolverError::Supabase)?;

        Ok(Self { cache })
    }

    /// Get cache statistics for diagnostics.
    pub fn cache_stats(&self) -> crate::data::cache::CacheStats {
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
    pub fn invalidate_trait(&self, spec_id: i32) {
        self.cache.invalidate_trait(spec_id);
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
        self.cache
            .get_spells(ids)
            .await
            .map_err(ResolverError::Supabase)
    }

    async fn get_trait_tree(&self, spec_id: i32) -> Result<TraitTreeFlat, ResolverError> {
        self.cache
            .get_trait_tree(spec_id)
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
        self.cache
            .search_spells(query, limit)
            .await
            .map_err(ResolverError::Supabase)
    }
}
