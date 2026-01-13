//! MM Hunter spec handler - uses definitions from spells.rs, auras.rs

use crate::handler::SpecHandler;
use crate::class::HunterClass;
use crate::types::{SpecId, ClassId, SpellIdx, AuraIdx, TargetIdx, UnitIdx, SimTime, DamageSchool};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::spec::{SpellDef, AuraDef, AuraEffect, GcdType, SpellFlags};
use crate::combat::{Cooldown, DamagePipeline};
use crate::aura::{AuraInstance, AuraFlags};
use crate::actor::Player;
use crate::rotation::{Action, CompiledRotation, Rotation};
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::procs::setup_procs;
use super::rotation::{spec_resolver, spell_name_to_idx, spell_id_to_idx};
use tracing::debug;

static MM_ROTATION: std::sync::OnceLock<CompiledRotation> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

/// Hidden aura for tracking Steady Shot count for Steady Focus
const STEADY_SHOT_TRACKER: AuraIdx = AuraIdx(999001);

fn get_rotation() -> &'static CompiledRotation {
    MM_ROTATION.get().expect("MM Hunter rotation not initialized")
}

fn get_spell(id: SpellIdx) -> Option<&'static SpellDef> {
    SPELL_DEFS.get_or_init(spell_definitions).iter().find(|s| s.id == id)
}

fn get_aura(id: AuraIdx) -> Option<&'static AuraDef> {
    AURA_DEFS.get_or_init(aura_definitions).iter().find(|a| a.id == id)
}

/// Get damage multiplier from aura effects
fn aura_damage_multiplier(aura: &AuraDef) -> f32 {
    for effect in &aura.effects {
        if let AuraEffect::DamageMultiplier { amount, .. } = effect {
            return *amount;
        }
    }
    1.0
}

/// MM Hunter spec handler implementing the SpecHandler trait.
///
/// Marksmanship focuses on ranged damage with careful shot placement.
/// Unlike BM, MM can operate without a pet using Lone Wolf.
pub struct MmHunter;

impl MmHunter {
    /// Create a new MM Hunter handler.
    pub fn new() -> Self {
        Self
    }

    /// Initialize the rotation from JSON.
    pub fn init_rotation(json: &str) -> Result<(), String> {
        let rotation = Rotation::from_json(json)
            .map_err(|e| format!("Failed to parse rotation: {}", e))?;
        let resolver = spec_resolver(TalentFlags::empty());
        let compiled = CompiledRotation::compile(&rotation, &resolver)
            .map_err(|e| format!("Failed to compile rotation: {}", e))?;
        MM_ROTATION.set(compiled).map_err(|_| "Rotation already initialized".to_string())?;
        Ok(())
    }

    /// Internal helper to cast a spell
    fn do_cast_spell(&self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let now = state.now();
        let haste = state.player.stats.haste();

        // Handle Lock and Load: free instant Aimed Shot
        let is_free = spell_id == AIMED_SHOT && state.player.buffs.has(LOCK_AND_LOAD, now);

        if !is_free {
            for cost in &spell.costs {
                if let Some(ref mut primary) = state.player.resources.primary {
                    primary.spend(cost.amount);
                }
            }
        }

        for gain in &spell.gains {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.gain(gain.amount);
            }
        }

        // Track Steady Focus (two consecutive Steady Shots)
        if spell_id == STEADY_SHOT {
            self.track_steady_focus(state);
        } else {
            // Reset Steady Shot tracker if casting something other than Steady Shot
            state.player.buffs.remove(STEADY_SHOT_TRACKER);
        }

        // Consume Lock and Load
        if is_free {
            state.player.buffs.remove(LOCK_AND_LOAD);
        }

        if spell.cooldown > SimTime::ZERO {
            if let Some(cd) = state.player.cooldown_mut(spell_id) {
                cd.start(now, haste);
            }
        }

        for &aura_id in &spell.apply_auras {
            self.apply_aura(state, aura_id, target);
        }

        // Consume Precise Shots on Arcane Shot or Multi-Shot
        if (spell_id == ARCANE_SHOT || spell_id == MULTI_SHOT)
            && state.player.buffs.has(PRECISE_SHOTS, now)
        {
            if let Some(aura) = state.player.buffs.get_mut(PRECISE_SHOTS) {
                let remaining = aura.remove_stack();
                if remaining == 0 {
                    state.player.buffs.remove(PRECISE_SHOTS);
                }
            }
        }

        let is_off_gcd = spell.gcd == GcdType::None || spell.flags.contains(SpellFlags::OFF_GCD);
        if is_off_gcd {
            state.events.schedule(now, SimEvent::GcdEnd);
        } else {
            let gcd = spell.gcd_duration(haste);
            state.player.start_gcd(gcd, now);
            state.schedule_in(gcd, SimEvent::GcdEnd);
        }

        state.events.schedule(now, SimEvent::CastComplete { spell: spell_id, target });
    }

    /// Track Steady Focus buff application.
    /// Two consecutive Steady Shots apply the buff.
    fn track_steady_focus(&self, state: &mut SimState) {
        let now = state.now();

        // Use a hidden tracking aura to count consecutive Steady Shots
        let count = state.player.buffs.stacks(STEADY_SHOT_TRACKER, now);

        if count == 0 {
            // First Steady Shot - create tracker with 1 stack
            let mut tracker = AuraInstance::new(
                STEADY_SHOT_TRACKER,
                TargetIdx(0),
                SimTime::from_secs(5), // Short duration to reset if gap
                now,
                AuraFlags { is_hidden: true, refreshable: true, ..Default::default() },
            );
            tracker = tracker.with_stacks(2);
            tracker.stacks = 1;
            state.player.buffs.apply(tracker, now);
        } else {
            // Second Steady Shot - apply Steady Focus and reset tracker
            self.apply_aura(state, STEADY_FOCUS, TargetIdx(0));
            state.player.buffs.remove(STEADY_SHOT_TRACKER);
        }
    }

    fn apply_aura(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        let Some(aura) = get_aura(aura_id) else { return };

        let mut instance = AuraInstance::new(aura_id, target, aura.duration, now, aura.flags);
        if aura.max_stacks > 1 {
            instance = instance.with_stacks(aura.max_stacks);
        }

        if aura.flags.is_debuff {
            if let Some(target_auras) = state.auras.target_mut(target) {
                target_auras.apply(instance, now);
            }
        } else {
            state.player.buffs.apply(instance, now);
        }
    }

    fn do_calculate_damage(&self, state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool, spell_id: Option<SpellIdx>) -> f32 {
        let ap = state.player.stats.attack_power();
        let sp = state.player.stats.spell_power();
        let crit = state.player.stats.crit_chance();
        let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);
        let now = state.now();

        let result = DamagePipeline::calculate(base, ap_coef, sp_coef, ap, sp, &state.multipliers, crit, school, armor, &mut state.rng);
        let mut damage = result.final_amount;

        // Trueshot: Bonus damage during cooldown
        if state.player.buffs.has(TRUESHOT_BUFF, now) {
            if let Some(ts) = get_aura(TRUESHOT_BUFF) {
                damage *= aura_damage_multiplier(ts);
            }
        }

        // Lone Wolf: 10% damage bonus when no pet active
        if state.player.buffs.has(LONE_WOLF, now) {
            damage *= 1.0 + LONE_WOLF_DAMAGE;
        }

        // Precise Shots: Arcane Shot and Multi-Shot deal bonus damage
        if let Some(spell) = spell_id {
            if (spell == ARCANE_SHOT || spell == MULTI_SHOT)
                && state.player.buffs.has(PRECISE_SHOTS, now)
            {
                damage *= 1.0 + PRECISE_SHOTS_DAMAGE;
            }
        }

        damage
    }
}

impl Default for MmHunter {
    fn default() -> Self {
        Self::new()
    }
}

impl SpecHandler for MmHunter {
    fn spec_id(&self) -> SpecId {
        SpecId::Marksmanship
    }

    fn class_id(&self) -> ClassId {
        ClassId::Hunter
    }

    fn init(&self, state: &mut SimState) {
        // MM Hunter: Apply Lone Wolf (no pet by default)
        // If pet is desired, summon it and don't apply Lone Wolf
        self.apply_aura(state, LONE_WOLF, TargetIdx(0));

        // Schedule first auto-attack
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });
    }

    fn init_player(&self, player: &mut Player) {
        player.spec = SpecId::Marksmanship;
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);

        for spell in spell_definitions() {
            if spell.cooldown > SimTime::ZERO {
                player.add_cooldown(spell.id, Cooldown::new(spell.cooldown.as_secs_f32()));
            }
        }
        setup_procs(&mut player.procs);
    }

    fn on_gcd(&self, state: &mut SimState) {
        if state.finished { return; }

        let result = get_rotation().evaluate(state);

        if result.is_cast() {
            if let Some(spell) = spell_id_to_idx(result.spell_id) {
                self.cast_spell(state, spell, TargetIdx(0));
            } else {
                state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd);
            }
        } else if result.is_wait() {
            let wait_ms = (result.wait_time * 1000.0) as u32;
            state.schedule_in(SimTime::from_millis(wait_ms.max(100)), SimEvent::GcdEnd);
        } else {
            state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd);
        }
    }

    fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        self.on_spell_damage(state, spell, target);
    }

    fn on_spell_damage(&self, state: &mut SimState, spell_id: SpellIdx, _target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let Some(ref dmg) = spell.damage else { return };

        let damage = self.do_calculate_damage(state, dmg.base_damage, dmg.ap_coefficient, dmg.sp_coefficient, dmg.school, Some(spell_id));
        state.record_damage(damage);
        debug!(spell = spell_id.0, damage, "Spell damage");
    }

    fn on_auto_attack(&self, state: &mut SimState, unit: UnitIdx) {
        let damage = self.do_calculate_damage(state, 0.0, 0.8, 0.0, DamageSchool::Physical, None);
        state.record_damage(damage);

        // Schedule next auto-attack using class method
        if !state.finished {
            let speed = <Self as HunterClass>::ranged_attack_speed(self, state);
            state.schedule_in(speed, SimEvent::AutoAttack { unit });
        }
    }

    fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx) {
        // MM Hunter typically doesn't use a pet (Lone Wolf)
        // But if they do, use HunterClass shared behavior
        let damage = <Self as HunterClass>::do_pet_attack(self, state, pet);
        if damage > 0.0 {
            debug!(pet = pet.0, damage, "Pet attack");
        }
        <Self as HunterClass>::schedule_next_pet_attack(self, state, pet);
    }

    fn on_aura_tick(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        if !state.auras.target(target).map(|a| a.has(aura_id, now)).unwrap_or(false) { return; }

        if let Some(aura) = get_aura(aura_id) {
            if let Some(ref periodic) = aura.periodic {
                let damage = self.do_calculate_damage(state, 0.0, periodic.ap_coefficient, periodic.sp_coefficient, DamageSchool::Physical, None);
                state.record_damage(damage);
                state.schedule_in(periodic.interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        }
    }

    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        self.do_cast_spell(state, spell, target);
    }

    fn next_action(&self, state: &SimState) -> Action {
        let result = get_rotation().evaluate(state);
        if result.is_cast() {
            if let Some(spell_idx) = spell_id_to_idx(result.spell_id) {
                Action::Cast(spell_idx)
            } else {
                Action::WaitGcd
            }
        } else if result.is_wait() {
            Action::Wait(result.wait_time as f64)
        } else {
            Action::WaitGcd
        }
    }

    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef> {
        get_spell(id)
    }

    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef> {
        get_aura(id)
    }

    fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx> {
        spell_name_to_idx(name)
    }

    fn aura_name_to_idx(&self, name: &str) -> Option<AuraIdx> {
        match name {
            "trueshot" => Some(TRUESHOT_BUFF),
            "precise_shots" => Some(PRECISE_SHOTS),
            "steady_focus" => Some(STEADY_FOCUS),
            "lone_wolf" => Some(LONE_WOLF),
            "lock_and_load" => Some(LOCK_AND_LOAD),
            "trick_shots" => Some(TRICK_SHOTS),
            _ => None,
        }
    }

    fn calculate_damage(&self, state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool) -> f32 {
        self.do_calculate_damage(state, base, ap_coef, sp_coef, school, None)
    }
}

// ============================================================================
// HunterClass Implementation
// ============================================================================

impl HunterClass for MmHunter {
    /// MM Hunter pet damage modifier.
    ///
    /// MM typically uses Lone Wolf (no pet), but if pet is active,
    /// use base damage without special modifiers.
    fn pet_damage_modifier(&self, _state: &SimState) -> f32 {
        1.0
    }

    /// MM Hunter pet attack speed modifier.
    ///
    /// No special pet attack speed bonuses for MM.
    fn pet_attack_speed_modifier(&self, _state: &SimState) -> f32 {
        1.0
    }
}
