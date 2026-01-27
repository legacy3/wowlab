use super::{FixedProc, ProcContext, ProcEffect, ProcFlags, ProcHandler, RppmState};
use crate::core::FastRng;
use wowlab_common::types::ProcIdx;
use wowlab_common::types::SimTime;

#[derive(Clone, Debug)]
pub struct ProcRegistry {
    rppm: Vec<RppmState>,
    fixed: Vec<FixedProc>,
    handlers: Vec<ProcHandler>,
}

impl ProcRegistry {
    pub fn new() -> Self {
        Self {
            rppm: Vec::new(),
            fixed: Vec::new(),
            handlers: Vec::new(),
        }
    }

    pub fn register_rppm(&mut self, state: RppmState, handler: ProcHandler) {
        self.rppm.push(state);
        self.handlers.push(handler);
    }

    pub fn register_fixed(&mut self, state: FixedProc, handler: ProcHandler) {
        self.fixed.push(state);
        self.handlers.push(handler);
    }

    pub fn get_handler(&self, id: ProcIdx) -> Option<&ProcHandler> {
        self.handlers.iter().find(|h| h.id == id)
    }

    pub fn get_rppm_mut(&mut self, id: ProcIdx) -> Option<&mut RppmState> {
        self.rppm.iter_mut().find(|r| r.proc_id == id)
    }

    pub fn get_fixed_mut(&mut self, id: ProcIdx) -> Option<&mut FixedProc> {
        self.fixed.iter_mut().find(|f| f.proc_id == id)
    }

    pub fn reset(&mut self) {
        for rppm in &mut self.rppm {
            rppm.reset();
        }

        for fixed in &mut self.fixed {
            fixed.reset();
        }
    }

    pub fn check_procs(
        &mut self,
        ctx: &ProcContext,
        now: SimTime,
        rng: &mut FastRng,
    ) -> Vec<(ProcIdx, ProcEffect)> {
        let mut triggered = Vec::new();

        for rppm in &mut self.rppm {
            if let Some(handler) = self.handlers.iter().find(|h| h.id == rppm.proc_id) {
                if handler.can_trigger(ctx) && rppm.attempt(now, ctx.haste, 0.0, rng) {
                    triggered.push((rppm.proc_id, handler.effect.clone()));
                }
            }
        }

        for fixed in &mut self.fixed {
            if let Some(handler) = self.handlers.iter().find(|h| h.id == fixed.proc_id) {
                if handler.can_trigger(ctx) && fixed.attempt(now, rng) {
                    triggered.push((fixed.proc_id, handler.effect.clone()));
                }
            }
        }

        triggered
    }

    pub fn handlers_for(&self, flags: ProcFlags) -> impl Iterator<Item = &ProcHandler> {
        self.handlers
            .iter()
            .filter(move |h| h.triggers.intersects(flags))
    }
}

impl Default for ProcRegistry {
    fn default() -> Self {
        Self::new()
    }
}
