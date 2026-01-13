//! Rotation system tests.

use super::*;

#[test]
fn test_compile_and_run() {
    let json = r#"{
        "name": "Test",
        "actions": [
            {
                "spell_id": 1,
                "condition": {">=": [{"var": "focus"}, 30]}
            },
            {"spell_id": 2}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let compiled = CompiledRotation::compile(&rotation).unwrap();

    let mut ctx = RotationContext::default();

    // Focus too low - should skip first spell, cast second
    ctx.focus = 20.0;
    assert_eq!(compiled.evaluate(&ctx), 2);

    // Focus high enough - cast first spell
    ctx.focus = 50.0;
    assert_eq!(compiled.evaluate(&ctx), 1);
}

#[test]
fn test_cooldown_slots() {
    let json = r#"{
        "name": "Test",
        "actions": [
            {
                "spell_id": 1,
                "condition": {"var": "cooldown.0.ready"}
            },
            {"spell_id": 2}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let compiled = CompiledRotation::compile(&rotation).unwrap();

    let mut ctx = RotationContext::default();

    // CD not ready
    ctx.cd_ready[0] = false;
    assert_eq!(compiled.evaluate(&ctx), 2);

    // CD ready
    ctx.cd_ready[0] = true;
    assert_eq!(compiled.evaluate(&ctx), 1);
}

#[test]
fn test_buff_slots() {
    let json = r#"{
        "name": "Test",
        "actions": [
            {
                "spell_id": 1,
                "condition": {"and": [
                    {"var": "buff.0.active"},
                    {">=": [{"var": "buff.0.stacks"}, 3]}
                ]}
            },
            {"spell_id": 2}
        ]
    }"#;

    let rotation = Rotation::from_json(json).unwrap();
    let compiled = CompiledRotation::compile(&rotation).unwrap();

    let mut ctx = RotationContext::default();

    // Buff not active
    ctx.buff_active[0] = false;
    ctx.buff_stacks[0] = 5;
    assert_eq!(compiled.evaluate(&ctx), 2);

    // Buff active but low stacks
    ctx.buff_active[0] = true;
    ctx.buff_stacks[0] = 2;
    assert_eq!(compiled.evaluate(&ctx), 2);

    // Buff active and enough stacks
    ctx.buff_active[0] = true;
    ctx.buff_stacks[0] = 3;
    assert_eq!(compiled.evaluate(&ctx), 1);
}
