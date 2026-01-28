use super::effect::SpellEffect;
use serde::{Deserialize, Serialize};
use wowlab_common::types::{AuraIdx, DamageSchool, ResourceType, SimTime, SpellIdx};

/// Target type for spells
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum SpellTarget {
    /// Single enemy target
    Enemy,
    /// Self
    Player,
    /// Friendly target
    Friendly,
    /// All enemies in range
    AllEnemies,
    /// Primary target + nearby
    Cleave { max_targets: u8 },
    /// Ground-targeted AoE
    Ground { radius: f32 },
    /// Pet
    Pet,
}

/// GCD behavior
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum GcdType {
    /// Standard GCD (affected by haste)
    Normal,
    /// Fixed GCD (not affected by haste)
    Fixed(u32), // milliseconds
    /// No GCD
    None,
}

/// Cast time behavior
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum CastType {
    /// Instant cast
    Instant,
    /// Cast time (affected by haste)
    Cast(u32), // base milliseconds
    /// Fixed cast time
    FixedCast(u32),
    /// Channeled (affected by haste)
    Channel { duration: u32, ticks: u8 },
}

/// Resource cost definition
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct ResourceCost {
    pub resource: ResourceType,
    pub amount: f32,
    /// Cost is percentage of max
    pub is_percent: bool,
}

impl ResourceCost {
    pub fn new(resource: ResourceType, amount: f32) -> Self {
        Self {
            resource,
            amount,
            is_percent: false,
        }
    }

    pub fn percent(resource: ResourceType, amount: f32) -> Self {
        Self {
            resource,
            amount,
            is_percent: true,
        }
    }
}

/// Damage effect definition
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct DamageEffect {
    pub school: DamageSchool,
    /// Base damage (at level 80)
    pub base_damage: f32,
    /// Spell power coefficient
    pub sp_coefficient: f32,
    /// Attack power coefficient
    pub ap_coefficient: f32,
    /// Weapon damage coefficient (for melee)
    pub weapon_coefficient: f32,
    /// Variance range (e.g., 0.1 = +/- 10%)
    pub variance: f32,
    /// Can this crit
    pub can_crit: bool,
    /// Is this direct damage (vs periodic)
    pub is_direct: bool,
}

impl Default for DamageEffect {
    fn default() -> Self {
        Self {
            school: DamageSchool::Physical,
            base_damage: 0.0,
            sp_coefficient: 0.0,
            ap_coefficient: 0.0,
            weapon_coefficient: 0.0,
            variance: 0.0,
            can_crit: true,
            is_direct: true,
        }
    }
}

/// Spell definition
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct SpellDef {
    /// Unique spell ID
    pub id: SpellIdx,
    /// Display name
    pub name: String,
    /// Spell school
    pub school: DamageSchool,
    /// Cast type
    pub cast_type: CastType,
    /// GCD behavior
    pub gcd: GcdType,
    /// Resource costs
    pub costs: Vec<ResourceCost>,
    /// Resource gains
    pub gains: Vec<ResourceCost>,
    /// Cooldown duration (0 = no cooldown)
    pub cooldown: SimTime,
    /// Charges (0 = no charges, use cooldown)
    pub charges: u8,
    /// Charge recharge time
    pub charge_time: SimTime,
    /// Range in yards
    pub range: f32,
    /// Target type
    pub target: SpellTarget,
    /// Damage effect (if any)
    pub damage: Option<DamageEffect>,
    /// Auras to apply
    pub apply_auras: Vec<AuraIdx>,
    /// Required aura to cast
    pub requires_aura: Option<AuraIdx>,
    /// Consumes aura on cast
    pub consumes_aura: Option<AuraIdx>,
    /// Effects that fire when this spell is cast
    pub effects: Vec<SpellEffect>,
    /// Travel time in ms (for projectiles)
    pub travel_time: u32,
    /// Whether this can be cast while moving
    pub castable_while_moving: bool,
    /// Spell flags for special handling
    pub flags: SpellFlags,
}

bitflags::bitflags! {
    /// Flags for special spell behavior
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
    #[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
    #[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
    pub struct SpellFlags: u32 {
        /// Spell is on the GCD
        const ON_GCD = 1 << 0;
        /// Triggers auto-attack reset
        const RESETS_AUTO = 1 << 1;
        /// Is a pet ability
        const PET_ABILITY = 1 << 2;
        /// Is a proc effect (not directly cast)
        const IS_PROC = 1 << 3;
        /// Ignores GCD
        const IGNORES_GCD = 1 << 4;
        /// Usable while GCD is active
        const OFF_GCD = 1 << 5;
        /// Background spell (no APL interaction)
        const BACKGROUND = 1 << 6;
    }
}

impl SpellDef {
    pub fn new(id: SpellIdx, name: impl Into<String>) -> Self {
        Self {
            id,
            name: name.into(),
            school: DamageSchool::Physical,
            cast_type: CastType::Instant,
            gcd: GcdType::Normal,
            costs: Vec::new(),
            gains: Vec::new(),
            cooldown: SimTime::ZERO,
            charges: 0,
            charge_time: SimTime::ZERO,
            range: 40.0,
            target: SpellTarget::Enemy,
            damage: None,
            apply_auras: Vec::new(),
            requires_aura: None,
            consumes_aura: None,
            effects: Vec::new(),
            travel_time: 0,
            castable_while_moving: true,
            flags: SpellFlags::ON_GCD,
        }
    }

    /// Get effective cast time with haste
    pub fn cast_time(&self, haste: f32) -> SimTime {
        match self.cast_type {
            CastType::Instant => SimTime::ZERO,
            CastType::Cast(base) => {
                let ms = (base as f32 / haste) as u32;
                SimTime::from_millis(ms)
            }
            CastType::FixedCast(ms) => SimTime::from_millis(ms),
            CastType::Channel { duration, .. } => {
                let ms = (duration as f32 / haste) as u32;
                SimTime::from_millis(ms)
            }
        }
    }

    /// Get effective GCD with haste
    pub fn gcd_duration(&self, haste: f32) -> SimTime {
        match self.gcd {
            GcdType::Normal => {
                let base = 1500.0; // 1.5s base GCD
                let ms = (base / haste) as u32;
                // GCD floor is 750ms
                SimTime::from_millis(ms.max(750))
            }
            GcdType::Fixed(ms) => SimTime::from_millis(ms),
            GcdType::None => SimTime::ZERO,
        }
    }

    /// Is this an instant cast?
    pub fn is_instant(&self) -> bool {
        matches!(self.cast_type, CastType::Instant)
    }

    /// Is this a channeled spell?
    pub fn is_channel(&self) -> bool {
        matches!(self.cast_type, CastType::Channel { .. })
    }

    /// Has cooldown?
    pub fn has_cooldown(&self) -> bool {
        self.cooldown > SimTime::ZERO || self.charges > 0
    }
}
