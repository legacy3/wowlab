//! BM Hunter spec handler - uses definitions from spells.rs, auras.rs, pet.rs

use crate::handler::SpecHandler;
use crate::class::HunterClass;
use crate::types::{SpecId, ClassId, SpellIdx, AuraIdx, TargetIdx, UnitIdx, SimTime, PetKind, DamageSchool, HitResult};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::spec::{SpellDef, AuraDef, AuraEffect, GcdType, SpellFlags};
use crate::combat::{Cooldown, ChargedCooldown, DamagePipeline};
use crate::aura::AuraInstance;
use crate::actor::Player;
use crate::rotation::{Rotation, Action};
use crate::data::{TuningData, apply_spell_overrides, apply_aura_overrides};
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::pet::PetDamage;
use super::procs::{setup_procs, setup_procs_with_talents, setup_tier_set_procs};
use super::rotation::{BmHunterBindings, spell_name_to_idx};
use tracing::debug;

static BM_ROTATION: std::sync::OnceLock<Rotation<BmHunterBindings>> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

fn get_rotation() -> &'static Rotation<BmHunterBindings> {
    BM_ROTATION.get().expect("BM Hunter rotation not initialized")
}

fn get_spell(id: SpellIdx) -> Option<&'static SpellDef> {
    SPELL_DEFS.get()
        .expect("BM Hunter spell definitions not initialized")
        .iter()
        .find(|s| s.id == id)
}

fn get_aura(id: AuraIdx) -> Option<&'static AuraDef> {
    AURA_DEFS.get()
        .expect("BM Hunter aura definitions not initialized")
        .iter()
        .find(|a| a.id == id)
}

fn get_spell_defs() -> &'static [SpellDef] {
    SPELL_DEFS.get()
        .expect("BM Hunter spell definitions not initialized")
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

/// BM Hunter spec handler implementing the SpecHandler trait.
///
/// This struct enables polymorphic dispatch for BM Hunter specific logic.
pub struct BmHunter {
    /// Enabled talents
    talents: TalentFlags,
    /// Enabled tier sets
    tier_sets: TierSetFlags,
    /// Animal Companion pet ID (if enabled)
    animal_companion_pet: Option<UnitIdx>,
    /// Active Dire Beasts
    dire_beasts: Vec<(UnitIdx, SimTime)>, // (pet_id, expire_time)
    /// Call of the Wild active
    cotw_active: bool,
    /// Next CotW summon time
    cotw_next_summon: SimTime,
    /// Huntmaster's Call stacks (for Fenryr/Hati summon)
    huntsmasters_stacks: u8,
}

impl BmHunter {
    /// Create a new BM Hunter handler.
    pub fn new() -> Self {
        Self {
            talents: TalentFlags::empty(),
            tier_sets: TierSetFlags::NONE,
            animal_companion_pet: None,
            dire_beasts: Vec::new(),
            cotw_active: false,
            cotw_next_summon: SimTime::ZERO,
            huntsmasters_stacks: 0,
        }
    }

    /// Create a new BM Hunter handler with talents.
    pub fn with_talents(talents: TalentFlags) -> Self {
        Self {
            talents,
            tier_sets: TierSetFlags::NONE,
            animal_companion_pet: None,
            dire_beasts: Vec::new(),
            cotw_active: false,
            cotw_next_summon: SimTime::ZERO,
            huntsmasters_stacks: 0,
        }
    }

    /// Create a new BM Hunter handler with talents and tier sets.
    pub fn with_talents_and_tier_sets(talents: TalentFlags, tier_sets: TierSetFlags) -> Self {
        Self {
            talents,
            tier_sets,
            animal_companion_pet: None,
            dire_beasts: Vec::new(),
            cotw_active: false,
            cotw_next_summon: SimTime::ZERO,
            huntsmasters_stacks: 0,
        }
    }

    /// Check if talent is enabled
    pub fn has_talent(&self, talent: TalentFlags) -> bool {
        self.talents.contains(talent)
    }

    /// Check if tier set is enabled
    pub fn has_tier_set(&self, tier_set: TierSetFlags) -> bool {
        self.tier_sets.contains(tier_set)
    }

    /// Get mastery bonus for pet damage (Master of Beasts)
    fn mastery_pet_damage_bonus(&self, state: &SimState) -> f32 {
        // BM Mastery: Master of Beasts - increases pet damage by mastery %
        // The stat cache already computed the final mastery percentage
        state.player.stats.mastery()
    }

    /// Initialize the rotation from a script.
    pub fn init_rotation(script: &str) -> Result<(), String> {
        Self::init_rotation_with_tuning(script, &TuningData::empty())
    }

    /// Initialize the rotation with tuning overrides.
    pub fn init_rotation_with_tuning(script: &str, tuning: &TuningData) -> Result<(), String> {
        // Initialize spell definitions with tuning
        let mut spells = spell_definitions();
        apply_spell_overrides(&mut spells, &tuning.spell);
        SPELL_DEFS.set(spells).map_err(|_| "Spell definitions already initialized".to_string())?;

        // Initialize aura definitions with tuning
        let mut auras = aura_definitions();
        apply_aura_overrides(&mut auras, &tuning.aura);
        AURA_DEFS.set(auras).map_err(|_| "Aura definitions already initialized".to_string())?;

        // Compile rotation
        let rotation = Rotation::new(script, BmHunterBindings::new())
            .map_err(|e| format!("Failed to compile rotation: {}", e))?;
        BM_ROTATION.set(rotation).map_err(|_| "Rotation already initialized".to_string())?;

        Ok(())
    }

    /// Internal helper to cast a spell
    fn do_cast_spell(&mut self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let now = state.now();
        let haste = state.player.stats.haste();

        // Handle costs (check for free cast buffs)
        let is_free = self.check_free_cast(state, spell_id);
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
            self.apply_aura(state, aura_id, target);
        }

        self.handle_spell_effects(state, spell_id, target);

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

    /// Check if current cast should be free
    fn check_free_cast(&self, state: &mut SimState, spell_id: SpellIdx) -> bool {
        let now = state.now();

        // Snakeskin Quiver: Free Cobra Shot
        if spell_id == COBRA_SHOT && state.player.buffs.has(SNAKESKIN_QUIVER_PROC, now) {
            state.player.buffs.remove(SNAKESKIN_QUIVER_PROC);
            debug!("Snakeskin Quiver consumed - free Cobra Shot");
            return true;
        }

        // Withering Fire: Free abilities during CDs (stacks)
        if self.has_talent(TalentFlags::WITHERING_FIRE) && state.player.buffs.has(WITHERING_FIRE, now) {
            let stacks = state.player.buffs.stacks(WITHERING_FIRE, now);
            if stacks > 1 {
                // Decrement stacks by modifying the aura
                if let Some(aura) = state.player.buffs.get_mut(WITHERING_FIRE) {
                    aura.stacks = aura.stacks.saturating_sub(1);
                }
                debug!("Withering Fire consumed - free ability");
                return true;
            } else if stacks == 1 {
                state.player.buffs.remove(WITHERING_FIRE);
                debug!("Withering Fire consumed (last stack) - free ability");
                return true;
            }
        }

        false
    }

    fn handle_spell_effects(&mut self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let now = state.now();

        // Cobra Shot reduces Kill Command CD
        if spell_id == COBRA_SHOT {
            if let Some(cd) = state.player.cooldown_mut(KILL_COMMAND) {
                cd.reduce(SimTime::from_secs_f32(COBRA_SHOT_CDR));
            }
        }

        // Kill Command effects
        if spell_id == KILL_COMMAND {
            // Animal Companion: Second pet also uses KC
            if let Some(ac_pet) = self.animal_companion_pet {
                let damage = self.calculate_pet_kc_damage(state);
                state.record_damage(damage * 0.65); // Reduced damage for AC
                debug!(pet = ac_pet.0, damage = damage * 0.65, "Animal Companion KC");
            }

            // Kill Cleave: KC cleaves during Beast Cleave
            if self.has_talent(TalentFlags::KILL_CLEAVE) && state.player.buffs.has(BEAST_CLEAVE, now) {
                let kc_damage = self.calculate_pet_kc_damage(state);
                let cleave_damage = kc_damage * KILL_CLEAVE_DAMAGE;
                state.record_damage(cleave_damage);
                debug!(cleave_damage, "Kill Cleave");
            }

            // Wild Instincts: Apply debuff during Call of the Wild
            if self.has_talent(TalentFlags::WILD_INSTINCTS) && self.cotw_active {
                self.apply_aura(state, WILD_INSTINCTS, target);
            }
        }

        // Bestial Wrath effects
        if spell_id == BESTIAL_WRATH {
            // Thundering Hooves: Cast Explosive Shot
            if self.has_talent(TalentFlags::THUNDERING_HOOVES) {
                state.events.schedule(now, SimEvent::CastComplete { spell: EXPLOSIVE_SHOT, target });
            }
        }

        // Call of the Wild effects
        if spell_id == CALL_OF_THE_WILD {
            self.cotw_active = true;
            self.cotw_next_summon = now;

            // Bloody Frenzy: Beast Cleave active during CotW
            if self.has_talent(TalentFlags::BLOODY_FRENZY) {
                self.apply_aura(state, BEAST_CLEAVE, TargetIdx(0));
            }
        }

        // Dire Beast summon
        if spell_id == DIRE_BEAST {
            self.summon_dire_beast(state, false);
        }
    }

    fn apply_aura(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
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

    fn do_calculate_damage(&self, state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool, spell_id: Option<SpellIdx>) -> f32 {
        let ap = state.player.stats.attack_power();
        let sp = state.player.stats.spell_power();
        let crit = state.player.stats.crit_chance();
        let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);
        let now = state.now();

        let result = DamagePipeline::calculate(base, ap_coef, sp_coef, ap, sp, &state.multipliers, crit, school, armor, &mut state.rng);
        let mut damage = result.final_amount;
        let is_crit = result.hit_result == HitResult::Crit;

        // Bestial Wrath damage bonus
        if let Some(bw) = get_aura(BESTIAL_WRATH_BUFF) {
            if state.player.buffs.has(BESTIAL_WRATH_BUFF, now) {
                damage *= aura_damage_multiplier(bw);
            }
        }

        // Serpentine Rhythm: Bonus damage for Cobra Shot based on stacks
        if self.has_talent(TalentFlags::SERPENTINE_RHYTHM) {
            if spell_id == Some(COBRA_SHOT) {
                let stacks = state.player.buffs.stacks(SERPENTINE_RHYTHM, now);
                if stacks > 0 {
                    damage *= 1.0 + (stacks as f32 * SERPENTINE_RHYTHM_DAMAGE);
                    state.player.buffs.remove(SERPENTINE_RHYTHM);
                }
            }
        }

        // Killer Instinct: +50% damage vs targets below 35% HP
        if self.has_talent(TalentFlags::KILLER_INSTINCT) {
            if let Some(enemy) = state.enemies.primary() {
                let health_pct = enemy.current_health / enemy.max_health;
                if health_pct < KILLER_INSTINCT_THRESHOLD {
                    damage *= 1.0 + KILLER_INSTINCT_BONUS;
                }
            }
        }

        // Alpha Predator: +30% KC damage
        if self.has_talent(TalentFlags::ALPHA_PREDATOR) && spell_id == Some(KILL_COMMAND) {
            damage *= 1.0 + ALPHA_PREDATOR_KC_BONUS;
        }

        // Go for the Throat: KC crit damage scales with crit rating
        if self.has_talent(TalentFlags::GO_FOR_THE_THROAT) && spell_id == Some(KILL_COMMAND) {
            if is_crit {
                let crit_bonus = crit * GO_FOR_THE_THROAT_SCALING;
                damage *= 1.0 + crit_bonus;
            }
        }

        // Pack Mentality: KC damage bonus with special pet
        if self.has_talent(TalentFlags::PACK_MENTALITY) && spell_id == Some(KILL_COMMAND) {
            if state.player.buffs.has(PACK_MENTALITY, now) {
                damage *= 1.0 + PACK_MENTALITY_BONUS;
            }
        }

        // Wild Instincts: KC bonus vs debuffed targets
        if self.has_talent(TalentFlags::WILD_INSTINCTS) && spell_id == Some(KILL_COMMAND) {
            if let Some(target_auras) = state.auras.target(TargetIdx(0)) {
                if target_auras.has(WILD_INSTINCTS, now) {
                    let stacks = target_auras.stacks(WILD_INSTINCTS, now);
                    damage *= 1.0 + (stacks as f32 * 0.05);
                }
            }
        }

        // Solitary Companion: +10% damage without Animal Companion
        if self.has_talent(TalentFlags::SOLITARY_COMPANION) && self.animal_companion_pet.is_none() {
            damage *= 1.10;
        }

        // Training Expert: +10% pet damage (for pet abilities)
        if self.has_talent(TalentFlags::TRAINING_EXPERT) {
            if let Some(spell) = spell_id.and_then(get_spell) {
                if spell.flags.contains(SpellFlags::PET_ABILITY) {
                    damage *= 1.0 + TRAINING_EXPERT_BONUS;
                }
            }
        }

        damage
    }

    /// Calculate pet Kill Command damage
    fn calculate_pet_kc_damage(&self, state: &SimState) -> f32 {
        let ap = state.player.stats.attack_power();
        ap * PetDamage::STAT_INHERITANCE * PetDamage::KILL_COMMAND_COEF
    }

    /// Summon a Dire Beast
    fn summon_dire_beast(&mut self, state: &mut SimState, is_special: bool) {
        let now = state.now();
        let name = if is_special { "Hati" } else { "Dire Beast" };
        let pet_id = state.pets.summon(state.player.id, PetKind::Guardian, name);

        let duration = if self.has_talent(TalentFlags::DIRE_FRENZY) {
            DIRE_BEAST_DURATION + DIRE_FRENZY_EXTENSION
        } else {
            DIRE_BEAST_DURATION
        };

        let expire_time = now + SimTime::from_secs_f32(duration);
        self.dire_beasts.push((pet_id, expire_time));

        // Schedule attacks
        state.events.schedule(now, SimEvent::PetAttack { pet: pet_id });

        debug!(pet = pet_id.0, duration, special = is_special, "Summoned Dire Beast");
    }

    /// Clean up expired Dire Beasts
    #[allow(dead_code)]
    fn cleanup_dire_beasts(&mut self, now: SimTime) {
        self.dire_beasts.retain(|(_, expire)| *expire > now);
    }
}

impl Default for BmHunter {
    fn default() -> Self {
        Self::new()
    }
}

impl SpecHandler for BmHunter {
    fn spec_id(&self) -> SpecId {
        SpecId::BeastMastery
    }

    fn class_id(&self) -> ClassId {
        ClassId::Hunter
    }

    fn init(&self, state: &mut SimState) {
        let pet_id = state.pets.summon(state.player.id, PetKind::Permanent, "Pet");
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });
        state.events.schedule(SimTime::ZERO, SimEvent::PetAttack { pet: pet_id });

        // Animal Companion: Summon second permanent pet
        if self.has_talent(TalentFlags::ANIMAL_COMPANION) {
            let ac_pet = state.pets.summon(state.player.id, PetKind::Permanent, "Animal Companion");
            state.events.schedule(SimTime::ZERO, SimEvent::PetAttack { pet: ac_pet });
        }
    }

    fn init_player(&self, player: &mut Player) {
        player.spec = SpecId::BeastMastery;
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);

        // Use tuned spell definitions
        for spell in get_spell_defs() {
            if spell.charges > 0 {
                let mut charges = spell.charges;
                // Alpha Predator: +1 Barbed Shot charge
                if spell.id == BARBED_SHOT && self.has_talent(TalentFlags::ALPHA_PREDATOR) {
                    charges += 1;
                }
                player.add_charged_cooldown(spell.id, ChargedCooldown::new(charges, spell.charge_time.as_secs_f32()));
            } else if spell.cooldown > SimTime::ZERO {
                player.add_cooldown(spell.id, Cooldown::new(spell.cooldown.as_secs_f32()));
            }
        }

        // Setup procs based on talents
        if self.talents.is_empty() {
            setup_procs(&mut player.procs);
        } else {
            setup_procs_with_talents(&mut player.procs, self.talents);
        }

        // Setup tier set procs
        if !self.tier_sets.is_empty() {
            setup_tier_set_procs(&mut player.procs, self.tier_sets);
        }
    }

    fn on_gcd(&self, state: &mut SimState) {
        if state.finished { return; }

        match get_rotation().next_action(state) {
            Action::Cast(name) => {
                if let Some(spell) = spell_name_to_idx(&name) {
                    let handler = BmHunter::with_talents(self.talents);
                    handler.cast_spell(state, spell, TargetIdx(0));
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
        let now = state.now();
        let haste = state.player.stats.haste();

        let damage = self.do_calculate_damage(state, 0.0, PetDamage::AUTO_ATTACK_COEF, 0.0, DamageSchool::Physical, None);
        state.record_damage(damage);

        // Wild Call: critical auto-attacks have a chance to reset Barbed Shot
        let crit = state.player.stats.crit_chance();
        if state.rng.roll(crit) && state.rng.roll(WILD_CALL_CHANCE) {
            if let Some(cd) = state.player.charged_cooldown_mut(BARBED_SHOT) {
                if !cd.is_full() {
                    cd.gain_charge(now, haste);
                    debug!("Wild Call proc");
                }
            }
        }

        // Schedule next auto-attack using class method
        if !state.finished {
            let speed = <Self as HunterClass>::ranged_attack_speed(self, state);
            state.schedule_in(speed, SimEvent::AutoAttack { unit });
        }
    }

    fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx) {
        // Use HunterClass shared pet attack behavior
        let damage = <Self as HunterClass>::do_pet_attack(self, state, pet);
        if damage > 0.0 {
            debug!(pet = pet.0, damage, "Pet attack");
        }

        // Brutal Companion: Extra attack at max Frenzy
        if self.has_talent(TalentFlags::BRUTAL_COMPANION) {
            let frenzy_stacks = state.player.buffs.stacks(FRENZY, state.now());
            if frenzy_stacks >= FRENZY_MAX_STACKS {
                // Extra basic attack
                let extra_damage = <Self as HunterClass>::do_pet_attack(self, state, pet);
                debug!(pet = pet.0, extra_damage, "Brutal Companion extra attack");
            }
        }

        // Schedule next pet attack using class method
        <Self as HunterClass>::schedule_next_pet_attack(self, state, pet);
    }

    fn on_aura_tick(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        if !state.auras.target(target).map(|a| a.has(aura_id, now)).unwrap_or(false) { return; }

        if let Some(aura) = get_aura(aura_id) {
            if let Some(ref periodic) = aura.periodic {
                let damage = self.do_calculate_damage(state, 0.0, periodic.ap_coefficient, periodic.sp_coefficient, DamageSchool::Physical, None);
                state.record_damage(damage);

                // Master Handler: Barbed Shot ticks reduce KC CD
                if aura_id == BARBED_SHOT_DOT && self.has_talent(TalentFlags::MASTER_HANDLER) {
                    if let Some(cd) = state.player.cooldown_mut(KILL_COMMAND) {
                        cd.reduce(SimTime::from_secs_f32(MASTER_HANDLER_CDR));
                        debug!("Master Handler: KC CD reduced");
                    }
                }

                state.schedule_in(periodic.interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        }
    }

    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        let mut handler = BmHunter::with_talents(self.talents);
        handler.do_cast_spell(state, spell, target);
    }

    fn next_action(&self, state: &SimState) -> Action {
        get_rotation().next_action(state)
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
            "call_of_the_wild" => Some(CALL_OF_THE_WILD_BUFF),
            "bloodshed" => Some(BLOODSHED_DEBUFF),
            "thrill_of_the_hunt" => Some(THRILL_OF_THE_HUNT),
            "serpentine_rhythm" => Some(SERPENTINE_RHYTHM),
            "piercing_fangs" => Some(PIERCING_FANGS),
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

impl HunterClass for BmHunter {
    /// BM Hunter pet damage modifier.
    ///
    /// Includes mastery (Master of Beasts), Bestial Wrath, talents, and tier sets.
    fn pet_damage_modifier(&self, state: &SimState) -> f32 {
        let mut modifier = 1.0;
        let now = state.now();

        // Master of Beasts (Mastery): Pet damage scales with mastery
        let mastery = self.mastery_pet_damage_bonus(state);
        modifier *= 1.0 + mastery;

        // Bestial Wrath: +25% damage
        if state.player.buffs.has(BESTIAL_WRATH_BUFF, now) {
            if let Some(bw) = get_aura(BESTIAL_WRATH_BUFF) {
                modifier *= aura_damage_multiplier(bw);
            }
        }

        // Training Expert: +10% pet damage
        if self.has_talent(TalentFlags::TRAINING_EXPERT) {
            modifier *= 1.0 + TRAINING_EXPERT_BONUS;
        }

        // Piercing Fangs: Pet crit damage during BW
        if self.has_talent(TalentFlags::PIERCING_FANGS) && state.player.buffs.has(PIERCING_FANGS, now) {
            modifier *= 1.0 + PIERCING_FANGS_CRIT_DAMAGE;
        }

        // Solitary Companion: +10% without Animal Companion
        if self.has_talent(TalentFlags::SOLITARY_COMPANION) && !self.has_talent(TalentFlags::ANIMAL_COMPANION) {
            modifier *= 1.10;
        }

        // Wild Hunt: +10% when pet focus > 50 (approximated - always active for simplicity)
        // In WoW, this affects pets at high focus; we assume good play keeps focus high
        modifier *= 1.0 + WILD_HUNT_DAMAGE_BONUS;

        // TWW S2 4pc: Potent Mutagen pet buff
        if self.has_tier_set(TierSetFlags::TWW_S2_4PC) && state.player.buffs.has(POTENT_MUTAGEN, now) {
            modifier *= 1.0 + TWW_S2_4PC_DAMAGE_BONUS;
        }

        modifier
    }

    /// BM Hunter pet attack speed modifier.
    ///
    /// Frenzy stacks increase pet attack speed.
    fn pet_attack_speed_modifier(&self, state: &SimState) -> f32 {
        let now = state.now();
        let frenzy_stacks = state.player.buffs.stacks(FRENZY, now);
        let frenzy_haste = get_aura(FRENZY)
            .map(|a| aura_haste_per_stack(a))
            .unwrap_or(0.10);

        1.0 + frenzy_stacks as f32 * frenzy_haste
    }
}
