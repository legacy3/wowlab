use crate::types::SimTime;
use crate::core::{SimEvent, ScheduledEvent};
use crate::resource::ResourceRegen;
use super::SimState;

/// Handles event execution
pub struct SimExecutor;

impl SimExecutor {
    /// Run one iteration of the simulation
    pub fn run(state: &mut SimState) {
        while let Some(event) = state.events.pop() {
            if state.finished {
                break;
            }

            // Advance simulation time to the event time
            state.advance_time(event.time);

            Self::handle_event(state, event);
        }
    }

    /// Process a single event
    fn handle_event(state: &mut SimState, event: ScheduledEvent) {
        match event.event {
            SimEvent::SimEnd => {
                state.finished = true;
            }

            SimEvent::GcdEnd => {
                // GCD finished, rotation can proceed
                // The APL will be called on the next decision point
            }

            SimEvent::CastComplete { spell, target } => {
                // Cast finished, apply effects
                // This would be handled by the spec-specific logic
                let _ = (spell, target); // Suppress unused warnings for now
            }

            SimEvent::SpellDamage { spell, target, snapshot_id } => {
                // Damage lands after travel time
                // Apply damage using snapshotted stats
                let _ = (spell, target, snapshot_id); // Suppress unused warnings for now
            }

            SimEvent::AuraExpire { aura, target } => {
                // Remove aura from target
                if let Some(auras) = state.auras.target_mut(target) {
                    auras.remove(aura);
                }
            }

            SimEvent::AuraTick { aura, target } => {
                // Process periodic tick
                // Calculate damage using snapshotted stats
                let _ = (aura, target); // Suppress unused warnings for now
            }

            SimEvent::CooldownReady { spell } => {
                // Cooldown finished, can cast again
                let _ = spell; // Suppress unused warnings for now
            }

            SimEvent::ChargeReady { spell } => {
                // Charge regenerated
                let haste = state.player.stats.haste();
                let now = state.now();
                if let Some(cd) = state.player.charged_cooldown_mut(spell) {
                    cd.gain_charge(now, haste);
                }
            }

            SimEvent::AutoAttack { unit } => {
                // Process auto-attack
                // Schedule next auto
                let _ = unit; // Suppress unused warnings for now
            }

            SimEvent::PetAttack { pet } => {
                // Process pet auto-attack
                let now = state.now();
                if let Some(p) = state.pets.get_mut(pet) {
                    if p.is_valid(now) {
                        // Deal damage, schedule next
                    }
                }
            }

            SimEvent::ResourceTick => {
                // Regenerate resources
                Self::handle_resource_tick(state);

                // Schedule next tick
                if !state.finished {
                    state.schedule_in(
                        SimTime::from_millis(100),
                        SimEvent::ResourceTick,
                    );
                }
            }

            SimEvent::ProcIcdEnd { proc } => {
                // ICD finished, proc can trigger again
                let _ = proc; // Suppress unused warnings for now
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
