use super::*;
use crate::types::*;
use crate::sim::{SimState, SimConfig};
use crate::actor::Player;

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
fn handler_creation() {
    let handler = BeastMasteryHandler::new();

    assert!(handler.spell(KILL_COMMAND).is_some());
    assert!(handler.spell(COBRA_SHOT).is_some());
    assert!(handler.spell(BARBED_SHOT).is_some());
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
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    BeastMasteryHandler::init_sim(&mut state);

    assert_eq!(state.player.spec, SpecId::BeastMastery);
}

#[test]
fn kill_shot_usable() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    // Target at full health - can't kill shot
    assert!(!BeastMasteryHandler::can_kill_shot(&state));

    // Drop target below 20%
    if let Some(enemy) = state.enemies.primary_mut() {
        enemy.current_health = enemy.max_health * 0.15;
    }

    assert!(BeastMasteryHandler::can_kill_shot(&state));
}

#[test]
fn kill_command_damage() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.combat.attack_power = 10000.0;

    let state = SimState::new(config, player);
    let damage = BeastMasteryHandler::calc_kill_command(&state);

    // 10000 AP * 2.0 coef = 20000 base damage
    assert!((damage - 20000.0).abs() < 100.0);
}

#[test]
fn cobra_shot_damage() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.combat.attack_power = 10000.0;

    let state = SimState::new(config, player);
    let damage = BeastMasteryHandler::calc_cobra_shot(&state);

    // 10000 AP * 0.4 coef = 4000 base damage
    assert!((damage - 4000.0).abs() < 100.0);
}

#[test]
fn frenzy_stacks() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);
    BeastMasteryHandler::init_sim(&mut state);

    // Apply Barbed Shot 3 times
    for _ in 0..3 {
        BeastMasteryHandler::apply_barbed_shot(&mut state, TargetIdx(0));
    }

    let stacks = state.player.buffs.stacks(FRENZY, state.now());
    assert_eq!(stacks, FRENZY_MAX_STACKS);
}

#[test]
fn bestial_wrath_damage_bonus() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.combat.attack_power = 10000.0;

    let mut state = SimState::new(config, player);
    BeastMasteryHandler::init_sim(&mut state);

    let damage_before = BeastMasteryHandler::calc_kill_command(&state);

    BeastMasteryHandler::apply_bestial_wrath(&mut state);

    let damage_after = BeastMasteryHandler::calc_kill_command(&state);

    // Should be 25% more damage
    assert!((damage_after / damage_before - 1.25).abs() < 0.01);
}

#[test]
fn pet_damage_constants() {
    assert!((PetDamage::KILL_COMMAND_COEF - 2.0).abs() < 0.01);
    assert!((PetDamage::STAT_INHERITANCE - 0.6).abs() < 0.01);
}

#[test]
fn spec_coefficients() {
    let coefs = BeastMasteryHandler::coefficients();

    // BM Hunter mastery coefficients
    assert!((coefs.mastery_base - 16.0).abs() < 0.01);
    assert!((coefs.mastery_coeff - 2.0).abs() < 0.01);
}
