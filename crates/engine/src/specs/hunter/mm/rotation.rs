//! MM Hunter rotation support.
//!
//! Provides name resolution for MM Hunter rotations.

use super::constants::*;
use crate::rotation::SpecResolver;
use wowlab_common::types::SpellIdx;

/// Create a spec resolver for MM Hunter.
pub fn spec_resolver(talents: TalentFlags) -> SpecResolver {
    SpecResolver::new("mm_hunter")
        .resource("focus")
        // Core spells
        .spell("aimed_shot", AIMED_SHOT.0)
        .spell("rapid_fire", RAPID_FIRE.0)
        .spell("steady_shot", STEADY_SHOT.0)
        .spell("arcane_shot", ARCANE_SHOT.0)
        .spell("kill_shot", KILL_SHOT.0)
        .spell("trueshot", TRUESHOT.0)
        .spell("multi_shot", MULTI_SHOT.0)
        // Core buffs
        .aura("trueshot", TRUESHOT_BUFF.0)
        .aura("precise_shots", PRECISE_SHOTS.0)
        .aura("steady_focus", STEADY_FOCUS.0)
        .aura("trick_shots", TRICK_SHOTS.0)
        .aura("lock_and_load", LOCK_AND_LOAD.0)
        // Talents
        .talent("trueshot", talents.contains(TalentFlags::TRUESHOT))
        .talent(
            "lock_and_load",
            talents.contains(TalentFlags::LOCK_AND_LOAD),
        )
}

/// Default spec resolver (no talents).
pub fn default_resolver() -> SpecResolver {
    spec_resolver(TalentFlags::empty())
}

/// Convert game spell ID to internal SpellIdx.
pub fn spell_id_to_idx(id: u32) -> Option<SpellIdx> {
    match id {
        19434 => Some(AIMED_SHOT),
        257044 => Some(RAPID_FIRE),
        56641 => Some(STEADY_SHOT),
        185358 => Some(ARCANE_SHOT),
        53351 => Some(KILL_SHOT),
        288613 => Some(TRUESHOT),
        2643 => Some(MULTI_SHOT),
        _ => None,
    }
}

/// Convert spell name to SpellIdx.
pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "aimed_shot" => Some(AIMED_SHOT),
        "rapid_fire" => Some(RAPID_FIRE),
        "steady_shot" => Some(STEADY_SHOT),
        "arcane_shot" => Some(ARCANE_SHOT),
        "kill_shot" => Some(KILL_SHOT),
        "trueshot" => Some(TRUESHOT),
        "multi_shot" => Some(MULTI_SHOT),
        _ => None,
    }
}

/// Minimal rotation for testing.
pub const MINIMAL_ROTATION_JSON: &str = r#"{
  "name": "MM Hunter Minimal",
  "actions": [
    { "cast": "aimed_shot", "if": "cd.aimed_shot.ready" },
    { "cast": "arcane_shot" }
  ]
}"#;
