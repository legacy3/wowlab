use crate::proc::{ProcHandler, ProcFlags, ProcEffect, FixedProc, ProcRegistry};
use crate::types::SimTime;
use super::constants::*;

/// Setup BM Hunter procs
pub fn setup_procs(registry: &mut ProcRegistry) {
    // Wild Call: Barbed Shot has 20% chance to reset on auto-attack crits
    registry.register_fixed(
        FixedProc::new(WILD_CALL, WILD_CALL_CHANCE),
        ProcHandler::new(
            WILD_CALL,
            "Wild Call",
            ProcFlags::ON_AUTO_ATTACK | ProcFlags::ON_CRIT,
            ProcEffect::ReduceCooldown {
                spell: BARBED_SHOT,
                amount: SimTime::from_secs(12), // Full reset
            },
        ),
    );

    // Barbed Wrath: Barbed Shot reduces Bestial Wrath CD
    registry.register_fixed(
        FixedProc::new(BARBED_WRATH, 1.0), // Always triggers
        ProcHandler::new(
            BARBED_WRATH,
            "Barbed Wrath",
            ProcFlags::ON_SPELL_CAST,
            ProcEffect::ReduceCooldown {
                spell: BESTIAL_WRATH,
                amount: SimTime::from_secs(12),
            },
        ).with_spell_filter(vec![BARBED_SHOT]),
    );
}
