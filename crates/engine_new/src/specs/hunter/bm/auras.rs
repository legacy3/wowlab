use crate::spec::{AuraBuilder, AuraDef};
use super::constants::*;

/// Get all BM Hunter aura definitions
pub fn aura_definitions() -> Vec<AuraDef> {
    vec![
        bestial_wrath_buff(),
        frenzy_buff(),
        barbed_shot_dot(),
        beast_cleave_buff(),
    ]
}

fn bestial_wrath_buff() -> AuraDef {
    AuraBuilder::buff(BESTIAL_WRATH_BUFF, "Bestial Wrath", BESTIAL_WRATH_DURATION)
        .damage_multiplier(1.25) // 25% increased damage
        .build()
}

fn frenzy_buff() -> AuraDef {
    AuraBuilder::buff(FRENZY, "Frenzy", FRENZY_DURATION)
        .stacks(FRENZY_MAX_STACKS)
        .refreshable()
        // Each stack gives 10% pet attack speed
        .haste(0.10)
        .build()
}

fn barbed_shot_dot() -> AuraDef {
    AuraBuilder::dot(BARBED_SHOT_DOT, "Barbed Shot", 8.0, 2.0)
        .periodic_damage(2.0, 0.15) // 2s ticks, 15% AP per tick
        .pandemic()
        .snapshots()
        .build()
}

fn beast_cleave_buff() -> AuraDef {
    AuraBuilder::buff(BEAST_CLEAVE, "Beast Cleave", BEAST_CLEAVE_DURATION)
        // Pet attacks cleave for 35% damage while active
        .build()
}
