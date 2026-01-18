//! Decision context for APL evaluation.

use super::SimState;
use crate::types::SimTime;

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
        self.state
            .player
            .cooldown(spell)
            .map(|cd| cd.is_ready(self.now))
            .unwrap_or(true)
    }

    /// Get cooldown remaining
    pub fn cooldown_remaining(&self, spell: crate::types::SpellIdx) -> SimTime {
        self.state
            .player
            .cooldown(spell)
            .map(|cd| cd.remaining(self.now))
            .unwrap_or(SimTime::ZERO)
    }

    /// Check if player can cast (not on GCD, not casting)
    pub fn can_cast(&self) -> bool {
        self.state.player.can_cast(self.now)
    }

    /// Get primary resource amount
    pub fn resource(&self) -> f32 {
        self.state
            .player
            .resources
            .primary
            .as_ref()
            .map(|r| r.current)
            .unwrap_or(0.0)
    }

    /// Get resource deficit
    pub fn resource_deficit(&self) -> f32 {
        self.state
            .player
            .resources
            .primary
            .as_ref()
            .map(|r| r.deficit())
            .unwrap_or(0.0)
    }

    /// Get primary target health percent
    pub fn target_health_pct(&self) -> f32 {
        self.state
            .enemies
            .primary()
            .map(|e| e.health_percent())
            .unwrap_or(1.0)
    }

    /// Get active enemy count
    pub fn enemy_count(&self) -> usize {
        self.state.enemies.alive_count()
    }
}
