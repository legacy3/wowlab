//! Node configuration persistence

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Persistent node configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Unique node identifier (set after claiming)
    pub node_id: Option<Uuid>,
    /// User-visible name for this node
    pub name: String,
    /// Maximum parallel simulation workers
    pub max_parallel: u32,
    /// Supabase project URL
    pub supabase_url: String,
    /// Supabase anonymous key
    pub supabase_anon_key: String,
    /// Last known user ID (owner)
    pub user_id: Option<String>,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            node_id: None,
            name: format!("Node-{}", &Uuid::new_v4().to_string()[..8]),
            max_parallel: num_cpus::get().max(1).min(16) as u32,
            // Default to production Supabase instance
            supabase_url: "https://api.wowlab.gg".to_string(),
            supabase_anon_key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbHp6aWZzanNuanJxb3FyZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTUyMTYsImV4cCI6MjA3Nzk3MTIxNn0.I8sbS5AgEzLzD2h5FXcIBZCCchHnbnVn3EufN61WMoM".to_string(),
            user_id: None,
        }
    }
}

impl NodeConfig {
    /// Get the config file path
    fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("gg", "wowlab", "wowlab-node")
            .map(|dirs| dirs.config_dir().join("config.json"))
    }

    /// Load config from disk or create default
    pub fn load_or_create() -> Self {
        if let Some(path) = Self::config_path() {
            if path.exists() {
                if let Ok(contents) = std::fs::read_to_string(&path) {
                    if let Ok(config) = serde_json::from_str(&contents) {
                        tracing::info!("Loaded config from {:?}", path);
                        return config;
                    }
                }
            }
        }

        let config = Self::default();
        config.save();
        config
    }

    /// Save config to disk
    pub fn save(&self) {
        if let Some(path) = Self::config_path() {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }

            match serde_json::to_string_pretty(self) {
                Ok(contents) => {
                    if let Err(e) = std::fs::write(&path, contents) {
                        tracing::error!("Failed to save config: {}", e);
                    } else {
                        tracing::info!("Saved config to {:?}", path);
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to serialize config: {}", e);
                }
            }
        }
    }

    /// Update the node ID after claiming
    pub fn set_node_id(&mut self, id: Uuid) {
        self.node_id = Some(id);
        self.save();
    }

    /// Update the user ID after claiming
    pub fn set_user_id(&mut self, user_id: String) {
        self.user_id = Some(user_id);
        self.save();
    }
}

/// Get number of CPUs available (fallback for systems without num_cpus)
mod num_cpus {
    pub fn get() -> usize {
        std::thread::available_parallelism()
            .map(|p| p.get())
            .unwrap_or(4)
    }
}
