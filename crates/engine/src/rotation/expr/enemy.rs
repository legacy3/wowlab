//! Enemy expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use crate::types::{SimTime, SpellIdx};

use super::{write_i32, FieldType, PopulateContext};

/// Enemy-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum EnemyExpr {
    /// Number of active (alive) enemies.
    Count,
    /// Number of enemies that would be hit by a spell (based on AoE radius).
    SpellTargetsHit { spell: SpellIdx },
}

impl PopulateContext for EnemyExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, _now: SimTime) {
        match self {
            Self::Count => {
                let count = state.enemies.alive_count() as i32;
                write_i32(buffer, offset, count);
            }
            Self::SpellTargetsHit { spell: _ } => {
                // TODO: Implement with actual enemy positional logic
                write_i32(buffer, offset, 1);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        FieldType::Int
    }
}
