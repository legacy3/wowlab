use super::*;
use crate::handler::SpecHandler;
use crate::types::*;
use crate::sim::{SimState, SimConfig};
use crate::actor::Player;
use std::sync::Once;

static INIT_ROTATION: Once = Once::new();

fn ensure_rotation() {
    INIT_ROTATION.call_once(|| {
        let _ = BmHunter::init_rotation("wait_gcd()");
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
    let mut state = SimState::new(config, player);
    handler.init(&mut state);

    assert_eq!(state.player.spec, SpecId::BeastMastery);
    // Pet should be summoned
    assert!(state.pets.get(UnitIdx(1)).is_some());
}

#[test]
fn spell_lookup() {
    let spells = spell_definitions();

    let kill_cmd = spells.iter().find(|s| s.id == KILL_COMMAND);
    assert!(kill_cmd.is_some());
    let kc = kill_cmd.unwrap();
    assert!(kc.cooldown > SimTime::ZERO);

    let barbed = spells.iter().find(|s| s.id == BARBED_SHOT);
    assert!(barbed.is_some());
    let bs = barbed.unwrap();
    assert!(bs.charges > 0);
}

#[test]
fn pet_damage_constants() {
    assert!((PetDamage::KILL_COMMAND_COEF - 2.0).abs() < 0.01);
    assert!((PetDamage::STAT_INHERITANCE - 0.6).abs() < 0.01);
}

#[test]
fn rotation_spell_name_mapping() {
    assert_eq!(spell_name_to_idx("kill_command"), Some(KILL_COMMAND));
    assert_eq!(spell_name_to_idx("cobra_shot"), Some(COBRA_SHOT));
    assert_eq!(spell_name_to_idx("barbed_shot"), Some(BARBED_SHOT));
    assert_eq!(spell_name_to_idx("bestial_wrath"), Some(BESTIAL_WRATH));
    assert_eq!(spell_name_to_idx("invalid_spell"), None);
}

// ============================================================================
// JSON Rotation DSL Tests
// ============================================================================

#[test]
fn json_rotation_basic() {
    use crate::rotation::json_dsl::JsonRotation;
    use crate::rotation::Action;

    // Simple rotation: Cast Kill Command when off CD, else Cobra Shot
    let json = r#"{
        "defaultListId": "main",
        "name": "Basic BM Rotation",
        "lists": [
            {
                "id": "main",
                "name": "default",
                "listType": "main",
                "actions": [
                    {
                        "id": "1",
                        "type": "spell",
                        "spellId": 34026,
                        "enabled": true
                    },
                    {
                        "id": "2",
                        "type": "spell",
                        "spellId": 193455,
                        "enabled": true
                    }
                ]
            }
        ],
        "variables": []
    }"#;

    let resolver = BmHunterResolver;
    let rotation = JsonRotation::from_json(json, resolver).expect("Failed to parse rotation");

    // Create a minimal sim state to test
    ensure_rotation();
    let handler = BmHunter::new();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);
    let state = SimState::new(config, player);

    // Get next action - should be Kill Command (first in list, no conditions)
    let action = rotation.next_action(&state);
    assert_eq!(action, Action::Cast("kill_command".to_string()));
}

#[test]
fn json_rotation_with_conditions() {
    use crate::rotation::json_dsl::JsonRotation;
    use crate::rotation::Action;

    // Rotation with conditions: Cast Kill Command only when focus >= 30
    let json = r#"{
        "defaultListId": "main",
        "name": "Conditional BM Rotation",
        "lists": [
            {
                "id": "main",
                "name": "default",
                "listType": "main",
                "actions": [
                    {
                        "id": "1",
                        "type": "spell",
                        "spellId": 34026,
                        "enabled": true,
                        "condition": {
                            "combinator": "and",
                            "rules": [
                                {
                                    "field": "resource.current",
                                    "operator": ">=",
                                    "value": "30"
                                }
                            ]
                        }
                    },
                    {
                        "id": "2",
                        "type": "wait_gcd",
                        "enabled": true
                    }
                ]
            }
        ],
        "variables": []
    }"#;

    let resolver = BmHunterResolver;
    let rotation = JsonRotation::from_json(json, resolver).expect("Failed to parse rotation");

    // Create state with enough focus
    ensure_rotation();
    let handler = BmHunter::new();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);

    // Set focus to 50 (should cast KC)
    if let Some(ref mut res) = player.resources.primary {
        res.current = 50.0;
    }
    let state = SimState::new(config, player);

    let action = rotation.next_action(&state);
    assert_eq!(action, Action::Cast("kill_command".to_string()));

    // Now test with low focus - should skip KC and wait
    let mut player2 = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player2);
    if let Some(ref mut res) = player2.resources.primary {
        res.current = 10.0;
    }
    let state2 = SimState::new(SimConfig::default().with_duration(10.0), player2);

    let action2 = rotation.next_action(&state2);
    assert_eq!(action2, Action::WaitGcd);
}

#[test]
fn json_rotation_call_action_list() {
    use crate::rotation::json_dsl::JsonRotation;
    use crate::rotation::Action;

    // Rotation with sub-list call
    let json = r#"{
        "defaultListId": "main",
        "name": "Sub-list Rotation",
        "lists": [
            {
                "id": "main",
                "name": "default",
                "listType": "main",
                "actions": [
                    {
                        "id": "1",
                        "type": "call_action_list",
                        "listId": "cooldowns",
                        "enabled": true
                    },
                    {
                        "id": "2",
                        "type": "spell",
                        "spellId": 193455,
                        "enabled": true
                    }
                ]
            },
            {
                "id": "cooldowns",
                "name": "cooldowns",
                "listType": "sub",
                "actions": [
                    {
                        "id": "cd1",
                        "type": "spell",
                        "spellId": 19574,
                        "enabled": true
                    }
                ]
            }
        ],
        "variables": []
    }"#;

    let resolver = BmHunterResolver;
    let rotation = JsonRotation::from_json(json, resolver).expect("Failed to parse rotation");

    ensure_rotation();
    let handler = BmHunter::new();
    let config = SimConfig::default().with_duration(10.0);
    let mut player = Player::new(SpecId::BeastMastery);
    handler.init_player(&mut player);
    let state = SimState::new(config, player);

    // Should call cooldowns list first and cast Bestial Wrath
    let action = rotation.next_action(&state);
    assert_eq!(action, Action::Cast("bestial_wrath".to_string()));
}

#[test]
fn spell_id_resolver() {
    assert_eq!(spell_id_to_idx(34026), Some(KILL_COMMAND));
    assert_eq!(spell_id_to_idx(193455), Some(COBRA_SHOT));
    assert_eq!(spell_id_to_idx(217200), Some(BARBED_SHOT));
    assert_eq!(spell_id_to_idx(19574), Some(BESTIAL_WRATH));
    assert_eq!(spell_id_to_idx(99999), None);
}

#[test]
fn spell_idx_to_name_resolver() {
    assert_eq!(spell_idx_to_name(KILL_COMMAND), Some("kill_command"));
    assert_eq!(spell_idx_to_name(COBRA_SHOT), Some("cobra_shot"));
    assert_eq!(spell_idx_to_name(SpellIdx(99999)), None);
}
