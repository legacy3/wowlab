use super::DamageMultipliers;
use crate::core::FastRng;
use wowlab_common::types::{DamageFlags, DamageSchool, HitResult};

#[derive(Clone, Debug)]
pub struct DamageResult {
    pub raw: f32,
    pub final_amount: f32,
    pub hit_result: HitResult,
    pub school: DamageSchool,
    pub flags: DamageFlags,
}

pub struct DamagePipeline;

impl DamagePipeline {
    #[allow(clippy::too_many_arguments)]
    pub fn calculate(
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
        let hit_result = if is_crit {
            HitResult::Crit
        } else {
            HitResult::Hit
        };

        amount *= multipliers.total_da(is_crit);

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

    #[allow(clippy::too_many_arguments)]
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
        let hit_result = if is_crit {
            HitResult::Crit
        } else {
            HitResult::Hit
        };

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

    fn armor_mitigation(armor: f32) -> f32 {
        // TODO: move constant, this is for level 80
        const ARMOR_CONSTANT: f32 = 7390.0;
        (armor / (armor + ARMOR_CONSTANT)).min(0.85)
    }
}
