use super::*;
use crate::handler::SpecHandler;
use crate::types::*;
use crate::sim::{SimState, SimConfig};
use crate::actor::Player;
use std::sync::Once;

static INIT_ROTATION: Once = Once::new();

fn ensure_rotation() {
    INIT_ROTATION.call_once(|| {
        // Simple rotation that just casts Kill Command then Cobra Shot
        let json = r#"{
            "name": "test_rotation",
            "actions": [
                { "spell_id": 34026 },
                { "spell_id": 193455 }
            ]
        }"#;
        let _ = BmHunter::init_rotation(json);
    });
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
    let handler = BmHunter::new();
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    assert_eq!(player.spec, SpecId::BeastMastery);
    assert!(player.resources.primary.is_some());
    assert!(player.cooldown(KILL_COMMAND).is_some());
    assert!(player.charged_cooldown(BARBED_SHOT).is_some());
}

#[test]
fn sim_init() {
    ensure_rotation();
    let handler = BmHunter::new();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let state = SimState::new(config, player);
    assert!(!state.finished);
    assert_eq!(state.player.spec, SpecId::BeastMastery);
}

#[test]
fn cooldown_lookup() {
    let handler = BmHunter::new();
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let kc_cd = player.cooldown(KILL_COMMAND).expect("Kill Command should have cooldown");
    assert!(kc_cd.is_ready(SimTime::ZERO));

    let bw_cd = player.cooldown(BESTIAL_WRATH).expect("Bestial Wrath should have cooldown");
    assert!(bw_cd.is_ready(SimTime::ZERO));
}

#[test]
fn pet_init() {
    ensure_rotation();
    let handler = BmHunter::new();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    let mut state = SimState::new(config, player);
    let now = state.now();

    // Initialize sim - this should summon the pet
    handler.init(&mut state);

    // BM Hunter should have summoned a pet
    assert!(state.pets.active(now).count() > 0, "BM Hunter should have an active pet");
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
// JIT Rotation Tests
// ============================================================================

#[test]
fn rotation_compile_basic() {
    use crate::rotation::{Rotation, CompiledRotation};

    let json = r#"{
        "name": "basic",
        "actions": [
            { "spell_id": 34026 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    let compiled = CompiledRotation::compile(&rotation).expect("Failed to compile rotation");

    // Create context and evaluate
    use crate::rotation::RotationContext;
    let ctx = RotationContext::default();
    let result = compiled.evaluate(&ctx);
    assert_eq!(result, 34026); // Should return Kill Command spell ID
}

#[test]
fn rotation_compile_with_condition() {
    use crate::rotation::{Rotation, CompiledRotation, RotationContext};

    // Cast Kill Command when focus >= 30, else Cobra Shot
    let json = r#"{
        "name": "conditional",
        "actions": [
            {
                "spell_id": 34026,
                "condition": { ">=": [{ "var": "focus" }, 30] }
            },
            { "spell_id": 193455 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    let compiled = CompiledRotation::compile(&rotation).expect("Failed to compile rotation");

    // With high focus, should cast Kill Command
    let mut ctx = RotationContext::default();
    ctx.focus = 50.0;
    assert_eq!(compiled.evaluate(&ctx), 34026);

    // With low focus, should cast Cobra Shot
    ctx.focus = 20.0;
    assert_eq!(compiled.evaluate(&ctx), 193455);
}

#[test]
fn rotation_cooldown_condition() {
    use crate::rotation::{Rotation, CompiledRotation, RotationContext};

    // Cast Bestial Wrath when cooldown is ready (slot 1)
    let json = r#"{
        "name": "cooldown_test",
        "actions": [
            {
                "spell_id": 19574,
                "condition": "cooldown.1.ready"
            },
            { "spell_id": 193455 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    let compiled = CompiledRotation::compile(&rotation).expect("Failed to compile rotation");

    // Cooldown ready - should cast Bestial Wrath
    let mut ctx = RotationContext::default();
    ctx.cd_ready[1] = true;
    assert_eq!(compiled.evaluate(&ctx), 19574);

    // Cooldown not ready - should cast Cobra Shot
    ctx.cd_ready[1] = false;
    assert_eq!(compiled.evaluate(&ctx), 193455);
}

#[test]
fn rotation_buff_condition() {
    use crate::rotation::{Rotation, CompiledRotation, RotationContext};

    // Cast Kill Command when Bestial Wrath is active (buff slot 0)
    let json = r#"{
        "name": "buff_test",
        "actions": [
            {
                "spell_id": 34026,
                "condition": "buff.0.active"
            },
            { "spell_id": 193455 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    let compiled = CompiledRotation::compile(&rotation).expect("Failed to compile rotation");

    // Buff active - should cast Kill Command
    let mut ctx = RotationContext::default();
    ctx.buff_active[0] = true;
    assert_eq!(compiled.evaluate(&ctx), 34026);

    // Buff not active - should cast Cobra Shot
    ctx.buff_active[0] = false;
    assert_eq!(compiled.evaluate(&ctx), 193455);
}

#[test]
fn rotation_and_condition() {
    use crate::rotation::{Rotation, CompiledRotation, RotationContext};

    // Cast Kill Command when cooldown ready AND focus >= 30
    let json = r#"{
        "name": "and_test",
        "actions": [
            {
                "spell_id": 34026,
                "condition": {
                    "and": [
                        "cooldown.0.ready",
                        { ">=": [{ "var": "focus" }, 30] }
                    ]
                }
            },
            { "spell_id": 193455 }
        ]
    }"#;

    let rotation = Rotation::from_json(json).expect("Failed to parse rotation");
    let compiled = CompiledRotation::compile(&rotation).expect("Failed to compile rotation");

    let mut ctx = RotationContext::default();

    // Both conditions true
    ctx.cd_ready[0] = true;
    ctx.focus = 50.0;
    assert_eq!(compiled.evaluate(&ctx), 34026);

    // Focus too low
    ctx.focus = 20.0;
    assert_eq!(compiled.evaluate(&ctx), 193455);

    // Cooldown not ready
    ctx.cd_ready[0] = false;
    ctx.focus = 50.0;
    assert_eq!(compiled.evaluate(&ctx), 193455);
}
