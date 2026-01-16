//! GCD (global cooldown) expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use crate::types::SimTime;

use super::{write_bool, write_f64, FieldType, PopulateContext};

/// GCD-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum GcdExpr {
    /// GCD is currently running.
    Active,
    /// Time remaining on GCD (seconds).
    Remaining,
    /// Current GCD duration (seconds).
    Duration,
}

impl PopulateContext for GcdExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Active => {
                let active = state.player.on_gcd(now);
                write_bool(buffer, offset, active);
            }
            Self::Remaining => {
                let remaining = state.player.gcd_remaining(now).as_secs_f64();
                write_f64(buffer, offset, remaining);
            }
            Self::Duration => {
                // Base GCD is 1.5s, modified by haste
                let base_gcd = 1.5_f64;
                let haste = state.player.stats.haste() as f64;
                let duration = base_gcd / haste;
                write_f64(buffer, offset, duration);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Active => FieldType::Bool,
            Self::Remaining | Self::Duration => FieldType::Float,
        }
    }
}
