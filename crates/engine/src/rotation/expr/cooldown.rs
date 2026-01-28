//! Cooldown expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use wowlab_common::types::{SimTime, SpellIdx};

use super::{write_bool, write_f64, write_i32, FieldType, PopulateContext};

/// Cooldown-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum CooldownExpr {
    /// Cooldown is ready to use (charges > 0 or remaining = 0).
    CooldownReady { spell: SpellIdx },
    /// Time remaining until cooldown is ready (seconds).
    CooldownRemaining { spell: SpellIdx },
    /// Current haste-adjusted cooldown duration (seconds).
    CooldownDuration { spell: SpellIdx },
    /// Base cooldown duration without haste (seconds).
    CooldownBaseDuration { spell: SpellIdx },
    /// Current available charges (for charged cooldowns).
    CooldownCharges { spell: SpellIdx },
    /// Maximum charges (for charged cooldowns).
    CooldownChargesMax { spell: SpellIdx },
    /// Fractional charges (e.g., 1.5 when halfway to next charge).
    CooldownChargesFractional { spell: SpellIdx },
    /// Time until next charge is ready (seconds).
    CooldownRechargeTime { spell: SpellIdx },
    /// Time until all charges are ready (seconds).
    CooldownFullRechargeTime { spell: SpellIdx },
}

impl CooldownExpr {
    /// Get the spell ID this expression references.
    pub fn spell_id(&self) -> SpellIdx {
        match self {
            Self::CooldownReady { spell }
            | Self::CooldownRemaining { spell }
            | Self::CooldownDuration { spell }
            | Self::CooldownBaseDuration { spell }
            | Self::CooldownCharges { spell }
            | Self::CooldownChargesMax { spell }
            | Self::CooldownChargesFractional { spell }
            | Self::CooldownRechargeTime { spell }
            | Self::CooldownFullRechargeTime { spell } => *spell,
        }
    }
}

impl PopulateContext for CooldownExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::CooldownReady { spell } => {
                // Ready if regular cooldown is ready OR charged cooldown has charges
                let ready = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.has_charge())
                    .or_else(|| state.player.cooldown(*spell).map(|cd| cd.is_ready(now)))
                    .unwrap_or(true);
                write_bool(buffer, offset, ready);
            }
            Self::CooldownRemaining { spell } => {
                // For charged cooldowns, remaining time until at least one charge
                // For regular cooldowns, remaining time until ready
                let remaining = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.time_until_charge(now).as_secs_f64())
                    .or_else(|| {
                        state
                            .player
                            .cooldown(*spell)
                            .map(|cd| cd.remaining(now).as_secs_f64())
                    })
                    .unwrap_or(0.0);
                write_f64(buffer, offset, remaining);
            }
            Self::CooldownDuration { spell } => {
                // Current haste-adjusted duration
                let duration = state
                    .player
                    .cooldown(*spell)
                    .map(|cd| cd.duration.as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, duration);
            }
            Self::CooldownBaseDuration { spell } => {
                // Base duration without haste
                let duration = state
                    .player
                    .cooldown(*spell)
                    .map(|cd| cd.base_duration.as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, duration);
            }
            Self::CooldownCharges { spell } => {
                let charges = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.current_charges as i32)
                    .unwrap_or(0);
                write_i32(buffer, offset, charges);
            }
            Self::CooldownChargesMax { spell } => {
                let max = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.max_charges as i32)
                    .unwrap_or(0);
                write_i32(buffer, offset, max);
            }
            Self::CooldownChargesFractional { spell } => {
                let fractional = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.charges_fractional(now) as f64)
                    .unwrap_or(0.0);
                write_f64(buffer, offset, fractional);
            }
            Self::CooldownRechargeTime { spell } => {
                let time = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| cd.time_until_charge(now).as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, time);
            }
            Self::CooldownFullRechargeTime { spell } => {
                let time = state
                    .player
                    .charged_cooldown(*spell)
                    .map(|cd| {
                        if cd.is_full() {
                            0.0
                        } else {
                            let charges_needed = cd.max_charges - cd.current_charges;
                            let time_to_next = cd.time_until_charge(now).as_secs_f64();
                            let additional = (charges_needed.saturating_sub(1) as f64)
                                * cd.recharge_time.as_secs_f64();
                            time_to_next + additional
                        }
                    })
                    .unwrap_or(0.0);
                write_f64(buffer, offset, time);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::CooldownReady { .. } => FieldType::Bool,
            Self::CooldownCharges { .. } | Self::CooldownChargesMax { .. } => FieldType::Int,
            Self::CooldownRemaining { .. }
            | Self::CooldownDuration { .. }
            | Self::CooldownBaseDuration { .. }
            | Self::CooldownChargesFractional { .. }
            | Self::CooldownRechargeTime { .. }
            | Self::CooldownFullRechargeTime { .. } => FieldType::Float,
        }
    }
}
