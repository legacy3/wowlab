//! Combat timing expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use wowlab_common::types::SimTime;

use super::{write_f64, FieldType, PopulateContext};

/// Combat-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum CombatExpr {
    /// Time in combat (seconds).
    Time,
    /// Time remaining in fight (seconds).
    Remaining,
}

impl PopulateContext for CombatExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Time => {
                let time = now.as_secs_f64();
                write_f64(buffer, offset, time);
            }
            Self::Remaining => {
                let remaining = state.remaining().as_secs_f64();
                write_f64(buffer, offset, remaining);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        FieldType::Float
    }
}
