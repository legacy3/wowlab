//! Simulation configuration structures.

use serde::Deserialize;

use super::{AuraDef, ResourceConfig, SpellDef};
use crate::paperdoll::Paperdoll;

/// Complete simulation configuration.
///
/// Contains all data needed to run a simulation: player, pet, spells, auras, and target.
/// Built programmatically from CLI's SpecConfig (TOML-based) or other sources.
#[derive(Debug, Clone)]
pub struct SimConfig {
    /// Player configuration.
    pub player: PlayerConfig,

    /// Pet configuration (if any).
    pub pet: Option<PetConfig>,

    /// All spells available to the player.
    pub spells: Vec<SpellDef>,

    /// All auras that can be applied.
    pub auras: Vec<AuraDef>,

    /// Simulation duration in seconds.
    pub duration: f32,

    /// Target configuration.
    pub target: TargetConfig,
}

/// Player configuration.
#[derive(Debug, Clone)]
pub struct PlayerConfig {
    /// Character name.
    pub name: String,
    /// Specialization identifier.
    pub spec: SpecId,
    /// Player paperdoll with all stats computed.
    pub paperdoll: Paperdoll,
    /// Resource configuration.
    pub resources: ResourceConfig,

    /// Weapon swing speed in seconds (0 = no auto-attacks).
    pub weapon_speed: f32,

    /// Weapon damage range (min, max).
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
#[derive(Debug, Clone)]
pub struct PetConfig {
    /// Pet name.
    pub name: String,
    /// Pet paperdoll with all stats computed.
    pub paperdoll: Paperdoll,
    /// Pet abilities.
    pub spells: Vec<SpellDef>,

    /// Pet melee attack speed in seconds.
    pub attack_speed: f32,

    /// Pet melee damage range (min, max).
    pub attack_damage: (f32, f32),
}

/// Target/boss configuration.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct TargetConfig {
    /// Level difference from player (0 = same, 3 = boss).
    pub level_diff: i8,

    /// Maximum health for execute calculations.
    pub max_health: f32,

    /// Armor value for physical damage reduction.
    pub armor: f32,
}

impl SimConfig {
    /// Finalize the configuration.
    ///
    /// Currently a no-op since StatConfig doesn't need finalization.
    /// Kept for API compatibility.
    pub fn finalize(&mut self) {
        // StatConfig doesn't need finalization - stats are used directly
    }
}
