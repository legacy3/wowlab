//! Condition types and evaluation for predictive rotation gating.
//!
//! Conditions are extracted from the Rhai AST and evaluated against simulation state.
//! Each condition can optionally return a "wake time" indicating when it might become true,
//! enabling the predictive gating optimization.

use crate::sim::SimState;

/// A condition that determines when a spell should be cast.
///
/// Conditions form an expression tree that can be evaluated against simulation state.
/// Most conditions can predict when they will become true, enabling optimization.
#[derive(Debug, Clone)]
#[allow(dead_code)] // Many variants for future condition support
pub enum Condition {
    /// Always true (unconditional cast).
    Always,

    /// Spell is off cooldown or has charges available.
    SpellReady(u8),

    /// Spell has at least N charges.
    SpellCharges { idx: u8, min: u8 },

    /// Spell cooldown remaining is at most N ms.
    SpellCooldownLte { idx: u8, max_ms: u32 },

    /// Aura/buff is currently active.
    AuraActive(u8),

    /// Aura has at least N stacks.
    AuraStacks { idx: u8, min: u8 },

    /// Aura has at least N ms remaining.
    AuraRemainingGte { idx: u8, min_ms: u32 },

    /// Aura has at most N ms remaining.
    AuraRemainingLte { idx: u8, max_ms: u32 },

    /// Resource is at least threshold.
    ResourceGte(f32),

    /// Resource is at most threshold.
    ResourceLte(f32),

    /// Simulation time is at least N ms.
    TimeGte(u32),

    /// Fight remaining time is at most N ms.
    FightRemainsLte(u32),

    /// Target health percentage is below threshold.
    TargetHealthPctLt(f32),

    /// Both conditions must be true.
    And(Box<Condition>, Box<Condition>),

    /// Either condition must be true.
    Or(Box<Condition>, Box<Condition>),

    /// Condition must be false.
    Not(Box<Condition>),
}

impl Condition {
    /// Evaluates the condition against simulation state.
    ///
    /// Returns a tuple of:
    /// - `bool`: Whether the condition is currently true
    /// - `Option<u32>`: Optional wake time in ms when this condition might become true
    ///
    /// The wake time enables predictive gating - if we know when a condition will
    /// become true, we can skip evaluating it until then.
    #[inline(always)]
    pub fn evaluate(&self, state: &SimState, duration_ms: u32) -> (bool, Option<u32>) {
        match self {
            Condition::Always => (true, None),

            Condition::SpellReady(idx) => {
                let spell_state = &state.player.spell_states[*idx as usize];

                // Check charges for charge-based spells (max_charges is duplicated in SpellState)
                if spell_state.max_charges > 0 {
                    let ready = spell_state.charges > 0;
                    let wake = if !ready {
                        Some(spell_state.cooldown_ready)
                    } else {
                        None
                    };
                    return (ready, wake);
                }

                // Check cooldown for regular spells
                let ready = spell_state.cooldown_ready <= state.time;
                let wake = if !ready {
                    Some(spell_state.cooldown_ready)
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::SpellCharges { idx, min } => {
                let spell_state = &state.player.spell_states[*idx as usize];
                let ready = spell_state.charges >= *min;
                // Can't predict when charges will be available (depends on usage)
                (ready, None)
            }

            Condition::SpellCooldownLte { idx, max_ms } => {
                let spell_state = &state.player.spell_states[*idx as usize];
                let remaining = spell_state.cooldown_ready.saturating_sub(state.time);
                let ready = remaining <= *max_ms;
                let wake = if !ready {
                    Some(spell_state.cooldown_ready.saturating_sub(*max_ms))
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::AuraActive(idx) => {
                let remaining = state.player.auras.remaining_slot(*idx as usize, state.time);
                let ready = remaining > 0;
                // Can't predict when aura will be applied (depends on spell usage/procs)
                (ready, None)
            }

            Condition::AuraStacks { idx, min } => {
                let stacks = state.player.auras.stacks_slot(*idx as usize);
                let ready = stacks >= *min;
                (ready, None)
            }

            Condition::AuraRemainingGte { idx, min_ms } => {
                let remaining = state.player.auras.remaining_slot(*idx as usize, state.time);
                let ready = remaining >= *min_ms;
                (ready, None)
            }

            Condition::AuraRemainingLte { idx, max_ms } => {
                let remaining = state.player.auras.remaining_slot(*idx as usize, state.time);
                let active = remaining > 0;
                let ready = active && remaining <= *max_ms;
                // If aura active but remaining > max_ms, wake when it drops below
                let wake = if active && !ready {
                    state
                        .player
                        .auras
                        .get_slot(*idx as usize)
                        .map(|instance| instance.expires.saturating_sub(*max_ms))
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::ResourceGte(threshold) => {
                let current = state.player.resources.current;
                let ready = current >= *threshold;
                let wake = if !ready && state.player.resources.regen_per_second > 0.0 {
                    let needed = *threshold - current;
                    let time_needed = (needed / state.player.resources.regen_per_second * 1000.0) as u32;
                    Some(state.time + time_needed)
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::ResourceLte(threshold) => {
                let ready = state.player.resources.current <= *threshold;
                // Can't predict when resource will decrease (depends on spell usage)
                (ready, None)
            }

            Condition::TimeGte(ms) => {
                let ready = state.time >= *ms;
                let wake = if !ready { Some(*ms) } else { None };
                (ready, wake)
            }

            Condition::FightRemainsLte(ms) => {
                let remaining = duration_ms.saturating_sub(state.time);
                let ready = remaining <= *ms;
                let wake = if !ready {
                    Some(duration_ms.saturating_sub(*ms))
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::TargetHealthPctLt(threshold) => {
                let pct = (state.target.health / state.target.max_health) * 100.0;
                let ready = pct < *threshold;
                // Can't predict when health will drop
                (ready, None)
            }

            Condition::And(a, b) => {
                let (a_result, a_wake) = a.evaluate(state, duration_ms);
                let (b_result, b_wake) = b.evaluate(state, duration_ms);
                let ready = a_result && b_result;
                // For AND, wake when the later of the two conditions becomes true
                let wake = match (a_result, b_result, a_wake, b_wake) {
                    (false, false, Some(a), Some(b)) => Some(a.max(b)),
                    (false, _, Some(a), _) => Some(a),
                    (_, false, _, Some(b)) => Some(b),
                    _ => None,
                };
                (ready, wake)
            }

            Condition::Or(a, b) => {
                let (a_result, a_wake) = a.evaluate(state, duration_ms);
                let (b_result, b_wake) = b.evaluate(state, duration_ms);
                let ready = a_result || b_result;
                // For OR, wake when the earlier of the two conditions becomes true
                let wake = if !ready {
                    match (a_wake, b_wake) {
                        (Some(a), Some(b)) => Some(a.min(b)),
                        (Some(a), None) => Some(a),
                        (None, Some(b)) => Some(b),
                        _ => None,
                    }
                } else {
                    None
                };
                (ready, wake)
            }

            Condition::Not(inner) => {
                let (inner_result, _) = inner.evaluate(state, duration_ms);
                // NOT conditions are unpredictable (we need inner to become false)
                (!inner_result, None)
            }
        }
    }
}

/// Status of a condition for predictive gating.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConditionStatus {
    /// Condition is disabled until `enable_at` time.
    Disabled,
    /// Condition is being actively watched (can't predict when true).
    Watching,
    /// Condition is currently true.
    Active,
}

/// A rotation rule: cast a spell when a condition is true.
///
/// Rules are evaluated in priority order. The first rule with a true
/// condition and a castable spell is executed.
#[derive(Debug, Clone)]
pub struct Rule {
    /// Index of the spell to cast.
    pub spell_idx: u8,
    /// Condition that must be true to consider this rule.
    pub condition: Condition,
    /// Current status for predictive gating.
    pub status: ConditionStatus,
    /// Time (ms) when this rule should be re-enabled if Disabled.
    pub enable_at: u32,
}

impl Rule {
    /// Creates a new rule in the Watching state.
    pub fn new(spell_idx: u8, condition: Condition) -> Self {
        Self {
            spell_idx,
            condition,
            status: ConditionStatus::Watching,
            enable_at: 0,
        }
    }
}
