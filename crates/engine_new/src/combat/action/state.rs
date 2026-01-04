use crate::types::{SnapshotFlags, DamageSchool, HitResult};

/// Snapshotted state for an action (DoTs, delayed damage)
#[derive(Clone, Debug, Default)]
pub struct ActionState {
    // Snapshotted stats
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste: f32,
    pub versatility: f32,
    pub mastery: f32,

    // Snapshotted multipliers
    pub da_multiplier: f32,
    pub ta_multiplier: f32,
    pub persistent_multiplier: f32,
    pub player_multiplier: f32,
    pub target_multiplier: f32,

    // Result tracking
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

    /// Snapshot stats from cache based on flags
    pub fn snapshot(
        &mut self,
        cache: &crate::stats::StatCache,
        flags: SnapshotFlags,
    ) {
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

    /// Get attack power (snapshotted or live)
    #[inline]
    pub fn get_attack_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::ATTACK_POWER) {
            self.attack_power
        } else {
            live
        }
    }

    /// Get spell power (snapshotted or live)
    #[inline]
    pub fn get_spell_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::SPELL_POWER) {
            self.spell_power
        } else {
            live
        }
    }
}

/// Unique ID for tracking snapshots (for delayed damage)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SnapshotId(pub u32);
