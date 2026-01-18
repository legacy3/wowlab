//! Local caching for simulation configs and rotation scripts.
//!
//! Configs are cached by hash (immutable, never change).
//! Rotations are cached by ID + checksum (refetch if checksum changes).

use moka::sync::Cache;
use std::time::Duration;

/// Cached simulation config (from jobs_configs table).
#[derive(Debug, Clone)]
pub struct CachedConfig {
    /// The full config JSON including rotationId.
    pub config_json: serde_json::Value,
    /// Extracted rotationId for fetching the script.
    pub rotation_id: String,
}

/// Cached rotation script (from rotations table).
#[derive(Debug, Clone)]
pub struct CachedRotation {
    pub script: String,
    pub checksum: String,
}

/// Thread-safe cache for configs and rotations using moka.
pub struct ConfigCache {
    /// Config hash -> cached config (TTL: 1 hour, max 1000 entries).
    configs: Cache<String, CachedConfig>,
    /// Rotation ID -> cached rotation (TTL: 1 hour, max 500 entries).
    rotations: Cache<String, CachedRotation>,
}

impl Default for ConfigCache {
    fn default() -> Self {
        Self::new()
    }
}

impl ConfigCache {
    pub fn new() -> Self {
        Self {
            configs: Cache::builder()
                .max_capacity(1000)
                .time_to_live(Duration::from_secs(3600))
                .build(),
            rotations: Cache::builder()
                .max_capacity(500)
                .time_to_live(Duration::from_secs(3600))
                .build(),
        }
    }

    /// Get a cached config by hash.
    pub fn get_config(&self, hash: &str) -> Option<CachedConfig> {
        self.configs.get(hash)
    }

    /// Insert a config into the cache.
    pub fn insert_config(&self, hash: String, config: CachedConfig) {
        self.configs.insert(hash, config);
    }

    /// Get a cached rotation by ID, but only if checksum matches.
    /// Returns None if not cached or if checksum doesn't match (needs refetch).
    pub fn get_rotation(&self, id: &str, expected_checksum: &str) -> Option<String> {
        let cached = self.rotations.get(id)?;
        if cached.checksum == expected_checksum {
            Some(cached.script.clone())
        } else {
            // Checksum mismatch, invalidate and need refetch
            self.rotations.invalidate(id);
            None
        }
    }

    /// Insert a rotation into the cache.
    pub fn insert_rotation(&self, id: String, script: String, checksum: String) {
        self.rotations
            .insert(id, CachedRotation { script, checksum });
    }

    /// Clear all caches. Useful for debugging or resetting.
    #[allow(dead_code)]
    pub fn clear(&self) {
        self.configs.invalidate_all();
        self.rotations.invalidate_all();
    }

    /// Get cache stats for debugging.
    #[allow(dead_code)]
    pub fn stats(&self) -> (u64, u64) {
        (self.configs.entry_count(), self.rotations.entry_count())
    }
}
