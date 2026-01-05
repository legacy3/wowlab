//! BM Hunter spec handler - uses definitions from spells.rs, auras.rs, pet.rs

use crate::types::{SpecId, SpellIdx, AuraIdx, TargetIdx, SimTime, PetKind, DamageSchool};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::spec::{SpellDef, AuraDef, AuraEffect, GcdType, SpellFlags};
use crate::combat::{Cooldown, ChargedCooldown, DamagePipeline};
use crate::aura::AuraInstance;
use crate::actor::Player;
use crate::rotation::{Rotation, Action};
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::pet::PetDamage;
use super::procs::setup_procs;
use super::rotation::{BmHunterBindings, spell_name_to_idx};
use tracing::debug;

static BM_ROTATION: std::sync::OnceLock<Rotation<BmHunterBindings>> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

fn get_rotation() -> &'static Rotation<BmHunterBindings> {
    BM_ROTATION.get().expect("BM Hunter rotation not initialized")
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

/// Get haste per stack from aura effects
fn aura_haste_per_stack(aura: &AuraDef) -> f32 {
    for effect in &aura.effects {
        if let AuraEffect::DerivedPercent { stat: crate::types::DerivedStat::Haste, amount } = effect {
            return *amount;
        }
    }
    0.0
}

pub struct BeastMasteryHandler;

impl BeastMasteryHandler {
    pub fn init_rotation(script: &str) -> Result<(), String> {
        let rotation = Rotation::new(script, BmHunterBindings::new())
            .map_err(|e| format!("Failed to compile rotation: {}", e))?;
        BM_ROTATION.set(rotation).map_err(|_| "Rotation already initialized".to_string())?;
        Ok(())
    }

    pub fn init_player(player: &mut Player) {
        player.spec = SpecId::BeastMastery;
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);

        for spell in spell_definitions() {
            if spell.charges > 0 {
                player.add_charged_cooldown(spell.id, ChargedCooldown::new(spell.charges, spell.charge_time.as_secs_f32()));
            } else if spell.cooldown > SimTime::ZERO {
                player.add_cooldown(spell.id, Cooldown::new(spell.cooldown.as_secs_f32()));
            }
        }
        setup_procs(&mut player.procs);
    }

    pub fn init_sim(state: &mut SimState) {
        Self::init_player(&mut state.player);
        let pet_id = state.pets.summon(state.player.id, PetKind::Permanent, "Pet");
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });
        state.events.schedule(SimTime::ZERO, SimEvent::PetAttack { pet: pet_id });
    }

    pub fn handle_gcd(state: &mut SimState) {
        if state.finished { return; }

        match get_rotation().next_action(state) {
            Action::Cast(name) => {
                if let Some(spell) = spell_name_to_idx(&name) {
                    Self::cast_spell(state, spell, TargetIdx(0));
                } else {
                    state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd);
                }
            }
            Action::Wait(secs) => {
                state.schedule_in(SimTime::from_secs_f32(secs as f32), SimEvent::GcdEnd);
            }
            _ => state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd),
        }
    }

    pub fn cast_spell(state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let now = state.now();
        let haste = state.player.stats.haste();

        for cost in &spell.costs {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.spend(cost.amount);
            }
        }

        for gain in &spell.gains {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.gain(gain.amount);
            }
        }

        if spell.charges > 0 {
            if let Some(cd) = state.player.charged_cooldown_mut(spell_id) {
                cd.spend(now, haste);
            }
        } else if spell.cooldown > SimTime::ZERO {
            if let Some(cd) = state.player.cooldown_mut(spell_id) {
                cd.start(now, haste);
            }
        }

        for &aura_id in &spell.apply_auras {
            Self::apply_aura(state, aura_id, target);
        }

        Self::handle_spell_effects(state, spell_id);

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

    fn handle_spell_effects(state: &mut SimState, spell_id: SpellIdx) {
        if spell_id == COBRA_SHOT {
            if let Some(cd) = state.player.cooldown_mut(KILL_COMMAND) {
                cd.reduce(SimTime::from_secs_f32(COBRA_SHOT_CDR));
            }
        }
    }

    pub fn handle_cast_complete(state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        Self::handle_spell_damage(state, spell, target);
    }

    pub fn handle_spell_damage(state: &mut SimState, spell_id: SpellIdx, _target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let Some(ref dmg) = spell.damage else { return };

        let damage = Self::calculate_damage(state, dmg.base_damage, dmg.ap_coefficient, dmg.sp_coefficient, dmg.school);
        state.record_damage(damage);
        debug!(spell = spell_id.0, damage, "Spell damage");
    }

    pub fn handle_auto_attack(state: &mut SimState, unit: crate::types::UnitIdx) {
        let now = state.now();
        let haste = state.player.stats.haste();

        let damage = Self::calculate_damage(state, 0.0, PetDamage::AUTO_ATTACK_COEF, 0.0, DamageSchool::Physical);
        state.record_damage(damage);

        let crit = state.player.stats.crit_chance();
        if state.rng.roll(crit) && state.rng.roll(WILD_CALL_CHANCE) {
            if let Some(cd) = state.player.charged_cooldown_mut(BARBED_SHOT) {
                if !cd.is_full() {
                    cd.gain_charge(now, haste);
                    debug!("Wild Call proc");
                }
            }
        }

        if !state.finished {
            let speed = SimTime::from_millis(((RANGED_ATTACK_SPEED / haste) as u32).max(100));
            state.schedule_in(speed, SimEvent::AutoAttack { unit });
        }
    }

    pub fn handle_pet_attack(state: &mut SimState, pet: crate::types::UnitIdx) {
        let now = state.now();
        if !state.pets.get(pet).map(|p| p.is_valid(now)).unwrap_or(false) { return; }

        let frenzy_stacks = state.player.buffs.stacks(FRENZY, now);
        let frenzy_haste = get_aura(FRENZY).map(|a| aura_haste_per_stack(a)).unwrap_or(0.10);

        let coef = PetDamage::AUTO_ATTACK_COEF * PetDamage::STAT_INHERITANCE;
        let damage = Self::calculate_damage(state, 0.0, coef, 0.0, DamageSchool::Physical);
        let damage = damage * (1.0 + frenzy_stacks as f32 * frenzy_haste);
        state.record_damage(damage);

        if !state.finished {
            let haste = state.player.stats.haste() * (1.0 + frenzy_stacks as f32 * frenzy_haste);
            let base_speed = PetDamage::ATTACK_SPEED.as_millis() as f32;
            let speed = SimTime::from_millis(((base_speed / haste) as u32).max(100));
            state.schedule_in(speed, SimEvent::PetAttack { pet });
        }
    }

    pub fn handle_aura_tick(state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        if !state.auras.target(target).map(|a| a.has(aura_id, now)).unwrap_or(false) { return; }

        if let Some(aura) = get_aura(aura_id) {
            if let Some(ref periodic) = aura.periodic {
                let damage = Self::calculate_damage(state, 0.0, periodic.ap_coefficient, periodic.sp_coefficient, DamageSchool::Physical);
                state.record_damage(damage);
                state.schedule_in(periodic.interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        }
    }

    fn apply_aura(state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        let Some(aura) = get_aura(aura_id) else { return };

        let mut instance = AuraInstance::new(aura_id, target, aura.duration, now, aura.flags);
        if aura.max_stacks > 1 {
            instance = instance.with_stacks(aura.max_stacks);
        }

        let schedule_tick = aura.periodic.as_ref().map(|p| p.interval);

        if aura.flags.is_debuff {
            if let Some(target_auras) = state.auras.target_mut(target) {
                if let Some(ref periodic) = aura.periodic {
                    instance = instance.with_periodic(periodic.interval, now);
                }
                target_auras.apply(instance, now);
            }
        } else {
            state.player.buffs.apply(instance, now);
        }

        if let Some(interval) = schedule_tick {
            if aura.flags.is_debuff {
                state.schedule_in(interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        }
    }

    fn calculate_damage(state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool) -> f32 {
        let ap = state.player.stats.attack_power();
        let sp = state.player.stats.spell_power();
        let crit = state.player.stats.crit_chance();
        let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

        let result = DamagePipeline::calculate(base, ap_coef, sp_coef, ap, sp, &state.multipliers, crit, school, armor, &mut state.rng);
        let mut damage = result.final_amount;

        if let Some(bw) = get_aura(BESTIAL_WRATH_BUFF) {
            if state.player.buffs.has(BESTIAL_WRATH_BUFF, state.now()) {
                damage *= aura_damage_multiplier(bw);
            }
        }

        damage
    }
}
