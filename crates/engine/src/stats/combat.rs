/// Combat stats (percentages, ready to use)
#[derive(Clone, Debug, Default)]
pub struct CombatStats {
    /// Crit chance (0.0 to 1.0+)
    pub crit_chance: f32,
    /// Haste multiplier (1.0 = no haste, 1.3 = 30% haste)
    pub haste: f32,
    /// Mastery percentage (spec-specific interpretation)
    pub mastery: f32,
    /// Versatility damage/healing bonus (0.0 to 0.x)
    pub versatility_damage: f32,
    /// Versatility damage reduction (half of damage bonus)
    pub versatility_dr: f32,
    /// Attack power
    pub attack_power: f32,
    /// Spell power
    pub spell_power: f32,
    /// Weapon DPS (for melee calculations)
    pub weapon_dps: f32,
}

impl CombatStats {
    /// Base crit chance (5% for all specs)
    pub const BASE_CRIT: f32 = 0.05;
    /// Base haste (1.0 = no haste)
    pub const BASE_HASTE: f32 = 1.0;

    /// Create with sensible defaults (base values)
    pub fn new() -> Self {
        Self {
            crit_chance: Self::BASE_CRIT,
            haste: Self::BASE_HASTE,
            mastery: 0.0,
            versatility_damage: 0.0,
            versatility_dr: 0.0,
            attack_power: 0.0,
            spell_power: 0.0,
            weapon_dps: 0.0,
        }
    }
}
