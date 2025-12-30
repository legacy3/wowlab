//! Player stats and resource configuration.

use serde::Deserialize;

/// Player primary and secondary stats.
///
/// Stats are loaded from configuration and then [`finalize`](Stats::finalize) should be called
/// to pre-compute derived values for efficient hot-path access.
#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct Stats {
    // Primary
    pub intellect: f32,
    pub agility: f32,
    pub strength: f32,
    pub stamina: f32,

    // Secondary (as rating, converted to %)
    pub crit_rating: f32,
    pub haste_rating: f32,
    pub mastery_rating: f32,
    pub versatility_rating: f32,

    // Derived (calculated from ratings)
    #[serde(default)]
    pub crit_pct: f32,
    #[serde(default)]
    pub haste_pct: f32,
    #[serde(default)]
    pub mastery_pct: f32,
    #[serde(default)]
    pub versatility_pct: f32,

    // Precomputed for hot path (call finalize() after loading)
    #[serde(skip)]
    pub attack_power: f32,
    #[serde(skip)]
    pub ap_normalized: f32, // attack_power / 14.0 for melee normalization
    #[serde(skip)]
    pub crit_chance: f32, // crit_pct * 0.01
    #[serde(skip)]
    pub vers_mult: f32, // 1.0 + vers_pct * 0.01
    #[serde(skip)]
    pub haste_mult: f32, // 1.0 + haste_pct * 0.01
}

impl Stats {
    /// Pre-compute derived values for hot-path access.
    ///
    /// Call this after loading or modifying stats.
    #[inline]
    pub fn finalize(&mut self) {
        self.attack_power = self.agility + self.strength;
        self.ap_normalized = self.attack_power / 14.0;
        self.crit_chance = self.crit_pct * 0.01;
        self.vers_mult = 1.0 + self.versatility_pct * 0.01;
        self.haste_mult = 1.0 + self.haste_pct * 0.01;
    }

    /// Returns the effective spell power.
    #[inline]
    #[must_use]
    pub fn spell_power(&self) -> f32 {
        self.intellect
    }

    /// Returns the GCD modified by haste (minimum 0.75s).
    #[inline]
    #[must_use]
    pub fn gcd(&self, base_gcd: f32) -> f32 {
        (base_gcd / self.haste_mult).max(0.75)
    }

    /// Returns the cast time modified by haste.
    #[inline]
    #[must_use]
    pub fn cast_time(&self, base_cast_time: f32) -> f32 {
        base_cast_time / self.haste_mult
    }
}

/// Resource pool configuration (mana, focus, energy, etc.).
#[derive(Debug, Clone, Copy, Default, Deserialize)]
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
