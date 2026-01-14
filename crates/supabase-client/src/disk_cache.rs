//! Persistent disk cache keyed by patch version
//!
//! Data is stored as JSON files in a configurable directory.
//! Cache is invalidated when the patch version changes.

use serde::{de::DeserializeOwned, Serialize};
use std::fs;
use std::io::{self, BufReader, BufWriter};
use std::path::{Path, PathBuf};

/// Disk cache configuration
#[derive(Clone)]
pub struct DiskCacheConfig {
    /// Directory to store cache files
    pub cache_dir: PathBuf,
    /// Current patch version (cache invalidates on change)
    pub patch_version: String,
}

impl DiskCacheConfig {
    /// Create a new config with the given cache directory and patch version
    pub fn new(cache_dir: impl Into<PathBuf>, patch_version: impl Into<String>) -> Self {
        Self {
            cache_dir: cache_dir.into(),
            patch_version: patch_version.into(),
        }
    }
}

/// Persistent disk cache for game data
pub struct DiskCache {
    config: DiskCacheConfig,
}

impl DiskCache {
    /// Create a new disk cache, ensuring the directory exists
    pub fn new(config: DiskCacheConfig) -> io::Result<Self> {
        fs::create_dir_all(&config.cache_dir)?;

        let cache = Self { config };

        // Check patch version and clear if mismatched
        if !cache.patch_matches()? {
            tracing::info!(
                "Patch version changed to {}, clearing disk cache",
                cache.config.patch_version
            );
            cache.clear()?;
            cache.write_patch_version()?;
        }

        Ok(cache)
    }

    /// Get a cached value by key
    pub fn get<T: DeserializeOwned>(&self, cache_name: &str, key: i32) -> Option<T> {
        let path = self.entry_path(cache_name, key);
        self.read_json(&path).ok()
    }

    /// Store a value in the cache
    pub fn set<T: Serialize>(&self, cache_name: &str, key: i32, value: &T) -> io::Result<()> {
        let dir = self.cache_dir(cache_name);
        fs::create_dir_all(&dir)?;

        let path = self.entry_path(cache_name, key);
        self.write_json(&path, value)
    }

    /// Check if an entry exists
    pub fn contains(&self, cache_name: &str, key: i32) -> bool {
        self.entry_path(cache_name, key).exists()
    }

    /// Remove a specific entry
    pub fn remove(&self, cache_name: &str, key: i32) -> io::Result<()> {
        let path = self.entry_path(cache_name, key);
        if path.exists() {
            fs::remove_file(path)?;
        }
        Ok(())
    }

    /// Clear all cached data
    pub fn clear(&self) -> io::Result<()> {
        if self.config.cache_dir.exists() {
            for entry in fs::read_dir(&self.config.cache_dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_dir() {
                    fs::remove_dir_all(path)?;
                } else if path.file_name().map(|n| n != "patch_version").unwrap_or(true) {
                    fs::remove_file(path)?;
                }
            }
        }
        Ok(())
    }

    /// Get cache statistics
    pub fn stats(&self) -> CacheStats {
        let mut stats = CacheStats::default();

        for name in ["spells", "talents", "items", "auras"] {
            let dir = self.cache_dir(name);
            if let Ok(entries) = fs::read_dir(&dir) {
                let count = entries.filter_map(|e| e.ok()).count();
                match name {
                    "spells" => stats.spells = count,
                    "talents" => stats.talents = count,
                    "items" => stats.items = count,
                    "auras" => stats.auras = count,
                    _ => {}
                }
            }
        }

        stats
    }

    // Internal helpers

    fn cache_dir(&self, name: &str) -> PathBuf {
        self.config.cache_dir.join(name)
    }

    fn entry_path(&self, cache_name: &str, key: i32) -> PathBuf {
        self.cache_dir(cache_name).join(format!("{}.json", key))
    }

    fn patch_version_path(&self) -> PathBuf {
        self.config.cache_dir.join("patch_version")
    }

    fn patch_matches(&self) -> io::Result<bool> {
        let path = self.patch_version_path();
        if !path.exists() {
            return Ok(false);
        }

        let stored = fs::read_to_string(&path)?;
        Ok(stored.trim() == self.config.patch_version)
    }

    fn write_patch_version(&self) -> io::Result<()> {
        fs::write(self.patch_version_path(), &self.config.patch_version)
    }

    fn read_json<T: DeserializeOwned>(&self, path: &Path) -> io::Result<T> {
        let file = fs::File::open(path)?;
        let reader = BufReader::new(file);
        serde_json::from_reader(reader).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    }

    fn write_json<T: Serialize>(&self, path: &Path, value: &T) -> io::Result<()> {
        let file = fs::File::create(path)?;
        let writer = BufWriter::new(file);
        serde_json::to_writer(writer, value)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    }
}

/// Cache statistics
#[derive(Debug, Default)]
pub struct CacheStats {
    pub spells: usize,
    pub talents: usize,
    pub items: usize,
    pub auras: usize,
}

impl CacheStats {
    pub fn total(&self) -> usize {
        self.spells + self.talents + self.items + self.auras
    }
}
