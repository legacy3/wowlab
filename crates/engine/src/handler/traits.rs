//! Core spec handler trait.
//!
//! All specializations must implement this trait to participate in the simulation.

use crate::actor::Player;
use crate::rotation::Action;
use crate::sim::SimState;
use crate::spec::{AuraDef, SpellDef};
use wowlab_types::{AuraIdx, ClassId, DamageSchool, SpecId, SpellIdx, TargetIdx, UnitIdx};

/// Core trait all specs must implement.
///
/// This trait defines the interface between the simulation executor and
/// spec-specific game logic. By using trait objects, we eliminate match
/// statements and enable true polymorphism.
pub trait SpecHandler: Send + Sync {
    // === Identity ===

    /// Returns the spec identifier.
    fn spec_id(&self) -> SpecId;

    /// Returns the class identifier.
    fn class_id(&self) -> ClassId {
        self.spec_id().class()
    }

    /// Returns the WoW API spec ID (e.g., 253 for BM Hunter).
    fn wow_spec_id(&self) -> u32 {
        self.spec_id().wow_spec_id()
    }

    /// Returns the WoW API class ID (e.g., 3 for Hunter).
    fn wow_class_id(&self) -> u32 {
        self.class_id() as u32
    }

    /// Human-readable display name for the spec.
    fn display_name(&self) -> &'static str;

    // === Coverage Methods ===

    /// Returns all spell definitions implemented by this spec.
    fn spell_definitions(&self) -> &'static [SpellDef];

    /// Returns all aura definitions implemented by this spec.
    fn aura_definitions(&self) -> &'static [AuraDef];

    /// Returns all talent names for this spec.
    fn talent_names(&self) -> Vec<String>;

    // === Initialization ===

    /// Initialize simulation state (pets, events, etc.).
    fn init(&self, state: &mut SimState);

    /// Initialize player state (resources, cooldowns, procs).
    fn init_player(&self, player: &mut Player);

    // === Event Handlers ===

    /// Called when GCD ends and rotation can make a decision.
    fn on_gcd(&self, state: &mut SimState);

    /// Called when a spell cast completes.
    fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx);

    /// Called when spell damage is applied.
    fn on_spell_damage(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx);

    /// Called on player auto-attack.
    fn on_auto_attack(&self, state: &mut SimState, unit: UnitIdx);

    /// Called on pet auto-attack.
    fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx);

    /// Called on aura periodic tick.
    fn on_aura_tick(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx);

    /// Called when an aura is applied.
    fn on_aura_apply(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx) {
        let _ = (state, aura, target);
    }

    /// Called when an aura expires.
    fn on_aura_expire(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx) {
        let _ = (state, aura, target);
    }

    // === Actions ===

    /// Cast a spell on a target.
    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx);

    // === Rotation ===

    /// Get the next action from the rotation.
    fn next_action(&self, state: &SimState) -> Action;

    // === Spell/Aura Lookup ===

    /// Get spell definition by ID.
    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef>;

    /// Get aura definition by ID.
    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef>;

    /// Convert spell name to ID.
    fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx>;

    /// Convert aura name to ID.
    fn aura_name_to_idx(&self, name: &str) -> Option<AuraIdx>;

    // === Default Implementations ===

    /// Calculate damage using the standard pipeline.
    ///
    /// Specs can override this to apply spec-specific modifiers.
    fn calculate_damage(
        &self,
        state: &mut SimState,
        base: f32,
        ap_coef: f32,
        sp_coef: f32,
        school: DamageSchool,
    ) -> f32 {
        use crate::combat::DamagePipeline;

        let ap = state.player.stats.attack_power();
        let sp = state.player.stats.spell_power();
        let crit = state.player.stats.crit_chance();
        let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

        let result = DamagePipeline::calculate(
            base,
            ap_coef,
            sp_coef,
            ap,
            sp,
            &state.multipliers,
            crit,
            school,
            armor,
            &mut state.rng,
        );

        result.final_amount
    }
}
