//! BM Hunter rotation bindings.

use crate::rotation::{ContextBuilder, RotationContext};
use crate::sim::SimState;
use crate::types::{AuraIdx, SpellIdx};
use super::constants::*;

/// BM Hunter context builder.
#[derive(Debug, Clone, Default)]
pub struct BmHunterContext;

impl BmHunterContext {
    pub fn new() -> Self {
        Self
    }
}

impl ContextBuilder for BmHunterContext {
    fn build_context(&self, sim: &SimState) -> RotationContext {
        let mut ctx = RotationContext::from_sim_state(sim);
        let now = sim.now();

        // Map cooldowns to slots
        // Slot 0: Kill Command
        if let Some(cd) = sim.player.cooldown(KILL_COMMAND) {
            ctx.cd_ready[0] = cd.is_ready(now);
            ctx.cd_remains[0] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 1: Bestial Wrath
        if let Some(cd) = sim.player.cooldown(BESTIAL_WRATH) {
            ctx.cd_ready[1] = cd.is_ready(now);
            ctx.cd_remains[1] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 2: Barbed Shot (charged)
        if let Some(cd) = sim.player.charged_cooldown(BARBED_SHOT) {
            ctx.cd_ready[2] = cd.has_charge();
            ctx.cd_charges[2] = cd.current_charges as i32;
            ctx.cd_remains[2] = cd.time_until_charge(now).as_secs_f32() as f64;
        }
        // Slot 3: Call of the Wild
        if let Some(cd) = sim.player.cooldown(CALL_OF_THE_WILD) {
            ctx.cd_ready[3] = cd.is_ready(now);
            ctx.cd_remains[3] = cd.remaining(now).as_secs_f32() as f64;
        }
        // Slot 4: Kill Shot
        if let Some(cd) = sim.player.cooldown(KILL_SHOT) {
            ctx.cd_ready[4] = cd.is_ready(now);
            ctx.cd_remains[4] = cd.remaining(now).as_secs_f32() as f64;
        }

        // Map buffs to slots
        // Slot 0: Bestial Wrath
        ctx.buff_active[0] = sim.player.buffs.has(BESTIAL_WRATH_BUFF, now);
        ctx.buff_remains[0] = sim.player.buffs.get(BESTIAL_WRATH_BUFF)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 1: Frenzy
        ctx.buff_active[1] = sim.player.buffs.has(FRENZY, now);
        ctx.buff_stacks[1] = sim.player.buffs.stacks(FRENZY, now) as i32;
        ctx.buff_remains[1] = sim.player.buffs.get(FRENZY)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);
        // Slot 2: Beast Cleave
        ctx.buff_active[2] = sim.player.buffs.has(BEAST_CLEAVE, now);
        ctx.buff_remains[2] = sim.player.buffs.get(BEAST_CLEAVE)
            .map(|a| a.remaining(now).as_secs_f32() as f64)
            .unwrap_or(0.0);

        ctx
    }

    fn cooldown_slot(&self, spell: SpellIdx) -> Option<usize> {
        match spell {
            x if x == KILL_COMMAND => Some(0),
            x if x == BESTIAL_WRATH => Some(1),
            x if x == BARBED_SHOT => Some(2),
            x if x == CALL_OF_THE_WILD => Some(3),
            x if x == KILL_SHOT => Some(4),
            _ => None,
        }
    }

    fn buff_slot(&self, aura: AuraIdx) -> Option<usize> {
        match aura {
            x if x == BESTIAL_WRATH_BUFF => Some(0),
            x if x == FRENZY => Some(1),
            x if x == BEAST_CLEAVE => Some(2),
            _ => None,
        }
    }
}

/// Convert game spell ID to internal SpellIdx.
pub fn spell_id_to_idx(id: u32) -> Option<SpellIdx> {
    match id {
        34026 => Some(KILL_COMMAND),
        193455 => Some(COBRA_SHOT),
        217200 => Some(BARBED_SHOT),
        19574 => Some(BESTIAL_WRATH),
        2643 => Some(MULTI_SHOT),
        53351 => Some(KILL_SHOT),
        359844 => Some(CALL_OF_THE_WILD),
        321530 => Some(BLOODSHED),
        120679 => Some(DIRE_BEAST),
        131894 => Some(MURDER_OF_CROWS),
        212431 => Some(EXPLOSIVE_SHOT),
        467902 => Some(BLACK_ARROW),
        _ => None,
    }
}

/// Convert spell name to SpellIdx.
pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "kill_command" => Some(KILL_COMMAND),
        "cobra_shot" => Some(COBRA_SHOT),
        "barbed_shot" => Some(BARBED_SHOT),
        "bestial_wrath" => Some(BESTIAL_WRATH),
        "multi_shot" => Some(MULTI_SHOT),
        "kill_shot" => Some(KILL_SHOT),
        "call_of_the_wild" => Some(CALL_OF_THE_WILD),
        "bloodshed" => Some(BLOODSHED),
        "dire_beast" => Some(DIRE_BEAST),
        "murder_of_crows" => Some(MURDER_OF_CROWS),
        "explosive_shot" => Some(EXPLOSIVE_SHOT),
        "black_arrow" => Some(BLACK_ARROW),
        _ => None,
    }
}
