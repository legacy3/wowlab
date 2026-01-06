use crate::proc::{ProcHandler, ProcFlags, ProcEffect, FixedProc, ProcRegistry};
use crate::types::{SimTime, ProcIdx};
use super::constants::*;

/// Setup BM Hunter procs based on enabled talents
pub fn setup_procs(registry: &mut ProcRegistry) {
    setup_base_procs(registry);
}

/// Setup procs with talent configuration
pub fn setup_procs_with_talents(registry: &mut ProcRegistry, talents: TalentFlags) {
    setup_base_procs(registry);
    setup_talent_procs(registry, talents);
    setup_hero_talent_procs(registry, talents);
}

/// Base procs always active
fn setup_base_procs(registry: &mut ProcRegistry) {
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

/// Talent-based procs
fn setup_talent_procs(registry: &mut ProcRegistry, talents: TalentFlags) {
    // War Orders: 50% chance to reset KC on Barbed Shot
    if talents.contains(TalentFlags::WAR_ORDERS) {
        registry.register_fixed(
            FixedProc::new(WAR_ORDERS, WAR_ORDERS_CHANCE),
            ProcHandler::new(
                WAR_ORDERS,
                "War Orders",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ReduceCooldown {
                    spell: KILL_COMMAND,
                    amount: SimTime::from_secs_f32(7.5), // Full reset
                },
            ).with_spell_filter(vec![BARBED_SHOT]),
        );
    }

    // Thrill of the Hunt: Barbed Shot grants crit stacks
    if talents.contains(TalentFlags::THRILL_OF_THE_HUNT) {
        registry.register_fixed(
            FixedProc::new(THRILL_OF_THE_HUNT_PROC, 1.0),
            ProcHandler::new(
                THRILL_OF_THE_HUNT_PROC,
                "Thrill of the Hunt",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::AddStacks {
                    aura: THRILL_OF_THE_HUNT,
                    stacks: 1,
                },
            ).with_spell_filter(vec![BARBED_SHOT]),
        );
    }

    // Laceration: Crits apply bleed
    if talents.contains(TalentFlags::LACERATION) {
        registry.register_fixed(
            FixedProc::new(LACERATION_PROC, 1.0),
            ProcHandler::new(
                LACERATION_PROC,
                "Laceration",
                ProcFlags::ON_CRIT,
                ProcEffect::ApplyAura {
                    aura: LACERATION,
                },
            ),
        );
    }

    // Barbed Scales: Cobra Shot reduces Barbed Shot CD
    if talents.contains(TalentFlags::BARBED_SCALES) {
        registry.register_fixed(
            FixedProc::new(BARBED_SCALES, 1.0),
            ProcHandler::new(
                BARBED_SCALES,
                "Barbed Scales",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ReduceCooldown {
                    spell: BARBED_SHOT,
                    amount: SimTime::from_secs_f32(BARBED_SCALES_CDR),
                },
            ).with_spell_filter(vec![COBRA_SHOT]),
        );
    }

    // Snakeskin Quiver: 20% chance for free Cobra Shot
    if talents.contains(TalentFlags::SNAKESKIN_QUIVER) {
        registry.register_fixed(
            FixedProc::new(SNAKESKIN_QUIVER, SNAKESKIN_QUIVER_CHANCE),
            ProcHandler::new(
                SNAKESKIN_QUIVER,
                "Snakeskin Quiver",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: SNAKESKIN_QUIVER_PROC,
                },
            ).with_spell_filter(vec![COBRA_SHOT]),
        );
    }

    // Hunter's Prey: KC crits reduce Kill Shot CD
    if talents.contains(TalentFlags::HUNTERS_PREY) {
        registry.register_fixed(
            FixedProc::new(HUNTERS_PREY, 1.0),
            ProcHandler::new(
                HUNTERS_PREY,
                "Hunter's Prey",
                ProcFlags::ON_SPELL_CAST | ProcFlags::ON_CRIT,
                ProcEffect::ReduceCooldown {
                    spell: KILL_SHOT,
                    amount: SimTime::from_secs_f32(HUNTERS_PREY_CDR),
                },
            ).with_spell_filter(vec![KILL_COMMAND]),
        );
    }

    // Dire Command: KC has chance to spawn Dire Beast
    if talents.contains(TalentFlags::DIRE_COMMAND) {
        registry.register_fixed(
            FixedProc::new(DIRE_COMMAND, DIRE_COMMAND_CHANCE),
            ProcHandler::new(
                DIRE_COMMAND,
                "Dire Command",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::CastSpell {
                    spell: DIRE_BEAST,
                },
            ).with_spell_filter(vec![KILL_COMMAND]),
        );
    }

    // Master Handler: Barbed Shot ticks reduce KC CD
    if talents.contains(TalentFlags::MASTER_HANDLER) {
        registry.register_fixed(
            FixedProc::new(MASTER_HANDLER, 1.0),
            ProcHandler::new(
                MASTER_HANDLER,
                "Master Handler",
                ProcFlags::ON_PERIODIC_DAMAGE,
                ProcEffect::ReduceCooldown {
                    spell: KILL_COMMAND,
                    amount: SimTime::from_secs_f32(MASTER_HANDLER_CDR),
                },
            ),
        );
    }

    // Killer Cobra: Cobra Shot resets KC during BW
    if talents.contains(TalentFlags::KILLER_COBRA) {
        registry.register_fixed(
            FixedProc::new(KILLER_COBRA, 1.0),
            ProcHandler::new(
                KILLER_COBRA,
                "Killer Cobra",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ReduceCooldown {
                    spell: KILL_COMMAND,
                    amount: SimTime::from_secs_f32(7.5),
                },
            )
            .with_spell_filter(vec![COBRA_SHOT])
            .with_requires_aura(BESTIAL_WRATH_BUFF),
        );
    }

    // Scent of Blood: BW resets Barbed Shot charges
    if talents.contains(TalentFlags::SCENT_OF_BLOOD) {
        registry.register_fixed(
            FixedProc::new(SCENT_OF_BLOOD, 1.0),
            ProcHandler::new(
                SCENT_OF_BLOOD,
                "Scent of Blood",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ReduceCooldown {
                    spell: BARBED_SHOT,
                    amount: SimTime::from_secs(24), // 2 charges worth
                },
            ).with_spell_filter(vec![BESTIAL_WRATH]),
        );
    }

    // Stomp: Barbed Shot triggers pet Stomp
    if talents.contains(TalentFlags::STOMP) {
        registry.register_fixed(
            FixedProc::new(STOMP_PROC, 1.0),
            ProcHandler::new(
                STOMP_PROC,
                "Stomp",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::CastSpell {
                    spell: PET_STOMP,
                },
            ).with_spell_filter(vec![BARBED_SHOT]),
        );
    }

    // Serpentine Rhythm: Cobra Shot builds stacks
    if talents.contains(TalentFlags::SERPENTINE_RHYTHM) {
        registry.register_fixed(
            FixedProc::new(ProcIdx(50), 1.0), // Temp proc ID
            ProcHandler::new(
                ProcIdx(50),
                "Serpentine Rhythm",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::AddStacks {
                    aura: SERPENTINE_RHYTHM,
                    stacks: 1,
                },
            ).with_spell_filter(vec![COBRA_SHOT]),
        );
    }

    // Piercing Fangs: BW applies pet crit buff
    if talents.contains(TalentFlags::PIERCING_FANGS) {
        registry.register_fixed(
            FixedProc::new(ProcIdx(51), 1.0),
            ProcHandler::new(
                ProcIdx(51),
                "Piercing Fangs",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: PIERCING_FANGS,
                },
            ).with_spell_filter(vec![BESTIAL_WRATH]),
        );
    }

    // Poisoned Barbs: Barbed Shot applies Serpent Sting
    if talents.contains(TalentFlags::POISONED_BARBS) {
        registry.register_fixed(
            FixedProc::new(ProcIdx(52), 1.0),
            ProcHandler::new(
                ProcIdx(52),
                "Poisoned Barbs",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: SERPENT_STING,
                },
            ).with_spell_filter(vec![BARBED_SHOT]),
        );
    }

    // Bloodshed Dire Beast: 10% chance per Bloodshed tick
    if talents.contains(TalentFlags::BLOODSHED) {
        registry.register_fixed(
            FixedProc::new(BLOODSHED_DIRE_BEAST, BLOODSHED_DIRE_BEAST_CHANCE),
            ProcHandler::new(
                BLOODSHED_DIRE_BEAST,
                "Bloodshed Dire Beast",
                ProcFlags::ON_PERIODIC_DAMAGE,
                ProcEffect::CastSpell {
                    spell: DIRE_BEAST,
                },
            ),
        );
    }
}

/// Hero talent procs
fn setup_hero_talent_procs(registry: &mut ProcRegistry, talents: TalentFlags) {
    // Pack Leader: Lead from the Front - BW triggers pack leader summon
    if talents.contains(TalentFlags::LEAD_FROM_THE_FRONT) {
        registry.register_fixed(
            FixedProc::new(LEAD_FROM_THE_FRONT, 1.0),
            ProcHandler::new(
                LEAD_FROM_THE_FRONT,
                "Lead from the Front",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::CastSpell {
                    spell: HOWL_OF_THE_PACK_LEADER,
                },
            ).with_spell_filter(vec![BESTIAL_WRATH]),
        );
    }

    // Pack Leader: Covering Fire - Multi-Shot extends Beast Cleave
    if talents.contains(TalentFlags::COVERING_FIRE) {
        registry.register_fixed(
            FixedProc::new(COVERING_FIRE, 1.0),
            ProcHandler::new(
                COVERING_FIRE,
                "Covering Fire",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ExtendAura {
                    aura: BEAST_CLEAVE,
                    amount: SimTime::from_secs_f32(COVERING_FIRE_EXTENSION),
                },
            ).with_spell_filter(vec![MULTI_SHOT]),
        );
    }

    // Pack Leader: Ursine Fury - Bear summon reduces KC CD
    if talents.contains(TalentFlags::URSINE_FURY) {
        registry.register_fixed(
            FixedProc::new(URSINE_FURY, 1.0),
            ProcHandler::new(
                URSINE_FURY,
                "Ursine Fury",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ReduceCooldown {
                    spell: KILL_COMMAND,
                    amount: SimTime::from_secs_f32(URSINE_FURY_CDR),
                },
            ).with_requires_aura(BEAR_READY),
        );
    }

    // Pack Leader: Envenomed Fangs - Bear applies nature DoT
    if talents.contains(TalentFlags::ENVENOMED_FANGS) {
        registry.register_fixed(
            FixedProc::new(ProcIdx(60), 1.0),
            ProcHandler::new(
                ProcIdx(60),
                "Envenomed Fangs",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: ENVENOMED_FANGS,
                },
            ).with_requires_aura(BEAR_READY),
        );
    }

    // Dark Ranger: Withering Fire - Free abilities during big CDs
    if talents.contains(TalentFlags::WITHERING_FIRE) {
        registry.register_fixed(
            FixedProc::new(WITHERING_FIRE_PROC, 1.0),
            ProcHandler::new(
                WITHERING_FIRE_PROC,
                "Withering Fire",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: WITHERING_FIRE,
                },
            ).with_spell_filter(vec![BESTIAL_WRATH, CALL_OF_THE_WILD]),
        );
    }

    // Dark Ranger: Phantom Pain - Damage replicates to Black Arrow targets
    if talents.contains(TalentFlags::PHANTOM_PAIN) {
        registry.register_fixed(
            FixedProc::new(BLEAK_POWDER, 1.0),
            ProcHandler::new(
                BLEAK_POWDER,
                "Phantom Pain",
                ProcFlags::ON_SPELL_CAST,
                ProcEffect::ApplyAura {
                    aura: PHANTOM_PAIN,
                },
            ).with_spell_filter(vec![BLACK_ARROW]),
        );
    }
}
