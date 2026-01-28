//! Shared focus regeneration for all Hunter specs.
//!
//! All Hunter specs use Focus as their primary resource with the same base
//! regeneration rate. This module provides the shared constants and logic.

use crate::sim::SimState;

/// Base focus regeneration per second (before haste).
pub const FOCUS_REGEN_BASE: f32 = 5.0;

/// Maximum focus capacity.
pub const FOCUS_MAX: f32 = 100.0;

/// Calculate focus regeneration rate with haste.
///
/// Focus regeneration scales with haste: more haste = faster regen.
#[inline]
pub fn focus_regen_rate(haste: f32) -> f32 {
    FOCUS_REGEN_BASE * haste
}

/// Regenerate focus for a time period.
///
/// Returns the amount of focus regenerated.
pub fn regenerate_focus(state: &mut SimState, duration_secs: f32) -> f32 {
    let haste = state.player.stats.haste();
    let regen = focus_regen_rate(haste) * duration_secs;

    if let Some(ref mut primary) = state.player.resources.primary {
        let before = primary.current;
        primary.gain(regen);
        primary.current - before
    } else {
        0.0
    }
}
