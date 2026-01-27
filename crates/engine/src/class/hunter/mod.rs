//! Hunter class shared behavior.
//!
//! All Hunter specs (Beast Mastery, Marksmanship, Survival) share:
//! - Focus as primary resource
//! - Pet mechanics
//! - Certain abilities (Kill Shot, Tranquilizing Shot, aspects)
//!
//! This module provides the `HunterClass` trait that extends `SpecHandler`
//! with Hunter-specific shared functionality.

pub mod focus;
pub mod pet;
pub mod shared;

pub use focus::{focus_regen_rate, regenerate_focus, FOCUS_MAX, FOCUS_REGEN_BASE};
pub use pet::{
    calculate_pet_damage, default_pet_attack, PET_ATTACK_SPEED, PET_AUTO_ATTACK_COEF,
    PET_STAT_INHERITANCE,
};
pub use shared::{
    calculate_kill_shot_damage, can_use_kill_shot, ranged_attack_speed, ARCANE_SHOT,
    ASPECT_OF_THE_CHEETAH, ASPECT_OF_THE_TURTLE, KILL_SHOT, KILL_SHOT_AP_COEF, KILL_SHOT_COOLDOWN,
    KILL_SHOT_COST, KILL_SHOT_THRESHOLD, RANGED_ATTACK_SPEED, STEADY_SHOT, TRANQUILIZING_SHOT,
};

use crate::handler::SpecHandler;
use crate::sim::SimState;
use wowlab_common::types::{DamageSchool, TargetIdx, UnitIdx};

/// Shared behavior for all Hunter specs.
///
/// This trait extends `SpecHandler` with Hunter-specific methods that have
/// default implementations. Specs can override any method to customize
/// behavior while still benefiting from shared code.
///
/// # Implementation Pattern
///
/// ```ignore
/// impl HunterClass for BmHunter {
///     // Override pet damage modifier for BM-specific bonuses
///     fn pet_damage_modifier(&self, state: &SimState) -> f32 {
///         let base = 1.0;
///         if state.player.buffs.has(BESTIAL_WRATH_BUFF, state.now()) {
///             base * 2.0  // Bestial Wrath doubles pet damage
///         } else {
///             base
///         }
///     }
/// }
/// ```
pub trait HunterClass: SpecHandler {
    // ========================================================================
    // Resource Management
    // ========================================================================

    /// Base focus regeneration per second (before haste).
    ///
    /// Override this for talents/effects that modify base regen.
    fn base_focus_regen(&self) -> f32 {
        FOCUS_REGEN_BASE
    }

    /// Calculate current focus regeneration rate.
    ///
    /// Takes haste into account.
    fn focus_regen(&self, state: &SimState) -> f32 {
        let haste = state.player.stats.haste();
        self.base_focus_regen() * haste
    }

    // ========================================================================
    // Pet Mechanics
    // ========================================================================

    /// Pet damage modifier (multiplier applied to all pet damage).
    ///
    /// Override for specs with pet damage bonuses (e.g., BM's Bestial Wrath).
    fn pet_damage_modifier(&self, _state: &SimState) -> f32 {
        1.0
    }

    /// Pet attack speed modifier (multiplier for attack speed).
    ///
    /// Override for specs with pet haste effects (e.g., Frenzy stacks).
    fn pet_attack_speed_modifier(&self, _state: &SimState) -> f32 {
        1.0
    }

    /// Default pet attack behavior.
    ///
    /// Called from `on_pet_attack` to handle the base pet attack logic.
    /// Returns the damage dealt.
    fn do_pet_attack(&self, state: &mut SimState, pet: UnitIdx) -> f32 {
        let now = state.now();

        // Verify pet is valid
        if !state
            .pets
            .get(pet)
            .map(|p| p.is_valid(now))
            .unwrap_or(false)
        {
            return 0.0;
        }

        // Calculate damage with modifiers
        let damage =
            calculate_pet_damage(state, PET_AUTO_ATTACK_COEF, self.pet_damage_modifier(state));
        state.record_damage(damage);

        damage
    }

    /// Schedule next pet attack.
    ///
    /// Call this after processing the current pet attack.
    fn schedule_next_pet_attack(&self, state: &mut SimState, pet: UnitIdx) {
        if state.finished {
            return;
        }

        let haste = state.player.stats.haste() * self.pet_attack_speed_modifier(state);
        let base_speed = PET_ATTACK_SPEED.as_millis() as f32;
        let speed =
            wowlab_common::types::SimTime::from_millis(((base_speed / haste) as u32).max(100));
        state.schedule_in(speed, crate::core::SimEvent::PetAttack { pet });
    }

    // ========================================================================
    // Shared Abilities
    // ========================================================================

    /// Check if Kill Shot can be used on the target.
    fn can_kill_shot(&self, state: &SimState, target: TargetIdx) -> bool {
        can_use_kill_shot(state, target)
    }

    /// Execute Kill Shot on a target.
    ///
    /// Returns the damage dealt.
    fn do_kill_shot(&self, state: &mut SimState, _target: TargetIdx) -> f32 {
        let damage = calculate_kill_shot_damage(state);
        state.record_damage(damage);
        damage
    }

    // ========================================================================
    // Damage Calculation
    // ========================================================================

    /// Calculate damage with Hunter-specific modifiers.
    ///
    /// This wraps the base damage calculation and adds any class-wide
    /// damage modifiers (e.g., mastery, talents).
    fn calculate_hunter_damage(
        &self,
        state: &mut SimState,
        base: f32,
        ap_coef: f32,
        sp_coef: f32,
        school: DamageSchool,
    ) -> f32 {
        // Use the SpecHandler's calculate_damage method
        self.calculate_damage(state, base, ap_coef, sp_coef, school)
    }

    // ========================================================================
    // Auto-Attack
    // ========================================================================

    /// Get ranged auto-attack speed with haste.
    fn ranged_attack_speed(&self, state: &SimState) -> wowlab_common::types::SimTime {
        let haste = state.player.stats.haste();
        ranged_attack_speed(haste)
    }
}
