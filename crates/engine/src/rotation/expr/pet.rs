//! Pet expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use wowlab_types::{AuraIdx, SimTime};

use super::{write_bool, write_f64, write_i32, FieldType, PopulateContext};

/// Pet-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum PetExpr {
    /// Pet is active (at least one pet summoned).
    Active,
    /// Number of active pets.
    Count,
    /// Pet duration remaining (for temporary pets).
    Remaining,
    /// Pet buff is active.
    BuffActive { aura: AuraIdx },
}

impl PopulateContext for PetExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Active => {
                let active = state.pets.active_count(now) > 0;
                write_bool(buffer, offset, active);
            }
            Self::Count => {
                let count = state.pets.active_count(now) as i32;
                write_i32(buffer, offset, count);
            }
            Self::Remaining => {
                // Duration of first temporary pet
                let remaining = state
                    .pets
                    .active(now)
                    .filter_map(|p| p.expires_at)
                    .next()
                    .map(|expires| expires.saturating_sub(now).as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, remaining);
            }
            Self::BuffActive { aura } => {
                // Check first pet's buffs
                let active = state
                    .pets
                    .active(now)
                    .next()
                    .map(|p| p.buffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, offset, active);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Active | Self::BuffActive { .. } => FieldType::Bool,
            Self::Count => FieldType::Int,
            Self::Remaining => FieldType::Float,
        }
    }
}
