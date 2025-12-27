use serde::Deserialize;

use super::ResourceType;

/// Static spell definition (from game data)
#[derive(Debug, Clone, Deserialize)]
pub struct SpellDef {
    pub id: u32,
    pub name: String,

    // Timing
    pub cooldown: f32,
    pub charges: u8,
    pub gcd: f32,
    pub cast_time: f32,

    // Cost
    #[serde(default)]
    pub cost: ResourceCost,

    // Damage
    #[serde(default)]
    pub damage: DamageFormula,

    // Effects triggered on cast/hit
    #[serde(default)]
    pub effects: Vec<SpellEffect>,

    // Flags
    #[serde(default)]
    pub is_gcd: bool,
    #[serde(default)]
    pub is_harmful: bool,
}

#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct ResourceCost {
    pub resource_type: ResourceType,
    pub amount: f32,
}

#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct DamageFormula {
    pub base_min: f32,
    pub base_max: f32,
    pub ap_coefficient: f32,
    pub sp_coefficient: f32,
    pub weapon_coefficient: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SpellEffect {
    Damage {
        formula: DamageFormula,
    },
    ApplyAura {
        aura_id: u32,
        duration: f32,
    },
    Heal {
        formula: DamageFormula,
    },
    Energize {
        resource_type: ResourceType,
        amount: f32,
    },
    Summon {
        unit_id: u32,
        duration: f32,
    },
    TriggerSpell {
        spell_id: u32,
    },
}
