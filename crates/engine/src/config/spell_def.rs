//! Spell definitions and effects.

use serde::Deserialize;

use super::ResourceType;

/// Static spell definition loaded from game data.
///
/// Contains all the immutable data about a spell: timing, cost, damage formula, and effects.
#[derive(Debug, Clone, Deserialize)]
pub struct SpellDef {
    /// Unique spell identifier.
    pub id: u32,
    /// Spell name for display and rotation script matching.
    pub name: String,

    /// Base cooldown in seconds.
    pub cooldown: f32,
    /// Maximum charges (0 for non-charge spells).
    pub charges: u8,
    /// GCD duration in seconds (0 for off-GCD).
    pub gcd: f32,
    /// Cast time in seconds (0 for instant).
    pub cast_time: f32,

    /// Resource cost.
    #[serde(default)]
    pub cost: ResourceCost,

    /// Direct damage formula.
    #[serde(default)]
    pub damage: DamageFormula,

    /// Effects triggered on cast (aura application, energize, etc.).
    #[serde(default)]
    pub effects: Vec<SpellEffect>,

    /// Whether this spell triggers GCD.
    #[serde(default)]
    pub is_gcd: bool,
    /// Whether this spell is harmful (for targeting).
    #[serde(default)]
    pub is_harmful: bool,
}

/// Resource cost for casting a spell.
#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct ResourceCost {
    /// Which resource this spell consumes.
    pub resource_type: ResourceType,
    /// Amount of resource consumed.
    pub amount: f32,
}

/// Formula for calculating damage or healing.
#[derive(Debug, Clone, Copy, Default, Deserialize)]
pub struct DamageFormula {
    /// Minimum base damage.
    pub base_min: f32,
    /// Maximum base damage.
    pub base_max: f32,
    /// Attack power scaling coefficient.
    pub ap_coefficient: f32,
    /// Spell power scaling coefficient.
    pub sp_coefficient: f32,
    /// Weapon damage coefficient.
    pub weapon_coefficient: f32,
}

/// Effects triggered when a spell is cast.
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SpellEffect {
    /// Deal additional damage.
    Damage { formula: DamageFormula },
    /// Apply an aura/buff/debuff.
    ApplyAura { aura_id: u32, duration: f32 },
    /// Heal the target.
    Heal { formula: DamageFormula },
    /// Grant resources.
    Energize { resource_type: ResourceType, amount: f32 },
    /// Summon a unit (pet, totem, etc.).
    Summon { unit_id: u32, duration: f32 },
    /// Trigger another spell.
    TriggerSpell { spell_id: u32 },
}
