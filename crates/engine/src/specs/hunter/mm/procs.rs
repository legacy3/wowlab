use crate::proc::{ProcHandler, ProcFlags, ProcEffect, FixedProc, ProcRegistry};
use super::constants::*;

/// Setup MM Hunter procs
pub fn setup_procs(registry: &mut ProcRegistry) {
    // Lock and Load: Auto-attacks have a chance to proc a free instant Aimed Shot
    registry.register_fixed(
        FixedProc::new(LOCK_AND_LOAD_PROC, LOCK_AND_LOAD_CHANCE),
        ProcHandler::new(
            LOCK_AND_LOAD_PROC,
            "Lock and Load",
            ProcFlags::ON_AUTO_ATTACK,
            ProcEffect::ApplyAura {
                aura: LOCK_AND_LOAD,
            },
        ),
    );
}
