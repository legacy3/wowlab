//! Rotation action types.

use wowlab_types::SpellIdx;

/// Action to perform - the output of rotation evaluation.
#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    /// Cast a spell.
    Cast(SpellIdx),
    /// Wait for GCD.
    WaitGcd,
    /// Wait for a duration.
    Wait(f64),
    /// Pool resources until target amount is reached.
    Pool {
        /// Target resource amount to pool to.
        target: f64,
    },
    /// No action.
    None,
}

impl Action {
    /// Create action from JIT result (spell index, 0 = wait).
    #[inline]
    pub fn from_jit_result(spell_idx: u32) -> Self {
        if spell_idx == 0 {
            Action::WaitGcd
        } else {
            Action::Cast(SpellIdx(spell_idx))
        }
    }
}
