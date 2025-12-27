use serde::Deserialize;

use super::{AuraDef, ResourceConfig, SpellDef, Stats};
use crate::rotation::RotationAction;

/// Complete simulation configuration (passed from JS)
#[derive(Debug, Clone, Deserialize)]
pub struct SimConfig {
    /// Player configuration
    pub player: PlayerConfig,

    /// Pet configuration (if applicable)
    #[serde(default)]
    pub pet: Option<PetConfig>,

    /// All spells available to the player
    pub spells: Vec<SpellDef>,

    /// All auras that can be applied
    pub auras: Vec<AuraDef>,

    /// Rotation priority list
    pub rotation: Vec<RotationAction>,

    /// Simulation duration in seconds
    pub duration: f32,

    /// Target configuration
    #[serde(default)]
    pub target: TargetConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PlayerConfig {
    pub name: String,
    pub spec: SpecId,
    pub stats: Stats,
    pub resources: ResourceConfig,

    /// Weapon swing speed (0 = no auto-attacks)
    #[serde(default)]
    pub weapon_speed: f32,

    /// Weapon damage range
    #[serde(default)]
    pub weapon_damage: (f32, f32),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SpecId {
    // Hunter
    BeastMastery,
    Marksmanship,
    Survival,
    // Add more as needed
}

#[derive(Debug, Clone, Deserialize)]
pub struct PetConfig {
    pub name: String,
    pub stats: Stats,
    pub spells: Vec<SpellDef>,

    /// Pet melee attack speed
    #[serde(default = "default_pet_attack_speed")]
    pub attack_speed: f32,

    /// Pet melee damage range
    #[serde(default)]
    pub attack_damage: (f32, f32),
}

fn default_pet_attack_speed() -> f32 {
    2.0
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct TargetConfig {
    /// Target level relative to player (0 = same level, 3 = boss)
    #[serde(default)]
    pub level_diff: i8,

    /// Target max health (for execute calculations)
    #[serde(default = "default_target_health")]
    pub max_health: f32,

    /// Armor value
    #[serde(default)]
    pub armor: f32,
}

fn default_target_health() -> f32 {
    10_000_000.0
}
