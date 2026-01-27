//! Shared abilities for all Hunter specs.
//!
//! Abilities like Kill Shot, Tranquilizing Shot, and aspects are available
//! to all Hunter specs with the same base implementation.

use crate::combat::DamagePipeline;
use crate::sim::SimState;
use wowlab_common::types::{AuraIdx, DamageSchool, SimTime, SpellIdx, TargetIdx};

/// Kill Shot - Execute ability available below 20% health
pub const KILL_SHOT: SpellIdx = SpellIdx(53351);

/// Tranquilizing Shot - Dispel enrage
pub const TRANQUILIZING_SHOT: SpellIdx = SpellIdx(19801);

/// Arcane Shot - Basic filler ability
pub const ARCANE_SHOT: SpellIdx = SpellIdx(185358);

/// Steady Shot - Focus generator (MM/SV)
pub const STEADY_SHOT: SpellIdx = SpellIdx(56641);

/// Aspect of the Cheetah - Speed boost
pub const ASPECT_OF_THE_CHEETAH: AuraIdx = AuraIdx(186257);

/// Aspect of the Turtle - Damage immunity
pub const ASPECT_OF_THE_TURTLE: AuraIdx = AuraIdx(186265);

/// Execute threshold (20% health).
pub const KILL_SHOT_THRESHOLD: f32 = 0.20;

/// Kill Shot focus cost.
pub const KILL_SHOT_COST: f32 = 10.0;

/// Kill Shot AP coefficient.
pub const KILL_SHOT_AP_COEF: f32 = 3.0;

/// Kill Shot cooldown (seconds).
pub const KILL_SHOT_COOLDOWN: f32 = 10.0;

/// Check if Kill Shot can be used on a target.
pub fn can_use_kill_shot(state: &SimState, target: TargetIdx) -> bool {
    // Check if target is below execute threshold
    if let Some(enemy) = state.enemies.get(target) {
        enemy.health_percent() <= KILL_SHOT_THRESHOLD
    } else {
        false
    }
}

/// Calculate Kill Shot damage.
///
/// Kill Shot deals high damage to targets below 20% health.
pub fn calculate_kill_shot_damage(state: &mut SimState) -> f32 {
    let ap = state.player.stats.attack_power();
    let sp = state.player.stats.spell_power();
    let crit = state.player.stats.crit_chance();
    let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

    let result = DamagePipeline::calculate(
        0.0,
        KILL_SHOT_AP_COEF,
        0.0,
        ap,
        sp,
        &state.multipliers,
        crit,
        DamageSchool::Physical,
        armor,
        &mut state.rng,
    );

    result.final_amount
}

/// Base ranged auto-attack speed (ms).
pub const RANGED_ATTACK_SPEED: f32 = 2600.0;

/// Calculate ranged attack speed with haste.
pub fn ranged_attack_speed(haste: f32) -> SimTime {
    SimTime::from_millis(((RANGED_ATTACK_SPEED / haste) as u32).max(100))
}
