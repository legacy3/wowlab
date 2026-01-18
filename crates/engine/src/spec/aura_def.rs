use crate::aura::{AuraFlags, PeriodicEffect};
use wowlab_types::{Attribute, AuraIdx, DamageSchool, DerivedStat, RatingType, SimTime, SpellIdx};
use serde::{Deserialize, Serialize};

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
        resource: wowlab_types::ResourceType,
        amount: f32,
    },
    /// Cooldown reduction
    CooldownReduction { spell: SpellIdx, amount: f32 },
    /// Proc chance modifier
    ProcChance {
        proc: wowlab_types::ProcIdx,
        amount: f32,
    },
    /// Custom effect (handled by spec)
    Custom { id: u32 },
}

/// Aura definition
#[derive(Clone, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub struct AuraDef {
    /// Unique aura ID
    pub id: AuraIdx,
    /// Display name
    pub name: String,
    /// Base duration
    pub duration: SimTime,
    /// Max stacks
    pub max_stacks: u8,
    /// Behavior flags
    pub flags: AuraFlags,
    /// Effects while active
    pub effects: Vec<AuraEffect>,
    /// Periodic effect (for DoTs/HoTs)
    pub periodic: Option<PeriodicEffect>,
    /// Spell that applies this aura
    pub applied_by: Option<SpellIdx>,
}

impl AuraDef {
    pub fn new(id: AuraIdx, name: impl Into<String>, duration: SimTime) -> Self {
        Self {
            id,
            name: name.into(),
            duration,
            max_stacks: 1,
            flags: AuraFlags::default(),
            effects: Vec::new(),
            periodic: None,
            applied_by: None,
        }
    }

    /// Create a buff
    pub fn buff(id: AuraIdx, name: impl Into<String>, duration: SimTime) -> Self {
        Self::new(id, name, duration)
    }

    /// Create a debuff
    pub fn debuff(id: AuraIdx, name: impl Into<String>, duration: SimTime) -> Self {
        let mut aura = Self::new(id, name, duration);
        aura.flags.is_debuff = true;
        aura
    }

    /// Create a DoT
    pub fn dot(
        id: AuraIdx,
        name: impl Into<String>,
        duration: SimTime,
        tick_interval: SimTime,
    ) -> Self {
        let mut aura = Self::debuff(id, name, duration);
        aura.flags.is_periodic = true;
        aura.flags.can_pandemic = true;
        aura.flags.snapshots = true;
        aura.flags.refreshable = true;
        aura.periodic = Some(PeriodicEffect::new(id, tick_interval));
        aura
    }

    pub fn with_stacks(mut self, max: u8) -> Self {
        self.max_stacks = max;
        self
    }

    pub fn with_effect(mut self, effect: AuraEffect) -> Self {
        self.effects.push(effect);
        self
    }

    pub fn with_periodic(mut self, periodic: PeriodicEffect) -> Self {
        self.periodic = Some(periodic);
        self.flags.is_periodic = true;
        self
    }

    pub fn pandemic(mut self) -> Self {
        self.flags.can_pandemic = true;
        self
    }

    pub fn snapshots(mut self) -> Self {
        self.flags.snapshots = true;
        self
    }

    pub fn refreshable(mut self) -> Self {
        self.flags.refreshable = true;
        self
    }

    pub fn hidden(mut self) -> Self {
        self.flags.is_hidden = true;
        self
    }
}
