//! MM Hunter rotation bindings.

use crate::rotation::{ContextBuilder, RotationContext};
use crate::sim::SimState;
use crate::types::{AuraIdx, SpellIdx};
use super::constants::*;

/// MM Hunter context builder.
#[derive(Debug, Clone, Default)]
pub struct MmHunterContext;

impl MmHunterContext {
    pub fn new() -> Self {
        Self
    }
}

impl ContextBuilder for MmHunterContext {
    fn build_context(&self, sim: &SimState) -> RotationContext {
        let mut ctx = RotationContext::from_sim_state(sim);
        let now = sim.now();

        // Map cooldowns to slots
        // Slot 0: Aimed Shot
        if let Some(cd) = sim.player.cooldown(AIMED_SHOT) {
            ctx.cd_ready[0] = cd.is_ready(now);
            ctx.cd_remains[0] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 1: Rapid Fire
        if let Some(cd) = sim.player.cooldown(RAPID_FIRE) {
            ctx.cd_ready[1] = cd.is_ready(now);
            ctx.cd_remains[1] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 2: Trueshot
        if let Some(cd) = sim.player.cooldown(TRUESHOT) {
            ctx.cd_ready[2] = cd.is_ready(now);
            ctx.cd_remains[2] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 3: Kill Shot
        if let Some(cd) = sim.player.cooldown(KILL_SHOT) {
            ctx.cd_ready[3] = cd.is_ready(now);
            ctx.cd_remains[3] = cd.remaining(now).as_secs_f32() as f64;
        }

        // Map buffs to slots
        // Slot 0: Trueshot
        ctx.buff_active[0] = sim.player.buffs.has(TRUESHOT_BUFF, now);
        ctx.buff_remains[0] = sim.player.buffs.get(TRUESHOT_BUFF)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 1: Precise Shots
        ctx.buff_active[1] = sim.player.buffs.has(PRECISE_SHOTS, now);
        ctx.buff_stacks[1] = sim.player.buffs.stacks(PRECISE_SHOTS, now) as i32;
        ctx.buff_remains[1] = sim.player.buffs.get(PRECISE_SHOTS)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 2: Steady Focus
        ctx.buff_active[2] = sim.player.buffs.has(STEADY_FOCUS, now);
        ctx.buff_remains[2] = sim.player.buffs.get(STEADY_FOCUS)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 3: Trick Shots
        ctx.buff_active[3] = sim.player.buffs.has(TRICK_SHOTS, now);
        ctx.buff_remains[3] = sim.player.buffs.get(TRICK_SHOTS)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 4: Lock and Load
        ctx.buff_active[4] = sim.player.buffs.has(LOCK_AND_LOAD, now);
        ctx.buff_stacks[4] = sim.player.buffs.stacks(LOCK_AND_LOAD, now) as i32;

        ctx
    }

    fn cooldown_slot(&self, spell: SpellIdx) -> Option<usize> {
        match spell {
            x if x == AIMED_SHOT => Some(0),
            x if x == RAPID_FIRE => Some(1),
            x if x == TRUESHOT => Some(2),
            x if x == KILL_SHOT => Some(3),
            _ => None,
        }
    }

    fn buff_slot(&self, aura: AuraIdx) -> Option<usize> {
        match aura {
            x if x == TRUESHOT_BUFF => Some(0),
            x if x == PRECISE_SHOTS => Some(1),
            x if x == STEADY_FOCUS => Some(2),
            x if x == TRICK_SHOTS => Some(3),
            x if x == LOCK_AND_LOAD => Some(4),
            _ => None,
        }
    }
}

/// Convert game spell ID to internal SpellIdx.
pub fn spell_id_to_idx(id: u32) -> Option<SpellIdx> {
    match id {
        19434 => Some(AIMED_SHOT),
        257044 => Some(RAPID_FIRE),
        56641 => Some(STEADY_SHOT),
        185358 => Some(ARCANE_SHOT),
        53351 => Some(KILL_SHOT),
        288613 => Some(TRUESHOT),
        2643 => Some(MULTI_SHOT),
        _ => None,
    }
}

/// Convert spell name to SpellIdx.
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
