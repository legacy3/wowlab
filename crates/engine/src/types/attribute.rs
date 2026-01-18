use super::DamageSchool;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum Attribute {
    Strength = 0,
    Agility = 1,
    Intellect = 2,
    Stamina = 3,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum RatingType {
    Crit = 0,
    Haste = 1,
    Mastery = 2,
    Versatility = 3,
    Leech = 4,
    Avoidance = 5,
    Speed = 6,
}

impl RatingType {
    pub const COMBAT_COUNT: usize = 4; // crit, haste, mastery, vers
}

/// Derived combat stats (percentage-based, not ratings)
/// These are the final computed values after rating conversion
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum DerivedStat {
    /// Crit chance percentage
    CritChance,
    /// Haste multiplier (1.3 = 30% haste)
    Haste,
    /// Versatility damage bonus
    VersatilityDamage,
    /// Versatility damage reduction
    VersatilityDr,
    /// Mastery effect value
    Mastery,
}

/// How mastery affects damage for a spec
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum MasteryEffect {
    /// Flat damage multiplier to all damage
    AllDamage,
    /// Physical damage only
    PhysicalDamage,
    /// Magic damage only (non-physical)
    MagicDamage,
    /// Pet damage multiplier (BM Hunter)
    PetDamage,
    /// Pet + owner damage (BM Hunter actual)
    PetAndOwnerDamage { owner_pct: f32 },
    /// DoT damage multiplier
    DotDamage,
    /// Execute damage below health threshold
    ExecuteDamage { threshold: f32 },
    /// Specific school multiplier
    SchoolDamage(DamageSchool),
    /// Bonus to specific buff/effect (spec handles)
    Custom,
}
