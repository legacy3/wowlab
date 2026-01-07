//! Native Rust enum-based rotation evaluation
//!
//! Uses enum dispatch for conditions - the fastest approach.

use crate::{Action, SpellId, AuraId, GameState};

/// Comparison operators
#[derive(Clone, Copy, Debug)]
pub enum Cmp {
    Lt,
    Le,
    Gt,
    Ge,
    Eq,
}

impl Cmp {
    #[inline]
    fn compare(self, a: f32, b: f32) -> bool {
        match self {
            Cmp::Lt => a < b,
            Cmp::Le => a <= b,
            Cmp::Gt => a > b,
            Cmp::Ge => a >= b,
            Cmp::Eq => (a - b).abs() < f32::EPSILON,
        }
    }
}

/// Condition enum - all possible conditions
#[derive(Clone, Debug)]
pub enum Condition {
    // Boolean combinators
    And(Box<Condition>, Box<Condition>),
    Or(Box<Condition>, Box<Condition>),
    Not(Box<Condition>),
    True,

    // Spell conditions
    SpellReady(SpellId),
    SpellCharges(SpellId, Cmp, u8),

    // Aura conditions
    AuraActive(AuraId),
    AuraRemaining(AuraId, Cmp, f32),
    AuraStacks(AuraId, Cmp, u8),

    // Resource conditions
    FocusAbove(f32),
    FocusBelow(f32),

    // Target conditions
    TargetHealthBelow(f32),
    ExecutePhase,
}

impl Condition {
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> bool {
        match self {
            Condition::And(a, b) => a.evaluate(state) && b.evaluate(state),
            Condition::Or(a, b) => a.evaluate(state) || b.evaluate(state),
            Condition::Not(c) => !c.evaluate(state),
            Condition::True => true,

            Condition::SpellReady(spell) => state.cooldown_ready(*spell),
            Condition::SpellCharges(spell, cmp, val) => {
                cmp.compare(state.charge_count(*spell) as f32, *val as f32)
            }

            Condition::AuraActive(aura) => state.aura_active(*aura),
            Condition::AuraRemaining(aura, cmp, val) => {
                cmp.compare(state.aura_remaining(*aura), *val)
            }
            Condition::AuraStacks(aura, cmp, val) => {
                cmp.compare(state.aura_stacks(*aura) as f32, *val as f32)
            }

            Condition::FocusAbove(threshold) => state.focus >= *threshold,
            Condition::FocusBelow(threshold) => state.focus < *threshold,

            Condition::TargetHealthBelow(pct) => state.target_health_pct < *pct,
            Condition::ExecutePhase => state.execute_phase(),
        }
    }

    // Builder helpers
    pub fn and(self, other: Self) -> Self {
        Condition::And(Box::new(self), Box::new(other))
    }

    pub fn or(self, other: Self) -> Self {
        Condition::Or(Box::new(self), Box::new(other))
    }

    pub fn not(self) -> Self {
        Condition::Not(Box::new(self))
    }
}

/// Rotation action entry
pub struct RotationEntry {
    pub condition: Condition,
    pub action: Action,
}

/// Native enum-based rotation
pub struct NativeRotation {
    entries: Vec<RotationEntry>,
    fallback: Action,
}

impl NativeRotation {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            fallback: Action::WaitGcd,
        }
    }

    pub fn add(mut self, condition: Condition, action: Action) -> Self {
        self.entries.push(RotationEntry { condition, action });
        self
    }

    pub fn fallback(mut self, action: Action) -> Self {
        self.fallback = action;
        self
    }

    /// Create BM Hunter rotation
    pub fn bm_hunter() -> Self {
        use Condition::*;

        Self::new()
            // Bestial Wrath on cooldown
            .add(
                SpellReady(SpellId::BESTIAL_WRATH),
                Action::Cast(SpellId::BESTIAL_WRATH),
            )
            // Kill Command with focus
            .add(
                SpellReady(SpellId::KILL_COMMAND).and(FocusAbove(30.0)),
                Action::Cast(SpellId::KILL_COMMAND),
            )
            // Barbed Shot to maintain Frenzy
            .add(
                SpellCharges(SpellId::BARBED_SHOT, Cmp::Ge, 1).and(
                    AuraRemaining(AuraId::FRENZY, Cmp::Le, 2.0)
                        .or(AuraActive(AuraId::FRENZY).not())
                ),
                Action::Cast(SpellId::BARBED_SHOT),
            )
            // Barbed Shot at 2 charges
            .add(
                SpellCharges(SpellId::BARBED_SHOT, Cmp::Ge, 2),
                Action::Cast(SpellId::BARBED_SHOT),
            )
            // Dire Beast
            .add(
                SpellReady(SpellId::DIRE_BEAST),
                Action::Cast(SpellId::DIRE_BEAST),
            )
            // Cobra Shot filler
            .add(
                FocusAbove(50.0),
                Action::Cast(SpellId::COBRA_SHOT),
            )
            .fallback(Action::WaitGcd)
    }

    /// Evaluate the rotation
    #[inline]
    pub fn evaluate(&self, state: &GameState) -> Action {
        for entry in &self.entries {
            if entry.condition.evaluate(state) {
                return entry.action;
            }
        }
        self.fallback
    }
}

impl Default for NativeRotation {
    fn default() -> Self {
        Self::new()
    }
}

/// Hand-optimized inline rotation (maximum performance)
/// This is what you'd get from a proc-macro DSL
#[inline(always)]
pub fn bm_hunter_inline(state: &GameState) -> Action {
    // Bestial Wrath
    if state.cooldown_ready(SpellId::BESTIAL_WRATH) {
        return Action::Cast(SpellId::BESTIAL_WRATH);
    }

    // Kill Command with focus
    if state.cooldown_ready(SpellId::KILL_COMMAND) && state.focus >= 30.0 {
        return Action::Cast(SpellId::KILL_COMMAND);
    }

    // Barbed Shot to maintain Frenzy
    if state.charge_count(SpellId::BARBED_SHOT) >= 1 {
        let frenzy_low = state.aura_remaining(AuraId::FRENZY) <= 2.0;
        let no_frenzy = !state.aura_active(AuraId::FRENZY);
        if frenzy_low || no_frenzy {
            return Action::Cast(SpellId::BARBED_SHOT);
        }
    }

    // Barbed Shot at 2 charges
    if state.charge_count(SpellId::BARBED_SHOT) >= 2 {
        return Action::Cast(SpellId::BARBED_SHOT);
    }

    // Dire Beast
    if state.cooldown_ready(SpellId::DIRE_BEAST) {
        return Action::Cast(SpellId::DIRE_BEAST);
    }

    // Cobra Shot filler
    if state.focus >= 50.0 {
        return Action::Cast(SpellId::COBRA_SHOT);
    }

    Action::WaitGcd
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_native_rotation() {
        let rotation = NativeRotation::bm_hunter();
        let state = GameState::new();
        let action = rotation.evaluate(&state);
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }

    #[test]
    fn test_inline_rotation() {
        let state = GameState::new();
        let action = bm_hunter_inline(&state);
        assert!(matches!(action, Action::Cast(SpellId::BESTIAL_WRATH)));
    }
}
