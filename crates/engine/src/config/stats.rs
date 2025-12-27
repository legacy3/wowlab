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
}

impl Stats {
    /// Calculate attack power (for physical specs)
    pub fn attack_power(&self) -> f32 {
        self.agility + self.strength
    }

    /// Calculate spell power
    pub fn spell_power(&self) -> f32 {
        self.intellect
    }

    /// GCD modified by haste (minimum 0.75s)
    pub fn gcd(&self, base_gcd: f32) -> f32 {
        (base_gcd / (1.0 + self.haste_pct / 100.0)).max(0.75)
    }

    /// Cast time modified by haste
    pub fn cast_time(&self, base_cast_time: f32) -> f32 {
        base_cast_time / (1.0 + self.haste_pct / 100.0)
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
