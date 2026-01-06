use crate::spec::{AuraBuilder, AuraDef};
use super::constants::*;

/// Get all BM Hunter aura definitions
pub fn aura_definitions() -> Vec<AuraDef> {
    vec![
        // Core buffs
        bestial_wrath_buff(),
        frenzy_buff(),
        barbed_shot_dot(),
        beast_cleave_buff(),
        // Major cooldown buffs/debuffs
        call_of_the_wild_buff(),
        bloodshed_debuff(),
        murder_of_crows_debuff(),
        // Talent buffs
        thrill_of_the_hunt_buff(),
        thrill_of_the_hunt_pet_buff(),
        serpentine_rhythm_buff(),
        piercing_fangs_buff(),
        serpent_sting_dot(),
        laceration_dot(),
        snakeskin_quiver_buff(),
        wild_instincts_debuff(),
        brutal_companion_buff(),
        // Hero talent buffs - Pack Leader
        wyvern_ready_buff(),
        boar_ready_buff(),
        bear_ready_buff(),
        mongoose_fury_buff(),
        pack_mentality_buff(),
        envenomed_fangs_dot(),
        // Hero talent buffs - Dark Ranger
        black_arrow_dot(),
        phantom_pain_buff(),
        withering_fire_buff(),
    ]
}

// ============================================================================
// Core Buffs
// ============================================================================

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
        .refreshable()
        .build()
}

// ============================================================================
// Major Cooldown Buffs/Debuffs
// ============================================================================

fn call_of_the_wild_buff() -> AuraDef {
    AuraBuilder::buff(CALL_OF_THE_WILD_BUFF, "Call of the Wild", CALL_OF_THE_WILD_DURATION)
        // Spawns pets every 4 seconds, reduces KC/BS cooldowns
        .build()
}

fn bloodshed_debuff() -> AuraDef {
    AuraBuilder::dot(BLOODSHED_DEBUFF, "Bloodshed", BLOODSHED_DURATION, 2.0)
        .periodic_damage(2.0, BLOODSHED_AP_COEF / 6.0) // Divided across ticks
        .snapshots()
        .build()
}

fn murder_of_crows_debuff() -> AuraDef {
    AuraBuilder::dot(MURDER_OF_CROWS_DEBUFF, "A Murder of Crows", MURDER_OF_CROWS_DURATION, MURDER_OF_CROWS_TICK)
        .periodic_damage(MURDER_OF_CROWS_TICK, 0.12) // AP coefficient per tick
        .snapshots()
        .build()
}

// ============================================================================
// Talent Buffs
// ============================================================================

/// Thrill of the Hunt - player crit buff
fn thrill_of_the_hunt_buff() -> AuraDef {
    AuraBuilder::buff(THRILL_OF_THE_HUNT, "Thrill of the Hunt", THRILL_OF_THE_HUNT_DURATION)
        .stacks(THRILL_OF_THE_HUNT_STACKS)
        .refreshable()
        .crit(THRILL_OF_THE_HUNT_CRIT) // 2% crit per stack
        .build()
}

/// Thrill of the Hunt - pet crit buff
fn thrill_of_the_hunt_pet_buff() -> AuraDef {
    AuraBuilder::buff(THRILL_OF_THE_HUNT_PET, "Thrill of the Hunt (Pet)", THRILL_OF_THE_HUNT_DURATION)
        .stacks(THRILL_OF_THE_HUNT_STACKS)
        .refreshable()
        .crit(THRILL_OF_THE_HUNT_CRIT) // 2% crit per stack
        .hidden()
        .build()
}

/// Serpentine Rhythm - Cobra Shot damage buff
fn serpentine_rhythm_buff() -> AuraDef {
    AuraBuilder::buff(SERPENTINE_RHYTHM, "Serpentine Rhythm", SERPENTINE_RHYTHM_DURATION)
        .stacks(SERPENTINE_RHYTHM_STACKS)
        .refreshable()
        .damage_multiplier(1.0 + SERPENTINE_RHYTHM_DAMAGE) // 5% per stack
        .build()
}

/// Piercing Fangs - pet crit bonus during Bestial Wrath
fn piercing_fangs_buff() -> AuraDef {
    AuraBuilder::buff(PIERCING_FANGS, "Piercing Fangs", BESTIAL_WRATH_DURATION)
        .crit(PIERCING_FANGS_CRIT) // 10% pet crit
        .build()
}

/// Serpent Sting - from Poisoned Barbs talent
fn serpent_sting_dot() -> AuraDef {
    AuraBuilder::dot(SERPENT_STING, "Serpent Sting", SERPENT_STING_DURATION, 3.0)
        .periodic_damage(3.0, 0.08) // Nature damage over time
        .pandemic()
        .build()
}

/// Laceration - bleed from crits
fn laceration_dot() -> AuraDef {
    AuraBuilder::dot(LACERATION, "Laceration", LACERATION_DURATION, 1.0)
        .periodic_damage(1.0, LACERATION_AP_COEF / 4.0) // Divided across ticks
        .snapshots()
        .build()
}

/// Snakeskin Quiver - free Cobra Shot proc
fn snakeskin_quiver_buff() -> AuraDef {
    AuraBuilder::buff(SNAKESKIN_QUIVER_PROC, "Snakeskin Quiver", 15.0)
        // Next Cobra Shot is free
        .build()
}

/// Wild Instincts - KC debuff during Call of the Wild
fn wild_instincts_debuff() -> AuraDef {
    AuraBuilder::debuff(WILD_INSTINCTS, "Wild Instincts", 6.0)
        .stacks(3)
        .refreshable()
        // KC deals increased damage to target
        .build()
}

/// Brutal Companion - extra pet attack at max Frenzy
fn brutal_companion_buff() -> AuraDef {
    AuraBuilder::buff(BRUTAL_COMPANION_BUFF, "Brutal Companion", 5.0)
        .hidden()
        .build()
}

// ============================================================================
// Hero Talent Buffs - Pack Leader
// ============================================================================

fn wyvern_ready_buff() -> AuraDef {
    AuraBuilder::buff(WYVERN_READY, "Wyvern Ready", 30.0)
        .hidden()
        .build()
}

fn boar_ready_buff() -> AuraDef {
    AuraBuilder::buff(BOAR_READY, "Boar Ready", 30.0)
        .hidden()
        .build()
}

fn bear_ready_buff() -> AuraDef {
    AuraBuilder::buff(BEAR_READY, "Bear Ready", 30.0)
        .hidden()
        .build()
}

fn mongoose_fury_buff() -> AuraDef {
    AuraBuilder::buff(MONGOOSE_FURY, "Mongoose Fury", 14.0)
        .stacks(5)
        .refreshable()
        .damage_multiplier(1.05) // 5% per stack
        .build()
}

fn pack_mentality_buff() -> AuraDef {
    AuraBuilder::buff(PACK_MENTALITY, "Pack Mentality", 15.0)
        // KC damage bonus when special pet active
        .damage_multiplier(1.0 + PACK_MENTALITY_BONUS)
        .build()
}

fn envenomed_fangs_dot() -> AuraDef {
    AuraBuilder::dot(ENVENOMED_FANGS, "Envenomed Fangs", ENVENOMED_FANGS_DURATION, ENVENOMED_FANGS_TICK)
        .periodic_damage(ENVENOMED_FANGS_TICK, 0.15) // Nature damage
        .build()
}

// ============================================================================
// Hero Talent Buffs - Dark Ranger
// ============================================================================

fn black_arrow_dot() -> AuraDef {
    AuraBuilder::dot(BLACK_ARROW_DOT, "Black Arrow", BLACK_ARROW_DURATION, BLACK_ARROW_TICK)
        .periodic_damage(BLACK_ARROW_TICK, BLACK_ARROW_AP_COEF)
        .pandemic()
        .build()
}

fn phantom_pain_buff() -> AuraDef {
    AuraBuilder::buff(PHANTOM_PAIN, "Phantom Pain", 10.0)
        // Damage dealt is replicated to Black Arrow targets
        .hidden()
        .build()
}

fn withering_fire_buff() -> AuraDef {
    AuraBuilder::buff(WITHERING_FIRE, "Withering Fire", 10.0)
        // Free abilities during big cooldowns
        .stacks(3)
        .build()
}
