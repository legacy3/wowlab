//! Resource configuration.
//!
//! This module contains resource-related types for class resource pools.
//! Player stats are now handled by the Paperdoll system.

use serde::Deserialize;

/// Resource pool configuration (mana, focus, energy, etc.).
#[derive(Debug, Clone, Copy, Default, Deserialize)]
#[serde(default)]
pub struct ResourceConfig {
    /// Type of resource.
    pub resource_type: ResourceType,
    /// Maximum resource value.
    pub max: f32,
    /// Passive regeneration per second.
    pub regen_per_second: f32,
    /// Initial resource value at combat start.
    pub initial: f32,
}

/// Class resource types.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
#[allow(dead_code)] // Variants for future class support
pub enum ResourceType {
    #[default]
    Mana,
    Focus,
    Energy,
    Rage,
    RunicPower,
    Fury,
    Pain,
    Maelstrom,
    Insanity,
    AstralPower,
    HolyPower,
    Chi,
    ComboPoints,
    SoulShards,
    ArcaneCharges,
    Essence,
}
