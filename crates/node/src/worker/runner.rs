//! Simulation runner that integrates with the engine crate.

use engine::sim::{BatchResults, SimConfig, SimState, Simulation};
use engine::types::SpecId;
use engine::actor::Player;
use engine::specs::BmHunter;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// JSON request format for distributed simulation.
#[derive(Debug, Clone, Deserialize)]
pub struct SimRequest {
    /// Player configuration
    pub player: PlayerConfig,

    /// Fight duration in seconds
    pub duration: f32,

    /// Target configuration
    pub target: TargetConfig,

    /// Rotation script (Rhai code) - currently ignored until rotation system is integrated
    #[serde(default)]
    pub rotation: String,

    /// Spells - currently ignored (using spec handler definitions)
    #[serde(default)]
    pub spells: Vec<serde_json::Value>,

    /// Auras - currently ignored (using spec handler definitions)
    #[serde(default)]
    pub auras: Vec<serde_json::Value>,
}

/// Player configuration from JSON
#[derive(Debug, Clone, Deserialize)]
pub struct PlayerConfig {
    /// Player name
    #[serde(default)]
    pub name: String,

    /// Spec identifier (e.g., "beast_mastery")
    pub spec: String,

    /// Player stats
    pub stats: StatsConfig,

    /// Resource configuration
    #[serde(default)]
    pub resources: Option<ResourceConfig>,

    /// Weapon speed
    #[serde(default)]
    pub weapon_speed: f32,

    /// Weapon damage range [min, max]
    #[serde(default)]
    pub weapon_damage: [f32; 2],
}

/// Stats configuration from JSON
#[derive(Debug, Clone, Deserialize, Default)]
pub struct StatsConfig {
    pub strength: f32,
    pub agility: f32,
    pub intellect: f32,
    #[serde(default)]
    pub stamina: f32,

    // Rating-based stats
    #[serde(default)]
    pub crit_rating: f32,
    #[serde(default)]
    pub haste_rating: f32,
    #[serde(default)]
    pub mastery_rating: f32,
    #[serde(default)]
    pub versatility_rating: f32,

    // Percent-based stats (for direct setting)
    #[serde(default)]
    pub crit_pct: Option<f32>,
    #[serde(default)]
    pub haste_pct: Option<f32>,
    #[serde(default)]
    pub mastery_pct: Option<f32>,
    #[serde(default)]
    pub versatility_pct: Option<f32>,
}

/// Resource configuration from JSON
#[derive(Debug, Clone, Deserialize)]
pub struct ResourceConfig {
    pub resource_type: String,
    pub max: f32,
    pub regen_per_second: f32,
    #[serde(default)]
    pub initial: f32,
}

/// Target configuration from JSON
#[derive(Debug, Clone, Deserialize)]
pub struct TargetConfig {
    #[serde(default)]
    pub level_diff: i32,
    pub max_health: f32,
    #[serde(default)]
    pub armor: f32,
}

/// Result format returned by the simulation runner.
#[derive(Debug, Clone, Serialize)]
pub struct SimResponse {
    pub iterations: u32,
    pub mean_dps: f64,
    pub std_dps: f64,
    pub min_dps: f64,
    pub max_dps: f64,
    pub total_casts: u64,
}

impl From<BatchResults> for SimResponse {
    fn from(result: BatchResults) -> Self {
        Self {
            iterations: result.iterations,
            mean_dps: result.mean_dps,
            std_dps: result.std_dev,
            min_dps: result.min_dps,
            max_dps: result.max_dps,
            total_casts: 0, // Not tracked in new engine yet
        }
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

        // Get spec handler
        let handler: Arc<dyn engine::handler::SpecHandler> = match spec_id {
            SpecId::BeastMastery => Arc::new(BmHunter::new()),
            _ => return Err(SimError::Engine(format!("Spec {:?} not implemented", spec_id))),
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

        // Convert to response format
        let response = SimResponse::from(results);
        serde_json::to_value(response).map_err(|e| SimError::Serialization(e.to_string()))
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
    handler: Arc<dyn engine::handler::SpecHandler>,
    config: SimConfig,
    player_template: Player,
    iterations: u32,
) -> BatchResults {
    let mut dps_values = Vec::with_capacity(iterations as usize);

    for i in 0..iterations {
        let mut iter_config = config.clone();
        iter_config.seed = config.seed.wrapping_add(i as u64);

        let mut sim = Simulation::new(
            Arc::clone(&handler),
            iter_config,
            player_template.clone(),
        );
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
