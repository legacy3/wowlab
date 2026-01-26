//! Simulation runner that integrates with the engine crate.

use wowlab_engine::actor::Player;
use wowlab_engine::handler::SpecHandler;
use wowlab_engine::sim::{BatchResults, SimConfig, Simulation};
use wowlab_engine::specs::hunter::bm::{BmHunter, TalentFlags, TierSetFlags};
use wowlab_engine::specs::hunter::mm::MmHunter;
use wowlab_common::types::{ChunkResult, SpecId};
use serde::Deserialize;
use std::sync::Arc;

/// JSON request format for distributed simulation.
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)] // Fields exist for JSON deserialization compatibility
struct SimRequest {
    /// Player configuration
    player: PlayerConfig,

    /// Fight duration in seconds
    duration: f32,

    /// Target configuration
    target: TargetConfig,

    /// Rotation JSON with name and actions.
    #[serde(default)]
    rotation: String,

    /// Reserved for future use.
    #[serde(default)]
    spells: Vec<serde_json::Value>,

    /// Reserved for future use.
    #[serde(default)]
    auras: Vec<serde_json::Value>,
}

/// Player configuration from JSON.
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)] // Fields exist for JSON deserialization compatibility
struct PlayerConfig {
    #[serde(default)]
    name: String,
    spec: String,
    stats: StatsConfig,
    #[serde(default)]
    resources: Option<ResourceConfig>,
    #[serde(default)]
    weapon_speed: f32,
    #[serde(default)]
    weapon_damage: [f32; 2],
}

/// Stats configuration from JSON.
#[derive(Debug, Clone, Deserialize, Default)]
struct StatsConfig {
    strength: f32,
    agility: f32,
    intellect: f32,
    #[serde(default)]
    stamina: f32,
    #[serde(default)]
    crit_rating: f32,
    #[serde(default)]
    haste_rating: f32,
    #[serde(default)]
    mastery_rating: f32,
    #[serde(default)]
    versatility_rating: f32,
    #[serde(default)]
    crit_pct: Option<f32>,
    #[serde(default)]
    haste_pct: Option<f32>,
    #[serde(default)]
    mastery_pct: Option<f32>,
    #[serde(default)]
    versatility_pct: Option<f32>,
}

/// Resource configuration from JSON.
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct ResourceConfig {
    resource_type: String,
    max: f32,
    regen_per_second: f32,
    #[serde(default)]
    initial: f32,
}

/// Target configuration from JSON.
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct TargetConfig {
    #[serde(default)]
    level_diff: i32,
    max_health: f32,
    #[serde(default)]
    armor: f32,
}

/// Convert BatchResults to ChunkResult
fn to_chunk_result(result: BatchResults) -> ChunkResult {
    ChunkResult {
        iterations: result.iterations,
        mean_dps: result.mean_dps,
        std_dps: result.std_dev,
        min_dps: result.min_dps,
        max_dps: result.max_dps,
    }
}

pub struct SimRunner;

impl SimRunner {
    /// Run a batch simulation using the engine.
    ///
    /// # Arguments
    /// * `config_json` - JSON string containing SimRequest
    /// * `iterations` - Number of simulation iterations to run
    /// * `base_seed` - Base seed for RNG (offset by chunk for distribution)
    ///
    /// # Returns
    /// JSON value containing simulation results
    pub fn run(
        config_json: &str,
        iterations: u32,
        base_seed: u64,
    ) -> Result<serde_json::Value, SimError> {
        // Parse the request
        let request: SimRequest =
            serde_json::from_str(config_json).map_err(|e| SimError::Config(e.to_string()))?;

        // Parse spec
        let spec_id = parse_spec(&request.player.spec)?;

        // Create player with stats
        let mut player = create_player(spec_id, &request.player)?;

        // Get rotation JSON - use provided if it looks like JSON, otherwise use empty default.
        // This handles backwards compatibility with old Rhai script format.
        let rotation_json =
            if request.rotation.is_empty() || !request.rotation.trim().starts_with('{') {
                r#"{"name": "default", "actions": []}"#.to_string()
            } else {
                request.rotation.clone()
            };

        // Create spec handler with rotation
        let handler: Arc<dyn SpecHandler> = match spec_id {
            SpecId::BeastMastery => {
                let h = BmHunter::new(&rotation_json, TalentFlags::empty(), TierSetFlags::NONE)
                    .map_err(|e| SimError::Engine(format!("Failed to create BM handler: {}", e)))?;
                Arc::new(h)
            }
            SpecId::Marksmanship => {
                let h = MmHunter::new(&rotation_json)
                    .map_err(|e| SimError::Engine(format!("Failed to create MM handler: {}", e)))?;
                Arc::new(h)
            }
            _ => {
                return Err(SimError::Engine(format!(
                    "Spec {:?} not implemented",
                    spec_id
                )))
            }
        };

        // Initialize spec-specific abilities
        handler.init_player(&mut player);

        // Create sim config
        let config = SimConfig::default()
            .with_duration(request.duration)
            .with_seed(base_seed);

        // Run batch simulation
        let results = run_batch(handler, config, player, iterations);

        tracing::debug!(
            "Completed {} iterations: mean DPS = {:.0} (±{:.0})",
            results.iterations,
            results.mean_dps,
            results.std_dev
        );

        // Convert to chunk result format
        let chunk_result = to_chunk_result(results);
        serde_json::to_value(chunk_result).map_err(|e| SimError::Serialization(e.to_string()))
    }
}

/// Parse spec string to SpecId
fn parse_spec(spec: &str) -> Result<SpecId, SimError> {
    match spec.to_lowercase().as_str() {
        "beast_mastery" | "beastmastery" | "bm" | "bm_hunter" => Ok(SpecId::BeastMastery),
        "marksmanship" | "mm" | "mm_hunter" => Ok(SpecId::Marksmanship),
        "survival" | "sv" | "sv_hunter" => Ok(SpecId::Survival),
        _ => Err(SimError::Config(format!("Unknown spec: {}", spec))),
    }
}

/// Create a player from config
fn create_player(spec_id: SpecId, config: &PlayerConfig) -> Result<Player, SimError> {
    let mut player = Player::new(spec_id);

    // Set primary stats
    player.stats.primary.strength = config.stats.strength;
    player.stats.primary.agility = config.stats.agility;
    player.stats.primary.intellect = config.stats.intellect;
    player.stats.primary.stamina = config.stats.stamina;

    // Set rating stats
    player.stats.ratings.crit = config.stats.crit_rating;
    player.stats.ratings.haste = config.stats.haste_rating;
    player.stats.ratings.mastery = config.stats.mastery_rating;
    player.stats.ratings.versatility = config.stats.versatility_rating;

    // If percent stats are provided, use them directly in combat stats
    // (This is a simplification - in production, you'd convert properly)
    if let Some(crit) = config.stats.crit_pct {
        player.stats.combat.crit_chance = crit / 100.0;
    }
    if let Some(haste) = config.stats.haste_pct {
        player.stats.combat.haste = 1.0 + haste / 100.0;
    }
    if let Some(mastery) = config.stats.mastery_pct {
        player.stats.combat.mastery = mastery;
    }
    if let Some(vers) = config.stats.versatility_pct {
        player.stats.combat.versatility_damage = vers / 100.0;
    }

    // Recalculate combat stats from primary/ratings
    player.stats.invalidate();
    player.stats.update(1.0); // Default mastery coefficient

    Ok(player)
}

/// Run batch simulation with proper spec initialization per iteration
fn run_batch(
    handler: Arc<dyn wowlab_engine::handler::SpecHandler>,
    config: SimConfig,
    player_template: Player,
    iterations: u32,
) -> BatchResults {
    let mut dps_values = Vec::with_capacity(iterations as usize);

    for i in 0..iterations {
        let mut iter_config = config.clone();
        iter_config.seed = config.seed.wrapping_add(i as u64);

        let mut sim = Simulation::new(Arc::clone(&handler), iter_config, player_template.clone());
        sim.run();
        dps_values.push(sim.dps());
    }

    BatchResults::from_values(dps_values)
}

#[derive(Debug, thiserror::Error)]
pub enum SimError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Engine error: {0}")]
    Engine(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}
