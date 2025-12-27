use serde::Deserialize;

/// Static aura/buff definition
#[derive(Debug, Clone, Deserialize)]
pub struct AuraDef {
    pub id: u32,
    pub name: String,
    pub duration: f32,
    pub max_stacks: u8,

    #[serde(default)]
    pub effects: Vec<AuraEffect>,

    /// If true, refreshing resets duration instead of extending
    #[serde(default)]
    pub pandemic: bool,

    /// Tick interval for DoTs/HoTs (0 = no ticks)
    #[serde(default)]
    pub tick_interval: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AuraEffect {
    /// Modify a stat by flat amount
    FlatStat {
        stat: StatType,
        amount: f32,
    },
    /// Modify a stat by percentage
    PercentStat {
        stat: StatType,
        percent: f32,
    },
    /// Modify damage dealt by percentage
    DamageDone {
        percent: f32,
        school: Option<DamageSchool>,
    },
    /// Modify damage taken by percentage
    DamageTaken {
        percent: f32,
    },
    /// Periodic damage
    PeriodicDamage {
        amount: f32,
        coefficient: f32,
    },
    /// Periodic healing
    PeriodicHeal {
        amount: f32,
        coefficient: f32,
    },
    /// Proc effect on spell cast/hit
    Proc {
        trigger: ProcTrigger,
        spell_id: u32,
        chance: f32,
        icd: f32, // internal cooldown
    },
    /// Reduce cooldown of spell
    CooldownReduction {
        spell_id: u32,
        reduction: f32,
    },
}

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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcTrigger {
    OnSpellCast,
    OnSpellHit,
    OnSpellCrit,
    OnMeleeHit,
    OnMeleeCrit,
    OnDamageTaken,
    OnHeal,
}
