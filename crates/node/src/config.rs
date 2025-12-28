use config::{Config, File, FileFormat};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fmt::Write;
use std::path::PathBuf;
use uuid::Uuid;

const DEFAULT_API_URL: &str = "https://api.wowlab.gg";
const DEFAULT_ANON_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbHp6aWZzanNuanJxb3FyZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTUyMTYsImV4cCI6MjA3Nzk3MTIxNn0.I8sbS5AgEzLzD2h5FXcIBZCCchHnbnVn3EufN61WMoM";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct ConfigFile {
    #[serde(default)]
    node: NodeConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    #[serde(default)]
    pub node_id: Option<Uuid>,
    #[serde(default = "default_api_url")]
    pub api_url: String,
    #[serde(default = "default_anon_key")]
    pub anon_key: String,
}

fn default_api_url() -> String {
    DEFAULT_API_URL.to_string()
}

fn default_anon_key() -> String {
    DEFAULT_ANON_KEY.to_string()
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            node_id: None,
            api_url: default_api_url(),
            anon_key: default_anon_key(),
        }
    }
}

impl NodeConfig {
    fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("gg", "wowlab", "wowlab-node")
            .map(|dirs| dirs.config_dir().join("config.ini"))
    }

    pub fn load_or_create() -> Self {
        let Some(path) = Self::config_path() else {
            tracing::warn!("Could not determine config directory");
            return Self::default();
        };

        if !path.exists() {
            let config = Self::default();
            config.save();
            return config;
        }

        match Config::builder()
            .add_source(File::new(path.to_str().unwrap_or(""), FileFormat::Ini))
            .build()
        {
            Ok(settings) => match settings.try_deserialize::<ConfigFile>() {
                Ok(file) => {
                    tracing::debug!("Loaded config from {:?}", path);
                    file.node
                }
                Err(e) => {
                    tracing::error!("Invalid config at {:?}: {}. Creating backup.", path, e);
                    let backup = path.with_extension("ini.bak");
                    let _ = std::fs::rename(&path, &backup);
                    let config = Self::default();
                    config.save();
                    config
                }
            },
            Err(e) => {
                tracing::error!("Failed to read config at {:?}: {}", path, e);
                let config = Self::default();
                config.save();
                config
            }
        }
    }

    pub fn save(&self) {
        let Some(path) = Self::config_path() else {
            return;
        };

        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let mut content = String::new();
        content.push_str("[node]\n");

        if let Some(id) = &self.node_id {
            let _ = writeln!(content, "node_id = {id}");
        }

        let _ = writeln!(content, "api_url = {}", self.api_url);
        let _ = writeln!(content, "anon_key = {}", self.anon_key);

        if let Err(e) = std::fs::write(&path, content) {
            tracing::error!("Failed to save config: {}", e);
        }
    }

    pub fn set_node_id(&mut self, id: Uuid) {
        self.node_id = Some(id);
        self.save();
    }
}
