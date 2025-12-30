//! Simulation configuration structures.

use serde::Deserialize;

use super::{AuraDef, ResourceConfig, SpellDef, Stats};

/// Complete simulation configuration.
///
/// Contains all data needed to run a simulation: player, pet, spells, auras, and target.
#[derive(Debug, Clone, Deserialize)]
pub struct SimConfig {
    /// Player configuration.
    pub player: PlayerConfig,

    /// Pet configuration (if any).
    #[serde(default)]
    pub pet: Option<PetConfig>,

    /// All spells available to the player.
    pub spells: Vec<SpellDef>,

    /// All auras that can be applied.
    pub auras: Vec<AuraDef>,

    /// Simulation duration in seconds.
    pub duration: f32,

    /// Target configuration.
    #[serde(default)]
    pub target: TargetConfig,
}

/// Player configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct PlayerConfig {
    /// Character name.
    pub name: String,
    /// Specialization identifier.
    pub spec: SpecId,
    /// Player stats.
    pub stats: Stats,
    /// Resource configuration.
    pub resources: ResourceConfig,

    /// Weapon swing speed in seconds (0 = no auto-attacks).
    #[serde(default)]
    pub weapon_speed: f32,

    /// Weapon damage range (min, max).
    #[serde(default)]
    pub weapon_damage: (f32, f32),
}

/// Class specialization identifiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
#[allow(dead_code)] // Variants for future class support
pub enum SpecId {
    // Hunter
    BeastMastery,
    Marksmanship,
    Survival,
}

/// Pet configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct PetConfig {
    /// Pet name.
    pub name: String,
    /// Pet stats.
    pub stats: Stats,
    /// Pet abilities.
    pub spells: Vec<SpellDef>,

    /// Pet melee attack speed in seconds.
    #[serde(default = "default_pet_attack_speed")]
    pub attack_speed: f32,

    /// Pet melee damage range (min, max).
    #[serde(default)]
    pub attack_damage: (f32, f32),
}

fn default_pet_attack_speed() -> f32 {
    2.0
}

/// Target/boss configuration.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct TargetConfig {
    /// Level difference from player (0 = same, 3 = boss).
    #[serde(default)]
    pub level_diff: i8,

    /// Maximum health for execute calculations.
    #[serde(default = "default_target_health")]
    pub max_health: f32,

    /// Armor value for physical damage reduction.
    #[serde(default)]
    pub armor: f32,
}

fn default_target_health() -> f32 {
    10_000_000.0
}

impl SimConfig {
    /// Pre-compute derived stat values.
    ///
    /// Call this after loading configuration.
    pub fn finalize(&mut self) {
        self.player.stats.finalize();
        if let Some(ref mut pet) = self.pet {
            pet.stats.finalize();
        }
    }
}
