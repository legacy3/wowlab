//! Aura expressions (buffs, debuffs, DoTs).

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::sim::SimState;
use crate::types::{AuraIdx, SimTime};

use super::{write_bool, write_f64, write_i32, FieldType, PopulateContext};

/// Target specifier for aura queries.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum AuraOn {
    Player,
    Target,
    Pet,
}

impl Default for AuraOn {
    fn default() -> Self {
        AuraOn::Player
    }
}

/// Unified aura expressions that can query player, target, or pet auras.
///
/// | Expression | Return Type | Description |
/// |------------|-------------|-------------|
/// | aura_active | Bool | Aura is present on target |
/// | aura_inactive | Bool | Aura is NOT present (convenience) |
/// | aura_remaining | Float | Seconds remaining |
/// | aura_stacks | Int | Current stack count |
/// | aura_stacks_max | Int | Maximum stacks |
/// | aura_duration | Float | Base duration |
/// | aura_refreshable | Bool | Below pandemic threshold (30%) |
/// | aura_ticking | Bool | Has periodic effect |
/// | aura_ticks_remaining | Int | Periodic ticks left |
/// | aura_tick_time | Float | Time between ticks |
/// | aura_next_tick | Float | Time until next tick |
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum UnifiedAuraExpr {
    /// Aura is present on target.
    AuraActive {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Aura is NOT present on target (convenience for negation).
    AuraInactive {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Seconds remaining on the aura.
    AuraRemaining {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Current stack count.
    AuraStacks {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Maximum stacks allowed.
    AuraStacksMax {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Base duration in seconds.
    AuraDuration {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Below pandemic threshold (30% remaining).
    AuraRefreshable {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Has periodic effect (is ticking).
    AuraTicking {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Number of periodic ticks remaining.
    AuraTicksRemaining {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Time between ticks in seconds.
    AuraTickTime {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
    /// Time until next tick in seconds.
    AuraNextTick {
        aura: AuraIdx,
        #[serde(default)]
        on: AuraOn,
    },
}

impl UnifiedAuraExpr {
    /// Get the aura ID this expression references.
    pub fn aura_id(&self) -> AuraIdx {
        match self {
            Self::AuraActive { aura, .. }
            | Self::AuraInactive { aura, .. }
            | Self::AuraRemaining { aura, .. }
            | Self::AuraStacks { aura, .. }
            | Self::AuraStacksMax { aura, .. }
            | Self::AuraDuration { aura, .. }
            | Self::AuraRefreshable { aura, .. }
            | Self::AuraTicking { aura, .. }
            | Self::AuraTicksRemaining { aura, .. }
            | Self::AuraTickTime { aura, .. }
            | Self::AuraNextTick { aura, .. } => *aura,
        }
    }

    /// Get the target this expression queries.
    pub fn target(&self) -> AuraOn {
        match self {
            Self::AuraActive { on, .. }
            | Self::AuraInactive { on, .. }
            | Self::AuraRemaining { on, .. }
            | Self::AuraStacks { on, .. }
            | Self::AuraStacksMax { on, .. }
            | Self::AuraDuration { on, .. }
            | Self::AuraRefreshable { on, .. }
            | Self::AuraTicking { on, .. }
            | Self::AuraTicksRemaining { on, .. }
            | Self::AuraTickTime { on, .. }
            | Self::AuraNextTick { on, .. } => *on,
        }
    }
}

impl PopulateContext for UnifiedAuraExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::AuraActive { aura, on } => {
                let active = match on {
                    AuraOn::Player => state.player.buffs.has(*aura, now),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .map(|e| e.debuffs.has(*aura, now))
                        .unwrap_or(false),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .map(|p| p.buffs.has(*aura, now))
                        .unwrap_or(false),
                };
                write_bool(buffer, offset, active);
            }
            Self::AuraInactive { aura, on } => {
                let inactive = match on {
                    AuraOn::Player => !state.player.buffs.has(*aura, now),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .map(|e| !e.debuffs.has(*aura, now))
                        .unwrap_or(true),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .map(|p| !p.buffs.has(*aura, now))
                        .unwrap_or(true),
                };
                write_bool(buffer, offset, inactive);
            }
            Self::AuraRemaining { aura, on } => {
                let remaining = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.remaining(now).as_secs_f64())
                        .unwrap_or(0.0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.remaining(now).as_secs_f64())
                        .unwrap_or(0.0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.remaining(now).as_secs_f64())
                        .unwrap_or(0.0),
                };
                write_f64(buffer, offset, remaining);
            }
            Self::AuraStacks { aura, on } => {
                let stacks = match on {
                    AuraOn::Player => state.player.buffs.stacks(*aura, now) as i32,
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .map(|e| e.debuffs.stacks(*aura, now) as i32)
                        .unwrap_or(0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .map(|p| p.buffs.stacks(*aura, now) as i32)
                        .unwrap_or(0),
                };
                write_i32(buffer, offset, stacks);
            }
            Self::AuraStacksMax { aura, on } => {
                let max = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.max_stacks as i32)
                        .unwrap_or(0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.max_stacks as i32)
                        .unwrap_or(0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.max_stacks as i32)
                        .unwrap_or(0),
                };
                write_i32(buffer, offset, max);
            }
            Self::AuraDuration { aura, on } => {
                let duration = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.base_duration.as_secs_f64())
                        .unwrap_or(0.0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.base_duration.as_secs_f64())
                        .unwrap_or(0.0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.base_duration.as_secs_f64())
                        .unwrap_or(0.0),
                };
                write_f64(buffer, offset, duration);
            }
            Self::AuraRefreshable { aura, on } => {
                let refreshable = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| {
                            let remaining = a.remaining(now).as_secs_f64();
                            let duration = a.base_duration.as_secs_f64();
                            remaining < duration * 0.3
                        })
                        .unwrap_or(true),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| {
                            let remaining = a.remaining(now).as_secs_f64();
                            let duration = a.base_duration.as_secs_f64();
                            remaining < duration * 0.3
                        })
                        .unwrap_or(true),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| {
                            let remaining = a.remaining(now).as_secs_f64();
                            let duration = a.base_duration.as_secs_f64();
                            remaining < duration * 0.3
                        })
                        .unwrap_or(true),
                };
                write_bool(buffer, offset, refreshable);
            }
            Self::AuraTicking { aura, on } => {
                let ticking = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.is_periodic() && a.is_active(now))
                        .unwrap_or(false),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.is_periodic() && a.is_active(now))
                        .unwrap_or(false),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.is_periodic() && a.is_active(now))
                        .unwrap_or(false),
                };
                write_bool(buffer, offset, ticking);
            }
            Self::AuraTicksRemaining { aura, on } => {
                let ticks = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.remaining_ticks as i32)
                        .unwrap_or(0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.remaining_ticks as i32)
                        .unwrap_or(0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.remaining_ticks as i32)
                        .unwrap_or(0),
                };
                write_i32(buffer, offset, ticks);
            }
            Self::AuraTickTime { aura, on } => {
                let tick_time = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.tick_time())
                        .unwrap_or(0.0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.tick_time())
                        .unwrap_or(0.0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.tick_time())
                        .unwrap_or(0.0),
                };
                write_f64(buffer, offset, tick_time);
            }
            Self::AuraNextTick { aura, on } => {
                let next_tick = match on {
                    AuraOn::Player => state
                        .player
                        .buffs
                        .get(*aura)
                        .map(|a| a.next_tick_in(now))
                        .unwrap_or(0.0),
                    AuraOn::Target => state
                        .enemies
                        .primary()
                        .and_then(|e| e.debuffs.get(*aura))
                        .map(|a| a.next_tick_in(now))
                        .unwrap_or(0.0),
                    AuraOn::Pet => state
                        .pets
                        .active(now)
                        .next()
                        .and_then(|p| p.buffs.get(*aura))
                        .map(|a| a.next_tick_in(now))
                        .unwrap_or(0.0),
                };
                write_f64(buffer, offset, next_tick);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::AuraActive { .. }
            | Self::AuraInactive { .. }
            | Self::AuraRefreshable { .. }
            | Self::AuraTicking { .. } => FieldType::Bool,
            Self::AuraStacks { .. }
            | Self::AuraStacksMax { .. }
            | Self::AuraTicksRemaining { .. } => FieldType::Int,
            Self::AuraRemaining { .. }
            | Self::AuraDuration { .. }
            | Self::AuraTickTime { .. }
            | Self::AuraNextTick { .. } => FieldType::Float,
        }
    }
}

/// Buff expressions (auras on player).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum BuffExpr {
    /// Buff is active.
    Active { aura: AuraIdx },
    /// Buff is not active.
    Inactive { aura: AuraIdx },
    /// Time remaining on buff.
    Remaining { aura: AuraIdx },
    /// Current buff stacks.
    Stacks { aura: AuraIdx },
    /// Maximum buff stacks.
    StacksMax { aura: AuraIdx },
    /// Base buff duration.
    Duration { aura: AuraIdx },
}

impl BuffExpr {
    /// Get the aura ID this expression references.
    pub fn aura_id(&self) -> AuraIdx {
        match self {
            Self::Active { aura }
            | Self::Inactive { aura }
            | Self::Remaining { aura }
            | Self::Stacks { aura }
            | Self::StacksMax { aura }
            | Self::Duration { aura } => *aura,
        }
    }
}

impl PopulateContext for BuffExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Active { aura } => {
                let active = state.player.buffs.has(*aura, now);
                write_bool(buffer, offset, active);
            }
            Self::Inactive { aura } => {
                let inactive = !state.player.buffs.has(*aura, now);
                write_bool(buffer, offset, inactive);
            }
            Self::Remaining { aura } => {
                let remaining = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.remaining(now).as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, remaining);
            }
            Self::Stacks { aura } => {
                let stacks = state.player.buffs.stacks(*aura, now) as i32;
                write_i32(buffer, offset, stacks);
            }
            Self::StacksMax { aura } => {
                let max = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.max_stacks as i32)
                    .unwrap_or(0);
                write_i32(buffer, offset, max);
            }
            Self::Duration { aura } => {
                let duration = state
                    .player
                    .buffs
                    .get(*aura)
                    .map(|a| a.base_duration.as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, duration);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Active { .. } | Self::Inactive { .. } => FieldType::Bool,
            Self::Stacks { .. } | Self::StacksMax { .. } => FieldType::Int,
            Self::Remaining { .. } | Self::Duration { .. } => FieldType::Float,
        }
    }
}

/// Debuff expressions (auras on target).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum DebuffExpr {
    /// Debuff is active on target.
    Active { aura: AuraIdx },
    /// Debuff is not active on target.
    Inactive { aura: AuraIdx },
    /// Time remaining on debuff.
    Remaining { aura: AuraIdx },
    /// Current debuff stacks.
    Stacks { aura: AuraIdx },
    /// Debuff is refreshable (<30% duration remaining or not present).
    Refreshable { aura: AuraIdx },
}

impl DebuffExpr {
    /// Get the aura ID this expression references.
    pub fn aura_id(&self) -> AuraIdx {
        match self {
            Self::Active { aura }
            | Self::Inactive { aura }
            | Self::Remaining { aura }
            | Self::Stacks { aura }
            | Self::Refreshable { aura } => *aura,
        }
    }
}

impl PopulateContext for DebuffExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Active { aura } => {
                let active = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, offset, active);
            }
            Self::Inactive { aura } => {
                let inactive = state
                    .enemies
                    .primary()
                    .map(|e| !e.debuffs.has(*aura, now))
                    .unwrap_or(true);
                write_bool(buffer, offset, inactive);
            }
            Self::Remaining { aura } => {
                let remaining = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining(now).as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, remaining);
            }
            Self::Stacks { aura } => {
                let stacks = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.stacks(*aura, now) as i32)
                    .unwrap_or(0);
                write_i32(buffer, offset, stacks);
            }
            Self::Refreshable { aura } => {
                let refreshable = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| {
                        let remaining = a.remaining(now).as_secs_f64();
                        let duration = a.base_duration.as_secs_f64();
                        remaining < duration * 0.3
                    })
                    .unwrap_or(true);
                write_bool(buffer, offset, refreshable);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Active { .. } | Self::Inactive { .. } | Self::Refreshable { .. } => {
                FieldType::Bool
            }
            Self::Stacks { .. } => FieldType::Int,
            Self::Remaining { .. } => FieldType::Float,
        }
    }
}

/// DoT expressions (damage over time on target).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum DotExpr {
    /// DoT is ticking on target.
    Ticking { aura: AuraIdx },
    /// Time remaining on DoT.
    Remaining { aura: AuraIdx },
    /// DoT is refreshable (<30% duration remaining or not present).
    Refreshable { aura: AuraIdx },
    /// Number of ticks remaining.
    TicksRemaining { aura: AuraIdx },
}

impl DotExpr {
    /// Get the aura ID this expression references.
    pub fn aura_id(&self) -> AuraIdx {
        match self {
            Self::Ticking { aura }
            | Self::Remaining { aura }
            | Self::Refreshable { aura }
            | Self::TicksRemaining { aura } => *aura,
        }
    }
}

impl PopulateContext for DotExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Ticking { aura } => {
                let ticking = state
                    .enemies
                    .primary()
                    .map(|e| e.debuffs.has(*aura, now))
                    .unwrap_or(false);
                write_bool(buffer, offset, ticking);
            }
            Self::Remaining { aura } => {
                let remaining = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining(now).as_secs_f64())
                    .unwrap_or(0.0);
                write_f64(buffer, offset, remaining);
            }
            Self::Refreshable { aura } => {
                let refreshable = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| {
                        let remaining = a.remaining(now).as_secs_f64();
                        let duration = a.base_duration.as_secs_f64();
                        remaining < duration * 0.3
                    })
                    .unwrap_or(true);
                write_bool(buffer, offset, refreshable);
            }
            Self::TicksRemaining { aura } => {
                let ticks = state
                    .enemies
                    .primary()
                    .and_then(|e| e.debuffs.get(*aura))
                    .map(|a| a.remaining_ticks as i32)
                    .unwrap_or(0);
                write_i32(buffer, offset, ticks);
            }
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Ticking { .. } | Self::Refreshable { .. } => FieldType::Bool,
            Self::TicksRemaining { .. } => FieldType::Int,
            Self::Remaining { .. } => FieldType::Float,
        }
    }
}

/// Combined aura expression that holds buff, debuff, dot, or unified aura expr.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
pub enum AuraExpr {
    Buff(BuffExpr),
    Debuff(DebuffExpr),
    Dot(DotExpr),
    Unified(UnifiedAuraExpr),
}

impl PopulateContext for AuraExpr {
    fn populate(&self, buffer: &mut [u8], offset: usize, state: &SimState, now: SimTime) {
        match self {
            Self::Buff(e) => e.populate(buffer, offset, state, now),
            Self::Debuff(e) => e.populate(buffer, offset, state, now),
            Self::Dot(e) => e.populate(buffer, offset, state, now),
            Self::Unified(e) => e.populate(buffer, offset, state, now),
        }
    }

    fn field_type(&self) -> FieldType {
        match self {
            Self::Buff(e) => e.field_type(),
            Self::Debuff(e) => e.field_type(),
            Self::Dot(e) => e.field_type(),
            Self::Unified(e) => e.field_type(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aura_on_serde_roundtrip() {
        let targets = [AuraOn::Player, AuraOn::Target, AuraOn::Pet];
        for target in targets {
            let json = serde_json::to_string(&target).unwrap();
            let parsed: AuraOn = serde_json::from_str(&json).unwrap();
            assert_eq!(target, parsed);
        }
    }

    #[test]
    fn test_unified_aura_expr_serde_roundtrip() {
        let aura = AuraIdx(100);
        let expressions = [
            UnifiedAuraExpr::AuraActive {
                aura,
                on: AuraOn::Player,
            },
            UnifiedAuraExpr::AuraInactive {
                aura,
                on: AuraOn::Target,
            },
            UnifiedAuraExpr::AuraRemaining {
                aura,
                on: AuraOn::Pet,
            },
            UnifiedAuraExpr::AuraStacks {
                aura,
                on: AuraOn::Player,
            },
            UnifiedAuraExpr::AuraStacksMax {
                aura,
                on: AuraOn::Target,
            },
            UnifiedAuraExpr::AuraDuration {
                aura,
                on: AuraOn::Pet,
            },
            UnifiedAuraExpr::AuraRefreshable {
                aura,
                on: AuraOn::Player,
            },
            UnifiedAuraExpr::AuraTicking {
                aura,
                on: AuraOn::Target,
            },
            UnifiedAuraExpr::AuraTicksRemaining {
                aura,
                on: AuraOn::Pet,
            },
            UnifiedAuraExpr::AuraTickTime {
                aura,
                on: AuraOn::Player,
            },
            UnifiedAuraExpr::AuraNextTick {
                aura,
                on: AuraOn::Target,
            },
        ];

        for expr in expressions {
            let json = serde_json::to_string(&expr).unwrap();
            let parsed: UnifiedAuraExpr = serde_json::from_str(&json).unwrap();
            assert_eq!(expr, parsed, "Failed for: {}", json);
        }
    }

    #[test]
    fn test_unified_aura_expr_field_types() {
        let aura = AuraIdx(100);

        // Bool types
        assert_eq!(
            UnifiedAuraExpr::AuraActive {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Bool
        );
        assert_eq!(
            UnifiedAuraExpr::AuraInactive {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Bool
        );
        assert_eq!(
            UnifiedAuraExpr::AuraRefreshable {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Bool
        );
        assert_eq!(
            UnifiedAuraExpr::AuraTicking {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Bool
        );

        // Int types
        assert_eq!(
            UnifiedAuraExpr::AuraStacks {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Int
        );
        assert_eq!(
            UnifiedAuraExpr::AuraStacksMax {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Int
        );
        assert_eq!(
            UnifiedAuraExpr::AuraTicksRemaining {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Int
        );

        // Float types
        assert_eq!(
            UnifiedAuraExpr::AuraRemaining {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Float
        );
        assert_eq!(
            UnifiedAuraExpr::AuraDuration {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Float
        );
        assert_eq!(
            UnifiedAuraExpr::AuraTickTime {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Float
        );
        assert_eq!(
            UnifiedAuraExpr::AuraNextTick {
                aura,
                on: AuraOn::Player
            }
            .field_type(),
            FieldType::Float
        );
    }

    #[test]
    fn test_aura_on_default() {
        assert_eq!(AuraOn::default(), AuraOn::Player);
    }

    #[test]
    fn test_unified_aura_expr_aura_id() {
        let aura = AuraIdx(42);
        let expr = UnifiedAuraExpr::AuraActive {
            aura,
            on: AuraOn::Target,
        };
        assert_eq!(expr.aura_id(), aura);
    }

    #[test]
    fn test_unified_aura_expr_target() {
        let aura = AuraIdx(42);
        let expr = UnifiedAuraExpr::AuraRemaining {
            aura,
            on: AuraOn::Pet,
        };
        assert_eq!(expr.target(), AuraOn::Pet);
    }

    #[test]
    fn test_unified_aura_expr_json_format() {
        // Test that the JSON format matches expected schema
        let expr = UnifiedAuraExpr::AuraRefreshable {
            aura: AuraIdx(12345),
            on: AuraOn::Target,
        };
        let json = serde_json::to_string(&expr).unwrap();
        assert!(json.contains("\"type\":\"auraRefreshable\""));
        assert!(json.contains("\"aura\":12345"));
        assert!(json.contains("\"on\":\"target\""));
    }

    #[test]
    fn test_all_11_expressions_roundtrip() {
        // Verify all 11 expression types have proper JSON roundtrip
        let aura = AuraIdx(999);
        let on = AuraOn::Pet;

        let all_exprs: Vec<UnifiedAuraExpr> = vec![
            UnifiedAuraExpr::AuraActive { aura, on },
            UnifiedAuraExpr::AuraInactive { aura, on },
            UnifiedAuraExpr::AuraRemaining { aura, on },
            UnifiedAuraExpr::AuraStacks { aura, on },
            UnifiedAuraExpr::AuraStacksMax { aura, on },
            UnifiedAuraExpr::AuraDuration { aura, on },
            UnifiedAuraExpr::AuraRefreshable { aura, on },
            UnifiedAuraExpr::AuraTicking { aura, on },
            UnifiedAuraExpr::AuraTicksRemaining { aura, on },
            UnifiedAuraExpr::AuraTickTime { aura, on },
            UnifiedAuraExpr::AuraNextTick { aura, on },
        ];

        assert_eq!(all_exprs.len(), 11, "Should have exactly 11 expression types");

        for expr in all_exprs {
            let json = serde_json::to_string(&expr).unwrap();
            let parsed: UnifiedAuraExpr = serde_json::from_str(&json).unwrap();
            assert_eq!(expr, parsed);
        }
    }
}
