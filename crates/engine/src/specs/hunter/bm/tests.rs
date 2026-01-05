use super::*;
use crate::types::*;
use crate::sim::{SimState, SimConfig};
use crate::actor::Player;
use std::sync::Once;

static INIT_ROTATION: Once = Once::new();

fn ensure_rotation() {
    INIT_ROTATION.call_once(|| {
        let _ = BeastMasteryHandler::init_rotation("wait_gcd()");
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
    let mut player = Player::new(SpecId::BeastMastery);
    BeastMasteryHandler::init_player(&mut player);

    assert_eq!(player.spec, SpecId::BeastMastery);
    assert!(player.resources.primary.is_some());
    assert!(player.cooldown(KILL_COMMAND).is_some());
    assert!(player.charged_cooldown(BARBED_SHOT).is_some());
}

#[test]
fn sim_init() {
    ensure_rotation();
    let config = SimConfig::default().with_duration(10.0);
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    BeastMasteryHandler::init_sim(&mut state);

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
