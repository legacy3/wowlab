//! Local caching for simulation configs and rotation scripts.

use moka::sync::Cache;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct CachedConfig {
    pub config_json: serde_json::Value,
    pub rotation_id: String,
}

#[derive(Debug, Clone)]
pub struct CachedRotation {
    pub script: String,
    pub checksum: String,
}

/// Thread-safe cache for configs and rotations.
pub struct ConfigCache {
    configs: Cache<String, CachedConfig>,
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

    pub fn get_config(&self, hash: &str) -> Option<CachedConfig> {
        self.configs.get(hash)
    }

    pub fn insert_config(&self, hash: String, config: CachedConfig) {
        self.configs.insert(hash, config);
    }

    /// Get rotation if cached and checksum matches.
    pub fn get_rotation(&self, id: &str, expected_checksum: &str) -> Option<String> {
        let cached = self.rotations.get(id)?;
        if cached.checksum == expected_checksum {
            Some(cached.script.clone())
        } else {
            self.rotations.invalidate(id);
            None
        }
    }

    pub fn insert_rotation(&self, id: String, script: String, checksum: String) {
        self.rotations
            .insert(id, CachedRotation { script, checksum });
    }
}
