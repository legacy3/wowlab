//! BM Hunter rotation bindings for the Rhai rotation system.

use crate::rotation::bindings::RotationBindings;
use crate::rotation::schema::{GameState, StateSchema};
use crate::sim::SimState;
use crate::types::SpellIdx;
use super::constants::*;

/// BM Hunter rotation bindings implementation.
#[derive(Debug, Clone, Default)]
pub struct BmHunterBindings;

impl BmHunterBindings {
    pub fn new() -> Self {
        Self
    }
}

impl RotationBindings for BmHunterBindings {
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

        // Aura: Frenzy remaining time
        if let Some(slot) = schema.slot("aura_frenzy_remaining") {
            let remaining = sim.player.buffs.get(FRENZY)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Aura: Bestial Wrath remaining time
        if let Some(slot) = schema.slot("aura_bestial_wrath_remaining") {
            let remaining = sim.player.buffs.get(BESTIAL_WRATH_BUFF)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown: Kill Command remaining
        if let Some(slot) = schema.slot("cooldown_kill_command_remaining") {
            let remaining = sim.player.cooldown(KILL_COMMAND)
                .map(|cd| cd.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown: Bestial Wrath remaining
        if let Some(slot) = schema.slot("cooldown_bestial_wrath_remaining") {
            let remaining = sim.player.cooldown(BESTIAL_WRATH)
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
                // Cooldown has_charge check
                ("cooldown", [spell], "has_charge") => {
                    evaluate_has_charges(sim, spell)
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
        "kill_command" => KILL_COMMAND,
        "bestial_wrath" => BESTIAL_WRATH,
        "kill_shot" => KILL_SHOT,
        _ => return false,
    };

    sim.player.cooldown(spell)
        .map(|cd| cd.is_ready(now))
        .unwrap_or(true)
}

/// Evaluate if a charged cooldown has charges
fn evaluate_has_charges(sim: &SimState, spell_name: &str) -> bool {
    let spell = match spell_name {
        "barbed_shot" => BARBED_SHOT,
        _ => return false,
    };

    sim.player.charged_cooldown(spell)
        .map(|cd| cd.has_charge())
        .unwrap_or(false)
}

/// Evaluate if an aura is active
fn evaluate_aura_active(sim: &SimState, aura_name: &str, now: crate::types::SimTime) -> bool {
    let aura = match aura_name {
        "bestial_wrath" => BESTIAL_WRATH_BUFF,
        "frenzy" => FRENZY,
        "beast_cleave" => BEAST_CLEAVE,
        _ => return false,
    };

    sim.player.buffs.has(aura, now)
}

/// Evaluate if an aura has stacks (> 0)
fn evaluate_aura_has_stacks(sim: &SimState, aura_name: &str, now: crate::types::SimTime) -> bool {
    let aura = match aura_name {
        "frenzy" => FRENZY,
        "thrill_of_the_hunt" => THRILL_OF_THE_HUNT,
        _ => return false,
    };

    sim.player.buffs.stacks(aura, now) > 0
}

/// Convert spell name to SpellIdx
pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "kill_command" => Some(KILL_COMMAND),
        "cobra_shot" => Some(COBRA_SHOT),
        "barbed_shot" => Some(BARBED_SHOT),
        "bestial_wrath" => Some(BESTIAL_WRATH),
        "multi_shot" => Some(MULTI_SHOT),
        "kill_shot" => Some(KILL_SHOT),
        _ => None,
    }
}
