//! BM Hunter spec handler using declarative effects.
//!
//! This handler delegates to the generic effect executor, keeping
//! spec-specific code minimal.

use super::auras::aura_definitions;
use super::constants::*;
use super::pet::PetDamage;
use super::procs::{setup_procs, setup_procs_with_talents, setup_tier_set_procs};
use super::rotation::{spec_resolver, spell_id_to_idx, spell_name_to_idx};
use super::spells::spell_definitions;
use super::talents::{active_talents, collect_damage_mods};
use crate::actor::Player;
use crate::aura::AuraInstance;
use crate::class::HunterClass;
use crate::combat::{ChargedCooldown, Cooldown};
use crate::core::SimEvent;
use crate::handler::SpecHandler;
use crate::rotation::{Action, CompiledRotation};
use crate::sim::SimState;
use crate::spec::{
    calculate_damage, execute_effects, AuraDef, DamageContext, EffectContext, GcdType, SpellDef,
    SpellFlags,
};
use tracing::debug;
use wowlab_common::types::{
    AuraIdx, ClassId, DamageSchool, PetKind, SimTime, SpecId, SpellIdx, TargetIdx, UnitIdx,
};

static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

/// Ensure spell and aura definitions are initialized (idempotent).
fn ensure_definitions() {
    SPELL_DEFS.get_or_init(spell_definitions);
    AURA_DEFS.get_or_init(aura_definitions);
}

fn get_spell(id: SpellIdx) -> Option<&'static SpellDef> {
    SPELL_DEFS.get()?.iter().find(|s| s.id == id)
}

fn get_aura(id: AuraIdx) -> Option<&'static AuraDef> {
    AURA_DEFS.get()?.iter().find(|a| a.id == id)
}

fn get_spell_defs() -> &'static [SpellDef] {
    // SAFETY: ensure_definitions() is called in BmHunter::new() before any access
    SPELL_DEFS
        .get()
        .expect("BM Hunter spell definitions not initialized")
}

fn get_aura_defs() -> &'static [AuraDef] {
    // SAFETY: ensure_definitions() is called in BmHunter::new() before any access
    AURA_DEFS
        .get()
        .expect("BM Hunter aura definitions not initialized")
}

/// BM Hunter spec handler.
pub struct BmHunter {
    talents: TalentFlags,
    tier_sets: TierSetFlags,
    rotation: CompiledRotation,
    /// Cached talent names for hot path (computed once at creation).
    cached_talent_names: Vec<&'static str>,
    /// Cached damage modifiers for hot path (computed once at creation).
    cached_damage_mods: Vec<crate::spec::DamageMod>,
}

impl BmHunter {
    /// Create a new BM Hunter handler with the given rotation and talents.
    pub fn new(
        rotation_json: &str,
        talents: TalentFlags,
        tier_sets: TierSetFlags,
    ) -> Result<Self, String> {
        ensure_definitions();

        let resolver = spec_resolver(talents);
        let rotation = CompiledRotation::compile_json(rotation_json, &resolver)
            .map_err(|e| format!("Compile error: {}", e))?;

        // Pre-compute and cache for hot path performance
        let cached_talent_names = active_talents(talents);
        let cached_damage_mods = collect_damage_mods(talents);

        Ok(Self {
            talents,
            tier_sets,
            rotation,
            cached_talent_names,
            cached_damage_mods,
        })
    }

    /// Create with default empty rotation (for tests/simple cases).
    pub fn with_defaults() -> Result<Self, String> {
        Self::new(
            r#"{"actions":[]}"#,
            TalentFlags::empty(),
            TierSetFlags::NONE,
        )
    }

    /// Create with talents and default rotation.
    pub fn with_talents(rotation_json: &str, talents: TalentFlags) -> Result<Self, String> {
        Self::new(rotation_json, talents, TierSetFlags::NONE)
    }

    pub fn has_talent(&self, talent: TalentFlags) -> bool {
        self.talents.contains(talent)
    }

    pub fn has_tier_set(&self, tier_set: TierSetFlags) -> bool {
        self.tier_sets.contains(tier_set)
    }

    /// Cast a spell using the effect system.
    fn do_cast(&self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else {
            return;
        };
        let now = state.now();
        let haste = state.player.stats.haste();

        // Pay costs
        for cost in &spell.costs {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.spend(cost.amount);
            }
        }

        // Gain resources
        for gain in &spell.gains {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.gain(gain.amount);
            }
        }

        // Handle cooldowns
        if spell.charges > 0 {
            if let Some(cd) = state.player.charged_cooldown_mut(spell_id) {
                cd.spend(now, haste);
            }
        } else if spell.cooldown > SimTime::ZERO {
            if let Some(cd) = state.player.cooldown_mut(spell_id) {
                cd.start(now, haste);
            }
        }

        // Apply auras from spell definition
        for &aura_id in &spell.apply_auras {
            self.apply_aura(state, aura_id, target);
        }

        // Execute declarative effects
        let mut ctx = EffectContext {
            state,
            spell,
            target,
            talents: &self.cached_talent_names,
            get_aura: &|id| get_aura(id),
        };
        execute_effects(&mut ctx);

        // Handle GCD
        let is_off_gcd = spell.gcd == GcdType::None || spell.flags.contains(SpellFlags::OFF_GCD);
        if is_off_gcd {
            state.events.schedule(now, SimEvent::GcdEnd);
        } else {
            let gcd = spell.gcd_duration(haste);
            state.player.start_gcd(gcd, now);
            state.schedule_in(gcd, SimEvent::GcdEnd);
        }

        state.events.schedule(
            now,
            SimEvent::CastComplete {
                spell: spell_id,
                target,
            },
        );
    }

    fn apply_aura(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        let Some(aura) = get_aura(aura_id) else {
            return;
        };

        let mut instance = AuraInstance::new(aura_id, target, aura.duration, now, aura.flags);
        if aura.max_stacks > 1 {
            instance = instance.with_stacks(aura.max_stacks);
        }

        if aura.flags.is_debuff {
            if let Some(ref periodic) = aura.periodic {
                instance = instance.with_periodic(periodic.interval, now);
            }
            if let Some(target_auras) = state.auras.target_mut(target) {
                target_auras.apply(instance, now);
            }
            if let Some(ref periodic) = aura.periodic {
                state.schedule_in(
                    periodic.interval,
                    SimEvent::AuraTick {
                        aura: aura_id,
                        target,
                    },
                );
            }
        } else {
            state.player.buffs.apply(instance, now);
        }
    }

    /// Calculate damage using the modifier system.
    fn do_damage(
        &self,
        state: &mut SimState,
        spell_id: Option<SpellIdx>,
        target: TargetIdx,
        ap_coef: f32,
        sp_coef: f32,
        school: DamageSchool,
    ) -> f32 {
        let spell = spell_id.and_then(get_spell);

        let mut ctx = DamageContext {
            state,
            spell,
            spell_id,
            target,
            talents: &self.cached_talent_names,
            modifiers: &self.cached_damage_mods,
            is_crit: false,
        };

        calculate_damage(&mut ctx, 0.0, ap_coef, sp_coef, school)
    }

    fn mastery_pet_damage_bonus(&self, state: &SimState) -> f32 {
        state.player.stats.mastery()
    }
}

impl SpecHandler for BmHunter {
    fn spec_id(&self) -> SpecId {
        SpecId::BeastMastery
    }
    fn class_id(&self) -> ClassId {
        ClassId::Hunter
    }

    fn display_name(&self) -> &'static str {
        "Beast Mastery Hunter"
    }

    fn spell_definitions(&self) -> &'static [SpellDef] {
        get_spell_defs()
    }

    fn aura_definitions(&self) -> &'static [AuraDef] {
        get_aura_defs()
    }

    fn talent_names(&self) -> Vec<String> {
        super::talents::talent_definitions()
            .into_iter()
            .map(|t| t.name)
            .collect()
    }

    fn init(&self, state: &mut SimState) {
        let pet_id = state
            .pets
            .summon(state.player.id, PetKind::Permanent, "Pet");
        state.events.schedule(
            SimTime::ZERO,
            SimEvent::AutoAttack {
                unit: state.player.id,
            },
        );
        state
            .events
            .schedule(SimTime::ZERO, SimEvent::PetAttack { pet: pet_id });

        if self.has_talent(TalentFlags::ANIMAL_COMPANION) {
            let ac_pet = state
                .pets
                .summon(state.player.id, PetKind::Permanent, "Animal Companion");
            state
                .events
                .schedule(SimTime::ZERO, SimEvent::PetAttack { pet: ac_pet });
        }
    }

    fn init_player(&self, player: &mut Player) {
        player.spec = SpecId::BeastMastery;
        player.resources = crate::resource::UnitResources::new()
            .with_primary(wowlab_common::types::ResourceType::Focus);

        for spell in get_spell_defs() {
            if spell.charges > 0 {
                let mut charges = spell.charges;
                if spell.id == BARBED_SHOT && self.has_talent(TalentFlags::ALPHA_PREDATOR) {
                    charges += 1;
                }
                player.add_charged_cooldown(
                    spell.id,
                    ChargedCooldown::new(charges, spell.charge_time.as_secs_f32()),
                );
            } else if spell.cooldown > SimTime::ZERO {
                player.add_cooldown(spell.id, Cooldown::new(spell.cooldown.as_secs_f32()));
            }
        }

        if self.talents.is_empty() {
            setup_procs(&mut player.procs);
        } else {
            setup_procs_with_talents(&mut player.procs, self.talents);
        }

        if !self.tier_sets.is_empty() {
            setup_tier_set_procs(&mut player.procs, self.tier_sets);
        }
    }

    fn on_gcd(&self, state: &mut SimState) {
        if state.finished {
            return;
        }

        let result = self.rotation.evaluate(state);

        if result.is_cast() {
            if let Some(spell) = spell_id_to_idx(result.spell_id) {
                self.do_cast(state, spell, TargetIdx(0));
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

    fn on_spell_damage(&self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else {
            return;
        };
        let Some(ref dmg) = spell.damage else { return };

        let damage = self.do_damage(
            state,
            Some(spell_id),
            target,
            dmg.ap_coefficient,
            dmg.sp_coefficient,
            dmg.school,
        );
        state.record_damage(damage);
        debug!(spell = spell_id.0, damage, "Spell damage");
    }

    fn on_auto_attack(&self, state: &mut SimState, unit: UnitIdx) {
        let now = state.now();
        let haste = state.player.stats.haste();

        let damage = self.do_damage(
            state,
            None,
            TargetIdx(0),
            PetDamage::AUTO_ATTACK_COEF,
            0.0,
            DamageSchool::Physical,
        );
        state.record_damage(damage);

        // Wild Call proc
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
            let speed = <Self as HunterClass>::ranged_attack_speed(self, state);
            state.schedule_in(speed, SimEvent::AutoAttack { unit });
        }
    }

    fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx) {
        let damage = <Self as HunterClass>::do_pet_attack(self, state, pet);
        if damage > 0.0 {
            debug!(pet = pet.0, damage, "Pet attack");
        }

        // Brutal Companion extra attack
        if self.has_talent(TalentFlags::BRUTAL_COMPANION) {
            let frenzy_stacks = state.player.buffs.stacks(FRENZY, state.now());
            if frenzy_stacks >= FRENZY_MAX_STACKS {
                let extra = <Self as HunterClass>::do_pet_attack(self, state, pet);
                debug!(pet = pet.0, extra, "Brutal Companion");
            }
        }

        <Self as HunterClass>::schedule_next_pet_attack(self, state, pet);
    }

    fn on_aura_tick(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        if !state
            .auras
            .target(target)
            .map(|a| a.has(aura_id, now))
            .unwrap_or(false)
        {
            return;
        }

        if let Some(aura) = get_aura(aura_id) {
            if let Some(ref periodic) = aura.periodic {
                let damage = self.do_damage(
                    state,
                    None,
                    target,
                    periodic.ap_coefficient,
                    periodic.sp_coefficient,
                    DamageSchool::Physical,
                );
                state.record_damage(damage);

                // Master Handler: Barbed Shot ticks reduce KC CD
                if aura_id == BARBED_SHOT_DOT && self.has_talent(TalentFlags::MASTER_HANDLER) {
                    if let Some(cd) = state.player.cooldown_mut(KILL_COMMAND) {
                        cd.reduce(SimTime::from_secs_f32(MASTER_HANDLER_CDR));
                    }
                }

                state.schedule_in(
                    periodic.interval,
                    SimEvent::AuraTick {
                        aura: aura_id,
                        target,
                    },
                );
            }
        }
    }

    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        self.do_cast(state, spell, target);
    }

    fn next_action(&self, state: &SimState) -> Action {
        let result = self.rotation.evaluate(state);
        if result.is_cast() {
            spell_id_to_idx(result.spell_id)
                .map(Action::Cast)
                .unwrap_or(Action::WaitGcd)
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
            "bestial_wrath" => Some(BESTIAL_WRATH_BUFF),
            "frenzy" => Some(FRENZY),
            "barbed_shot" => Some(BARBED_SHOT_DOT),
            "beast_cleave" => Some(BEAST_CLEAVE),
            _ => None,
        }
    }

    fn calculate_damage(
        &self,
        state: &mut SimState,
        _base: f32,
        ap_coef: f32,
        sp_coef: f32,
        school: DamageSchool,
    ) -> f32 {
        self.do_damage(state, None, TargetIdx(0), ap_coef, sp_coef, school)
    }
}

impl HunterClass for BmHunter {
    fn pet_damage_modifier(&self, state: &SimState) -> f32 {
        let now = state.now();
        let mut modifier = 1.0;

        // Mastery: Master of Beasts
        modifier *= 1.0 + self.mastery_pet_damage_bonus(state);

        // Bestial Wrath
        if state.player.buffs.has(BESTIAL_WRATH_BUFF, now) {
            modifier *= 1.25;
        }

        // Training Expert
        if self.has_talent(TalentFlags::TRAINING_EXPERT) {
            modifier *= 1.0 + TRAINING_EXPERT_BONUS;
        }

        // Wild Hunt
        modifier *= 1.0 + WILD_HUNT_DAMAGE_BONUS;

        modifier
    }

    fn pet_attack_speed_modifier(&self, state: &SimState) -> f32 {
        let now = state.now();
        let frenzy_stacks = state.player.buffs.stacks(FRENZY, now);
        1.0 + frenzy_stacks as f32 * 0.10
    }
}
