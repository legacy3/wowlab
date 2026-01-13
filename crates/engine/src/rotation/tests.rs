//! Rotation system tests.

use super::*;
use crate::sim::{SimConfig, SimState};
use crate::actor::Player;
use crate::types::SpecId;

/// Create a minimal SimState for testing
fn test_sim_state() -> SimState {
    let config = SimConfig::default().with_duration(10.0);
    let player = Player::new(SpecId::BeastMastery);
    SimState::new(config, player)
}

/// Create a simple test resolver
fn test_resolver() -> SpecResolver {
    SpecResolver::new("test")
        .resource("focus")
        .spell("spell_a", 1)
        .spell("spell_b", 2)
        .spell("spell_c", 3)
        .spell("kill_command", 34026)
        .spell("cobra_shot", 193455)
        .spell("barbed_shot", 217200)
        .spell("bestial_wrath", 19574)
        .aura("buff_a", 100)
        .aura("buff_b", 101)
        .aura("bestial_wrath", 19574)
        .aura("frenzy", 272790)
        .dot("dot_a", 200)
        .talent("talent_a", true)
        .talent("talent_b", false)
        .charged_cooldown("barbed_shot")
}

// ============================================================================
// Parser Tests
// ============================================================================

#[test]
fn test_parse_simple_rotation() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a" },
            { "cast": "spell_b" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.name, "Test");
    assert_eq!(rotation.actions.len(), 2);
}

#[test]
fn test_parse_conditional_cast() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": "cd.spell_a.ready" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    match &rotation.actions[0] {
        AstAction::Cast { spell, condition } => {
            assert_eq!(spell, "spell_a");
            assert!(condition.is_some());
        }
        _ => panic!("Expected Cast action"),
    }
}

#[test]
fn test_parse_variables() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "need_refresh": { "and": [
                "buff.buff_a.active",
                { "<": ["buff.buff_a.remaining", 2] }
            ]}
        },
        "actions": [
            { "cast": "spell_a", "if": "need_refresh" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert!(rotation.variables.contains_key("need_refresh"));
}

#[test]
fn test_parse_lists() {
    let json = r#"{
        "name": "Test",
        "lists": {
            "cooldowns": [
                { "cast": "spell_a", "if": "cd.spell_a.ready" }
            ]
        },
        "actions": [
            { "call": "cooldowns" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert!(rotation.lists.contains_key("cooldowns"));
    match &rotation.actions[0] {
        AstAction::Call { list, .. } => assert_eq!(list, "cooldowns"),
        _ => panic!("Expected Call action"),
    }
}

#[test]
fn test_parse_arithmetic() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">=": [
                { "+": ["resource.focus", 10] },
                50
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_functions() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "floored": { "floor": { "/": ["resource.focus", 10] } },
            "min_val": { "min": ["resource.focus", 100] },
            "max_val": { "max": ["resource.focus", 0] }
        },
        "actions": [
            { "cast": "spell_a" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert!(rotation.variables.contains_key("floored"));
}

// ============================================================================
// Variable Path Tests
// ============================================================================

#[test]
fn test_parse_resource_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { ">=": ["resource.focus", 30] },
                { "<=": ["resource.focus.percent", 80] },
                { ">=": ["resource.focus.deficit", 20] }
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_cooldown_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                "cd.spell_a.ready",
                { "<": ["cd.spell_a.remaining", 1] },
                { ">=": ["cd.barbed_shot.charges", 1] }
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_buff_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                "buff.buff_a.active",
                { "not": "buff.buff_b.inactive" },
                { ">=": ["buff.buff_a.stacks", 3] },
                { "<": ["buff.buff_a.remaining", 5] }
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_dot_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "or": [
                { "not": "dot.dot_a.ticking" },
                "dot.dot_a.refreshable",
                { "<": ["dot.dot_a.remaining", 3] }
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_combat_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { ">": ["combat.time", 5] },
                { ">": ["combat.remaining", 30] }
            ]}}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_target_paths() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "<": ["target.health_percent", 35] } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_talent_path() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": "talent.talent_a" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

// ============================================================================
// Resolver Tests
// ============================================================================

#[test]
fn test_resolver_spells() {
    let resolver = test_resolver();
    assert_eq!(resolver.resolve_spell("spell_a").unwrap().0, 1);
    assert_eq!(resolver.resolve_spell("spell_b").unwrap().0, 2);
    assert!(resolver.resolve_spell("unknown").is_err());
}

#[test]
fn test_resolver_auras() {
    let resolver = test_resolver();
    assert_eq!(resolver.resolve_aura("buff_a").unwrap().0, 100);
    assert!(resolver.resolve_aura("unknown").is_err());
}

#[test]
fn test_resolver_dots() {
    let resolver = test_resolver();
    assert_eq!(resolver.resolve_dot("dot_a").unwrap().0, 200);
}

#[test]
fn test_resolver_talents() {
    let resolver = test_resolver();
    assert!(resolver.resolve_talent("talent_a").unwrap());
    assert!(!resolver.resolve_talent("talent_b").unwrap());
    assert!(resolver.resolve_talent("unknown").is_err());
}

#[test]
fn test_resolver_charged_cooldowns() {
    let resolver = test_resolver();
    assert!(resolver.is_charged("barbed_shot"));
    assert!(!resolver.is_charged("spell_a"));
}

// ============================================================================
// Compilation Tests
// ============================================================================

#[test]
fn test_compile_simple() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    // Should return spell_a (id 1)
    let result = compiled.evaluate(&test_sim_state());
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_compile_conditional() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">=": ["resource.focus", 50] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    // With default state (low focus), should skip spell_a and return spell_b
    let state = test_sim_state();
    let result = compiled.evaluate(&state);
    assert!(result.is_cast());
    // Result depends on state's focus level
}

#[test]
fn test_compile_with_user_variables() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "should_cast": { ">=": ["resource.focus", 30] }
        },
        "actions": [
            { "cast": "spell_a", "if": "should_cast" },
            { "cast": "spell_b" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    assert!(compiled.schema().size > 0);
}

#[test]
fn test_compile_with_lists() {
    let json = r#"{
        "name": "Test",
        "lists": {
            "sub": [
                { "cast": "spell_a", "if": "cd.spell_a.ready" }
            ]
        },
        "actions": [
            { "call": "sub" },
            { "cast": "spell_b" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    let state = test_sim_state();
    let result = compiled.evaluate(&state);
    assert!(!result.is_none());
}

#[test]
fn test_compile_talent_constant_folding() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": "talent.talent_a" },
            { "cast": "spell_b", "if": "talent.talent_b" },
            { "cast": "spell_c" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    // talent_a is true, so should return spell_a (id 1)
    let state = test_sim_state();
    let result = compiled.evaluate(&state);
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_compile_unknown_spell_error() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "unknown_spell" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let result = CompiledRotation::compile(&rotation, &resolver);
    assert!(result.is_err());
}

#[test]
fn test_compile_unknown_aura_error() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": "buff.unknown_buff.active" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let resolver = test_resolver();
    let result = CompiledRotation::compile(&rotation, &resolver);
    assert!(result.is_err());
}

// ============================================================================
// EvalResult Tests
// ============================================================================

#[test]
fn test_eval_result_none() {
    let result = EvalResult::NONE;
    assert!(result.is_none());
    assert!(!result.is_cast());
    assert!(!result.is_wait());
}

#[test]
fn test_eval_result_cast() {
    let result = EvalResult::cast(crate::types::SpellIdx(123));
    assert!(result.is_cast());
    assert!(!result.is_none());
    assert!(!result.is_wait());
    assert_eq!(result.spell_id, 123);
}

#[test]
fn test_eval_result_wait() {
    let result = EvalResult::wait(0.5);
    assert!(result.is_wait());
    assert!(!result.is_none());
    assert!(!result.is_cast());
    assert!((result.wait_time - 0.5).abs() < 0.001);
}

// ============================================================================
// Context Schema Tests
// ============================================================================

#[test]
fn test_schema_builder() {
    let mut builder = SchemaBuilder::new();

    let offset1 = builder.add(ResolvedVar::Resource);
    let offset2 = builder.add(ResolvedVar::CdReady(crate::types::SpellIdx(1)));
    let offset3 = builder.add(ResolvedVar::BuffStacks(crate::types::AuraIdx(1)));

    // Offsets should be different
    assert_ne!(offset1, offset2);

    // Adding same var again should return same offset
    let offset1_again = builder.add(ResolvedVar::Resource);
    assert_eq!(offset1, offset1_again);

    let schema = builder.build();
    assert!(schema.size > 0);
    assert_eq!(schema.offset(&ResolvedVar::Resource), Some(offset1));
}

#[test]
fn test_schema_alignment() {
    let mut builder = SchemaBuilder::new();

    // Add bool (1 byte)
    builder.add(ResolvedVar::CdReady(crate::types::SpellIdx(1)));
    // Add float (8 bytes) - should be aligned
    builder.add(ResolvedVar::Resource);

    let schema = builder.build();

    // Float should be 8-byte aligned
    let float_offset = schema.offset(&ResolvedVar::Resource).unwrap();
    assert_eq!(float_offset % 8, 0);
}

// ============================================================================
// BM Hunter Integration Tests
// ============================================================================

#[test]
fn test_bm_hunter_minimal_rotation() {
    use crate::specs::hunter::bm::{default_resolver, MINIMAL_ROTATION_JSON};

    let rotation = Rotation::from_json(MINIMAL_ROTATION_JSON).unwrap();
    let resolver = default_resolver();
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return either kill_command or cobra_shot
    assert!(result.is_cast());
    assert!(result.spell_id == 34026 || result.spell_id == 193455);
}

#[test]
fn test_bm_hunter_example_rotation() {
    use crate::specs::hunter::bm::{default_resolver, EXAMPLE_ROTATION_JSON};

    let rotation = Rotation::from_json(EXAMPLE_ROTATION_JSON).unwrap();
    let resolver = default_resolver();

    // Compilation should succeed
    let compiled = CompiledRotation::compile(&rotation, &resolver).unwrap();

    // Should have non-zero schema (uses variables)
    assert!(compiled.schema().size > 0);
}
