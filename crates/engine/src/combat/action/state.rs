use wowlab_common::types::{DamageSchool, HitResult, SnapshotFlags};

#[derive(Clone, Debug, Default)]
pub struct ActionState {
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste: f32,
    pub versatility: f32,
    pub mastery: f32,
    pub da_multiplier: f32,
    pub ta_multiplier: f32,
    pub persistent_multiplier: f32,
    pub player_multiplier: f32,
    pub target_multiplier: f32,
    pub result: HitResult,
    pub school: DamageSchool,
}

impl ActionState {
    pub fn new() -> Self {
        Self {
            da_multiplier: 1.0,
            ta_multiplier: 1.0,
            persistent_multiplier: 1.0,
            player_multiplier: 1.0,
            target_multiplier: 1.0,
            ..Default::default()
        }
    }

    pub fn snapshot(&mut self, cache: &crate::stats::StatCache, flags: SnapshotFlags) {
        if flags.contains(SnapshotFlags::ATTACK_POWER) {
            self.attack_power = cache.attack_power();
        }
        if flags.contains(SnapshotFlags::SPELL_POWER) {
            self.spell_power = cache.spell_power();
        }
        if flags.contains(SnapshotFlags::CRIT) {
            self.crit_chance = cache.crit_chance();
        }
        if flags.contains(SnapshotFlags::HASTE) {
            self.haste = cache.haste();
        }
        if flags.contains(SnapshotFlags::VERSATILITY) {
            self.versatility = cache.versatility();
        }
        if flags.contains(SnapshotFlags::MASTERY) {
            self.mastery = cache.mastery();
        }
    }

    #[inline]
    pub fn get_attack_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::ATTACK_POWER) {
            self.attack_power
        } else {
            live
        }
    }

    #[inline]
    pub fn get_spell_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::SPELL_POWER) {
            self.spell_power
        } else {
            live
        }
    }
}
