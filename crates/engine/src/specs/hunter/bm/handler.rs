use crate::types::{SpecId, SpellIdx, AuraIdx, TargetIdx, SimTime, PetKind};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::combat::{ActionState, Cooldown, ChargedCooldown};
use crate::aura::{AuraInstance, AuraFlags};
use crate::actor::Player;
use crate::stats::SpecCoefficients;
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::procs::setup_procs;
use super::pet::PetDamage;

/// BM Hunter spec handler
pub struct BeastMasteryHandler {
    spells: Vec<crate::spec::SpellDef>,
    auras: Vec<crate::spec::AuraDef>,
}

impl BeastMasteryHandler {
    pub fn new() -> Self {
        Self {
            spells: spell_definitions(),
            auras: aura_definitions(),
        }
    }

    /// Get spec coefficients
    pub fn coefficients() -> SpecCoefficients {
        SpecCoefficients::for_spec(SpecId::BeastMastery)
    }

    /// Initialize player for BM Hunter
    pub fn init_player(player: &mut Player) {
        player.spec = SpecId::BeastMastery;

        // Setup resources
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);

        // Setup cooldowns
        player.add_cooldown(KILL_COMMAND, Cooldown::new(7.5));
        player.add_cooldown(BESTIAL_WRATH, Cooldown::new(BESTIAL_WRATH_COOLDOWN));
        player.add_cooldown(KILL_SHOT, Cooldown::new(10.0));

        // Setup charged cooldowns
        player.add_charged_cooldown(BARBED_SHOT, ChargedCooldown::new(
            BARBED_SHOT_CHARGES,
            BARBED_SHOT_RECHARGE,
        ));

        // Setup procs
        setup_procs(&mut player.procs);
    }

    /// Initialize simulation state for BM Hunter
    pub fn init_sim(state: &mut SimState) {
        Self::init_player(&mut state.player);

        // Add pet
        state.pets.summon(state.player.id, PetKind::Permanent, "Pet");

        // Schedule first auto-attack
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });

        // Schedule pet auto-attack
        state.events.schedule(SimTime::ZERO, SimEvent::PetAttack { pet: crate::types::UnitIdx(1) });
    }

    /// Get spell definition by ID
    pub fn spell(&self, id: SpellIdx) -> Option<&crate::spec::SpellDef> {
        self.spells.iter().find(|s| s.id == id)
    }

    /// Get aura definition by ID
    pub fn aura(&self, id: AuraIdx) -> Option<&crate::spec::AuraDef> {
        self.auras.iter().find(|a| a.id == id)
    }

    /// Check if Kill Shot is usable (target < 20%)
    pub fn can_kill_shot(state: &SimState) -> bool {
        state.enemies.primary()
            .map(|e| e.health_percent() < 0.20)
            .unwrap_or(false)
    }

    /// Calculate Kill Command damage
    pub fn calc_kill_command(state: &SimState) -> f32 {
        let ap = state.player.stats.attack_power();
        let coef = PetDamage::KILL_COMMAND_COEF;

        let mut damage = ap * coef;

        // Apply Bestial Wrath
        if state.player.buffs.has(BESTIAL_WRATH_BUFF, state.now()) {
            damage *= 1.25;
        }

        damage
    }

    /// Calculate Cobra Shot damage
    pub fn calc_cobra_shot(state: &SimState) -> f32 {
        let ap = state.player.stats.attack_power();
        let coef = 0.4;

        ap * coef
    }

    /// Create action state snapshot from player
    fn snapshot_from_player(player: &Player) -> ActionState {
        let mut state = ActionState::new();
        state.attack_power = player.stats.attack_power();
        state.spell_power = player.stats.spell_power();
        state.crit_chance = player.stats.crit_chance();
        state.haste = player.stats.haste();
        state.versatility = player.stats.versatility();
        state.mastery = player.stats.mastery();
        state
    }

    /// Apply Barbed Shot effects
    pub fn apply_barbed_shot(state: &mut SimState, target: TargetIdx) {
        let now = state.now();

        // Apply/refresh Barbed Shot DoT
        if let Some(target_auras) = state.auras.target_mut(target) {
            let dot = AuraInstance::new(
                BARBED_SHOT_DOT,
                target,
                SimTime::from_secs(8),
                now,
                AuraFlags {
                    is_debuff: true,
                    is_periodic: true,
                    can_pandemic: true,
                    snapshots: true,
                    refreshable: true,
                    ..Default::default()
                },
            ).with_periodic(SimTime::from_secs(2), now)
             .with_snapshot(Self::snapshot_from_player(&state.player));

            target_auras.apply(dot, now);
        }

        // Apply/refresh Frenzy stacks
        let frenzy = AuraInstance::new(
            FRENZY,
            TargetIdx(0), // Player buff
            SimTime::from_secs_f32(FRENZY_DURATION),
            now,
            AuraFlags {
                refreshable: true,
                ..Default::default()
            },
        ).with_stacks(FRENZY_MAX_STACKS);

        state.player.buffs.apply(frenzy, now);
    }

    /// Apply Bestial Wrath
    pub fn apply_bestial_wrath(state: &mut SimState) {
        let now = state.now();

        let buff = AuraInstance::new(
            BESTIAL_WRATH_BUFF,
            TargetIdx(0),
            SimTime::from_secs_f32(BESTIAL_WRATH_DURATION),
            now,
            AuraFlags::default(),
        );

        state.player.buffs.apply(buff, now);
    }
}

impl Default for BeastMasteryHandler {
    fn default() -> Self {
        Self::new()
    }
}
