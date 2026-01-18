//! Unified game data cache: memory (moka) → disk → network
//!
//! Provides a two-layer cache for immutable game data:
//! - L1: In-memory moka cache for hot data
//! - L2: Disk cache (JSON files) for persistence across restarts
//! - L3: Network fetch from Supabase as fallback
//!
//! Cache is keyed by patch version - when patch changes, disk cache is cleared.

use crate::{SupabaseClient, SupabaseError};
use directories::ProjectDirs;
use moka::sync::Cache;
use wowlab_types::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat};
use serde::{de::DeserializeOwned, Serialize};
use std::fs;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

/// Unified game data cache with memory and disk layers.
pub struct GameDataCache {
    client: SupabaseClient,
    patch: String,
    cache_dir: PathBuf,

    // L1: In-memory (no TTL - data is immutable per patch)
    spells: Cache<i32, SpellDataFlat>,
    traits: Cache<i32, TraitTreeFlat>,
    items: Cache<i32, ItemDataFlat>,
    auras: Cache<i32, AuraDataFlat>,
}

/// Cache statistics for diagnostics.
#[derive(Debug, Default)]
pub struct CacheStats {
    pub memory: MemoryStats,
    pub disk: DiskStats,
}

#[derive(Debug, Default)]
pub struct MemoryStats {
    pub spells: u64,
    pub traits: u64,
    pub items: u64,
    pub auras: u64,
}

#[derive(Debug, Default)]
pub struct DiskStats {
    pub spells: usize,
    pub traits: usize,
    pub items: usize,
    pub auras: usize,
}

impl GameDataCache {
    /// Create a new cache with default paths from `directories` crate.
    ///
    /// Cache directory: `~/.cache/wowlab/game-data/` (Linux)
    ///                  `~/Library/Caches/wowlab/game-data/` (macOS)
    ///                  `%LOCALAPPDATA%\wowlab\game-data\` (Windows)
    pub fn new(client: SupabaseClient, patch: impl Into<String>) -> Result<Self, SupabaseError> {
        let cache_dir = ProjectDirs::from("gg", "wowlab", "wowlab")
            .map(|d| d.cache_dir().join("game-data"))
            .unwrap_or_else(|| PathBuf::from(".cache/game-data"));

        Self::with_cache_dir(client, patch, cache_dir)
    }

    /// Create a new cache with a custom cache directory.
    pub fn with_cache_dir(
        client: SupabaseClient,
        patch: impl Into<String>,
        cache_dir: PathBuf,
    ) -> Result<Self, SupabaseError> {
        let patch = patch.into();

        fs::create_dir_all(&cache_dir).map_err(|e| SupabaseError::Io {
            message: format!("Failed to create cache dir: {}", e),
        })?;

        let cache = Self {
            client,
            patch: patch.clone(),
            cache_dir: cache_dir.clone(),
            spells: Cache::builder().max_capacity(50_000).build(),
            traits: Cache::builder().max_capacity(1_000).build(),
            items: Cache::builder().max_capacity(50_000).build(),
            auras: Cache::builder().max_capacity(10_000).build(),
        };

        // Clear disk cache if patch changed
        if !cache.patch_matches() {
            tracing::info!("Patch changed to {}, clearing disk cache", patch);
            cache.clear_disk()?;
            cache.write_patch_version()?;
        }

        Ok(cache)
    }

    // ========================================================================
    // Public API
    // ========================================================================

    /// Get a spell by ID.
    pub async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, SupabaseError> {
        // L1: Memory
        if let Some(v) = self.spells.get(&id) {
            return Ok(v);
        }

        // L2: Disk
        if let Some(v) = self.read_disk::<SpellDataFlat>("spells", id) {
            self.spells.insert(id, v.clone());
            return Ok(v);
        }

        // L3: Network
        let v = self.client.get_spell(id, None).await?;
        self.write_disk("spells", id, &v)?;
        self.spells.insert(id, v.clone());
        Ok(v)
    }

    /// Get a trait tree by spec ID.
    pub async fn get_trait_tree(&self, spec_id: i32) -> Result<TraitTreeFlat, SupabaseError> {
        if let Some(v) = self.traits.get(&spec_id) {
            return Ok(v);
        }

        if let Some(v) = self.read_disk::<TraitTreeFlat>("traits", spec_id) {
            self.traits.insert(spec_id, v.clone());
            return Ok(v);
        }

        let v = self.client.get_trait_tree(spec_id).await?;
        self.write_disk("traits", spec_id, &v)?;
        self.traits.insert(spec_id, v.clone());
        Ok(v)
    }

    /// Get an item by ID.
    pub async fn get_item(&self, id: i32) -> Result<ItemDataFlat, SupabaseError> {
        if let Some(v) = self.items.get(&id) {
            return Ok(v);
        }

        if let Some(v) = self.read_disk::<ItemDataFlat>("items", id) {
            self.items.insert(id, v.clone());
            return Ok(v);
        }

        let v = self.client.get_item(id, None).await?;
        self.write_disk("items", id, &v)?;
        self.items.insert(id, v.clone());
        Ok(v)
    }

    /// Get an aura by spell ID.
    pub async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, SupabaseError> {
        if let Some(v) = self.auras.get(&spell_id) {
            return Ok(v);
        }

        if let Some(v) = self.read_disk::<AuraDataFlat>("auras", spell_id) {
            self.auras.insert(spell_id, v.clone());
            return Ok(v);
        }

        let v = self.client.get_aura(spell_id).await?;
        self.write_disk("auras", spell_id, &v)?;
        self.auras.insert(spell_id, v.clone());
        Ok(v)
    }

    /// Get the underlying client for uncached operations.
    pub fn client(&self) -> &SupabaseClient {
        &self.client
    }

    /// Get cache statistics.
    pub fn stats(&self) -> CacheStats {
        CacheStats {
            memory: MemoryStats {
                spells: self.spells.entry_count(),
                traits: self.traits.entry_count(),
                items: self.items.entry_count(),
                auras: self.auras.entry_count(),
            },
            disk: DiskStats {
                spells: self.count_disk_entries("spells"),
                traits: self.count_disk_entries("traits"),
                items: self.count_disk_entries("items"),
                auras: self.count_disk_entries("auras"),
            },
        }
    }

    /// Clear all caches (memory and disk).
    pub fn clear_all(&self) -> Result<(), SupabaseError> {
        self.spells.invalidate_all();
        self.traits.invalidate_all();
        self.items.invalidate_all();
        self.auras.invalidate_all();
        self.clear_disk()?;
        tracing::info!("All caches cleared");
        Ok(())
    }

    /// Invalidate a specific spell.
    pub fn invalidate_spell(&self, id: i32) {
        self.spells.invalidate(&id);
        let _ = self.remove_disk("spells", id);
    }

    /// Invalidate a specific trait tree.
    pub fn invalidate_trait(&self, spec_id: i32) {
        self.traits.invalidate(&spec_id);
        let _ = self.remove_disk("traits", spec_id);
    }

    /// Invalidate a specific item.
    pub fn invalidate_item(&self, id: i32) {
        self.items.invalidate(&id);
        let _ = self.remove_disk("items", id);
    }

    /// Invalidate a specific aura.
    pub fn invalidate_aura(&self, spell_id: i32) {
        self.auras.invalidate(&spell_id);
        let _ = self.remove_disk("auras", spell_id);
    }

    // ========================================================================
    // Disk Layer
    // ========================================================================

    fn read_disk<T: DeserializeOwned>(&self, category: &str, key: i32) -> Option<T> {
        let path = self.disk_path(category, key);
        let file = fs::File::open(&path).ok()?;
        serde_json::from_reader(BufReader::new(file)).ok()
    }

    fn write_disk<T: Serialize>(
        &self,
        category: &str,
        key: i32,
        value: &T,
    ) -> Result<(), SupabaseError> {
        let dir = self.cache_dir.join(category);
        fs::create_dir_all(&dir).map_err(|e| SupabaseError::Io {
            message: format!("Failed to create cache subdir: {}", e),
        })?;

        let path = self.disk_path(category, key);
        let file = fs::File::create(&path).map_err(|e| SupabaseError::Io {
            message: format!("Failed to create cache file: {}", e),
        })?;

        serde_json::to_writer(BufWriter::new(file), value).map_err(|e| SupabaseError::Io {
            message: format!("Failed to write cache: {}", e),
        })
    }

    fn remove_disk(&self, category: &str, key: i32) -> Result<(), SupabaseError> {
        let path = self.disk_path(category, key);
        if path.exists() {
            fs::remove_file(&path).map_err(|e| SupabaseError::Io {
                message: format!("Failed to remove cache file: {}", e),
            })?;
        }
        Ok(())
    }

    fn clear_disk(&self) -> Result<(), SupabaseError> {
        for category in ["spells", "traits", "items", "auras"] {
            let dir = self.cache_dir.join(category);
            if dir.exists() {
                fs::remove_dir_all(&dir).map_err(|e| SupabaseError::Io {
                    message: format!("Failed to clear cache dir: {}", e),
                })?;
            }
        }
        Ok(())
    }

    fn disk_path(&self, category: &str, key: i32) -> PathBuf {
        self.cache_dir.join(category).join(format!("{}.json", key))
    }

    fn count_disk_entries(&self, category: &str) -> usize {
        let dir = self.cache_dir.join(category);
        fs::read_dir(&dir)
            .map(|entries| entries.filter_map(|e| e.ok()).count())
            .unwrap_or(0)
    }

    // ========================================================================
    // Patch Version Tracking
    // ========================================================================

    fn patch_version_path(&self) -> PathBuf {
        self.cache_dir.join("patch_version")
    }

    fn patch_matches(&self) -> bool {
        let path = self.patch_version_path();
        fs::read_to_string(&path)
            .map(|stored| stored.trim() == self.patch)
            .unwrap_or(false)
    }

    fn write_patch_version(&self) -> Result<(), SupabaseError> {
        fs::write(self.patch_version_path(), &self.patch).map_err(|e| SupabaseError::Io {
            message: format!("Failed to write patch version: {}", e),
        })
    }
}
