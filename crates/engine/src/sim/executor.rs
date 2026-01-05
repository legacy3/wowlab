use crate::types::{SimTime, SpecId};
use crate::core::{SimEvent, ScheduledEvent};
use crate::resource::ResourceRegen;
use crate::specs::BeastMasteryHandler;
use super::SimState;
use tracing::debug;

/// Handles event execution
pub struct SimExecutor;

impl SimExecutor {
    /// Run one iteration of the simulation
    pub fn run(state: &mut SimState) {
        debug!(
            duration_secs = state.config.duration.as_secs_f32(),
            targets = state.config.target_count,
            seed = state.config.seed,
            iteration = state.iteration,
            "Simulation iteration starting"
        );

        while let Some(event) = state.events.pop() {
            if state.finished {
                break;
            }

            // Advance simulation time to the event time
            state.advance_time(event.time);

            Self::handle_event(state, event);
        }

        debug!(
            iteration = state.iteration,
            total_damage = state.total_damage,
            dps = state.current_dps(),
            "Simulation iteration finished"
        );
    }

    /// Process a single event
    fn handle_event(state: &mut SimState, event: ScheduledEvent) {
        match event.event {
            SimEvent::SimEnd => {
                state.finished = true;
            }

            SimEvent::GcdEnd => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_gcd(state),
                    _ => {}
                }
            }

            SimEvent::CastComplete { spell, target } => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_cast_complete(state, spell, target),
                    _ => {}
                }
            }

            SimEvent::SpellDamage { spell, target, snapshot_id } => {
                let _ = snapshot_id;
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_spell_damage(state, spell, target),
                    _ => {}
                }
            }

            SimEvent::AuraExpire { aura, target } => {
                if let Some(auras) = state.auras.target_mut(target) {
                    auras.remove(aura);
                }
            }

            SimEvent::AuraTick { aura, target } => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_aura_tick(state, aura, target),
                    _ => {}
                }
            }

            SimEvent::CooldownReady { spell } => {
                let _ = spell;
            }

            SimEvent::ChargeReady { spell } => {
                let haste = state.player.stats.haste();
                let now = state.now();
                if let Some(cd) = state.player.charged_cooldown_mut(spell) {
                    cd.gain_charge(now, haste);
                }
            }

            SimEvent::AutoAttack { unit } => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_auto_attack(state, unit),
                    _ => {}
                }
            }

            SimEvent::PetAttack { pet } => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_pet_attack(state, pet),
                    _ => {}
                }
            }

            SimEvent::ResourceTick => {
                Self::handle_resource_tick(state);

                if !state.finished {
                    state.schedule_in(
                        SimTime::from_millis(100),
                        SimEvent::ResourceTick,
                    );
                }
            }

            SimEvent::ProcIcdEnd { proc } => {
                let _ = proc;
            }
        }
    }

    /// Handle resource regeneration
    fn handle_resource_tick(state: &mut SimState) {
        let haste = state.player.stats.haste();
        let tick_duration = SimTime::from_millis(100);

        if let Some(ref mut primary) = state.player.resources.primary {
            ResourceRegen::apply(primary, tick_duration, haste);
        }
    }
}

/// Decision context for APL
#[derive(Clone, Debug)]
pub struct DecisionContext<'a> {
    pub state: &'a SimState,
    pub now: SimTime,
}

impl<'a> DecisionContext<'a> {
    pub fn new(state: &'a SimState) -> Self {
        Self {
            now: state.now(),
            state,
        }
    }

    /// Time until something happens
    pub fn time_until(&self, target_time: SimTime) -> SimTime {
        target_time.saturating_sub(self.now)
    }

    /// Check if buff is active
    pub fn buff_up(&self, aura: crate::types::AuraIdx) -> bool {
        self.state.player.buffs.has(aura, self.now)
    }

    /// Get buff stacks
    pub fn buff_stacks(&self, aura: crate::types::AuraIdx) -> u8 {
        self.state.player.buffs.stacks(aura, self.now)
    }

    /// Check if cooldown is ready
    pub fn cooldown_ready(&self, spell: crate::types::SpellIdx) -> bool {
        self.state.player.cooldown(spell)
            .map(|cd| cd.is_ready(self.now))
            .unwrap_or(true)
    }

    /// Get cooldown remaining
    pub fn cooldown_remaining(&self, spell: crate::types::SpellIdx) -> SimTime {
        self.state.player.cooldown(spell)
            .map(|cd| cd.remaining(self.now))
            .unwrap_or(SimTime::ZERO)
    }

    /// Check if player can cast (not on GCD, not casting)
    pub fn can_cast(&self) -> bool {
        self.state.player.can_cast(self.now)
    }

    /// Get primary resource amount
    pub fn resource(&self) -> f32 {
        self.state.player.resources.primary
            .as_ref()
            .map(|r| r.current)
            .unwrap_or(0.0)
    }

    /// Get resource deficit
    pub fn resource_deficit(&self) -> f32 {
        self.state.player.resources.primary
            .as_ref()
            .map(|r| r.deficit())
            .unwrap_or(0.0)
    }

    /// Get primary target health percent
    pub fn target_health_pct(&self) -> f32 {
        self.state.enemies.primary()
            .map(|e| e.health_percent())
            .unwrap_or(1.0)
    }

    /// Get active enemy count
    pub fn enemy_count(&self) -> usize {
        self.state.enemies.alive_count()
    }
}
