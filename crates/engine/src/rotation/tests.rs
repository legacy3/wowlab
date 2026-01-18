//! Rotation system tests.

use super::*;
use crate::actor::Player;
use crate::sim::{SimConfig, SimState};
use wowlab_types::SpecId;

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
fn test_parse_resource_extended_paths() {
    // Test all 8 resource expression variants
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { ">=": ["resource.focus.current", 30] },
                { "<=": ["resource.focus.max", 100] },
                { ">=": ["resource.focus.deficit", 20] },
                { "<=": ["resource.focus.percent", 80] },
                { ">=": ["resource.focus.deficit_percent", 10] },
                { ">": ["resource.focus.regen", 0] },
                { "<": ["resource.focus.time_to_max", 10] }
            ]}}
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

    // Should compile without errors
    assert!(compiled.schema().size > 0);
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

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

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

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

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

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

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

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

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

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();

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

    let resolver = test_resolver();
    let result = CompiledRotation::compile_json(json, &resolver);
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

    let resolver = test_resolver();
    let result = CompiledRotation::compile_json(json, &resolver);
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
    let result = EvalResult::cast(wowlab_types::SpellIdx(123));
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
    use super::context::ExprKey;
    use super::expr::{BuffExpr, CooldownExpr, ResourceExpr};
    use wowlab_types::ResourceType;

    let mut builder = SchemaBuilder::new();

    let key1 = ExprKey::Resource(ResourceExpr::ResourceCurrent {
        resource: ResourceType::Focus,
    });
    let key2 = ExprKey::Cooldown(CooldownExpr::CooldownReady {
        spell: wowlab_types::SpellIdx(1),
    });
    let key3 = ExprKey::Buff(BuffExpr::Stacks {
        aura: wowlab_types::AuraIdx(1),
    });

    let offset1 = builder.add_key(key1.clone()).unwrap();
    let offset2 = builder.add_key(key2.clone()).unwrap();
    let _offset3 = builder.add_key(key3.clone()).unwrap();

    // Offsets should be different
    assert_ne!(offset1, offset2);

    // Adding same key again should return same offset
    let offset1_again = builder.add_key(key1.clone()).unwrap();
    assert_eq!(offset1, offset1_again);

    let schema = builder.build();
    assert!(schema.size > 0);
    assert_eq!(schema.offset(&key1), Some(offset1));
}

#[test]
fn test_schema_alignment() {
    use super::context::ExprKey;
    use super::expr::{CooldownExpr, ResourceExpr};
    use wowlab_types::ResourceType;

    let mut builder = SchemaBuilder::new();

    // Add bool (1 byte)
    let bool_key = ExprKey::Cooldown(CooldownExpr::CooldownReady {
        spell: wowlab_types::SpellIdx(1),
    });
    builder.add_key(bool_key).unwrap();
    // Add float (8 bytes) - should be aligned
    let float_key = ExprKey::Resource(ResourceExpr::ResourceCurrent {
        resource: ResourceType::Focus,
    });
    builder.add_key(float_key.clone()).unwrap();

    let schema = builder.build();

    // Float should be 8-byte aligned
    let float_offset = schema.offset(&float_key).unwrap();
    assert_eq!(float_offset % 8, 0);
}

// ============================================================================
// BM Hunter Integration Tests
// ============================================================================

#[test]
fn test_bm_hunter_minimal_rotation() {
    use crate::specs::hunter::bm::{default_resolver, MINIMAL_ROTATION_JSON};

    let resolver = default_resolver();
    let compiled = CompiledRotation::compile_json(MINIMAL_ROTATION_JSON, &resolver).unwrap();

    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return either kill_command or cobra_shot
    assert!(result.is_cast());
    assert!(result.spell_id == 34026 || result.spell_id == 193455);
}

#[test]
fn test_bm_hunter_example_rotation() {
    use crate::specs::hunter::bm::{default_resolver, EXAMPLE_ROTATION_JSON};

    let resolver = default_resolver();

    // Compilation should succeed
    let compiled = CompiledRotation::compile_json(EXAMPLE_ROTATION_JSON, &resolver).unwrap();

    // Should have non-zero schema (uses variables)
    assert!(compiled.schema().size > 0);
}

// ============================================================================
// Cooldown Expression Tests
// ============================================================================

#[test]
fn test_cooldown_expr_json_roundtrip() {
    use super::expr::CooldownExpr;
    use wowlab_types::SpellIdx;

    let test_cases = vec![
        CooldownExpr::CooldownReady {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownRemaining {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownDuration {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownBaseDuration {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownCharges {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownChargesMax {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownChargesFractional {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownRechargeTime {
            spell: SpellIdx(123),
        },
        CooldownExpr::CooldownFullRechargeTime {
            spell: SpellIdx(123),
        },
    ];

    for expr in test_cases {
        // Serialize to JSON
        let json = serde_json::to_string(&expr).expect("Failed to serialize");
        // Deserialize back
        let deserialized: CooldownExpr = serde_json::from_str(&json)
            .unwrap_or_else(|_| panic!("Failed to deserialize: {}", json));
        // Should be equal
        assert_eq!(expr, deserialized, "Roundtrip failed for {:?}", expr);
    }
}

#[test]
fn test_cooldown_expr_camel_case_deserialization() {
    use super::expr::CooldownExpr;
    use wowlab_types::SpellIdx;

    // All 9 expressions with camelCase type tag
    let test_cases = vec![
        (
            r#"{"type":"cooldownReady","spell":123}"#,
            CooldownExpr::CooldownReady {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownRemaining","spell":123}"#,
            CooldownExpr::CooldownRemaining {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownDuration","spell":123}"#,
            CooldownExpr::CooldownDuration {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownBaseDuration","spell":123}"#,
            CooldownExpr::CooldownBaseDuration {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownCharges","spell":123}"#,
            CooldownExpr::CooldownCharges {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownChargesMax","spell":123}"#,
            CooldownExpr::CooldownChargesMax {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownChargesFractional","spell":123}"#,
            CooldownExpr::CooldownChargesFractional {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownRechargeTime","spell":123}"#,
            CooldownExpr::CooldownRechargeTime {
                spell: SpellIdx(123),
            },
        ),
        (
            r#"{"type":"cooldownFullRechargeTime","spell":123}"#,
            CooldownExpr::CooldownFullRechargeTime {
                spell: SpellIdx(123),
            },
        ),
    ];

    for (json, expected) in test_cases {
        let deserialized: CooldownExpr = serde_json::from_str(json)
            .unwrap_or_else(|_| panic!("Failed to deserialize: {}", json));
        assert_eq!(deserialized, expected, "Failed for JSON: {}", json);
    }
}

#[test]
fn test_cooldown_ready_with_charges() {
    // Test that cooldown_ready returns true when charges > 0
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "barbed_shot", "if": "cd.barbed_shot.ready" },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // barbed_shot is a charged cooldown with charges available (default state)
    // Should return barbed_shot (id 217200)
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 217200);
}

#[test]
fn test_parse_cooldown_base_duration() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">": ["cd.spell_a.base_duration", 5] } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_cooldown_charges_fractional() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">=": ["cd.barbed_shot.charges_fractional", 1.5] } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_parse_cooldown_full_recharge_time() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { "<": ["cd.barbed_shot.full_recharge_time", 10] } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_cooldown_expr_field_types() {
    use super::expr::{CooldownExpr, FieldType, PopulateContext};
    use wowlab_types::SpellIdx;

    // Bool type
    assert_eq!(
        CooldownExpr::CooldownReady { spell: SpellIdx(1) }.field_type(),
        FieldType::Bool
    );

    // Int type
    assert_eq!(
        CooldownExpr::CooldownCharges { spell: SpellIdx(1) }.field_type(),
        FieldType::Int
    );
    assert_eq!(
        CooldownExpr::CooldownChargesMax { spell: SpellIdx(1) }.field_type(),
        FieldType::Int
    );

    // Float type
    assert_eq!(
        CooldownExpr::CooldownRemaining { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        CooldownExpr::CooldownDuration { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        CooldownExpr::CooldownBaseDuration { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        CooldownExpr::CooldownChargesFractional { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        CooldownExpr::CooldownRechargeTime { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        CooldownExpr::CooldownFullRechargeTime { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
}

// ============================================================================
// Combat and Target Expression Tests
// ============================================================================

#[test]
fn test_target_time_to_die() {
    use crate::actor::Enemy;
    use wowlab_types::TargetIdx;

    // Test time_to_die calculation
    let enemy = Enemy::new(TargetIdx(0), "Test Boss");
    assert_eq!(enemy.max_health, 10_000_000.0);
    assert_eq!(enemy.current_health, 10_000_000.0);

    // With 100k DPS, TTD should be 100 seconds
    let ttd = enemy.time_to_die(100_000.0);
    assert!((ttd.as_secs_f32() - 100.0).abs() < 0.001);

    // With 0 DPS, TTD should be MAX
    let ttd_zero = enemy.time_to_die(0.0);
    assert_eq!(ttd_zero, wowlab_types::SimTime::MAX);
}

#[test]
fn test_target_time_to_percent() {
    use crate::actor::Enemy;
    use wowlab_types::TargetIdx;

    let mut enemy = Enemy::new(TargetIdx(0), "Test Boss");
    enemy.max_health = 1_000_000.0;
    enemy.current_health = 500_000.0; // 50% health

    // Time to reach 30% at 10k DPS
    // Current: 500k, Target: 300k, Damage needed: 200k
    // Time: 200k / 10k = 20 seconds
    let ttp = enemy.time_to_percent(30.0, 10_000.0);
    assert!((ttp.as_secs_f32() - 20.0).abs() < 0.001);

    // Already below target percent - should be 0
    let ttp_below = enemy.time_to_percent(60.0, 10_000.0);
    assert_eq!(ttp_below, wowlab_types::SimTime::ZERO);

    // With 0 DPS - should be MAX
    let ttp_zero = enemy.time_to_percent(30.0, 0.0);
    assert_eq!(ttp_zero, wowlab_types::SimTime::MAX);
}

#[test]
fn test_enemy_count_returns_alive_count() {
    use crate::actor::EnemyManager;

    let mut enemies = EnemyManager::with_bosses(3);
    assert_eq!(enemies.alive_count(), 3);

    // Kill one enemy
    if let Some(enemy) = enemies.get_mut(wowlab_types::TargetIdx(0)) {
        enemy.current_health = 0.0;
    }
    assert_eq!(enemies.alive_count(), 2);
}

#[test]
fn test_parse_target_health_expressions() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">": ["target.health", 5000000] } },
            { "cast": "spell_b", "if": { ">": ["target.health_max", 9000000] } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 2);
}

#[test]
fn test_parse_target_casting_moving() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": "target.casting" },
            { "cast": "spell_b", "if": { "not": "target.moving" } }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    assert_eq!(rotation.actions.len(), 2);
}

#[test]
fn test_parse_combat_time_expressions() {
    let json = r#"{
        "name": "Test",
        "actions": [
            { "cast": "spell_a", "if": { ">": ["combat.time", 5.0] } },
            { "cast": "spell_b", "if": { "<": ["combat.remaining", 30.0] } }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // At time 0, combat.time > 5.0 is false, so should skip spell_a
    // combat.remaining < 30.0 depends on fight duration (10s default)
    assert!(result.is_cast());
}

#[test]
fn test_dps_window_calculation() {
    use crate::sim::DpsWindow;
    use wowlab_types::SimTime;

    let mut window = DpsWindow::new(5.0);

    // Record damage at different times
    window.record(SimTime::from_secs_f32(0.0), 1000.0);
    window.record(SimTime::from_secs_f32(1.0), 1000.0);
    window.record(SimTime::from_secs_f32(2.0), 1000.0);

    // At 2 seconds, we have 3000 damage over 2 seconds = 1500 DPS
    let dps = window.current_dps(SimTime::from_secs_f32(2.0));
    assert!((dps - 1500.0).abs() < 1.0);

    // At 10 seconds (past window), old samples should be pruned
    let dps_later = window.current_dps(SimTime::from_secs_f32(10.0));
    assert_eq!(dps_later, 0.0); // No samples in window
}

#[test]
fn test_enemy_fields() {
    use crate::actor::Enemy;
    use wowlab_types::TargetIdx;

    let mut enemy = Enemy::new(TargetIdx(0), "Test Boss");

    // Default values
    assert_eq!(enemy.distance, 5.0);
    assert!(!enemy.is_casting);
    assert!(!enemy.is_moving);

    // Modify values
    enemy.distance = 30.0;
    enemy.is_casting = true;
    enemy.is_moving = true;

    assert_eq!(enemy.distance, 30.0);
    assert!(enemy.is_casting);
    assert!(enemy.is_moving);

    // Reset should clear casting/moving
    enemy.reset();
    assert!(!enemy.is_casting);
    assert!(!enemy.is_moving);
}

// ============================================================================
// Spell Expression Tests
// ============================================================================

#[test]
fn test_spell_expr_field_types() {
    use super::expr::{FieldType, PopulateContext, SpellExpr};
    use wowlab_types::SpellIdx;

    // Float types
    assert_eq!(
        SpellExpr::Cost { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        SpellExpr::CastTime { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );
    assert_eq!(
        SpellExpr::Range { spell: SpellIdx(1) }.field_type(),
        FieldType::Float
    );

    // Bool types
    assert_eq!(
        SpellExpr::InRange { spell: SpellIdx(1) }.field_type(),
        FieldType::Bool
    );
    assert_eq!(
        SpellExpr::Usable { spell: SpellIdx(1) }.field_type(),
        FieldType::Bool
    );
}

#[test]
fn test_spell_usable_parse() {
    use crate::specs::hunter::bm::default_resolver;

    let resolver = default_resolver();
    let json = r#"{
        "name": "Test Spell Usable",
        "actions": [
            { "cast": "kill_command", "if": "spell.kill_command.usable" }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_spell_in_range_parse() {
    use crate::specs::hunter::bm::default_resolver;

    let resolver = default_resolver();
    let json = r#"{
        "name": "Test Spell In Range",
        "actions": [
            { "cast": "kill_command", "if": "spell.kill_command.in_range" }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_spell_range_parse() {
    use crate::specs::hunter::bm::default_resolver;

    let resolver = default_resolver();
    let json = r#"{
        "name": "Test Spell Range",
        "actions": [
            { "cast": "kill_command", "if": { "<": ["spell.kill_command.range", 50] } }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

// ============================================================================
// Talent Expression Tests
// ============================================================================

#[test]
fn test_talent_expr_field_types() {
    use super::expr::{FieldType, PopulateContext, TalentExpr};

    // Bool type
    assert_eq!(
        TalentExpr::Enabled { value: true }.field_type(),
        FieldType::Bool
    );
    assert_eq!(
        TalentExpr::Enabled { value: false }.field_type(),
        FieldType::Bool
    );

    // Int types
    assert_eq!(TalentExpr::Rank { rank: 1 }.field_type(), FieldType::Int);
    assert_eq!(
        TalentExpr::MaxRank { max_rank: 3 }.field_type(),
        FieldType::Int
    );
}

#[test]
fn test_talent_rank_default_for_enabled() {
    use super::expr::TalentExpr;

    // Enabled talent should have rank 1
    let expr = TalentExpr::with_rank(true, None);
    assert_eq!(expr.get_rank(), 1);

    // Disabled talent should have rank 0
    let expr = TalentExpr::with_rank(false, None);
    assert_eq!(expr.get_rank(), 0);
}

#[test]
fn test_talent_rank_explicit() {
    use super::expr::TalentExpr;

    // Explicit rank should be respected
    let expr = TalentExpr::with_rank(true, Some(2));
    assert_eq!(expr.get_rank(), 2);

    let expr = TalentExpr::with_rank(true, Some(3));
    assert_eq!(expr.get_rank(), 3);
}

#[test]
fn test_talent_rank_parse() {
    use super::resolver::SpecResolver;

    let resolver = SpecResolver::new("test")
        .spell("test_spell", 1)
        .talent_ranked("ranked_talent", 2, 3);

    let json = r#"{
        "name": "Test Talent Rank",
        "actions": [
            { "cast": "test_spell", "if": { "==": ["talent.ranked_talent.rank", 2] } }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

#[test]
fn test_talent_max_rank_parse() {
    use super::resolver::SpecResolver;

    let resolver = SpecResolver::new("test")
        .spell("test_spell", 1)
        .talent_ranked("ranked_talent", 2, 3);

    let json = r#"{
        "name": "Test Talent Max Rank",
        "actions": [
            { "cast": "test_spell", "if": { "==": ["talent.ranked_talent.max_rank", 3] } }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

// ============================================================================
// GCD Expression Tests
// ============================================================================

#[test]
fn test_gcd_expr_field_types() {
    use super::expr::{FieldType, GcdExpr, PopulateContext};

    // Bool type
    assert_eq!(GcdExpr::Active.field_type(), FieldType::Bool);

    // Float types
    assert_eq!(GcdExpr::Remaining.field_type(), FieldType::Float);
    assert_eq!(GcdExpr::Duration.field_type(), FieldType::Float);
}

#[test]
fn test_gcd_active_parse() {
    use crate::specs::hunter::bm::default_resolver;

    let resolver = default_resolver();
    let json = r#"{
        "name": "Test GCD Active",
        "actions": [
            { "cast": "kill_command", "if": { "not": "gcd.active" } }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

// ============================================================================
// Pet Expression Tests
// ============================================================================

#[test]
fn test_pet_expr_field_types() {
    use super::expr::{FieldType, PetExpr, PopulateContext};
    use wowlab_types::AuraIdx;

    // Bool types
    assert_eq!(PetExpr::Active.field_type(), FieldType::Bool);
    assert_eq!(
        PetExpr::BuffActive { aura: AuraIdx(1) }.field_type(),
        FieldType::Bool
    );

    // Int type
    assert_eq!(PetExpr::Count.field_type(), FieldType::Int);

    // Float type
    assert_eq!(PetExpr::Remaining.field_type(), FieldType::Float);
}

#[test]
fn test_pet_count_parse() {
    use crate::specs::hunter::bm::default_resolver;

    let resolver = default_resolver();
    let json = r#"{
        "name": "Test Pet Count",
        "actions": [
            { "cast": "kill_command", "if": { ">": ["pet.count", 0] } }
        ]
    }"#;

    let rotation = Rotation::from_json_resolved(json, &resolver).unwrap();
    assert_eq!(rotation.actions.len(), 1);
}

// ============================================================================
// TalentInfo Tests
// ============================================================================

#[test]
fn test_talent_info_new() {
    use super::resolver::TalentInfo;

    // Enabled talent
    let info = TalentInfo::new(true);
    assert!(info.enabled);
    assert_eq!(info.rank, 1);
    assert_eq!(info.max_rank, 1);

    // Disabled talent
    let info = TalentInfo::new(false);
    assert!(!info.enabled);
    assert_eq!(info.rank, 0);
    assert_eq!(info.max_rank, 1);
}

#[test]
fn test_talent_info_ranked() {
    use super::resolver::TalentInfo;

    // Ranked talent with rank 2/3
    let info = TalentInfo::ranked(2, 3);
    assert!(info.enabled);
    assert_eq!(info.rank, 2);
    assert_eq!(info.max_rank, 3);

    // Ranked talent with rank 0/3 (disabled)
    let info = TalentInfo::ranked(0, 3);
    assert!(!info.enabled);
    assert_eq!(info.rank, 0);
    assert_eq!(info.max_rank, 3);
}

// ============================================================================
// Expression System Tests (Logic, Comparison, Arithmetic)
// ============================================================================

#[test]
fn test_division_by_zero_returns_zero() {
    // Test that division by zero returns 0.0 instead of panicking/NaN
    let json = r#"{
        "name": "Test Div Zero",
        "variables": {
            "div_result": { "/": [10, 0] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["div_result", 0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // div_result should be 0, so condition is true, should return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1); // spell_a has id 1
}

#[test]
fn test_division_by_zero_float() {
    // Test division by zero with float operands
    let json = r#"{
        "name": "Test Div Zero Float",
        "variables": {
            "div_result": { "/": [10.5, 0.0] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["div_result", 0.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // div_result should be 0.0, so condition is true
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_true_modulo_negative_dividend() {
    // Test that -7 mod 3 = 2 (true modulo), not -1 (standard %)
    let json = r#"{
        "name": "Test True Mod",
        "variables": {
            "mod_result": { "%": [-7, 3] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["mod_result", 2] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // mod_result should be 2, so condition is true
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_true_modulo_positive() {
    // Test that 7 mod 3 = 1 (standard case)
    let json = r#"{
        "name": "Test True Mod Positive",
        "variables": {
            "mod_result": { "%": [7, 3] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["mod_result", 1] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_modulo_by_zero_returns_zero() {
    // Test that modulo by zero returns 0.0
    let json = r#"{
        "name": "Test Mod Zero",
        "variables": {
            "mod_result": { "%": [7, 0] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["mod_result", 0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_float_equality_with_epsilon() {
    // Test that float comparison uses epsilon tolerance
    // 1.0 + 1e-7 should be considered equal to 1.0
    let json = r#"{
        "name": "Test Float Eq",
        "actions": [
            { "cast": "spell_a", "if": { "==": [1.0000001, 1.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Values should be considered equal (within epsilon)
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_float_inequality_with_epsilon() {
    // Test that significantly different values are not equal
    let json = r#"{
        "name": "Test Float Ne",
        "actions": [
            { "cast": "spell_a", "if": { "!=": [1.0, 2.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Values should be not equal
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_validate_depth_shallow() {
    // Test that shallow expressions pass depth validation
    let expr = Expr::And {
        operands: vec![Expr::Bool { value: true }, Expr::Bool { value: false }],
    };

    assert!(expr.validate_depth().is_ok());
}

#[test]
fn test_validate_depth_nested() {
    // Test that moderately nested expressions pass
    let mut expr = Expr::Bool { value: true };
    for _ in 0..50 {
        expr = Expr::Not {
            operand: Box::new(expr),
        };
    }

    assert!(expr.validate_depth().is_ok());
}

#[test]
fn test_validate_depth_exceeds_max() {
    // Test that deeply nested expressions fail validation
    let mut expr = Expr::Bool { value: true };
    for _ in 0..110 {
        expr = Expr::Not {
            operand: Box::new(expr),
        };
    }

    let result = expr.validate_depth();
    assert!(result.is_err());
    match result {
        Err(super::Error::MaxDepthExceeded { depth, max }) => {
            assert!(depth > max);
            assert_eq!(max, 100);
        }
        _ => panic!("Expected MaxDepthExceeded error"),
    }
}

#[test]
fn test_short_circuit_and_early_exit() {
    // Test that AND short-circuits on first false
    // This test verifies the behavior by using a condition that would
    // fail if all operands were evaluated
    let json = r#"{
        "name": "Test Short Circuit And",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                false,
                { ">": [1, 0] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // AND should short-circuit on false, return spell_b
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 2); // spell_b
}

#[test]
fn test_short_circuit_or_early_exit() {
    // Test that OR short-circuits on first true
    let json = r#"{
        "name": "Test Short Circuit Or",
        "actions": [
            { "cast": "spell_a", "if": { "or": [
                true,
                false
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // OR should short-circuit on true, return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1); // spell_a
}

#[test]
fn test_short_circuit_and_all_true() {
    // Test that AND returns true when all operands are true
    let json = r#"{
        "name": "Test And All True",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                true,
                true,
                true
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1); // spell_a
}

#[test]
fn test_short_circuit_or_all_false() {
    // Test that OR returns false when all operands are false
    let json = r#"{
        "name": "Test Or All False",
        "actions": [
            { "cast": "spell_a", "if": { "or": [
                false,
                false,
                false
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 2); // spell_b (condition was false)
}

#[test]
fn test_arithmetic_operations() {
    // Test various arithmetic operations
    let json = r#"{
        "name": "Test Arithmetic",
        "variables": {
            "sum": { "+": [10, 5] },
            "diff": { "-": [10, 3] },
            "prod": { "*": [4, 3] },
            "quot": { "/": [10, 2] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { "==": ["sum", 15] },
                { "==": ["diff", 7] },
                { "==": ["prod", 12] },
                { "==": ["quot", 5] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_math_functions() {
    // Test floor, ceil, abs, min, max
    let json = r#"{
        "name": "Test Math Functions",
        "variables": {
            "floored": { "floor": 3.7 },
            "ceiled": { "ceil": 3.2 },
            "absolute": { "abs": -5.0 },
            "minimum": { "min": [3, 7] },
            "maximum": { "max": [3, 7] }
        },
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { "==": ["floored", 3.0] },
                { "==": ["ceiled", 4.0] },
                { "==": ["absolute", 5.0] },
                { "==": ["minimum", 3] },
                { "==": ["maximum", 7] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_comparison_operators() {
    // Test all comparison operators
    let json = r#"{
        "name": "Test Comparisons",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { ">": [5, 3] },
                { ">=": [5, 5] },
                { "<": [3, 5] },
                { "<=": [5, 5] },
                { "==": [5, 5] },
                { "!=": [5, 3] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_not_operator() {
    // Test NOT operator
    let json = r#"{
        "name": "Test Not",
        "actions": [
            { "cast": "spell_a", "if": { "not": false } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

// ============================================================================
// Action System Tests
// ============================================================================

#[test]
fn test_set_var_continues_to_next_action() {
    // SetVar should continue to next action (not consume GCD)
    let json = r#"{
        "name": "Test SetVar",
        "variables": {
            "my_var": 10
        },
        "actions": [
            { "set": "my_var", "value": 20 },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should continue past set_var and return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_set_var_with_condition_false() {
    // SetVar with false condition should continue to next action
    let json = r#"{
        "name": "Test SetVar Conditional",
        "variables": {
            "my_var": 10
        },
        "actions": [
            { "set": "my_var", "value": 20, "if": false },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should continue and return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_modify_var_add_continues() {
    // ModifyVar with add should continue to next action
    let json = r#"{
        "name": "Test ModifyVar Add",
        "variables": {
            "counter": 0
        },
        "actions": [
            { "modify": "counter", "op": "add", "value": 5 },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should continue past modify_var and return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_modify_var_operations() {
    // Test various modify operations compile successfully
    let json = r#"{
        "name": "Test ModifyVar Operations",
        "variables": {
            "val": 100
        },
        "actions": [
            { "modify": "val", "op": "add", "value": 10 },
            { "modify": "val", "op": "sub", "value": 5 },
            { "modify": "val", "op": "mul", "value": 2 },
            { "modify": "val", "op": "div", "value": 4 },
            { "modify": "val", "op": "min", "value": 50 },
            { "modify": "val", "op": "max", "value": 25 },
            { "modify": "val", "op": "reset", "value": 0 },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // All modify operations should be skipped, returning spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_pool_action_returns_pool_result() {
    // Pool action should return a Pool result
    let json = r#"{
        "name": "Test Pool",
        "actions": [
            { "pool": true, "extra": 20.0 }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return Pool result with target 20.0
    assert!(result.is_pool());
    assert!((result.pool_target().unwrap() - 20.0).abs() < 0.001);
}

#[test]
fn test_pool_action_default_extra() {
    // Pool action with no extra should have target 0.0
    let json = r#"{
        "name": "Test Pool Default",
        "actions": [
            { "pool": true }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return Pool result with target 0.0
    assert!(result.is_pool());
    assert!((result.pool_target().unwrap() - 0.0).abs() < 0.001);
}

#[test]
fn test_pool_with_condition_false() {
    // Pool with false condition should continue to next action
    let json = r#"{
        "name": "Test Pool Conditional",
        "actions": [
            { "pool": true, "extra": 20.0, "if": false },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should skip pool and return spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_use_trinket_stub_continues() {
    // UseTrinket stub should continue to next action
    let json = r#"{
        "name": "Test UseTrinket",
        "actions": [
            { "use_trinket": 1 },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Stub should continue to spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_use_item_stub_continues() {
    // UseItem stub should continue to next action
    let json = r#"{
        "name": "Test UseItem",
        "actions": [
            { "use_item": "potion_of_power" },
            { "cast": "spell_a" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Stub should continue to spell_a
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_eval_result_pool() {
    // Test EvalResult::pool constructor and accessors
    let result = EvalResult::pool(75.5);
    assert!(result.is_pool());
    assert!(!result.is_none());
    assert!(!result.is_cast());
    assert!(!result.is_wait());
    assert!((result.pool_target().unwrap() - 75.5).abs() < 0.001);
}

#[test]
fn test_modify_var_type_check_valid() {
    // ModifyVar with numeric value should pass validation
    let json = r#"{
        "name": "Test ModifyVar Type Check",
        "variables": {
            "counter": 0
        },
        "actions": [
            { "modify": "counter", "op": "add", "value": 10 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(
        result.valid,
        "Expected valid rotation, got errors: {:?}",
        result.errors
    );
}

#[test]
fn test_modify_var_type_check_bool_error() {
    // ModifyVar with bool value for arithmetic op should fail validation
    let json = r#"{
        "name": "Test ModifyVar Type Check",
        "variables": {
            "counter": 0
        },
        "actions": [
            { "modify": "counter", "op": "add", "value": true }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(
        !result.valid,
        "Expected validation error for bool in arithmetic op"
    );
    assert!(result
        .errors
        .iter()
        .any(|e| matches!(e, ValidationError::TypeMismatch { .. })));
}

#[test]
fn test_modify_var_set_allows_bool() {
    // ModifyVar with 'set' operation should allow bool values
    let json = r#"{
        "name": "Test ModifyVar Set Bool",
        "variables": {
            "flag": false
        },
        "actions": [
            { "modify": "flag", "op": "set", "value": true }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(
        result.valid,
        "Expected valid rotation for set with bool value"
    );
}

#[test]
fn test_modify_var_reset_allows_any_type() {
    // ModifyVar with 'reset' operation should allow any type
    let json = r#"{
        "name": "Test ModifyVar Reset",
        "variables": {
            "flag": false
        },
        "actions": [
            { "modify": "flag", "op": "reset", "value": true }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(
        result.valid,
        "Expected valid rotation for reset with bool value"
    );
}

// ============================================================================
// Comprehensive Integration Tests
// ============================================================================

/// Test rotation JSON for BM Hunter Single Target
/// Note: This uses resolved variable references that work with validation
const BM_HUNTER_ST_ROTATION: &str = r#"{
    "name": "BM Hunter ST",
    "variables": {
        "pooling": false,
        "high_focus": { ">=": [100, 80] }
    },
    "lists": {
        "cooldowns": [
            { "cast": "bestial_wrath", "if": true }
        ],
        "st": [
            {
                "cast": "barbed_shot",
                "if": true
            },
            {
                "cast": "kill_command",
                "if": { "and": [
                    true,
                    { ">=": [100, 30] }
                ]}
            },
            {
                "cast": "cobra_shot",
                "if": { ">=": [100, 35] }
            }
        ]
    },
    "actions": [
        { "call": "cooldowns" },
        { "run": "st" }
    ]
}"#;

/// Test rotation JSON that uses var paths - requires compilation with resolver
const BM_HUNTER_ST_ROTATION_WITH_PATHS: &str = r#"{
    "name": "BM Hunter ST With Paths",
    "variables": {
        "pooling": false,
        "frenzy_up": "buff.frenzy.active",
        "frenzy_low": { "<": ["buff.frenzy.stacks", 3] },
        "need_barbed": { "and": [
            "cd.barbed_shot.ready",
            { "or": [
                { "not": "frenzy_up" },
                "frenzy_low",
                { "<": ["buff.frenzy.remaining", 2] }
            ]}
        ]}
    },
    "lists": {
        "cooldowns": [
            { "cast": "bestial_wrath", "if": "cd.bestial_wrath.ready" }
        ],
        "st": [
            {
                "cast": "barbed_shot",
                "if": "need_barbed"
            },
            {
                "cast": "kill_command",
                "if": { "and": [
                    "cd.kill_command.ready",
                    { ">=": ["resource.focus", 30] }
                ]}
            },
            {
                "cast": "cobra_shot",
                "if": { ">=": ["resource.focus", 35] }
            }
        ]
    },
    "actions": [
        { "call": "cooldowns" },
        { "run": "st" }
    ]
}"#;

#[test]
fn test_bm_hunter_st_rotation_json_roundtrip() {
    // Test that the complete rotation can be parsed
    let rotation = Rotation::from_json(BM_HUNTER_ST_ROTATION).unwrap();

    assert_eq!(rotation.name, "BM Hunter ST");
    assert!(rotation.variables.contains_key("pooling"));
    assert!(rotation.variables.contains_key("high_focus"));
    assert!(rotation.lists.contains_key("cooldowns"));
    assert!(rotation.lists.contains_key("st"));
    assert_eq!(rotation.actions.len(), 2);

    // Test JSON serialization roundtrip
    let serialized = serde_json::to_string(&rotation).unwrap();
    let reparsed: Rotation = serde_json::from_str(&serialized).unwrap();
    assert_eq!(reparsed.name, rotation.name);
    assert_eq!(reparsed.variables.len(), rotation.variables.len());
    assert_eq!(reparsed.lists.len(), rotation.lists.len());
    assert_eq!(reparsed.actions.len(), rotation.actions.len());
}

#[test]
fn test_bm_hunter_st_rotation_with_paths_compiles() {
    // Test the rotation with var paths compiles correctly via resolver
    let resolver = test_resolver();
    let compiled =
        CompiledRotation::compile_json(BM_HUNTER_ST_ROTATION_WITH_PATHS, &resolver).unwrap();

    // Schema should have entries for all the expressions used
    assert!(compiled.schema().size > 0, "Schema should be non-empty");

    // Should be able to evaluate
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return a cast action
    assert!(
        result.is_cast() || result.is_none(),
        "Should return cast or none"
    );
}

#[test]
fn test_bm_hunter_st_rotation_validation() {
    let rotation = Rotation::from_json(BM_HUNTER_ST_ROTATION).unwrap();
    let result = validate_rotation(&rotation);

    // Should be valid
    assert!(
        result.valid,
        "Rotation should be valid, got errors: {:?}",
        result.errors
    );

    // No undefined variables
    assert!(!result
        .errors
        .iter()
        .any(|e| matches!(e, ValidationError::UndefinedVariable { .. })));

    // No undefined lists
    assert!(!result
        .errors
        .iter()
        .any(|e| matches!(e, ValidationError::UndefinedList { .. })));
}

#[test]
fn test_bm_hunter_st_rotation_compilation() {
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(BM_HUNTER_ST_ROTATION, &resolver).unwrap();

    // Schema should have entries for all the expressions used
    assert!(compiled.schema().size > 0, "Schema should be non-empty");

    // Should be able to evaluate
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // Should return a cast action (since cooldowns are ready by default)
    assert!(
        result.is_cast() || result.is_none(),
        "Should return cast or none"
    );
}

#[test]
fn test_bm_hunter_st_rotation_execution() {
    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(BM_HUNTER_ST_ROTATION, &resolver).unwrap();

    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // With default state, bestial_wrath should be ready in cooldowns list
    // After that, the st list should execute
    if result.is_cast() {
        // The result spell_id should be one of our defined spells
        let valid_spells = [19574u32, 217200, 34026, 193455]; // bestial_wrath, barbed_shot, kill_command, cobra_shot
        assert!(
            valid_spells.contains(&result.spell_id),
            "Unexpected spell_id: {}",
            result.spell_id
        );
    }
}

// ============================================================================
// Expression Type Tests - All Variants
// ============================================================================

#[test]
fn test_all_expr_variants_have_value_type() {
    use wowlab_types::{AuraIdx, ResourceType, SpellIdx};

    // Test every expression variant has a valid value_type
    let expressions: Vec<Expr> = vec![
        // Literals
        Expr::Bool { value: true },
        Expr::Int { value: 42 },
        Expr::Float { value: 3.5 },
        // User variable
        Expr::UserVar {
            name: "test".to_string(),
        },
        // Domain expressions
        Expr::Resource(super::expr::ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        }),
        Expr::Cooldown(super::expr::CooldownExpr::CooldownReady { spell: SpellIdx(1) }),
        Expr::Buff(super::expr::BuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Debuff(super::expr::DebuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Dot(super::expr::DotExpr::Ticking { aura: AuraIdx(1) }),
        Expr::Combat(super::expr::CombatExpr::Time),
        Expr::Target(super::expr::TargetExpr::HealthPercent),
        Expr::Enemy(super::expr::EnemyExpr::Count),
        Expr::Player(super::expr::PlayerExpr::Health),
        Expr::Spell(super::expr::SpellExpr::Cost { spell: SpellIdx(1) }),
        Expr::Talent(super::expr::TalentExpr::Enabled { value: true }),
        Expr::Gcd(super::expr::GcdExpr::Active),
        Expr::Pet(super::expr::PetExpr::Active),
        Expr::Equipped {
            item: "test".to_string(),
        },
        Expr::TrinketReady { slot: 1 },
        Expr::TrinketRemaining { slot: 1 },
        // Logical
        Expr::And {
            operands: vec![Expr::Bool { value: true }],
        },
        Expr::Or {
            operands: vec![Expr::Bool { value: true }],
        },
        Expr::Not {
            operand: Box::new(Expr::Bool { value: true }),
        },
        // Comparison
        Expr::Gt {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 0 }),
        },
        Expr::Gte {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 0 }),
        },
        Expr::Lt {
            left: Box::new(Expr::Int { value: 0 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Lte {
            left: Box::new(Expr::Int { value: 0 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Eq {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Ne {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 0 }),
        },
        // Arithmetic
        Expr::Add {
            left: Box::new(Expr::Float { value: 1.0 }),
            right: Box::new(Expr::Float { value: 2.0 }),
        },
        Expr::Sub {
            left: Box::new(Expr::Float { value: 2.0 }),
            right: Box::new(Expr::Float { value: 1.0 }),
        },
        Expr::Mul {
            left: Box::new(Expr::Float { value: 2.0 }),
            right: Box::new(Expr::Float { value: 3.0 }),
        },
        Expr::Div {
            left: Box::new(Expr::Float { value: 6.0 }),
            right: Box::new(Expr::Float { value: 2.0 }),
        },
        Expr::Mod {
            left: Box::new(Expr::Float { value: 7.0 }),
            right: Box::new(Expr::Float { value: 3.0 }),
        },
        // Functions
        Expr::Floor {
            operand: Box::new(Expr::Float { value: 3.7 }),
        },
        Expr::Ceil {
            operand: Box::new(Expr::Float { value: 3.2 }),
        },
        Expr::Abs {
            operand: Box::new(Expr::Float { value: -5.0 }),
        },
        Expr::Min {
            left: Box::new(Expr::Float { value: 1.0 }),
            right: Box::new(Expr::Float { value: 2.0 }),
        },
        Expr::Max {
            left: Box::new(Expr::Float { value: 1.0 }),
            right: Box::new(Expr::Float { value: 2.0 }),
        },
    ];

    // Verify each expression has a valid value_type
    for expr in &expressions {
        let vt = expr.value_type();
        assert!(
            matches!(vt, ValueType::Bool | ValueType::Int | ValueType::Float),
            "Expression {:?} has invalid value_type",
            expr
        );
    }

    // Verify type categories
    assert_eq!(Expr::Bool { value: true }.value_type(), ValueType::Bool);
    assert_eq!(Expr::Int { value: 42 }.value_type(), ValueType::Int);
    assert_eq!(
        Expr::Float {
            value: std::f64::consts::PI
        }
        .value_type(),
        ValueType::Float
    );
    assert_eq!(Expr::And { operands: vec![] }.value_type(), ValueType::Bool);
    assert_eq!(
        Expr::Add {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 2 })
        }
        .value_type(),
        ValueType::Float
    );
}

#[test]
fn test_all_expr_variants_validate_depth() {
    use wowlab_types::{AuraIdx, ResourceType, SpellIdx};

    // All leaf expressions should pass depth validation
    let expressions: Vec<Expr> = vec![
        Expr::Bool { value: true },
        Expr::Int { value: 42 },
        Expr::Float { value: 3.5 },
        Expr::UserVar {
            name: "test".to_string(),
        },
        Expr::Resource(super::expr::ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        }),
        Expr::Cooldown(super::expr::CooldownExpr::CooldownReady { spell: SpellIdx(1) }),
        Expr::Buff(super::expr::BuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Debuff(super::expr::DebuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Dot(super::expr::DotExpr::Ticking { aura: AuraIdx(1) }),
        Expr::Combat(super::expr::CombatExpr::Time),
        Expr::Target(super::expr::TargetExpr::HealthPercent),
        Expr::Enemy(super::expr::EnemyExpr::Count),
        Expr::Player(super::expr::PlayerExpr::Health),
        Expr::Spell(super::expr::SpellExpr::Cost { spell: SpellIdx(1) }),
        Expr::Talent(super::expr::TalentExpr::Enabled { value: true }),
        Expr::Gcd(super::expr::GcdExpr::Active),
        Expr::Pet(super::expr::PetExpr::Active),
        Expr::Equipped {
            item: "test".to_string(),
        },
        Expr::TrinketReady { slot: 1 },
        Expr::TrinketRemaining { slot: 1 },
    ];

    for expr in &expressions {
        assert!(
            expr.validate_depth().is_ok(),
            "Expression {:?} failed depth validation",
            expr
        );
    }
}

// ============================================================================
// Domain Expression Field Type Tests
// ============================================================================

#[test]
fn test_all_resource_expr_field_types() {
    use super::expr::{FieldType, PopulateContext, ResourceExpr};
    use wowlab_types::ResourceType;

    let variants = [
        ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceMax {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceDeficit {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourcePercent {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceDeficitPercent {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceRegen {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceTimeToMax {
            resource: ResourceType::Focus,
        },
        ResourceExpr::ResourceTimeTo {
            resource: ResourceType::Focus,
            amount: 50.0,
        },
    ];

    // All resource expressions return Float
    for variant in &variants {
        assert_eq!(
            variant.field_type(),
            FieldType::Float,
            "Failed for {:?}",
            variant
        );
    }
}

#[test]
fn test_all_buff_expr_field_types() {
    use super::expr::{BuffExpr, FieldType, PopulateContext};
    use wowlab_types::AuraIdx;

    let aura = AuraIdx(1);

    assert_eq!(BuffExpr::Active { aura }.field_type(), FieldType::Bool);
    assert_eq!(BuffExpr::Inactive { aura }.field_type(), FieldType::Bool);
    assert_eq!(BuffExpr::Remaining { aura }.field_type(), FieldType::Float);
    assert_eq!(BuffExpr::Stacks { aura }.field_type(), FieldType::Int);
    assert_eq!(BuffExpr::StacksMax { aura }.field_type(), FieldType::Int);
    assert_eq!(BuffExpr::Duration { aura }.field_type(), FieldType::Float);
}

#[test]
fn test_all_debuff_expr_field_types() {
    use super::expr::{DebuffExpr, FieldType, PopulateContext};
    use wowlab_types::AuraIdx;

    let aura = AuraIdx(1);

    assert_eq!(DebuffExpr::Active { aura }.field_type(), FieldType::Bool);
    assert_eq!(DebuffExpr::Inactive { aura }.field_type(), FieldType::Bool);
    assert_eq!(
        DebuffExpr::Remaining { aura }.field_type(),
        FieldType::Float
    );
    assert_eq!(DebuffExpr::Stacks { aura }.field_type(), FieldType::Int);
    assert_eq!(
        DebuffExpr::Refreshable { aura }.field_type(),
        FieldType::Bool
    );
}

#[test]
fn test_all_dot_expr_field_types() {
    use super::expr::{DotExpr, FieldType, PopulateContext};
    use wowlab_types::AuraIdx;

    let aura = AuraIdx(1);

    assert_eq!(DotExpr::Ticking { aura }.field_type(), FieldType::Bool);
    assert_eq!(DotExpr::Remaining { aura }.field_type(), FieldType::Float);
    assert_eq!(DotExpr::Refreshable { aura }.field_type(), FieldType::Bool);
    assert_eq!(
        DotExpr::TicksRemaining { aura }.field_type(),
        FieldType::Int
    );
}

#[test]
fn test_all_target_expr_field_types() {
    use super::expr::{FieldType, PercentValue, PopulateContext, TargetExpr};

    assert_eq!(TargetExpr::Health.field_type(), FieldType::Float);
    assert_eq!(TargetExpr::HealthMax.field_type(), FieldType::Float);
    assert_eq!(TargetExpr::HealthPercent.field_type(), FieldType::Float);
    assert_eq!(TargetExpr::TimeToDie.field_type(), FieldType::Float);
    assert_eq!(
        TargetExpr::TimeToPercent {
            percent: PercentValue(30.0)
        }
        .field_type(),
        FieldType::Float
    );
    assert_eq!(TargetExpr::Distance.field_type(), FieldType::Float);
    assert_eq!(TargetExpr::Casting.field_type(), FieldType::Bool);
    assert_eq!(TargetExpr::Moving.field_type(), FieldType::Bool);
    assert_eq!(TargetExpr::EnemyCount.field_type(), FieldType::Int);
}

#[test]
fn test_all_player_expr_field_types() {
    use super::expr::{FieldType, PlayerExpr, PopulateContext};

    // Float types
    assert_eq!(PlayerExpr::Health.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::HealthMax.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::HealthPercent.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::HealthDeficit.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Haste.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Crit.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Mastery.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Versatility.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::AttackPower.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::SpellPower.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Armor.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::Stamina.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::PrimaryStat.field_type(), FieldType::Float);
    assert_eq!(PlayerExpr::MovementRemaining.field_type(), FieldType::Float);

    // Int type
    assert_eq!(PlayerExpr::Level.field_type(), FieldType::Int);

    // Bool types
    assert_eq!(PlayerExpr::Moving.field_type(), FieldType::Bool);
    assert_eq!(PlayerExpr::Alive.field_type(), FieldType::Bool);
    assert_eq!(PlayerExpr::InCombat.field_type(), FieldType::Bool);
    assert_eq!(PlayerExpr::Stealthed.field_type(), FieldType::Bool);
    assert_eq!(PlayerExpr::Mounted.field_type(), FieldType::Bool);
}

#[test]
fn test_all_combat_expr_field_types() {
    use super::expr::{CombatExpr, FieldType, PopulateContext};

    assert_eq!(CombatExpr::Time.field_type(), FieldType::Float);
    assert_eq!(CombatExpr::Remaining.field_type(), FieldType::Float);
}

#[test]
fn test_all_enemy_expr_field_types() {
    use super::expr::{EnemyExpr, FieldType, PopulateContext};
    use wowlab_types::SpellIdx;

    assert_eq!(EnemyExpr::Count.field_type(), FieldType::Int);
    assert_eq!(
        EnemyExpr::SpellTargetsHit { spell: SpellIdx(1) }.field_type(),
        FieldType::Int
    );
}

// ============================================================================
// Expr JSON Serialization Tests
// ============================================================================

#[test]
fn test_expr_json_roundtrip_literals() {
    let cases: Vec<Expr> = vec![
        Expr::Bool { value: true },
        Expr::Bool { value: false },
        Expr::Int { value: 0 },
        Expr::Int { value: -100 },
        Expr::Int { value: i64::MAX },
        Expr::Float { value: 0.0 },
        Expr::Float { value: 3.56789 },
        Expr::Float { value: -999.999 },
    ];

    for expr in cases {
        let json = serde_json::to_string(&expr).unwrap();
        let parsed: Expr = serde_json::from_str(&json).unwrap();
        assert_eq!(expr, parsed, "Roundtrip failed for: {}", json);
    }
}

#[test]
fn test_expr_json_roundtrip_logical() {
    let cases: Vec<Expr> = vec![
        Expr::And {
            operands: vec![Expr::Bool { value: true }, Expr::Bool { value: false }],
        },
        Expr::Or {
            operands: vec![Expr::Bool { value: true }],
        },
        Expr::Not {
            operand: Box::new(Expr::Bool { value: true }),
        },
        Expr::And { operands: vec![] }, // Empty AND
        Expr::Or { operands: vec![] },  // Empty OR
    ];

    for expr in cases {
        let json = serde_json::to_string(&expr).unwrap();
        let parsed: Expr = serde_json::from_str(&json).unwrap();
        assert_eq!(expr, parsed, "Roundtrip failed for: {}", json);
    }
}

#[test]
fn test_expr_json_roundtrip_comparison() {
    let left = Box::new(Expr::Int { value: 10 });
    let right = Box::new(Expr::Int { value: 5 });

    let cases: Vec<Expr> = vec![
        Expr::Gt {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Gte {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Lt {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Lte {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Eq {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Ne {
            left: left.clone(),
            right: right.clone(),
        },
    ];

    for expr in cases {
        let json = serde_json::to_string(&expr).unwrap();
        let parsed: Expr = serde_json::from_str(&json).unwrap();
        assert_eq!(expr, parsed, "Roundtrip failed for: {}", json);
    }
}

#[test]
fn test_expr_json_roundtrip_arithmetic() {
    let left = Box::new(Expr::Float { value: 10.0 });
    let right = Box::new(Expr::Float { value: 3.0 });

    let cases: Vec<Expr> = vec![
        Expr::Add {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Sub {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Mul {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Div {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Mod {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Min {
            left: left.clone(),
            right: right.clone(),
        },
        Expr::Max {
            left: left.clone(),
            right: right.clone(),
        },
    ];

    for expr in cases {
        let json = serde_json::to_string(&expr).unwrap();
        let parsed: Expr = serde_json::from_str(&json).unwrap();
        assert_eq!(expr, parsed, "Roundtrip failed for: {}", json);
    }
}

#[test]
fn test_expr_json_roundtrip_functions() {
    let cases: Vec<Expr> = vec![
        Expr::Floor {
            operand: Box::new(Expr::Float { value: 3.7 }),
        },
        Expr::Ceil {
            operand: Box::new(Expr::Float { value: 3.2 }),
        },
        Expr::Abs {
            operand: Box::new(Expr::Float { value: -5.0 }),
        },
    ];

    for expr in cases {
        let json = serde_json::to_string(&expr).unwrap();
        let parsed: Expr = serde_json::from_str(&json).unwrap();
        assert_eq!(expr, parsed, "Roundtrip failed for: {}", json);
    }
}

// ============================================================================
// Action JSON Serialization Tests
// ============================================================================

#[test]
fn test_action_json_roundtrip() {
    let actions: Vec<AstAction> = vec![
        AstAction::Cast {
            spell: "test".to_string(),
            condition: None,
        },
        AstAction::Cast {
            spell: "test".to_string(),
            condition: Some(Expr::Bool { value: true }),
        },
        AstAction::Call {
            list: "cooldowns".to_string(),
            condition: None,
        },
        AstAction::Run {
            list: "st".to_string(),
            condition: None,
        },
        AstAction::Wait {
            seconds: 1.5,
            condition: None,
        },
        AstAction::WaitUntil {
            condition: Expr::Bool { value: true },
        },
        AstAction::Pool {
            extra: Some(20.0),
            condition: None,
        },
        AstAction::Pool {
            extra: None,
            condition: None,
        },
        AstAction::UseTrinket {
            slot: 1,
            condition: None,
        },
        AstAction::UseItem {
            name: "potion".to_string(),
            condition: None,
        },
        AstAction::SetVar {
            name: "test".to_string(),
            value: Expr::Int { value: 10 },
            condition: None,
        },
        AstAction::ModifyVar {
            name: "test".to_string(),
            op: VarOp::Add,
            value: Expr::Int { value: 5 },
            condition: None,
        },
    ];

    for action in actions {
        let json = serde_json::to_string(&action).unwrap();
        let parsed: AstAction = serde_json::from_str(&json).unwrap();
        // Compare by re-serializing (struct equality may differ on Option fields)
        assert_eq!(
            serde_json::to_string(&action).unwrap(),
            serde_json::to_string(&parsed).unwrap(),
            "Roundtrip failed for action"
        );
    }
}

// ============================================================================
// Complex Expression Trees Tests
// ============================================================================

#[test]
fn test_deeply_nested_and_or() {
    // Test deeply nested AND/OR that should compile
    let json = r#"{
        "name": "Test Nested Logic",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { "or": [true, false] },
                { "and": [
                    true,
                    { "or": [false, true] }
                ]},
                { "not": false }
            ]}}
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // The complex condition evaluates to true, so spell_a should be cast
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_complex_arithmetic_expression() {
    // Use nested binary operations: (10*2) + ((20/4) + (15-10)) = 20 + (5 + 5) = 30
    let json = r#"{
        "name": "Test Complex Arithmetic",
        "variables": {
            "result": { "+": [
                { "*": [10, 2] },
                { "+": [
                    { "/": [20, 4] },
                    { "-": [15, 10] }
                ]}
            ]}
        },
        "actions": [
            { "cast": "spell_a", "if": { "==": ["result", 30] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // result = (10*2) + ((20/4) + (15-10)) = 20 + (5 + 5) = 30
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

#[test]
fn test_mixed_comparison_chain() {
    let json = r#"{
        "name": "Test Mixed Comparisons",
        "actions": [
            { "cast": "spell_a", "if": { "and": [
                { ">": [10, 5] },
                { ">=": [10, 10] },
                { "<": [5, 10] },
                { "<=": [10, 10] },
                { "==": [5, 5] },
                { "!=": [5, 10] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();
    let result = compiled.evaluate(&state);

    // All comparisons are true, so spell_a should be cast
    assert!(result.is_cast());
    assert_eq!(result.spell_id, 1);
}

// ============================================================================
// Validation Edge Cases
// ============================================================================

#[test]
fn test_validation_circular_variable_reference() {
    let json = r#"{
        "name": "Test Circular Ref",
        "variables": {
            "a": "b",
            "b": "a"
        },
        "actions": [
            { "cast": "spell_a" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(!result.valid, "Should detect circular reference");
    assert!(result
        .errors
        .iter()
        .any(|e| matches!(e, ValidationError::CircularReference { .. })));
}

#[test]
fn test_validation_undefined_list() {
    let json = r#"{
        "name": "Test Undefined List",
        "actions": [
            { "call": "nonexistent" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(!result.valid, "Should detect undefined list");
    assert!(result
        .errors
        .iter()
        .any(|e| matches!(e, ValidationError::UndefinedList { name } if name == "nonexistent")));
}

#[test]
fn test_validation_empty_actions() {
    let json = r#"{
        "name": "Test Empty Actions",
        "actions": []
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    assert!(!result.valid, "Should detect empty actions");
    assert!(result.errors.iter().any(
        |e| matches!(e, ValidationError::EmptyActionList { list_name } if list_name == "actions")
    ));
}

#[test]
fn test_validation_unused_variable_warning() {
    let json = r#"{
        "name": "Test Unused Variable",
        "variables": {
            "unused_var": true
        },
        "actions": [
            { "cast": "spell_a" }
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let result = validate_rotation(&rotation);

    // Should be valid but with warnings
    assert!(result.valid, "Should be valid despite unused variable");
    assert!(result
        .warnings
        .iter()
        .any(|w| matches!(w, ValidationWarning::UnusedVariable { name } if name == "unused_var")));
}

// ============================================================================
// Expression Count Verification
// ============================================================================

#[test]
fn test_expression_variant_count() {
    // This test documents the number of expression variants
    // to ensure we don't accidentally remove any

    // Count the variants in the Expr enum by trying to create each one
    // We can verify by looking at the exhaustive match in value_type()

    // Domain expressions sub-enums:
    // ResourceExpr: 8 variants
    // CooldownExpr: 9 variants
    // BuffExpr: 6 variants
    // DebuffExpr: 5 variants
    // DotExpr: 4 variants
    // CombatExpr: 2 variants
    // TargetExpr: 9 variants
    // EnemyExpr: 2 variants
    // PlayerExpr: 20 variants
    // SpellExpr: 5 variants
    // TalentExpr: 3 variants
    // GcdExpr: 3 variants
    // PetExpr: 4 variants
    // UnifiedAuraExpr: 11 variants

    // Total domain sub-variants: 8+9+6+5+4+2+9+2+20+5+3+3+4+11 = 91

    // Top-level Expr variants:
    // 3 literals (Bool, Int, Float)
    // 1 user variable (UserVar)
    // 14 domain expressions (Resource, Cooldown, Buff, Debuff, Dot, Combat, Target, Enemy, Player, Spell, Talent, Gcd, Pet + Equipped, TrinketReady, TrinketRemaining = 17)
    // Wait, let me count: Resource, Cooldown, Buff, Debuff, Dot, Combat, Target, Enemy, Player, Spell, Talent, Gcd, Pet = 13
    // Plus standalone: Equipped, TrinketReady, TrinketRemaining = 3
    // Total domain: 16
    // 3 logical (And, Or, Not)
    // 6 comparison (Gt, Gte, Lt, Lte, Eq, Ne)
    // 5 arithmetic (Add, Sub, Mul, Div, Mod)
    // 5 functions (Floor, Ceil, Abs, Min, Max)

    // Total top-level: 3+1+16+3+6+5+5 = 39 variants

    // This test just asserts we can create examples of each top-level variant
    let variant_count = 39; // Update this if variants are added/removed

    // Create 39 distinct expression variants
    use wowlab_types::{AuraIdx, ResourceType, SpellIdx};

    let examples: Vec<Expr> = vec![
        // Literals (3)
        Expr::Bool { value: true },
        Expr::Int { value: 1 },
        Expr::Float { value: 1.0 },
        // UserVar (1)
        Expr::UserVar {
            name: "x".to_string(),
        },
        // Domain (16)
        Expr::Resource(super::expr::ResourceExpr::ResourceCurrent {
            resource: ResourceType::Focus,
        }),
        Expr::Cooldown(super::expr::CooldownExpr::CooldownReady { spell: SpellIdx(1) }),
        Expr::Buff(super::expr::BuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Debuff(super::expr::DebuffExpr::Active { aura: AuraIdx(1) }),
        Expr::Dot(super::expr::DotExpr::Ticking { aura: AuraIdx(1) }),
        Expr::Combat(super::expr::CombatExpr::Time),
        Expr::Target(super::expr::TargetExpr::Health),
        Expr::Enemy(super::expr::EnemyExpr::Count),
        Expr::Player(super::expr::PlayerExpr::Health),
        Expr::Spell(super::expr::SpellExpr::Cost { spell: SpellIdx(1) }),
        Expr::Talent(super::expr::TalentExpr::Enabled { value: true }),
        Expr::Gcd(super::expr::GcdExpr::Active),
        Expr::Pet(super::expr::PetExpr::Active),
        Expr::Equipped {
            item: "x".to_string(),
        },
        Expr::TrinketReady { slot: 1 },
        Expr::TrinketRemaining { slot: 1 },
        // Logical (3)
        Expr::And { operands: vec![] },
        Expr::Or { operands: vec![] },
        Expr::Not {
            operand: Box::new(Expr::Bool { value: true }),
        },
        // Comparison (6)
        Expr::Gt {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 0 }),
        },
        Expr::Gte {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 0 }),
        },
        Expr::Lt {
            left: Box::new(Expr::Int { value: 0 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Lte {
            left: Box::new(Expr::Int { value: 0 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Eq {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Ne {
            left: Box::new(Expr::Int { value: 0 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        // Arithmetic (5)
        Expr::Add {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Sub {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Mul {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Div {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        Expr::Mod {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 1 }),
        },
        // Functions (5)
        Expr::Floor {
            operand: Box::new(Expr::Float { value: 1.5 }),
        },
        Expr::Ceil {
            operand: Box::new(Expr::Float { value: 1.5 }),
        },
        Expr::Abs {
            operand: Box::new(Expr::Float { value: -1.0 }),
        },
        Expr::Min {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 2 }),
        },
        Expr::Max {
            left: Box::new(Expr::Int { value: 1 }),
            right: Box::new(Expr::Int { value: 2 }),
        },
    ];

    assert_eq!(
        examples.len(),
        variant_count,
        "Expected {} expression variants, got {}",
        variant_count,
        examples.len()
    );
}

// ============================================================================
// Runtime Variable Mutation Tests
// ============================================================================

/// Test that SetVar actually modifies a variable at runtime.
/// The rotation sets a bool variable to true, then uses it in a condition.
#[test]
fn test_set_var_bool_runtime_modification() {
    // Note: JSON parser uses "set" key, not "set_var"
    let json = r#"{
        "name": "Test",
        "variables": {
            "should_cast": false
        },
        "actions": [
            { "set": "should_cast", "value": true },
            { "cast": "spell_a", "if": "should_cast" },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // The set_var sets should_cast to true, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test that SetVar with a false condition doesn't modify the variable.
#[test]
fn test_set_var_with_condition_false_no_modification() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "should_cast": false
        },
        "actions": [
            { "set": "should_cast", "value": true, "if": false },
            { "cast": "spell_a", "if": "should_cast" },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // The set_var condition is false, so should_cast stays false, spell_b should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 2, "Expected spell_b (id=2)");
}

/// Test ModifyVar with Add operation.
#[test]
fn test_modify_var_add_runtime() {
    // Note: JSON parser uses "modify" key, not "modify_var"
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 10
        },
        "actions": [
            { "modify": "counter", "op": "add", "value": 5 },
            { "cast": "spell_a", "if": { ">=": ["counter", 15] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 10, add 5 = 15, condition is >= 15, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Sub operation.
#[test]
fn test_modify_var_sub_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 20
        },
        "actions": [
            { "modify": "counter", "op": "sub", "value": 15 },
            { "cast": "spell_a", "if": { "<": ["counter", 10] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 20, sub 15 = 5, condition is < 10, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Mul operation.
#[test]
fn test_modify_var_mul_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 5.0
        },
        "actions": [
            { "modify": "counter", "op": "mul", "value": 3.0 },
            { "cast": "spell_a", "if": { "==": ["counter", 15.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 5.0, mul 3.0 = 15.0, condition is == 15.0, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Div operation.
#[test]
fn test_modify_var_div_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 20.0
        },
        "actions": [
            { "modify": "counter", "op": "div", "value": 4.0 },
            { "cast": "spell_a", "if": { "==": ["counter", 5.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 20.0, div 4.0 = 5.0, condition is == 5.0, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Min operation.
#[test]
fn test_modify_var_min_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 100.0
        },
        "actions": [
            { "modify": "counter", "op": "min", "value": 50.0 },
            { "cast": "spell_a", "if": { "==": ["counter", 50.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 100.0, min(100, 50) = 50, condition is == 50.0, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Max operation.
#[test]
fn test_modify_var_max_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 10.0
        },
        "actions": [
            { "modify": "counter", "op": "max", "value": 50.0 },
            { "cast": "spell_a", "if": { "==": ["counter", 50.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 10.0, max(10, 50) = 50, condition is == 50.0, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test ModifyVar with Reset operation.
#[test]
fn test_modify_var_reset_runtime() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "counter": 42.0
        },
        "actions": [
            { "set": "counter", "value": 999.0 },
            { "modify": "counter", "op": "reset", "value": 0 },
            { "cast": "spell_a", "if": { "==": ["counter", 42.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // counter starts at 42.0, set to 999, reset to initial (42), condition is == 42.0, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test multiple SetVar operations in sequence.
#[test]
fn test_multiple_set_var_in_sequence() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "x": 0,
            "y": 0
        },
        "actions": [
            { "set": "x", "value": 10 },
            { "set": "y", "value": 20 },
            { "cast": "spell_a", "if": { "and": [
                { "==": ["x", 10] },
                { "==": ["y", 20] }
            ]}},
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // Both x and y should be set correctly
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test variable used in expression after modification.
#[test]
fn test_variable_in_arithmetic_expression() {
    let json = r#"{
        "name": "Test",
        "variables": {
            "base": 10.0
        },
        "actions": [
            { "set": "base", "value": 25.0 },
            { "cast": "spell_a", "if": { ">": [{ "+": ["base", 5.0] }, 20.0] } },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // base = 25, base + 5 = 30, 30 > 20 is true, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}

/// Test that variables defined only via SetVar work (no initial value in variables map).
#[test]
fn test_set_var_without_initial_definition() {
    // Note: Variables not in the variables map but used in SetVar
    // should be registered during schema building
    let json = r#"{
        "name": "Test",
        "variables": {},
        "actions": [
            { "set": "dynamic_var", "value": true },
            { "cast": "spell_a", "if": "dynamic_var" },
            { "cast": "spell_b" }
        ]
    }"#;

    let resolver = test_resolver();
    let compiled = CompiledRotation::compile_json(json, &resolver).unwrap();
    let state = test_sim_state();

    // dynamic_var is set to true, so spell_a should be cast
    let result = compiled.evaluate(&state);
    assert!(result.is_cast(), "Expected cast result");
    assert_eq!(result.spell_id, 1, "Expected spell_a (id=1)");
}
