//! BM Hunter rotation support.
//!
//! Provides name resolution for BM Hunter rotations and context building.

use super::constants::*;
use crate::rotation::SpecResolver;
use wowlab_common::types::SpellIdx;

/// Create a spec resolver for BM Hunter.
///
/// This maps human-readable spell/aura names to game IDs.
pub fn spec_resolver(talents: TalentFlags) -> SpecResolver {
    SpecResolver::new("bm_hunter")
        .resource("focus")
        // Core spells
        .spell("kill_command", KILL_COMMAND.0)
        .spell("cobra_shot", COBRA_SHOT.0)
        .spell("barbed_shot", BARBED_SHOT.0)
        .spell("bestial_wrath", BESTIAL_WRATH.0)
        .spell("multi_shot", MULTI_SHOT.0)
        .spell("kill_shot", KILL_SHOT.0)
        // Major cooldowns
        .spell("call_of_the_wild", CALL_OF_THE_WILD.0)
        .spell("bloodshed", BLOODSHED.0)
        .spell("dire_beast", DIRE_BEAST.0)
        .spell("murder_of_crows", MURDER_OF_CROWS.0)
        .spell("explosive_shot", EXPLOSIVE_SHOT.0)
        // Hero talents
        .spell("black_arrow", BLACK_ARROW.0)
        // Core buffs
        .aura("bestial_wrath", BESTIAL_WRATH_BUFF.0)
        .aura("frenzy", FRENZY.0)
        .aura("beast_cleave", BEAST_CLEAVE.0)
        .aura("call_of_the_wild", CALL_OF_THE_WILD_BUFF.0)
        // Talent buffs
        .aura("thrill_of_the_hunt", THRILL_OF_THE_HUNT.0)
        .aura("serpentine_rhythm", SERPENTINE_RHYTHM.0)
        .aura("piercing_fangs", PIERCING_FANGS.0)
        .aura("snakeskin_quiver", SNAKESKIN_QUIVER_PROC.0)
        // DoTs
        .dot("barbed_shot", BARBED_SHOT_DOT.0)
        .dot("serpent_sting", SERPENT_STING.0)
        .dot("laceration", LACERATION.0)
        .dot("black_arrow", BLACK_ARROW_DOT.0)
        // Debuffs
        .aura("bloodshed", BLOODSHED_DEBUFF.0)
        .aura("wild_instincts", WILD_INSTINCTS.0)
        // Charged cooldowns
        .charged_cooldown("barbed_shot")
        // Talents
        .talent(
            "animal_companion",
            talents.contains(TalentFlags::ANIMAL_COMPANION),
        )
        .talent(
            "solitary_companion",
            talents.contains(TalentFlags::SOLITARY_COMPANION),
        )
        .talent(
            "thrill_of_the_hunt",
            talents.contains(TalentFlags::THRILL_OF_THE_HUNT),
        )
        .talent(
            "go_for_the_throat",
            talents.contains(TalentFlags::GO_FOR_THE_THROAT),
        )
        .talent(
            "alpha_predator",
            talents.contains(TalentFlags::ALPHA_PREDATOR),
        )
        .talent(
            "killer_instinct",
            talents.contains(TalentFlags::KILLER_INSTINCT),
        )
        .talent("killer_cobra", talents.contains(TalentFlags::KILLER_COBRA))
        .talent("bloodshed", talents.contains(TalentFlags::BLOODSHED))
        .talent(
            "call_of_the_wild",
            talents.contains(TalentFlags::CALL_OF_THE_WILD),
        )
        .talent("dire_beast", talents.contains(TalentFlags::DIRE_BEAST))
        .talent(
            "murder_of_crows",
            talents.contains(TalentFlags::MURDER_OF_CROWS),
        )
        .talent("black_arrow", talents.contains(TalentFlags::BLACK_ARROW))
}

/// Default spec resolver (no talents).
pub fn default_resolver() -> SpecResolver {
    spec_resolver(TalentFlags::empty())
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

/// BM Hunter example rotation JSON.
///
/// This demonstrates the new rotation DSL with proper namespaced variables.
pub const EXAMPLE_ROTATION_JSON: &str = r#"{
  "name": "BM Hunter ST",
  "variables": {
    "in_opener": { "<": ["combat.time", 10] },
    "pool_for_bw": { "and": [
      { "<": ["cd.bestial_wrath.remaining", 3] },
      { "<": ["resource.focus", 70] }
    ]},
    "need_frenzy_refresh": { "and": [
      "buff.frenzy.active",
      { "<": ["buff.frenzy.remaining", 2] }
    ]}
  },
  "lists": {
    "cooldowns": [
      { "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" },
      { "cast": "call_of_the_wild", "if": { "and": [
        "cd.call_of_the_wild.ready",
        "buff.bestial_wrath.active"
      ]}}
    ],
    "st": [
      { "cast": "barbed_shot", "if": { "or": [
        { "not": "buff.frenzy.active" },
        "need_frenzy_refresh",
        { ">=": ["cd.barbed_shot.charges", 2] }
      ]}},
      { "cast": "kill_command", "if": "cd.kill_command.ready" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] }}
    ]
  },
  "actions": [
    { "call": "cooldowns" },
    { "call": "st" }
  ]
}"#;

/// Minimal rotation for testing.
pub const MINIMAL_ROTATION_JSON: &str = r#"{
  "name": "BM Hunter Minimal",
  "actions": [
    { "cast": "kill_command", "if": "cd.kill_command.ready" },
    { "cast": "cobra_shot" }
  ]
}"#;
