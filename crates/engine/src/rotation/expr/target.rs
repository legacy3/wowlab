//! Target expressions.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use wowlab_common::types::SimTime;

use super::{write_bool, write_f64, write_i32, FieldType, PopulateContext};

/// Wrapper for f64 that implements Eq and Hash via bit representation.
/// Safe for non-NaN floats used as constant parameters.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
pub struct PercentValue(pub f64);

impl PartialEq for PercentValue {
    fn eq(&self, other: &Self) -> bool {
        self.0.to_bits() == other.0.to_bits()
    }
}

impl Eq for PercentValue {}

impl std::hash::Hash for PercentValue {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.0.to_bits().hash(state);
    }
}

/// Target-related expressions.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum TargetExpr {
    /// Current target health.
    Health,
    /// Maximum target health.
    HealthMax,
    /// Target health percentage (0-100).
    HealthPercent,
    /// Estimated time to die (seconds) - uses rolling DPS.
    TimeToDie,
    /// Time to reach a specific health percentage.
    TimeToPercent { percent: PercentValue },
    /// Distance to target (yards).
    Distance,
    /// Target is currently casting.
    Casting,
    /// Target is currently moving.
    Moving,
    /// Number of active enemies.
    EnemyCount,
}

impl PopulateContext for TargetExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, _now: SimTime) {
        match self {
            Self::Health => {
                let health = state
                    .enemies
                    .primary()
                    .map(|e| e.current_health)
                    .unwrap_or(0.0);
                write_f64(buffer, offset, health as f64);
            }
            Self::HealthMax => {
                let max_health = state.enemies.primary().map(|e| e.max_health).unwrap_or(0.0);
                write_f64(buffer, offset, max_health as f64);
            }
            Self::HealthPercent => {
                let pct = state
                    .enemies
                    .primary()
                    .map(|e| e.health_percent() * 100.0)
                    .unwrap_or(100.0);
                write_f64(buffer, offset, pct as f64);
            }
            Self::TimeToDie => {
                // Use rolling DPS estimate for TTD calculation
                let dps = state.rolling_dps_estimate();
                let ttd = if dps > 0.0 {
                    state
                        .enemies
                        .primary()
                        .map(|e| e.time_to_die(dps).as_secs_f64())
                        .unwrap_or(f64::MAX)
                } else {
                    // Fallback to remaining fight duration if no DPS yet
                    state.remaining().as_secs_f64()
                };
                write_f64(buffer, offset, ttd);
            }
            Self::TimeToPercent { percent } => {
                let target_pct = percent.0 as f32;
                let dps = state.rolling_dps_estimate();
                let ttp = if dps > 0.0 {
                    state
                        .enemies
                        .primary()
                        .map(|e| e.time_to_percent(target_pct, dps).as_secs_f64())
                        .unwrap_or(0.0)
                } else {
                    // No DPS yet, estimate based on fight progress
                    let current_pct = state
                        .enemies
                        .primary()
                        .map(|e| e.health_percent() * 100.0)
                        .unwrap_or(100.0);
                    if current_pct <= target_pct {
                        0.0
                    } else {
                        state.remaining().as_secs_f64()
                    }
                };
                write_f64(buffer, offset, ttp);
            }
            Self::EnemyCount => {
                let count = state.enemies.alive_count();
                write_i32(buffer, offset, count as i32);
            }
            Self::Distance => {
                let distance = state.enemies.primary().map(|e| e.distance).unwrap_or(5.0);
                write_f64(buffer, offset, distance as f64);
            }
            Self::Casting => {
                let casting = state
                    .enemies
                    .primary()
                    .map(|e| e.is_casting)
                    .unwrap_or(false);
                write_bool(buffer, offset, casting);
            }
            Self::Moving => {
                let moving = state
                    .enemies
                    .primary()
                    .map(|e| e.is_moving)
                    .unwrap_or(false);
                write_bool(buffer, offset, moving);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Casting | Self::Moving => FieldType::Bool,
            Self::EnemyCount => FieldType::Int,
            _ => FieldType::Float,
        }
    }
}
