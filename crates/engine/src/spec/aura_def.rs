use bon::Builder;

use crate::aura::{AuraFlags, PeriodicEffect};
use serde::{Deserialize, Serialize};
use wowlab_common::types::{
    Attribute, AuraIdx, DamageSchool, DerivedStat, RatingType, SimTime, SpellIdx,
};

/// Type of aura effect
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum AuraEffect {
    /// Flat primary stat increase (str/agi/int/sta)
    AttributeFlat { attr: Attribute, amount: f32 },
    /// Percentage primary stat increase
    AttributePercent { attr: Attribute, amount: f32 },
    /// Flat rating increase (crit/haste/mastery/vers)
    RatingFlat { rating: RatingType, amount: f32 },
    /// Percentage increase to a derived stat (crit chance, haste mult, etc.)
    DerivedPercent { stat: DerivedStat, amount: f32 },
    /// Damage multiplier
    DamageMultiplier {
        amount: f32,
        school: Option<DamageSchool>,
    },
    /// Periodic damage
    PeriodicDamage(PeriodicEffect),
    /// Resource regen modifier
    ResourceRegen {
        resource: wowlab_common::types::ResourceType,
        amount: f32,
    },
    /// Cooldown reduction
    CooldownReduction { spell: SpellIdx, amount: f32 },
    /// Proc chance modifier
    ProcChance {
        proc: wowlab_common::types::ProcIdx,
        amount: f32,
    },
    /// Custom effect (handled by spec)
    Custom { id: u32 },
}

/// Aura definition
#[derive(Clone, Debug, Builder, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[builder(on(String, into))]
pub struct AuraDef {
    /// Unique aura ID
    pub id: AuraIdx,
    /// Display name
    pub name: String,
    /// Base duration
    pub duration: SimTime,
    /// Max stacks
    #[builder(default = 1)]
    pub max_stacks: u8,
    /// Behavior flags
    #[builder(default)]
    pub flags: AuraFlags,
    /// Effects while active
    #[builder(default)]
    pub effects: Vec<AuraEffect>,
    /// Periodic effect (for DoTs/HoTs)
    pub periodic: Option<PeriodicEffect>,
    /// Spell that applies this aura
    pub applied_by: Option<SpellIdx>,
}
