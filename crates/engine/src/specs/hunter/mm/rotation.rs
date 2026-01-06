//! MM Hunter rotation bindings for the Rhai rotation system.

use crate::rotation::bindings::RotationBindings;
use crate::rotation::schema::{GameState, StateSchema};
use crate::sim::SimState;
use crate::types::SpellIdx;
use super::constants::*;

/// MM Hunter rotation bindings implementation.
#[derive(Debug, Clone, Default)]
pub struct MmHunterBindings;

impl MmHunterBindings {
    pub fn new() -> Self {
        Self
    }
}

impl RotationBindings for MmHunterBindings {
    fn update_state(&self, state: &mut GameState, schema: &StateSchema, sim: &SimState) {
        let now = sim.now();

        // Power: Focus
        if let Some(slot) = schema.slot("power_focus") {
            let focus = sim.player.resources.primary
                .as_ref()
                .map(|r| r.current)
                .unwrap_or(0.0);
            state.set_float(slot, focus as f64);
        }

        // Target health percent
        if let Some(slot) = schema.slot("target_health_pct") {
            let health_pct = sim.enemies.primary()
                .map(|e| e.health_percent())
                .unwrap_or(1.0);
            state.set_float(slot, health_pct as f64);
        }

        // Aura: Trueshot remaining time
        if let Some(slot) = schema.slot("aura_trueshot_remaining") {
            let remaining = sim.player.buffs.get(TRUESHOT_BUFF)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Aura: Precise Shots remaining time
        if let Some(slot) = schema.slot("aura_precise_shots_remaining") {
            let remaining = sim.player.buffs.get(PRECISE_SHOTS)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Aura: Steady Focus remaining time
        if let Some(slot) = schema.slot("aura_steady_focus_remaining") {
            let remaining = sim.player.buffs.get(STEADY_FOCUS)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown: Aimed Shot remaining
        if let Some(slot) = schema.slot("cooldown_aimed_shot_remaining") {
            let remaining = sim.player.cooldown(AIMED_SHOT)
                .map(|cd| cd.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown: Rapid Fire remaining
        if let Some(slot) = schema.slot("cooldown_rapid_fire_remaining") {
            let remaining = sim.player.cooldown(RAPID_FIRE)
                .map(|cd| cd.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown: Trueshot remaining
        if let Some(slot) = schema.slot("cooldown_trueshot_remaining") {
            let remaining = sim.player.cooldown(TRUESHOT)
                .map(|cd| cd.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }
    }

    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState) -> Vec<(usize, bool)> {
        let now = sim.now();
        let mut results = Vec::new();

        for call in schema.method_calls() {
            let result = match (call.namespace.as_str(), call.path.as_slice(), call.method.as_str()) {
                // Cooldown ready checks
                ("cooldown", [spell], "ready") => {
                    evaluate_cooldown_ready(sim, spell, now)
                }
                // Aura active checks
                ("aura", [aura], "active") => {
                    evaluate_aura_active(sim, aura, now)
                }
                // Aura stacks (as bool: > 0)
                ("aura", [aura], "stacks") => {
                    evaluate_aura_has_stacks(sim, aura, now)
                }
                _ => false,
            };

            if let Some(slot) = schema.slot(&call.var) {
                results.push((slot, result));
            }
        }

        results
    }
}

/// Evaluate if a cooldown is ready
fn evaluate_cooldown_ready(sim: &SimState, spell_name: &str, now: crate::types::SimTime) -> bool {
    let spell = match spell_name {
        "aimed_shot" => AIMED_SHOT,
        "rapid_fire" => RAPID_FIRE,
        "trueshot" => TRUESHOT,
        "kill_shot" => KILL_SHOT,
        _ => return false,
    };

    sim.player.cooldown(spell)
        .map(|cd| cd.is_ready(now))
        .unwrap_or(true)
}

/// Evaluate if an aura is active
fn evaluate_aura_active(sim: &SimState, aura_name: &str, now: crate::types::SimTime) -> bool {
    let aura = match aura_name {
        "trueshot" => TRUESHOT_BUFF,
        "precise_shots" => PRECISE_SHOTS,
        "steady_focus" => STEADY_FOCUS,
        "lone_wolf" => LONE_WOLF,
        "lock_and_load" => LOCK_AND_LOAD,
        "trick_shots" => TRICK_SHOTS,
        _ => return false,
    };

    sim.player.buffs.has(aura, now)
}

/// Evaluate if an aura has stacks (> 0)
fn evaluate_aura_has_stacks(sim: &SimState, aura_name: &str, now: crate::types::SimTime) -> bool {
    let aura = match aura_name {
        "precise_shots" => PRECISE_SHOTS,
        _ => return false,
    };

    sim.player.buffs.stacks(aura, now) > 0
}

/// Convert spell name to SpellIdx
pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "aimed_shot" => Some(AIMED_SHOT),
        "rapid_fire" => Some(RAPID_FIRE),
        "steady_shot" => Some(STEADY_SHOT),
        "arcane_shot" => Some(ARCANE_SHOT),
        "kill_shot" => Some(KILL_SHOT),
        "trueshot" => Some(TRUESHOT),
        "multi_shot" => Some(MULTI_SHOT),
        _ => None,
    }
}
