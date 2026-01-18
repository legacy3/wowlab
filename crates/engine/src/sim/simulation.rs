//! Simulation - owns handler and state together.
//!
//! This struct solves the borrow checker issue where we need to call
//! `handler.on_gcd(&mut state)`. By owning both, we can borrow them separately.

use super::{SimConfig, SimState};
use crate::actor::Player;
use crate::core::{ScheduledEvent, SimEvent};
use crate::handler::SpecHandler;
use crate::resource::ResourceRegen;
use crate::types::SimTime;
use std::sync::Arc;
use tracing::{debug, trace};

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
        debug!(
            duration_secs = self.state.config.duration.as_secs_f32(),
            targets = self.state.config.target_count,
            seed = self.state.config.seed,
            iteration = self.state.iteration,
            "Simulation iteration starting"
        );

        let mut prev_time = SimTime::ZERO;
        let mut event_count = 0u32;
        let mut gcd_count = 0u32;
        let mut resource_tick_count = 0u32;
        let mut total_time_jumps = 0u32;
        let mut max_jump_ms = 0u32;

        while let Some(event) = self.state.events.pop() {
            if self.state.finished {
                break;
            }

            let event_time = event.time;
            let jump_ms = event_time.as_millis().saturating_sub(prev_time.as_millis());

            if jump_ms > 0 {
                total_time_jumps += 1;
                if jump_ms > max_jump_ms {
                    max_jump_ms = jump_ms;
                }
            }

            // Log time jump details at trace level
            trace!(
                prev_ms = prev_time.as_millis(),
                now_ms = event_time.as_millis(),
                jump_ms = jump_ms,
                event = ?event.event,
                "Time advance"
            );

            // Advance simulation time to the event time
            self.state.advance_time(event_time);
            prev_time = event_time;
            event_count += 1;

            match &event.event {
                SimEvent::GcdEnd => gcd_count += 1,
                SimEvent::ResourceTick => resource_tick_count += 1,
                _ => {}
            }

            self.handle_event(event);
        }

        debug!(
            iteration = self.state.iteration,
            total_damage = self.state.total_damage,
            dps = self.state.current_dps(),
            event_count = event_count,
            gcd_events = gcd_count,
            resource_ticks = resource_tick_count,
            time_jumps = total_time_jumps,
            max_jump_ms = max_jump_ms,
            events_scheduled = self.state.events.events_scheduled,
            "Simulation iteration finished"
        );
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
