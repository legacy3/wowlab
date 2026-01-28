use bitflags::bitflags;

bitflags! {
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct ProcFlags: u32 {
        const ON_DAMAGE = 1 << 0;
        const ON_PERIODIC_DAMAGE = 1 << 1;
        const ON_DIRECT_DAMAGE = 1 << 2;
        const ON_CRIT = 1 << 3;
        const ON_AUTO_ATTACK = 1 << 4;
        const ON_SPELL_CAST = 1 << 5;
        const ON_ABILITY = 1 << 6;
        const ON_DAMAGE_TAKEN = 1 << 7;
        const ON_HEAL = 1 << 8;
        const ON_PERIODIC_HEAL = 1 << 9;
        const ON_AURA_APPLY = 1 << 10;
        const ON_AURA_EXPIRE = 1 << 11;
        const ON_KILL = 1 << 12;
        const ON_PET_DAMAGE = 1 << 13;
        const ON_PET_ABILITY = 1 << 14;
        const MAIN_HAND_ONLY = 1 << 15;
        const OFF_HAND_ONLY = 1 << 16;
        const ON_HARMFUL_SPELL = 1 << 17;
        const ON_BENEFICIAL_SPELL = 1 << 18;
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProcCategory {
    Rppm,
    FixedChance,
    Guaranteed,
    Ppm,
}

#[derive(Clone, Debug)]
pub struct ProcContext {
    pub trigger: ProcFlags,
    pub spell_id: Option<wowlab_common::types::SpellIdx>,
    pub target: Option<wowlab_common::types::TargetIdx>,
    pub is_crit: bool,
    pub damage: f32,
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
