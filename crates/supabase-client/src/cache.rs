//! TTL-based caching layer using dashmap

use crate::{SupabaseClient, SupabaseError};
use dashmap::DashMap;
use snapshot_parser::flat::{ItemDataFlat, SpellDataFlat, TalentTreeFlat};
use std::time::{Duration, Instant};

/// Cache configuration
#[derive(Clone)]
pub struct CacheConfig {
    /// Time-to-live for cached entries
    pub ttl: Duration,
    /// Maximum number of entries per cache type
    pub max_entries: usize,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            ttl: Duration::from_secs(300),
            max_entries: 10_000,
        }
    }
}

/// A cache entry with its insertion time
struct CacheEntry<T> {
    value: T,
    inserted_at: Instant,
}

impl<T> CacheEntry<T> {
    fn new(value: T) -> Self {
        Self {
            value,
            inserted_at: Instant::now(),
        }
    }

    fn is_expired(&self, ttl: Duration) -> bool {
        self.inserted_at.elapsed() > ttl
    }
}

/// Evict oldest entry from a cache
fn evict_oldest<K: Clone + Eq + std::hash::Hash, V>(cache: &DashMap<K, CacheEntry<V>>) {
    if let Some(oldest_key) = cache
        .iter()
        .min_by_key(|e| e.value().inserted_at)
        .map(|e| e.key().clone())
    {
        cache.remove(&oldest_key);
    }
}

/// Cached client wrapper with TTL-based expiration
pub struct CachedClient {
    client: SupabaseClient,
    config: CacheConfig,
    spell_cache: DashMap<i32, CacheEntry<SpellDataFlat>>,
    talent_cache: DashMap<i32, CacheEntry<TalentTreeFlat>>,
    item_cache: DashMap<i32, CacheEntry<ItemDataFlat>>,
}

impl CachedClient {
    /// Create a new cached client
    pub fn new(client: SupabaseClient, config: CacheConfig) -> Self {
        Self {
            client,
            config,
            spell_cache: DashMap::new(),
            talent_cache: DashMap::new(),
            item_cache: DashMap::new(),
        }
    }

    /// Invalidate all cached data (call after sync)
    pub fn invalidate_all(&self) {
        self.spell_cache.clear();
        self.talent_cache.clear();
        self.item_cache.clear();
        tracing::info!("Cache invalidated");
    }

    /// Invalidate specific spell from cache
    pub fn invalidate_spell(&self, id: i32) {
        self.spell_cache.remove(&id);
    }

    /// Invalidate specific talent tree from cache
    pub fn invalidate_talent_tree(&self, spec_id: i32) {
        self.talent_cache.remove(&spec_id);
    }

    /// Invalidate specific item from cache
    pub fn invalidate_item(&self, id: i32) {
        self.item_cache.remove(&id);
    }

    /// Evict expired entries (call periodically)
    pub fn evict_expired(&self) {
        let ttl = self.config.ttl;
        self.spell_cache.retain(|_, e| !e.is_expired(ttl));
        self.talent_cache.retain(|_, e| !e.is_expired(ttl));
        self.item_cache.retain(|_, e| !e.is_expired(ttl));
    }

    /// Get current cache sizes for diagnostics
    pub fn cache_sizes(&self) -> (usize, usize, usize) {
        (
            self.spell_cache.len(),
            self.talent_cache.len(),
            self.item_cache.len(),
        )
    }

    /// Get a spell by ID, using cache
    pub async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, SupabaseError> {
        if let Some(entry) = self.spell_cache.get(&id) {
            if !entry.is_expired(self.config.ttl) {
                return Ok(entry.value.clone());
            }
        }

        let spell = self.client.get_spell(id, None).await?;

        if self.spell_cache.len() >= self.config.max_entries {
            evict_oldest(&self.spell_cache);
        }

        self.spell_cache.insert(id, CacheEntry::new(spell.clone()));
        Ok(spell)
    }

    /// Get a talent tree by spec ID, using cache
    pub async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, SupabaseError> {
        if let Some(entry) = self.talent_cache.get(&spec_id) {
            if !entry.is_expired(self.config.ttl) {
                return Ok(entry.value.clone());
            }
        }

        let tree = self.client.get_talent_tree(spec_id).await?;

        if self.talent_cache.len() >= self.config.max_entries {
            evict_oldest(&self.talent_cache);
        }

        self.talent_cache.insert(spec_id, CacheEntry::new(tree.clone()));
        Ok(tree)
    }

    /// Get an item by ID, using cache
    pub async fn get_item(&self, id: i32) -> Result<ItemDataFlat, SupabaseError> {
        if let Some(entry) = self.item_cache.get(&id) {
            if !entry.is_expired(self.config.ttl) {
                return Ok(entry.value.clone());
            }
        }

        let item = self.client.get_item(id, None).await?;

        if self.item_cache.len() >= self.config.max_entries {
            evict_oldest(&self.item_cache);
        }

        self.item_cache.insert(id, CacheEntry::new(item.clone()));
        Ok(item)
    }

    /// Get underlying client for non-cached operations
    pub fn client(&self) -> &SupabaseClient {
        &self.client
    }
}
