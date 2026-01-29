//! Simulation - owns handler and state together.
//!
//! This struct solves the borrow checker issue where we need to call
//! `handler.on_gcd(&mut state)`. By owning both, we can borrow them separately.

use super::{SimConfig, SimState};
use crate::actor::Player;
use crate::core::{ScheduledEvent, SimEvent};
use crate::handler::SpecHandler;
use crate::resource::ResourceRegen;
use std::sync::Arc;
use wowlab_common::types::SimTime;

/// Simulation combining handler and state.
///
/// This struct solves the borrow checker challenge of calling
/// `state.handler.on_gcd(&mut state)` by owning handler and state
/// separately, allowing independent borrows.
pub struct Simulation {
    /// The spec-specific handler.
    pub handler: Arc<dyn SpecHandler>,
    /// The simulation state.
    pub state: SimState,
}

impl Simulation {
    /// Create a new simulation with the given handler and config.
    pub fn new(handler: Arc<dyn SpecHandler>, config: SimConfig, mut player: Player) -> Self {
        // Initialize player with spec-specific setup
        handler.init_player(&mut player);

        // Create state
        let mut state = SimState::new(config, player);

        // Initialize simulation with spec-specific setup (pets, events, etc.)
        handler.init(&mut state);

        Self { handler, state }
    }

    /// Run one iteration of the simulation.
    pub fn run(&mut self) {
        while let Some(event) = self.state.events.pop() {
            if self.state.finished {
                break;
            }

            self.state.advance_time(event.time);
            self.handle_event(event);
        }
    }

    /// Reset simulation for next iteration.
    pub fn reset(&mut self, iteration: u32) {
        self.state.reset(iteration);
        self.handler.init(&mut self.state);
    }

    /// Get final DPS.
    pub fn dps(&self) -> f64 {
        self.state.current_dps()
    }

    /// Get total damage.
    pub fn total_damage(&self) -> f64 {
        self.state.total_damage
    }

    /// Process a single event.
    fn handle_event(&mut self, event: ScheduledEvent) {
        match event.event {
            SimEvent::SimEnd => {
                self.state.finished = true;
            }

            SimEvent::GcdEnd => {
                self.handler.on_gcd(&mut self.state);
            }

            SimEvent::CastComplete { spell, target } => {
                self.handler
                    .on_cast_complete(&mut self.state, spell, target);
            }

            SimEvent::SpellDamage {
                spell,
                target,
                snapshot_id: _,
            } => {
                self.handler.on_spell_damage(&mut self.state, spell, target);
            }

            SimEvent::AuraExpire { aura, target } => {
                if let Some(auras) = self.state.auras.target_mut(target) {
                    auras.remove(aura);
                }
                self.handler.on_aura_expire(&mut self.state, aura, target);
            }

            SimEvent::AuraTick { aura, target } => {
                self.handler.on_aura_tick(&mut self.state, aura, target);
            }

            SimEvent::CooldownReady { spell: _ } => {
                // Cooldown ready events are informational
            }

            SimEvent::ChargeReady { spell } => {
                let haste = self.state.player.stats.haste();
                let now = self.state.now();
                if let Some(cd) = self.state.player.charged_cooldown_mut(spell) {
                    cd.gain_charge(now, haste);
                }
            }

            SimEvent::AutoAttack { unit } => {
                self.handler.on_auto_attack(&mut self.state, unit);
            }

            SimEvent::PetAttack { pet } => {
                self.handler.on_pet_attack(&mut self.state, pet);
            }

            SimEvent::ResourceTick => {
                self.handle_resource_tick();

                if !self.state.finished {
                    self.state
                        .schedule_in(SimTime::from_millis(100), SimEvent::ResourceTick);
                }
            }

            SimEvent::ProcIcdEnd { proc: _ } => {
                // Proc ICD end events are informational
            }
        }
    }

    /// Handle resource regeneration.
    fn handle_resource_tick(&mut self) {
        let haste = self.state.player.stats.haste();
        let tick_duration = SimTime::from_millis(100);

        if let Some(ref mut primary) = self.state.player.resources.primary {
            ResourceRegen::apply(primary, tick_duration, haste);
        }
    }
}
