//! Simulation runner using the engine crate.

use serde::Deserialize;
use std::sync::Arc;
use wowlab_common::types::{ChunkResult, SpecId};
use wowlab_engine::actor::Player;
use wowlab_engine::handler::SpecHandler;
use wowlab_engine::sim::{BatchResults, BatchRunner, SimConfig};
use wowlab_engine::specs::hunter::bm::{BmHunter, TalentFlags, TierSetFlags};
use wowlab_engine::specs::hunter::mm::MmHunter;

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct SimRequest {
    player: PlayerConfig,
    duration: f32,
    target: TargetConfig,
    #[serde(default)]
    rotation: String,
    #[serde(default)]
    spells: Vec<serde_json::Value>,
    #[serde(default)]
    auras: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
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

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct ResourceConfig {
    resource_type: String,
    max: f32,
    regen_per_second: f32,
    #[serde(default)]
    initial: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct TargetConfig {
    #[serde(default)]
    level_diff: i32,
    max_health: f32,
    #[serde(default)]
    armor: f32,
}

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
    pub fn run(
        config_json: &str,
        iterations: u32,
        base_seed: u64,
    ) -> Result<serde_json::Value, SimError> {
        let request: SimRequest =
            serde_json::from_str(config_json).map_err(|e| SimError::Config(e.to_string()))?;

        let spec_id = parse_spec(&request.player.spec)?;
        let mut player = create_player(spec_id, &request.player)?;

        // Use rotation if valid JSON, otherwise default empty
        let rotation_json =
            if request.rotation.is_empty() || !request.rotation.trim().starts_with('{') {
                r#"{"name": "default", "actions": []}"#.to_string()
            } else {
                request.rotation.clone()
            };

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

        handler.init_player(&mut player);

        let config = SimConfig::default()
            .with_duration(request.duration)
            .with_seed(base_seed);

        let results = run_batch(handler, config, player, iterations);

        tracing::debug!(
            "Completed {} iterations: mean DPS = {:.0} (±{:.0})",
            results.iterations,
            results.mean_dps,
            results.std_dev
        );

        let chunk_result = to_chunk_result(results);
        serde_json::to_value(chunk_result).map_err(|e| SimError::Serialization(e.to_string()))
    }
}

fn parse_spec(spec: &str) -> Result<SpecId, SimError> {
    match spec.to_lowercase().as_str() {
        "beast_mastery" | "beastmastery" | "bm" | "bm_hunter" => Ok(SpecId::BeastMastery),
        "marksmanship" | "mm" | "mm_hunter" => Ok(SpecId::Marksmanship),
        "survival" | "sv" | "sv_hunter" => Ok(SpecId::Survival),
        _ => Err(SimError::Config(format!("Unknown spec: {}", spec))),
    }
}

fn create_player(spec_id: SpecId, config: &PlayerConfig) -> Result<Player, SimError> {
    let mut player = Player::new(spec_id);

    player.stats.primary.strength = config.stats.strength;
    player.stats.primary.agility = config.stats.agility;
    player.stats.primary.intellect = config.stats.intellect;
    player.stats.primary.stamina = config.stats.stamina;

    player.stats.ratings.crit = config.stats.crit_rating;
    player.stats.ratings.haste = config.stats.haste_rating;
    player.stats.ratings.mastery = config.stats.mastery_rating;
    player.stats.ratings.versatility = config.stats.versatility_rating;

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

    player.stats.invalidate();
    player.stats.update(1.0); // Default mastery coefficient

    Ok(player)
}

fn run_batch(
    handler: Arc<dyn wowlab_engine::handler::SpecHandler>,
    config: SimConfig,
    player_template: Player,
    iterations: u32,
) -> BatchResults {
    BatchRunner::with_handler(handler, config, player_template)
        .with_iterations(iterations)
        .run()
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
