use super::*;
use crate::actor::Player;
use crate::handler::SpecHandler;
use crate::rotation::{CompiledRotation, Rotation};
use crate::sim::{SimConfig, SimState};
use wowlab_common::types::*;

fn create_handler() -> BmHunter {
    BmHunter::with_defaults().expect("Failed to create BmHunter")
}

#[test]
fn constants_defined() {
    assert_eq!(KILL_COMMAND.0, 34026);
    assert_eq!(COBRA_SHOT.0, 193455);
    assert_eq!(BARBED_SHOT.0, 217200);
}

#[test]
fn spell_definitions_count() {
    let spells = spell_definitions();
    assert!(spells.len() >= 5); // At least the core abilities
}

#[test]
fn aura_definitions_count() {
    let auras = aura_definitions();
    assert!(auras.len() >= 3);
}

#[test]
fn player_init() {
    let handler = create_handler();
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    assert_eq!(player.spec, SpecId::BeastMastery);
    assert!(player.resources.primary.is_some());
    assert!(player.cooldown(KILL_COMMAND).is_some());
    assert!(player.charged_cooldown(BARBED_SHOT).is_some());
}

#[test]
fn sim_init() {
    let handler = create_handler();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let state = SimState::new(config, player);
    assert!(!state.finished);
    assert_eq!(state.player.spec, SpecId::BeastMastery);
}

#[test]
fn cooldown_lookup() {
    let handler = create_handler();
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let kc_cd = player
        .cooldown(KILL_COMMAND)
        .expect("Kill Command should have cooldown");
    assert!(kc_cd.is_ready(SimTime::ZERO));

    let bw_cd = player
        .cooldown(BESTIAL_WRATH)
        .expect("Bestial Wrath should have cooldown");
    assert!(bw_cd.is_ready(SimTime::ZERO));
}

#[test]
fn pet_init() {
    let handler = create_handler();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let mut state = SimState::new(config, player);
    let now = state.now();

    // Initialize sim - this should summon the pet
    handler.init(&mut state);

    // BM Hunter should have summoned a pet
    assert!(
        state.pets.active(now).count() > 0,
        "BM Hunter should have an active pet"
    );
}

// ============================================================================
// Spell ID Resolver Tests
// ============================================================================

#[test]
fn spell_id_resolver() {
    assert_eq!(spell_id_to_idx(34026), Some(KILL_COMMAND));
    assert_eq!(spell_id_to_idx(193455), Some(COBRA_SHOT));
    assert_eq!(spell_id_to_idx(217200), Some(BARBED_SHOT));
    assert_eq!(spell_id_to_idx(19574), Some(BESTIAL_WRATH));
    assert_eq!(spell_id_to_idx(99999), None);
}

#[test]
fn spell_name_resolver() {
    assert_eq!(spell_name_to_idx("kill_command"), Some(KILL_COMMAND));
    assert_eq!(spell_name_to_idx("cobra_shot"), Some(COBRA_SHOT));
    assert_eq!(spell_name_to_idx("barbed_shot"), Some(BARBED_SHOT));
    assert_eq!(spell_name_to_idx("bestial_wrath"), Some(BESTIAL_WRATH));
    assert_eq!(spell_name_to_idx("unknown_spell"), None);
}

// ============================================================================
// Name-Based Rotation Tests
// ============================================================================

#[test]
fn rotation_parse_basic() {
    let json = r#"{
        "name": "basic",
        "actions": [
            { "cast": "kill_command" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    assert_eq!(rotation.name, "basic");
    assert_eq!(rotation.actions.len(), 2);
}

#[test]
fn rotation_parse_with_condition() {
    let json = r#"{
        "name": "conditional",
        "actions": [
            { "cast": "kill_command", "if": "cd.kill_command.ready" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    assert_eq!(rotation.actions.len(), 2);
}

#[test]
fn rotation_compile_basic() {
    let json = r#"{
        "name": "basic",
        "actions": [
            { "cast": "kill_command" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");

    // Verify it compiled successfully (the schema should have the right size)
    assert!(compiled.schema().size > 0);
}

#[test]
fn rotation_compile_with_condition() {
    let json = r#"{
        "name": "conditional",
        "actions": [
            { "cast": "kill_command", "if": "cd.kill_command.ready" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_resource_check() {
    let json = r#"{
        "name": "resource_check",
        "actions": [
            { "cast": "kill_command", "if": { ">=": ["resource.focus", 30] } },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_buff_check() {
    let json = r#"{
        "name": "buff_check",
        "actions": [
            { "cast": "kill_command", "if": "buff.bestial_wrath.active" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_and_condition() {
    let json = r#"{
        "name": "and_check",
        "actions": [
            {
                "cast": "kill_command",
                "if": { "and": [
                    "cd.kill_command.ready",
                    { ">=": ["resource.focus", 30] }
                ]}
            },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_or_condition() {
    let json = r#"{
        "name": "or_check",
        "actions": [
            {
                "cast": "bestial_wrath",
                "if": { "or": [
                    "cd.bestial_wrath.ready",
                    "buff.bestial_wrath.active"
                ]}
            },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_lists() {
    let json = r#"{
        "name": "list_test",
        "lists": {
            "cooldowns": [
                { "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" }
            ]
        },
        "actions": [
            { "call": "cooldowns" },
            { "cast": "kill_command", "if": "cd.kill_command.ready" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_variables() {
    let json = r#"{
        "name": "variable_test",
        "variables": {
            "should_burst": { "and": [
                "cd.bestial_wrath.ready",
                { ">=": ["resource.focus", 50] }
            ]}
        },
        "actions": [
            { "cast": "bestial_wrath", "if": "should_burst" },
            { "cast": "kill_command", "if": "cd.kill_command.ready" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_dot_check() {
    let json = r#"{
        "name": "dot_check",
        "actions": [
            { "cast": "barbed_shot", "if": "dot.barbed_shot.refreshable" },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_with_charges() {
    let json = r#"{
        "name": "charges_test",
        "actions": [
            { "cast": "barbed_shot", "if": { ">=": ["cd.barbed_shot.charges", 1] } },
            { "cast": "cobra_shot" }
        ]
    }"#;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled =
        CompiledRotation::compile_json(json, &resolver).expect("Failed to compile rotation");
}

#[test]
fn rotation_compile_full_example() {
    // Use the example rotation JSON from the rotation module
    let json = EXAMPLE_ROTATION_JSON;

    let resolver = spec_resolver(TalentFlags::empty());
    let _compiled = CompiledRotation::compile_json(json, &resolver)
        .expect("Failed to compile example rotation");
}

#[test]
fn spec_resolver_has_required_spells() {
    let resolver = spec_resolver(TalentFlags::empty());

    // Core spells should be resolvable
    assert!(resolver.resolve_spell("kill_command").is_ok());
    assert!(resolver.resolve_spell("cobra_shot").is_ok());
    assert!(resolver.resolve_spell("barbed_shot").is_ok());
    assert!(resolver.resolve_spell("bestial_wrath").is_ok());

    // Unknown spell should fail
    assert!(resolver.resolve_spell("unknown_spell").is_err());
}

#[test]
fn spec_resolver_has_required_auras() {
    let resolver = spec_resolver(TalentFlags::empty());

    // Core auras should be resolvable
    assert!(resolver.has_aura("bestial_wrath"));
    assert!(resolver.has_aura("frenzy"));
    assert!(resolver.has_aura("beast_cleave"));

    // DoTs should be resolvable
    assert!(resolver.has_dot("barbed_shot"));
}

#[test]
fn spec_resolver_with_talents() {
    let talents = TalentFlags::ALPHA_PREDATOR | TalentFlags::KILLER_COBRA;
    let resolver = spec_resolver(talents);

    // Talent flags should be properly set
    assert!(resolver.has_talent("alpha_predator"));
    assert!(resolver.has_talent("killer_cobra"));
    assert!(!resolver.has_talent("bloodshed")); // Not enabled
}
