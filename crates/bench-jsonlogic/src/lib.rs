//! Benchmark comparing JsonLogic evaluation vs native Rust.
//!
//! Tests three approaches:
//! 1. Native Rust conditionals (baseline)
//! 2. datalogic-rs v3 (arena-based)
//! 3. datalogic-rs v4 (serde_json based)

use serde::{Deserialize, Serialize};

/// Simulated game state (simplified version of SimState)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GameState {
    pub resource: ResourceState,
    pub target: TargetState,
    pub cooldowns: CooldownState,
    pub buffs: BuffState,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResourceState {
    pub current: f64,
    pub max: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TargetState {
    pub health_pct: f64,
    pub distance: f64,
    pub count: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CooldownState {
    pub kill_command_ready: bool,
    pub bestial_wrath_ready: bool,
    pub barbed_shot_charges: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BuffState {
    pub bestial_wrath_active: bool,
    pub frenzy_stacks: u32,
}

impl GameState {
    pub fn sample() -> Self {
        Self {
            resource: ResourceState {
                current: 75.0,
                max: 100.0,
            },
            target: TargetState {
                health_pct: 0.45,
                distance: 30.0,
                count: 1,
            },
            cooldowns: CooldownState {
                kill_command_ready: true,
                bestial_wrath_ready: false,
                barbed_shot_charges: 2,
            },
            buffs: BuffState {
                bestial_wrath_active: true,
                frenzy_stacks: 3,
            },
        }
    }
}

/// Native Rust evaluation (baseline)
pub mod native {
    use super::GameState;

    /// Simple condition: resource >= 30
    #[inline]
    pub fn simple_condition(state: &GameState) -> bool {
        state.resource.current >= 30.0
    }

    /// Medium condition: resource >= 30 AND cooldown ready
    #[inline]
    pub fn medium_condition(state: &GameState) -> bool {
        state.resource.current >= 30.0 && state.cooldowns.kill_command_ready
    }

    /// Complex condition: (resource >= 30 AND cooldown ready) OR (buff active AND target < 20%)
    #[inline]
    pub fn complex_condition(state: &GameState) -> bool {
        (state.resource.current >= 30.0 && state.cooldowns.kill_command_ready)
            || (state.buffs.bestial_wrath_active && state.target.health_pct < 0.20)
    }

    /// Rotation-like: check multiple conditions in sequence
    #[inline]
    pub fn rotation_check(state: &GameState) -> u32 {
        // Simulate checking a priority list
        if state.cooldowns.bestial_wrath_ready && state.resource.current >= 10.0 {
            return 1; // Cast Bestial Wrath
        }
        if state.cooldowns.barbed_shot_charges > 0
            && (state.buffs.frenzy_stacks < 3 || state.buffs.bestial_wrath_active)
        {
            return 2; // Cast Barbed Shot
        }
        if state.cooldowns.kill_command_ready && state.resource.current >= 30.0 {
            return 3; // Cast Kill Command
        }
        if state.resource.current >= 35.0 {
            return 4; // Cast Cobra Shot
        }
        0 // Wait
    }
}

/// JsonLogic expressions for benchmarking
pub mod jsonlogic_exprs {
    use serde_json::{json, Value};

    /// Simple: {">=": [{"var": "resource.current"}, 30]}
    pub fn simple() -> Value {
        json!({
            ">=": [{"var": "resource.current"}, 30]
        })
    }

    /// Medium: {"and": [{">=": [{"var": "resource.current"}, 30]}, {"var": "cooldowns.kill_command_ready"}]}
    pub fn medium() -> Value {
        json!({
            "and": [
                {">=": [{"var": "resource.current"}, 30]},
                {"var": "cooldowns.kill_command_ready"}
            ]
        })
    }

    /// Complex: {"or": [{"and": [...]}, {"and": [...]}]}
    pub fn complex() -> Value {
        json!({
            "or": [
                {
                    "and": [
                        {">=": [{"var": "resource.current"}, 30]},
                        {"var": "cooldowns.kill_command_ready"}
                    ]
                },
                {
                    "and": [
                        {"var": "buffs.bestial_wrath_active"},
                        {"<": [{"var": "target.health_pct"}, 0.20]}
                    ]
                }
            ]
        })
    }

    /// Rotation-like: nested if-else
    pub fn rotation() -> Value {
        json!({
            "if": [
                // Condition 1: BW ready and resource >= 10
                {"and": [
                    {"var": "cooldowns.bestial_wrath_ready"},
                    {">=": [{"var": "resource.current"}, 10]}
                ]},
                1,
                // Condition 2: Barbed Shot charges and (frenzy < 3 or BW active)
                {"and": [
                    {">": [{"var": "cooldowns.barbed_shot_charges"}, 0]},
                    {"or": [
                        {"<": [{"var": "buffs.frenzy_stacks"}, 3]},
                        {"var": "buffs.bestial_wrath_active"}
                    ]}
                ]},
                2,
                // Condition 3: KC ready and resource >= 30
                {"and": [
                    {"var": "cooldowns.kill_command_ready"},
                    {">=": [{"var": "resource.current"}, 30]}
                ]},
                3,
                // Condition 4: Cobra Shot
                {">=": [{"var": "resource.current"}, 35]},
                4,
                // Default: wait
                0
            ]
        })
    }
}
