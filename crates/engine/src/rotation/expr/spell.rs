//! Spell information expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use crate::types::{SimTime, SpellIdx};

use super::{write_bool, write_f64, FieldType, PopulateContext};

/// Spell-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum SpellExpr {
    /// Resource cost of spell.
    Cost { spell: SpellIdx },
    /// Cast time of spell (haste-adjusted).
    CastTime { spell: SpellIdx },
    /// Spell range in yards.
    Range { spell: SpellIdx },
    /// Target is in range of spell.
    InRange { spell: SpellIdx },
    /// Spell is usable (resources, cooldown, range).
    Usable { spell: SpellIdx },
}

impl SpellExpr {
    /// Get the spell ID this expression references.
    pub fn spell_id(&self) -> SpellIdx {
        match self {
            Self::Cost { spell }
            | Self::CastTime { spell }
            | Self::Range { spell }
            | Self::InRange { spell }
            | Self::Usable { spell } => *spell,
        }
    }
}

impl PopulateContext for SpellExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Cost { spell: _ } => {
                // TODO: Look up spell cost from tuning
                write_f64(buffer, offset, 0.0);
            }
            Self::CastTime { spell: _ } => {
                // TODO: Look up spell cast time from tuning
                write_f64(buffer, offset, 0.0);
            }
            Self::Range { spell: _ } => {
                // TODO: Look up spell range from tuning
                // Default to 40 yards (standard ranged)
                write_f64(buffer, offset, 40.0);
            }
            Self::InRange { spell: _ } => {
                // Check if target is in range
                // Default distance is 5 yards (melee range)
                let distance = state
                    .enemies
                    .primary()
                    .map(|e| e.distance)
                    .unwrap_or(5.0);
                // TODO: Look up actual spell range from tuning
                let spell_range = 40.0; // Default ranged
                write_bool(buffer, offset, distance <= spell_range);
            }
            Self::Usable { spell } => {
                // Check if spell can be cast (cooldown ready)
                // For charged cooldowns, check if we have a charge
                // For regular cooldowns, check if ready
                let usable = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.has_charge())
                    .or_else(|| {
                        state
                            .player
                            .cooldown(*spell)
                            .map(|cd| cd.is_ready(now))
                    })
                    .unwrap_or(true); // No cooldown tracked = usable
                write_bool(buffer, offset, usable);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Cost { .. } | Self::CastTime { .. } | Self::Range { .. } => FieldType::Float,
            Self::InRange { .. } | Self::Usable { .. } => FieldType::Bool,
        }
    }
}
