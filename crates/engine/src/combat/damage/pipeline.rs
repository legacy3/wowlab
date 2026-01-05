use crate::types::{DamageSchool, HitResult, DamageFlags};
use crate::core::FastRng;
use super::DamageMultipliers;

/// Result of damage calculation
#[derive(Clone, Debug)]
pub struct DamageResult {
    /// Raw damage before mitigation
    pub raw: f32,
    /// Final damage after everything
    pub final_amount: f32,
    /// Hit/crit/miss
    pub hit_result: HitResult,
    /// Damage school
    pub school: DamageSchool,
    /// Flags
    pub flags: DamageFlags,
}

/// Damage calculation pipeline
pub struct DamagePipeline;

impl DamagePipeline {
    /// Calculate damage with full pipeline
    pub fn calculate(
        base: f32,
        ap_coeff: f32,
        sp_coeff: f32,
        attack_power: f32,
        spell_power: f32,
        multipliers: &DamageMultipliers,
        crit_chance: f32,
        school: DamageSchool,
        armor: f32, // Target armor (for physical)
        rng: &mut FastRng,
    ) -> DamageResult {
        // 1. Base damage + scaling
        let mut amount = base;
        amount += ap_coeff * attack_power;
        amount += sp_coeff * spell_power;

        let raw = amount;

        // 2. Roll for crit
        let is_crit = rng.roll(crit_chance);
        let hit_result = if is_crit { HitResult::Crit } else { HitResult::Hit };

        // 3. Apply multipliers
        amount *= multipliers.total_da(is_crit);

        // 4. Apply armor mitigation (physical only)
        if school.is_physical() && armor > 0.0 {
            let mitigation = Self::armor_mitigation(armor);
            amount *= 1.0 - mitigation;
        }

        let mut flags = DamageFlags::empty();
        if is_crit {
            flags |= DamageFlags::CRIT;
        }

        DamageResult {
            raw,
            final_amount: amount,
            hit_result,
            school,
            flags,
        }
    }

    /// Calculate periodic (DoT) tick damage
    pub fn calculate_periodic(
        base: f32,
        ap_coeff: f32,
        sp_coeff: f32,
        attack_power: f32,
        spell_power: f32,
        multipliers: &DamageMultipliers,
        crit_chance: f32,
        school: DamageSchool,
        armor: f32,
        rng: &mut FastRng,
    ) -> DamageResult {
        let mut amount = base;
        amount += ap_coeff * attack_power;
        amount += sp_coeff * spell_power;

        let raw = amount;

        let is_crit = rng.roll(crit_chance);
        let hit_result = if is_crit { HitResult::Crit } else { HitResult::Hit };

        // Use TA multiplier for periodic
        amount *= multipliers.total_ta(is_crit);

        if school.is_physical() && armor > 0.0 {
            let mitigation = Self::armor_mitigation(armor);
            amount *= 1.0 - mitigation;
        }

        let mut flags = DamageFlags::PERIODIC;
        if is_crit {
            flags |= DamageFlags::CRIT;
        }

        DamageResult {
            raw,
            final_amount: amount,
            hit_result,
            school,
            flags,
        }
    }

    /// Armor mitigation formula (level 80)
    fn armor_mitigation(armor: f32) -> f32 {
        // TODO Move this: Constant for level 80 target
        const ARMOR_CONSTANT: f32 = 7390.0;

        // DR formula: armor / (armor + constant)
        (armor / (armor + ARMOR_CONSTANT)).min(0.85) // Cap at 85%
    }
}
