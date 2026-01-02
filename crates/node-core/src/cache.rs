//! Local caching for simulation configs and rotation scripts.
//!
//! Configs are cached by hash (immutable, never change).
//! Rotations are cached by ID + checksum (refetch if checksum changes).

use std::collections::HashMap;
use std::sync::RwLock;

/// Cached simulation config (from sim_configs table).
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

/// Thread-safe cache for configs and rotations.
pub struct ConfigCache {
    /// Config hash -> cached config.
    configs: RwLock<HashMap<String, CachedConfig>>,
    /// Rotation ID -> cached rotation.
    rotations: RwLock<HashMap<String, CachedRotation>>,
}

impl Default for ConfigCache {
    fn default() -> Self {
        Self::new()
    }
}

impl ConfigCache {
    pub fn new() -> Self {
        Self {
            configs: RwLock::new(HashMap::new()),
            rotations: RwLock::new(HashMap::new()),
        }
    }

    /// Get a cached config by hash.
    pub fn get_config(&self, hash: &str) -> Option<CachedConfig> {
        self.configs.read().ok()?.get(hash).cloned()
    }

    /// Insert a config into the cache.
    pub fn insert_config(&self, hash: String, config: CachedConfig) {
        if let Ok(mut cache) = self.configs.write() {
            cache.insert(hash, config);
        }
    }

    /// Get a cached rotation by ID, but only if checksum matches.
    /// Returns None if not cached or if checksum doesn't match (needs refetch).
    pub fn get_rotation(&self, id: &str, expected_checksum: &str) -> Option<String> {
        let cache = self.rotations.read().ok()?;
        let cached = cache.get(id)?;
        if cached.checksum == expected_checksum {
            Some(cached.script.clone())
        } else {
            None // Checksum mismatch, need refetch
        }
    }

    /// Insert a rotation into the cache.
    pub fn insert_rotation(&self, id: String, script: String, checksum: String) {
        if let Ok(mut cache) = self.rotations.write() {
            cache.insert(id, CachedRotation { script, checksum });
        }
    }

    /// Clear all caches. Useful for debugging or resetting.
    #[allow(dead_code)]
    pub fn clear(&self) {
        if let Ok(mut cache) = self.configs.write() {
            cache.clear();
        }
        if let Ok(mut cache) = self.rotations.write() {
            cache.clear();
        }
    }

    /// Get cache stats for debugging.
    #[allow(dead_code)]
    pub fn stats(&self) -> (usize, usize) {
        let configs = self.configs.read().map(|c| c.len()).unwrap_or(0);
        let rotations = self.rotations.read().map(|r| r.len()).unwrap_or(0);
        (configs, rotations)
    }
}
