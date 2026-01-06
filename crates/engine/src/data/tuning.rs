//! Tuning data structures for external configuration.
//!
//! These structures are deserialized from TOML files and can override
//! the default values defined in spec code.

use serde::Deserialize;
use std::collections::HashMap;

/// Root tuning data loaded from TOML.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct TuningData {
    /// Spell-specific tuning overrides
    pub spell: HashMap<String, SpellTuning>,
    /// Aura-specific tuning overrides
    pub aura: HashMap<String, AuraTuning>,
    /// Class-wide tuning
    pub class: Option<ClassTuning>,
}

/// Spell tuning overrides.
///
/// All fields are optional - only specified values will override defaults.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct SpellTuning {
    // Timing
    /// Cooldown in seconds
    pub cooldown: Option<f32>,
    /// Number of charges
    pub charges: Option<u8>,
    /// Recharge time in seconds (for charged abilities)
    pub recharge_time: Option<f32>,
    /// Cast time in milliseconds
    pub cast_time: Option<u32>,

    // Resources
    /// Focus cost
    pub cost_focus: Option<f32>,
    /// Mana cost
    pub cost_mana: Option<f32>,
    /// Energy cost
    pub cost_energy: Option<f32>,
    /// Rage cost
    pub cost_rage: Option<f32>,
    /// Focus gain
    pub focus_gain: Option<f32>,

    // Damage coefficients
    /// Attack power coefficient
    pub ap_coefficient: Option<f32>,
    /// Spell power coefficient
    pub sp_coefficient: Option<f32>,
    /// Weapon damage coefficient
    pub weapon_coefficient: Option<f32>,
    /// Base damage amount
    pub base_damage: Option<f32>,

    // Special effects
    /// Damage multiplier
    pub damage_multiplier: Option<f32>,
    /// Cooldown reduction on another spell (seconds)
    pub kill_command_cooldown_reduction: Option<f32>,
}

/// Aura tuning overrides.
///
/// All fields are optional - only specified values will override defaults.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct AuraTuning {
    // Timing
    /// Duration in seconds
    pub duration: Option<f32>,
    /// Tick interval in seconds (for periodic effects)
    pub tick_interval: Option<f32>,

    // Stacking
    /// Maximum stack count
    pub max_stacks: Option<u8>,

    // Effects
    /// Damage multiplier while active
    pub damage_multiplier: Option<f32>,
    /// Haste per stack (for stacking buffs)
    pub haste_per_stack: Option<f32>,
    /// AP coefficient per tick (for periodic damage)
    pub ap_coefficient_per_tick: Option<f32>,
    /// SP coefficient per tick
    pub sp_coefficient_per_tick: Option<f32>,
}

/// Class-wide tuning.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct ClassTuning {
    /// Base focus regeneration per second (Hunter)
    pub focus_regeneration: Option<f32>,
    /// Base energy regeneration per second (Rogue)
    pub energy_regeneration: Option<f32>,
    /// Pet base damage modifier
    pub pet_base_damage: Option<f32>,
    /// Pet base attack speed multiplier
    pub pet_attack_speed: Option<f32>,
}

impl TuningData {
    /// Create empty tuning data (no overrides).
    pub fn empty() -> Self {
        Self::default()
    }

    /// Check if this tuning data has any overrides.
    pub fn is_empty(&self) -> bool {
        self.spell.is_empty() && self.aura.is_empty() && self.class.is_none()
    }

    /// Merge another TuningData into this one.
    ///
    /// Values from `other` take precedence over existing values.
    pub fn merge(&mut self, other: TuningData) {
        // Merge spell tuning
        for (name, tuning) in other.spell {
            self.spell.entry(name)
                .and_modify(|existing| existing.merge(&tuning))
                .or_insert(tuning);
        }

        // Merge aura tuning
        for (name, tuning) in other.aura {
            self.aura.entry(name)
                .and_modify(|existing| existing.merge(&tuning))
                .or_insert(tuning);
        }

        // Merge class tuning
        if let Some(other_class) = other.class {
            if let Some(ref mut class) = self.class {
                class.merge(&other_class);
            } else {
                self.class = Some(other_class);
            }
        }
    }
}

impl SpellTuning {
    /// Merge another SpellTuning into this one.
    fn merge(&mut self, other: &SpellTuning) {
        if other.cooldown.is_some() { self.cooldown = other.cooldown; }
        if other.charges.is_some() { self.charges = other.charges; }
        if other.recharge_time.is_some() { self.recharge_time = other.recharge_time; }
        if other.cast_time.is_some() { self.cast_time = other.cast_time; }
        if other.cost_focus.is_some() { self.cost_focus = other.cost_focus; }
        if other.cost_mana.is_some() { self.cost_mana = other.cost_mana; }
        if other.cost_energy.is_some() { self.cost_energy = other.cost_energy; }
        if other.cost_rage.is_some() { self.cost_rage = other.cost_rage; }
        if other.focus_gain.is_some() { self.focus_gain = other.focus_gain; }
        if other.ap_coefficient.is_some() { self.ap_coefficient = other.ap_coefficient; }
        if other.sp_coefficient.is_some() { self.sp_coefficient = other.sp_coefficient; }
        if other.weapon_coefficient.is_some() { self.weapon_coefficient = other.weapon_coefficient; }
        if other.base_damage.is_some() { self.base_damage = other.base_damage; }
        if other.damage_multiplier.is_some() { self.damage_multiplier = other.damage_multiplier; }
        if other.kill_command_cooldown_reduction.is_some() {
            self.kill_command_cooldown_reduction = other.kill_command_cooldown_reduction;
        }
    }
}

impl AuraTuning {
    /// Merge another AuraTuning into this one.
    fn merge(&mut self, other: &AuraTuning) {
        if other.duration.is_some() { self.duration = other.duration; }
        if other.tick_interval.is_some() { self.tick_interval = other.tick_interval; }
        if other.max_stacks.is_some() { self.max_stacks = other.max_stacks; }
        if other.damage_multiplier.is_some() { self.damage_multiplier = other.damage_multiplier; }
        if other.haste_per_stack.is_some() { self.haste_per_stack = other.haste_per_stack; }
        if other.ap_coefficient_per_tick.is_some() {
            self.ap_coefficient_per_tick = other.ap_coefficient_per_tick;
        }
        if other.sp_coefficient_per_tick.is_some() {
            self.sp_coefficient_per_tick = other.sp_coefficient_per_tick;
        }
    }
}

impl ClassTuning {
    /// Merge another ClassTuning into this one.
    fn merge(&mut self, other: &ClassTuning) {
        if other.focus_regeneration.is_some() { self.focus_regeneration = other.focus_regeneration; }
        if other.energy_regeneration.is_some() { self.energy_regeneration = other.energy_regeneration; }
        if other.pet_base_damage.is_some() { self.pet_base_damage = other.pet_base_damage; }
        if other.pet_attack_speed.is_some() { self.pet_attack_speed = other.pet_attack_speed; }
    }
}
