//! Shared pet mechanics for all Hunter specs.
//!
//! All Hunter specs have pets with similar base mechanics. This module
//! provides shared constants and default behavior that specs can override.

use crate::combat::DamagePipeline;
use crate::core::SimEvent;
use crate::sim::SimState;
use wowlab_common::types::{DamageSchool, SimTime, UnitIdx};

/// Base pet attack speed (ms).
pub const PET_ATTACK_SPEED: SimTime = SimTime::from_millis(2000);

/// Pet stat inheritance from owner (60%).
pub const PET_STAT_INHERITANCE: f32 = 0.6;

/// Pet auto-attack AP coefficient (base).
pub const PET_AUTO_ATTACK_COEF: f32 = 0.5;

/// Calculate base pet damage.
///
/// This uses the owner's attack power scaled by inheritance and coefficient.
pub fn calculate_pet_damage(state: &mut SimState, ap_coef: f32, damage_multiplier: f32) -> f32 {
    let ap = state.player.stats.attack_power();
    let sp = state.player.stats.spell_power();
    let crit = state.player.stats.crit_chance();
    let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

    let inherited_coef = ap_coef * PET_STAT_INHERITANCE;

    let result = DamagePipeline::calculate(
        0.0,            // base damage
        inherited_coef, // AP coefficient
        0.0,            // SP coefficient
        ap,
        sp,
        &state.multipliers,
        crit,
        DamageSchool::Physical,
        armor,
        &mut state.rng,
    );

    result.final_amount * damage_multiplier
}

/// Default pet auto-attack behavior.
///
/// Specs can call this from their `on_pet_attack` handler and add
/// spec-specific logic on top.
pub fn default_pet_attack(
    state: &mut SimState,
    pet: UnitIdx,
    attack_speed_modifier: f32,
    damage_multiplier: f32,
) {
    let now = state.now();

    // Verify pet is valid
    if !state
        .pets
        .get(pet)
        .map(|p| p.is_valid(now))
        .unwrap_or(false)
    {
        return;
    }

    // Calculate and record damage
    let damage = calculate_pet_damage(state, PET_AUTO_ATTACK_COEF, damage_multiplier);
    state.record_damage(damage);

    // Schedule next attack if simulation continues
    if !state.finished {
        let haste = state.player.stats.haste() * attack_speed_modifier;
        let base_speed = PET_ATTACK_SPEED.as_millis() as f32;
        let speed = SimTime::from_millis(((base_speed / haste) as u32).max(100));
        state.schedule_in(speed, SimEvent::PetAttack { pet });
    }
}
