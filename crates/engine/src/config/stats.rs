use serde::Deserialize;

/// Player primary and secondary stats
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
    pub crit_chance: f32, // crit_pct * 0.01
    #[serde(skip)]
    pub vers_mult: f32, // 1.0 + vers_pct * 0.01
    #[serde(skip)]
    pub haste_mult: f32, // 1.0 + haste_pct * 0.01
}

impl Stats {
    /// Precompute derived values - call after loading/modifying stats
    #[inline]
    pub fn finalize(&mut self) {
        self.attack_power = self.agility + self.strength;
        self.crit_chance = self.crit_pct * 0.01;
        self.vers_mult = 1.0 + self.versatility_pct * 0.01;
        self.haste_mult = 1.0 + self.haste_pct * 0.01;
    }

    /// Calculate spell power
    #[inline]
    pub fn spell_power(&self) -> f32 {
        self.intellect
    }

    /// GCD modified by haste (minimum 0.75s)
    #[inline]
    pub fn gcd(&self, base_gcd: f32) -> f32 {
        (base_gcd / self.haste_mult).max(0.75)
    }

    /// Cast time modified by haste
    #[inline]
    pub fn cast_time(&self, base_cast_time: f32) -> f32 {
        base_cast_time / self.haste_mult
    }
}

/// Resource configuration
#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct ResourceConfig {
    pub resource_type: ResourceType,
    pub max: f32,
    pub regen_per_second: f32,
    pub initial: f32,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
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
