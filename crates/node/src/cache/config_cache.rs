//! Configuration cache - stores sim configs locally to avoid repeated fetches
#![allow(dead_code)]

use crate::supabase::SupabaseClient;
use directories::ProjectDirs;
use lru::LruCache;
use std::{
    num::NonZeroUsize,
    path::PathBuf,
    sync::{Arc, Mutex},
};

/// Cache for simulation configurations
/// Uses both memory (LRU) and disk storage for persistence
pub struct ConfigCache {
    memory: Arc<Mutex<LruCache<String, String>>>,
    disk_path: PathBuf,
}

impl ConfigCache {
    /// Create a new config cache
    pub fn new() -> Self {
        let memory = LruCache::new(NonZeroUsize::new(100).unwrap());

        let disk_path = ProjectDirs::from("gg", "wowlab", "wowlab-node")
            .map(|dirs| dirs.cache_dir().join("configs"))
            .unwrap_or_else(|| PathBuf::from(".wowlab-cache/configs"));

        // Ensure cache directory exists
        if let Err(e) = std::fs::create_dir_all(&disk_path) {
            tracing::warn!("Failed to create cache directory: {}", e);
        }

        Self {
            memory: Arc::new(Mutex::new(memory)),
            disk_path,
        }
    }

    /// Get a config from cache or fetch from Supabase
    pub async fn get_or_fetch(
        &self,
        hash: &str,
        client: &SupabaseClient,
    ) -> Result<String, CacheError> {
        // Check memory cache
        {
            let mut cache = self.memory.lock().unwrap();
            if let Some(config) = cache.get(hash) {
                tracing::debug!("Config {} found in memory cache", hash);
                return Ok(config.clone());
            }
        }

        // Check disk cache
        let disk_file = self.disk_path.join(hash);
        if disk_file.exists() {
            match std::fs::read_to_string(&disk_file) {
                Ok(config) => {
                    tracing::debug!("Config {} found in disk cache", hash);
                    // Add to memory cache
                    let mut cache = self.memory.lock().unwrap();
                    cache.put(hash.to_string(), config.clone());
                    return Ok(config);
                }
                Err(e) => {
                    tracing::warn!("Failed to read cached config: {}", e);
                    // Continue to fetch from network
                }
            }
        }

        // Fetch from Supabase
        tracing::info!("Fetching config {} from Supabase", hash);
        let config = client.get_config(hash).await?;

        // Store in disk cache
        if let Err(e) = std::fs::write(&disk_file, &config) {
            tracing::warn!("Failed to cache config to disk: {}", e);
        }

        // Store in memory cache
        {
            let mut cache = self.memory.lock().unwrap();
            cache.put(hash.to_string(), config.clone());
        }

        Ok(config)
    }

    /// Verify a config hash matches its content
    pub fn verify_hash(hash: &str, config: &str) -> bool {
        use sha2::{Digest, Sha256};

        let mut hasher = Sha256::new();
        hasher.update(config.as_bytes());
        let computed = format!("{:x}", hasher.finalize());

        computed == hash
    }

    /// Clear all cached configs
    pub fn clear(&self) {
        // Clear memory
        {
            let mut cache = self.memory.lock().unwrap();
            cache.clear();
        }

        // Clear disk
        if let Ok(entries) = std::fs::read_dir(&self.disk_path) {
            for entry in entries.flatten() {
                let _ = std::fs::remove_file(entry.path());
            }
        }

        tracing::info!("Config cache cleared");
    }

    /// Get cache statistics
    pub fn stats(&self) -> CacheStats {
        let memory_count = self.memory.lock().unwrap().len();
        let disk_count = std::fs::read_dir(&self.disk_path)
            .map(|entries| entries.count())
            .unwrap_or(0);

        CacheStats {
            memory_count,
            disk_count,
        }
    }
}

impl Default for ConfigCache {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
pub struct CacheStats {
    pub memory_count: usize,
    pub disk_count: usize,
}

#[derive(Debug, thiserror::Error)]
pub enum CacheError {
    #[error("Network error: {0}")]
    Network(#[from] crate::supabase::SupabaseError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
