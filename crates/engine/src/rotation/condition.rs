//! Condition types and evaluation for predictive rotation gating.
//!
//! Conditions are extracted from Rhai AST and evaluated against simulation state.

use crate::sim::SimState;

/// A condition that determines when a spell should be cast.
#[derive(Debug, Clone)]
pub enum Condition {
    /// Always true - unconditional cast
    Always,

    /// Spell is off cooldown and has charges (or no charges required)
    SpellReady(u8),

    /// Spell has at least N charges
    SpellCharges { idx: u8, min: u8 },

    /// Spell cooldown is <= N ms
    SpellCooldownLte { idx: u8, max_ms: u32 },

    /// Aura/buff is active
    AuraActive(u8),

    /// Aura has at least N stacks
    AuraStacks { idx: u8, min: u8 },

    /// Aura has at least N ms remaining
    AuraRemainingGte { idx: u8, min_ms: u32 },

    /// Aura has at most N ms remaining
    AuraRemainingLte { idx: u8, max_ms: u32 },

    /// Resource >= threshold
    ResourceGte(f32),

    /// Resource <= threshold
    ResourceLte(f32),

    /// Time >= threshold (ms)
    TimeGte(u32),

    /// Fight remaining time <= threshold (ms)
    FightRemainsLte(u32),

    /// Target health % < threshold
    TargetHealthPctLt(f32),

    /// Logical AND
    And(Box<Condition>, Box<Condition>),

    /// Logical OR
    Or(Box<Condition>, Box<Condition>),

    /// Logical NOT
    Not(Box<Condition>),
}

impl Condition {
    /// Evaluate the condition against simulation state.
    /// Returns (result, optional_wake_time_ms) for predictive gating.
    pub fn evaluate(&self, state: &SimState, duration_ms: u32) -> (bool, Option<u32>) {
        match self {
            Condition::Always => (true, None),

            Condition::SpellReady(idx) => {
                let spell_state = &state.player.spell_states[*idx as usize];
                let spell_rt = &state.spell_runtime[*idx as usize];

                // Check charges for charge-based spells
                if spell_rt.max_charges > 0 {
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
                    if let Some(instance) = state.player.auras.get_slot(*idx as usize) {
                        Some(instance.expires.saturating_sub(*max_ms))
                    } else {
                        None
                    }
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

/// Condition status for predictive gating.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConditionStatus {
    /// Condition is disabled - skip evaluation until enable_at
    Disabled,
    /// Condition should be evaluated (can't predict when it becomes true)
    Watching,
    /// Condition is currently true
    Active,
}

/// A rule in the rotation: cast spell if condition is true.
#[derive(Debug, Clone)]
pub struct Rule {
    /// Spell index to cast
    pub spell_idx: u8,
    /// Condition to evaluate
    pub condition: Condition,
    /// Current status for predictive gating
    pub status: ConditionStatus,
    /// Time when this rule should be re-enabled (if Disabled)
    pub enable_at: u32,
}

impl Rule {
    pub fn new(spell_idx: u8, condition: Condition) -> Self {
        Self {
            spell_idx,
            condition,
            status: ConditionStatus::Watching,
            enable_at: 0,
        }
    }
}
