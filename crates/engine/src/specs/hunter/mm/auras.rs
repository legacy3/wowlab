use super::constants::*;
use crate::spec::{AuraBuilder, AuraDef};

/// Get all MM Hunter aura definitions
pub fn aura_definitions() -> Vec<AuraDef> {
    vec![
        trueshot_buff(),
        precise_shots_buff(),
        steady_focus_buff(),
        lone_wolf_buff(),
        lock_and_load_buff(),
        trick_shots_buff(),
    ]
}

fn trueshot_buff() -> AuraDef {
    AuraBuilder::buff(TRUESHOT_BUFF, "Trueshot", TRUESHOT_DURATION)
        .haste(TRUESHOT_HASTE) // 50% haste
        .crit(TRUESHOT_CRIT) // 20% crit
        .build()
}

fn precise_shots_buff() -> AuraDef {
    AuraBuilder::buff(PRECISE_SHOTS, "Precise Shots", PRECISE_SHOTS_DURATION)
        .stacks(PRECISE_SHOTS_STACKS)
        // Note: Damage bonus applied to Arcane Shot/Multi-Shot in handler
        .build()
}

fn steady_focus_buff() -> AuraDef {
    AuraBuilder::buff(STEADY_FOCUS, "Steady Focus", STEADY_FOCUS_DURATION)
        .refreshable()
        .haste(STEADY_FOCUS_HASTE) // 7% haste
        .build()
}

fn lone_wolf_buff() -> AuraDef {
    AuraBuilder::buff(LONE_WOLF, "Lone Wolf", 0.0) // Permanent while no pet
        .hidden()
        .damage_multiplier(1.0 + LONE_WOLF_DAMAGE) // 10% damage
        .build()
}

fn lock_and_load_buff() -> AuraDef {
    AuraBuilder::buff(LOCK_AND_LOAD, "Lock and Load", 15.0)
        // Allows free instant Aimed Shot
        .build()
}

fn trick_shots_buff() -> AuraDef {
    AuraBuilder::buff(TRICK_SHOTS, "Trick Shots", 6.0)
        // Aimed Shot and Rapid Fire ricochet to nearby enemies
        .build()
}
