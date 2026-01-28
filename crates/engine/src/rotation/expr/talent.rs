//! Talent expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use wowlab_common::types::SimTime;

use super::{write_bool, write_i32, FieldType, PopulateContext};

/// Talent expressions are compile-time constants.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum TalentExpr {
    /// Talent is enabled (compile-time constant).
    Enabled { value: bool },
    /// Current rank of the talent (1 for enabled talents without explicit rank, 0 for disabled).
    Rank { rank: i32 },
    /// Maximum rank of the talent.
    MaxRank { max_rank: i32 },
}

impl PopulateContext for TalentExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, _state: &SimState, _now: SimTime) {
        match self {
            Self::Enabled { value } => {
                write_bool(buffer, offset, *value);
            }
            Self::Rank { rank } => {
                write_i32(buffer, offset, *rank);
            }
            Self::MaxRank { max_rank } => {
                write_i32(buffer, offset, *max_rank);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Enabled { .. } => FieldType::Bool,
            Self::Rank { .. } | Self::MaxRank { .. } => FieldType::Int,
        }
    }
}

impl TalentExpr {
    /// Create a new enabled talent expression.
    pub fn new(enabled: bool) -> Self {
        Self::Enabled { value: enabled }
    }

    /// Create a talent expression with rank.
    /// Returns rank 1 for enabled talents, 0 for disabled.
    pub fn with_rank(enabled: bool, explicit_rank: Option<i32>) -> Self {
        let rank = explicit_rank.unwrap_or(if enabled { 1 } else { 0 });
        Self::Rank { rank }
    }

    /// Create a max rank expression.
    pub fn with_max_rank(max_rank: i32) -> Self {
        Self::MaxRank { max_rank }
    }

    /// Get the enabled state.
    pub fn is_enabled(&self) -> bool {
        match self {
            Self::Enabled { value } => *value,
            Self::Rank { rank } => *rank > 0,
            Self::MaxRank { .. } => false, // Max rank doesn't indicate enabled state
        }
    }

    /// Get the rank value (0 if disabled or not a rank expression).
    pub fn get_rank(&self) -> i32 {
        match self {
            Self::Enabled { value } => {
                if *value {
                    1
                } else {
                    0
                }
            }
            Self::Rank { rank } => *rank,
            Self::MaxRank { .. } => 0,
        }
    }
}
