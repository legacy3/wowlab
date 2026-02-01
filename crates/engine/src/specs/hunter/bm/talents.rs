//! BM Hunter talent definitions (modifiers, cooldown changes, effects).

use super::constants::*;
use crate::spec::{DamageMod, ModCondition, TalentDef};

/// Single source of truth for talent flag to name mapping.
const TALENT_MAP: &[(TalentFlags, &str)] = &[
    (TalentFlags::ALPHA_PREDATOR, "alpha_predator"),
    (TalentFlags::KILLER_INSTINCT, "killer_instinct"),
    (TalentFlags::KILLER_COBRA, "killer_cobra"),
    (TalentFlags::TRAINING_EXPERT, "training_expert"),
    (TalentFlags::ANIMAL_COMPANION, "animal_companion"),
    (TalentFlags::SOLITARY_COMPANION, "solitary_companion"),
    (TalentFlags::BRUTAL_COMPANION, "brutal_companion"),
    (TalentFlags::PIERCING_FANGS, "piercing_fangs"),
    (TalentFlags::SERPENTINE_RHYTHM, "serpentine_rhythm"),
    (TalentFlags::GO_FOR_THE_THROAT, "go_for_the_throat"),
    (TalentFlags::PACK_MENTALITY, "pack_mentality"),
    (TalentFlags::WILD_INSTINCTS, "wild_instincts"),
    (TalentFlags::KILL_CLEAVE, "kill_cleave"),
    (TalentFlags::BLOODY_FRENZY, "bloody_frenzy"),
    (TalentFlags::THUNDERING_HOOVES, "thundering_hooves"),
    (TalentFlags::MASTER_HANDLER, "master_handler"),
    (TalentFlags::DIRE_FRENZY, "dire_frenzy"),
    (TalentFlags::WITHERING_FIRE, "withering_fire"),
];

/// Get all BM Hunter talent definitions.
pub fn talent_definitions() -> Vec<TalentDef> {
    vec![
        // Core talents
        alpha_predator(),
        killer_instinct(),
        killer_cobra(),
        training_expert(),
        // Pet talents
        animal_companion(),
        solitary_companion(),
        wild_hunt(),
        brutal_companion(),
        // Damage talents
        piercing_fangs(),
        serpentine_rhythm(),
        go_for_the_throat(),
        pack_mentality(),
        wild_instincts(),
        // Cooldown talents
        kill_cleave_talent(),
        bloody_frenzy(),
        thundering_hooves(),
        master_handler(),
        dire_frenzy(),
        withering_fire(),
    ]
}

/// Get active talent names from flags.
pub fn active_talents(flags: TalentFlags) -> Vec<&'static str> {
    let mut talents: Vec<&'static str> = TALENT_MAP
        .iter()
        .filter(|(flag, _)| flags.contains(*flag))
        .map(|(_, name)| *name)
        .collect();
    // Wild Hunt is always active (passive with no flag)
    talents.push("wild_hunt");
    talents
}

/// Collect all damage modifiers from active talents.
pub fn collect_damage_mods(flags: TalentFlags) -> Vec<DamageMod> {
    talent_definitions()
        .into_iter()
        .filter(|t| is_talent_active(flags, &t.name))
        .flat_map(|t| t.damage_mods)
        .collect()
}

fn is_talent_active(flags: TalentFlags, name: &str) -> bool {
    if name == "wild_hunt" {
        return true; // Always active passive
    }
    TALENT_MAP
        .iter()
        .find(|(_, n)| *n == name)
        .map(|(flag, _)| flags.contains(*flag))
        .unwrap_or(false)
}

fn alpha_predator() -> TalentDef {
    TalentDef::new("alpha_predator", "Alpha Predator")
        // +30% Kill Command damage
        .spell_damage(KILL_COMMAND, 1.0 + ALPHA_PREDATOR_KC_BONUS)
        // +1 Barbed Shot charge (handled in handler)
        .extra_charges(BARBED_SHOT, 1)
}

fn killer_instinct() -> TalentDef {
    TalentDef::new("killer_instinct", "Killer Instinct")
        // +50% damage to targets below 35% health
        .execute_damage(KILLER_INSTINCT_THRESHOLD, 1.0 + KILLER_INSTINCT_BONUS)
}

fn killer_cobra() -> TalentDef {
    TalentDef::new("killer_cobra", "Killer Cobra")
    // While Bestial Wrath is active, Cobra Shot resets Kill Command CD
    // This is handled via effects, not damage mods
}

fn training_expert() -> TalentDef {
    TalentDef::new("training_expert", "Training Expert")
        // +10% pet damage
        .pet_damage(1.0 + TRAINING_EXPERT_BONUS)
}

fn animal_companion() -> TalentDef {
    TalentDef::new("animal_companion", "Animal Companion")
    // Summon a second pet - handled via spell effects
}

fn solitary_companion() -> TalentDef {
    TalentDef::new("solitary_companion", "Solitary Companion")
        // +10% damage without Animal Companion
        .damage_mod(
            DamageMod::always("solitary_companion", 1.10)
                .when(ModCondition::TalentEnabled("solitary_companion".into())),
        )
}

fn wild_hunt() -> TalentDef {
    TalentDef::new("wild_hunt", "Wild Hunt")
        // +10% pet damage when pet focus > 50 (simplified to always active)
        .pet_damage(1.0 + WILD_HUNT_DAMAGE_BONUS)
}

fn brutal_companion() -> TalentDef {
    TalentDef::new("brutal_companion", "Brutal Companion")
    // Extra pet attack at max Frenzy - handled in handler
}

fn piercing_fangs() -> TalentDef {
    TalentDef::new("piercing_fangs", "Piercing Fangs")
        // Pet crit damage during Bestial Wrath
        .damage_mod(DamageMod {
            name: "piercing_fangs".into(),
            multiplier: 1.0 + PIERCING_FANGS_CRIT_DAMAGE,
            condition: ModCondition::And(vec![
                ModCondition::PetAbility,
                ModCondition::BuffActive(BESTIAL_WRATH_BUFF),
                ModCondition::OnCrit,
            ]),
            priority: 0,
        })
}

fn serpentine_rhythm() -> TalentDef {
    TalentDef::new("serpentine_rhythm", "Serpentine Rhythm")
        // Cobra Shot damage bonus per stack
        .damage_mod(DamageMod {
            name: "serpentine_rhythm".into(),
            multiplier: 1.0, // Calculated at runtime based on stacks
            condition: ModCondition::And(vec![
                ModCondition::ForSpell(COBRA_SHOT),
                ModCondition::PerStack {
                    aura: SERPENTINE_RHYTHM,
                    per_stack: SERPENTINE_RHYTHM_DAMAGE,
                },
            ]),
            priority: 0,
        })
}

fn go_for_the_throat() -> TalentDef {
    TalentDef::new("go_for_the_throat", "Go for the Throat")
        // KC crit damage scales with crit rating
        .damage_mod(DamageMod {
            name: "go_for_the_throat".into(),
            multiplier: 1.0, // Calculated at runtime
            condition: ModCondition::And(vec![
                ModCondition::ForSpell(KILL_COMMAND),
                ModCondition::OnCrit,
                ModCondition::StatScaling {
                    base: GO_FOR_THE_THROAT_SCALING,
                },
            ]),
            priority: 0,
        })
}

fn pack_mentality() -> TalentDef {
    TalentDef::new("pack_mentality", "Pack Mentality")
        // KC damage bonus with special pet buff
        .damage_mod(DamageMod {
            name: "pack_mentality".into(),
            multiplier: 1.0 + PACK_MENTALITY_BONUS,
            condition: ModCondition::And(vec![
                ModCondition::ForSpell(KILL_COMMAND),
                ModCondition::BuffActive(PACK_MENTALITY),
            ]),
            priority: 0,
        })
}

fn wild_instincts() -> TalentDef {
    TalentDef::new("wild_instincts", "Wild Instincts")
        // KC bonus vs debuffed targets - per stack
        .damage_mod(DamageMod {
            name: "wild_instincts".into(),
            multiplier: 1.0,
            condition: ModCondition::And(vec![
                ModCondition::ForSpell(KILL_COMMAND),
                ModCondition::PerStack {
                    aura: WILD_INSTINCTS,
                    per_stack: 0.05,
                },
            ]),
            priority: 0,
        })
}

fn kill_cleave_talent() -> TalentDef {
    TalentDef::new("kill_cleave", "Kill Cleave")
    // KC cleaves during Beast Cleave - handled via spell effects
}

fn bloody_frenzy() -> TalentDef {
    TalentDef::new("bloody_frenzy", "Bloody Frenzy")
    // Beast Cleave active during Call of the Wild - handled via spell effects
}

fn thundering_hooves() -> TalentDef {
    TalentDef::new("thundering_hooves", "Thundering Hooves")
    // Bestial Wrath casts Explosive Shot - handled via spell effects
}

fn master_handler() -> TalentDef {
    TalentDef::new("master_handler", "Master Handler")
        // Barbed Shot ticks reduce KC CD - handled in tick handler
        .cooldown_reduction(KILL_COMMAND, MASTER_HANDLER_CDR, 0.0)
}

fn dire_frenzy() -> TalentDef {
    TalentDef::new("dire_frenzy", "Dire Frenzy")
    // Dire Beast extends Frenzy - handled via spell effects
}

fn withering_fire() -> TalentDef {
    TalentDef::new("withering_fire", "Withering Fire")
    // Free abilities during CDs - handled in cost check
}
