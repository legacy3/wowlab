//! Node configuration persistence

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Local node configuration
/// Settings like name and maxParallel come from the server via heartbeat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    /// Unique node identifier (set after claiming)
    pub node_id: Option<Uuid>,
    /// API URL (edge functions base URL)
    pub api_url: String,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            node_id: None,
            api_url: "https://api.wowlab.gg".to_string(),
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
}
