//! Aura (buff/debuff) definitions.

use serde::Deserialize;

/// Static aura/buff definition loaded from game data.
///
/// Auras represent buffs, debuffs, and periodic effects (DoTs/HoTs).
#[derive(Debug, Clone, Deserialize, Default)]
pub struct AuraDef {
    /// Unique aura identifier.
    pub id: u32,
    /// Aura name for display and rotation script matching.
    #[serde(default)]
    pub name: String,
    /// Base duration in seconds.
    #[serde(default)]
    pub duration: f32,
    /// Maximum stack count.
    #[serde(default)]
    pub max_stacks: u8,

    /// Effects applied while aura is active.
    #[serde(default)]
    pub effects: Vec<AuraEffect>,

    /// If true, refreshing resets duration (pandemic behavior).
    #[serde(default)]
    pub pandemic: bool,

    /// Tick interval in seconds for periodic effects (0 = no ticks).
    #[serde(default)]
    pub tick_interval: f32,

    /// If true, this aura is triggered by procs (unpredictable timing).
    #[serde(default)]
    pub is_proc: bool,
}

/// Effects that an aura can have while active.
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AuraEffect {
    /// Add flat amount to a stat.
    FlatStat { stat: StatType, amount: f32 },
    /// Increase a stat by percentage.
    PercentStat { stat: StatType, percent: f32 },
    /// Modify damage dealt by percentage.
    DamageDone { percent: f32, school: Option<DamageSchool> },
    /// Modify damage taken by percentage.
    DamageTaken { percent: f32 },
    /// Deal periodic damage (DoT).
    PeriodicDamage { amount: f32, coefficient: f32 },
    /// Heal periodically (HoT).
    PeriodicHeal { amount: f32, coefficient: f32 },
    /// Trigger a spell on certain events.
    Proc { trigger: ProcTrigger, spell_id: u32, chance: f32, icd: f32 },
    /// Reduce cooldown of a specific spell.
    CooldownReduction { spell_id: u32, reduction: f32 },
}

/// Stat types that can be modified by auras.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StatType {
    Agility,
    Intellect,
    Strength,
    Stamina,
    Crit,
    Haste,
    Mastery,
    Versatility,
    AttackPower,
    SpellPower,
}

/// Damage school types for school-specific modifiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DamageSchool {
    Physical,
    Holy,
    Fire,
    Nature,
    Frost,
    Shadow,
    Arcane,
}

/// Events that can trigger proc effects.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
#[allow(dead_code)] // Variants for future proc support
pub enum ProcTrigger {
    OnSpellCast,
    OnSpellHit,
    OnSpellCrit,
    OnMeleeHit,
    OnMeleeCrit,
    OnDamageTaken,
    OnHeal,
}
