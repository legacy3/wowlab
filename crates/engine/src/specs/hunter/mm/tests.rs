use super::*;
use crate::class::hunter::FOCUS_REGEN_BASE;
use crate::class::HunterClass;
use crate::handler::SpecHandler;
use crate::types::{ClassId, SpecId};

fn create_handler() -> MmHunter {
    MmHunter::with_defaults().expect("Failed to create MmHunter")
}

#[test]
fn test_mm_hunter_spec_id() {
    let handler = create_handler();
    assert_eq!(handler.spec_id(), SpecId::Marksmanship);
    assert_eq!(handler.class_id(), ClassId::Hunter);
}

#[test]
fn test_mm_hunter_is_hunter_class() {
    let handler = create_handler();
    // Verify HunterClass trait is implemented
    assert_eq!(handler.base_focus_regen(), FOCUS_REGEN_BASE);
}

#[test]
fn test_spell_definitions_exist() {
    let spells = spell_definitions();
    assert!(!spells.is_empty());

    // Check key spells exist
    let spell_ids: Vec<_> = spells.iter().map(|s| s.id).collect();
    assert!(spell_ids.contains(&AIMED_SHOT));
    assert!(spell_ids.contains(&RAPID_FIRE));
    assert!(spell_ids.contains(&STEADY_SHOT));
    assert!(spell_ids.contains(&ARCANE_SHOT));
    assert!(spell_ids.contains(&KILL_SHOT));
    assert!(spell_ids.contains(&TRUESHOT));
}

#[test]
fn test_aura_definitions_exist() {
    let auras = aura_definitions();
    assert!(!auras.is_empty());

    // Check key auras exist
    let aura_ids: Vec<_> = auras.iter().map(|a| a.id).collect();
    assert!(aura_ids.contains(&TRUESHOT_BUFF));
    assert!(aura_ids.contains(&PRECISE_SHOTS));
    assert!(aura_ids.contains(&STEADY_FOCUS));
    assert!(aura_ids.contains(&LONE_WOLF));
}

#[test]
fn test_spell_name_lookup() {
    assert_eq!(spell_name_to_idx("aimed_shot"), Some(AIMED_SHOT));
    assert_eq!(spell_name_to_idx("rapid_fire"), Some(RAPID_FIRE));
    assert_eq!(spell_name_to_idx("steady_shot"), Some(STEADY_SHOT));
    assert_eq!(spell_name_to_idx("arcane_shot"), Some(ARCANE_SHOT));
    assert_eq!(spell_name_to_idx("kill_shot"), Some(KILL_SHOT));
    assert_eq!(spell_name_to_idx("trueshot"), Some(TRUESHOT));
    assert_eq!(spell_name_to_idx("invalid"), None);
}

#[test]
fn test_aura_name_lookup() {
    let handler = create_handler();
    assert_eq!(handler.aura_name_to_idx("trueshot"), Some(TRUESHOT_BUFF));
    assert_eq!(
        handler.aura_name_to_idx("precise_shots"),
        Some(PRECISE_SHOTS)
    );
    assert_eq!(handler.aura_name_to_idx("steady_focus"), Some(STEADY_FOCUS));
    assert_eq!(handler.aura_name_to_idx("lone_wolf"), Some(LONE_WOLF));
    assert_eq!(handler.aura_name_to_idx("invalid"), None);
}

#[test]
fn test_kill_shot_shared_with_bm() {
    // Both specs should have Kill Shot with the same ID
    use crate::specs::hunter::bm;

    let mm_kill_shot = spell_definitions().into_iter().find(|s| s.id == KILL_SHOT);
    let bm_kill_shot = bm::spell_definitions()
        .into_iter()
        .find(|s| s.id == bm::KILL_SHOT);

    assert!(mm_kill_shot.is_some());
    assert!(bm_kill_shot.is_some());
    // Same spell ID
    assert_eq!(mm_kill_shot.unwrap().id, bm_kill_shot.unwrap().id);
}

#[test]
fn test_mm_lone_wolf_by_default() {
    // MM Hunter uses Lone Wolf (no pet) by default
    // Pet damage modifier should be 1.0 (no special bonus)
    // Since SimState requires parameters, we test the trait method directly
    let handler = create_handler();

    // Create a minimal SimState for testing
    use crate::actor::Player;
    use crate::sim::{SimConfig, SimState};

    let config = SimConfig::default();
    let player = Player::new(SpecId::Marksmanship);
    let state = SimState::new(config, player);

    assert_eq!(handler.pet_damage_modifier(&state), 1.0);
}

#[test]
fn test_aimed_shot_has_cast_time() {
    let spell = spell_definitions()
        .into_iter()
        .find(|s| s.id == AIMED_SHOT)
        .unwrap();
    // Aimed Shot should have a cast time
    match spell.cast_type {
        crate::spec::CastType::Cast(_) => {}
        _ => panic!("Aimed Shot should have a cast time"),
    }
}

#[test]
fn test_rapid_fire_is_channel() {
    let spell = spell_definitions()
        .into_iter()
        .find(|s| s.id == RAPID_FIRE)
        .unwrap();
    // Rapid Fire should be a channel
    match spell.cast_type {
        crate::spec::CastType::Channel { .. } => {}
        _ => panic!("Rapid Fire should be a channel"),
    }
}

#[test]
fn test_trueshot_is_off_gcd() {
    let spell = spell_definitions()
        .into_iter()
        .find(|s| s.id == TRUESHOT)
        .unwrap();
    // Trueshot should be off GCD
    assert_eq!(spell.gcd, crate::spec::GcdType::None);
}

#[test]
fn test_aimed_shot_applies_precise_shots() {
    let spell = spell_definitions()
        .into_iter()
        .find(|s| s.id == AIMED_SHOT)
        .unwrap();
    assert!(spell.apply_auras.contains(&PRECISE_SHOTS));
}

#[test]
fn test_steady_shot_generates_focus() {
    let spell = spell_definitions()
        .into_iter()
        .find(|s| s.id == STEADY_SHOT)
        .unwrap();
    assert!(!spell.gains.is_empty());
    assert_eq!(spell.gains[0].amount, STEADY_SHOT_FOCUS_GAIN);
}

#[test]
fn test_parallel_bm_mm_no_conflicts() {
    // Verify both specs can be created and used without global state conflicts
    use crate::specs::hunter::bm::BmHunter;

    let bm_handler = BmHunter::with_defaults().expect("Failed to create BmHunter");
    let mm_handler = create_handler();

    // Both should return their respective spec IDs
    assert_eq!(bm_handler.spec_id(), SpecId::BeastMastery);
    assert_eq!(mm_handler.spec_id(), SpecId::Marksmanship);

    // Both should be Hunter class
    assert_eq!(bm_handler.class_id(), ClassId::Hunter);
    assert_eq!(mm_handler.class_id(), ClassId::Hunter);

    // Each should have their own spell definitions (no sharing of handlers)
    assert!(bm_handler.spell_name_to_idx("kill_command").is_some());
    assert!(bm_handler.spell_name_to_idx("aimed_shot").is_none()); // BM doesn't have Aimed Shot

    assert!(mm_handler.spell_name_to_idx("aimed_shot").is_some());
    assert!(mm_handler.spell_name_to_idx("kill_command").is_none()); // MM doesn't have Kill Command
}

#[test]
fn test_shared_hunter_class_methods() {
    use crate::actor::Player;
    use crate::sim::{SimConfig, SimState};
    use crate::specs::hunter::bm::BmHunter;

    let bm_handler = BmHunter::with_defaults().expect("Failed to create BmHunter");
    let mm_handler = create_handler();

    // Both should use the same base focus regen from HunterClass
    assert_eq!(bm_handler.base_focus_regen(), FOCUS_REGEN_BASE);
    assert_eq!(mm_handler.base_focus_regen(), FOCUS_REGEN_BASE);

    // Create SimState for testing focus_regen with haste
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);

    // Both should calculate focus regen the same way (base * haste)
    let bm_regen = bm_handler.focus_regen(&state);
    let mm_regen = mm_handler.focus_regen(&state);
    assert!((bm_regen - mm_regen).abs() < 0.001);
}
