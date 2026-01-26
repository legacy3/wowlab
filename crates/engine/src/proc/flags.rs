use bitflags::bitflags;

bitflags! {
    /// Flags for what triggers a proc
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct ProcFlags: u32 {
        /// Triggered by dealing damage
        const ON_DAMAGE = 1 << 0;
        /// Triggered by dealing periodic damage
        const ON_PERIODIC_DAMAGE = 1 << 1;
        /// Triggered by direct damage
        const ON_DIRECT_DAMAGE = 1 << 2;
        /// Triggered by critical strike
        const ON_CRIT = 1 << 3;
        /// Triggered by auto-attack
        const ON_AUTO_ATTACK = 1 << 4;
        /// Triggered by spell cast
        const ON_SPELL_CAST = 1 << 5;
        /// Triggered by ability use
        const ON_ABILITY = 1 << 6;
        /// Triggered when taking damage
        const ON_DAMAGE_TAKEN = 1 << 7;
        /// Triggered by healing
        const ON_HEAL = 1 << 8;
        /// Triggered by periodic heal
        const ON_PERIODIC_HEAL = 1 << 9;
        /// Triggered by applying aura
        const ON_AURA_APPLY = 1 << 10;
        /// Triggered by aura expiring
        const ON_AURA_EXPIRE = 1 << 11;
        /// Triggered by killing enemy
        const ON_KILL = 1 << 12;
        /// Triggered by pet damage
        const ON_PET_DAMAGE = 1 << 13;
        /// Triggered by pet ability
        const ON_PET_ABILITY = 1 << 14;
        /// Triggered only by main hand attacks
        const MAIN_HAND_ONLY = 1 << 15;
        /// Triggered only by off hand attacks
        const OFF_HAND_ONLY = 1 << 16;
        /// Triggered by harmful spells
        const ON_HARMFUL_SPELL = 1 << 17;
        /// Triggered by beneficial spells
        const ON_BENEFICIAL_SPELL = 1 << 18;
    }
}

/// Categories for proc chance modifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProcCategory {
    /// Standard RPPM proc
    Rppm,
    /// Fixed percentage chance
    FixedChance,
    /// Guaranteed proc
    Guaranteed,
    /// Proc Per Minute (legacy, no BLP)
    Ppm,
}

/// Context passed to proc handlers
#[derive(Clone, Debug)]
pub struct ProcContext {
    /// What triggered this proc check
    pub trigger: ProcFlags,
    /// Spell that triggered (if any)
    pub spell_id: Option<wowlab_common::types::SpellIdx>,
    /// Target involved
    pub target: Option<wowlab_common::types::TargetIdx>,
    /// Was it a critical strike
    pub is_crit: bool,
    /// Damage dealt (if applicable)
    pub damage: f32,
    /// Current haste for RPPM calculation
    pub haste: f32,
}

impl Default for ProcContext {
    fn default() -> Self {
        Self {
            trigger: ProcFlags::empty(),
            spell_id: None,
            target: None,
            is_crit: false,
            damage: 0.0,
            haste: 1.0,
        }
    }
}

impl ProcContext {
    pub fn damage(trigger: ProcFlags, damage: f32, is_crit: bool) -> Self {
        Self {
            trigger,
            damage,
            is_crit,
            ..Default::default()
        }
    }

    pub fn spell_cast(spell_id: wowlab_common::types::SpellIdx) -> Self {
        Self {
            trigger: ProcFlags::ON_SPELL_CAST,
            spell_id: Some(spell_id),
            ..Default::default()
        }
    }

    pub fn with_haste(mut self, haste: f32) -> Self {
        self.haste = haste;
        self
    }
}
