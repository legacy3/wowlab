//! Snapshot tests for SimC profile parsing
//!
//! Uses insta for golden file testing. Run `cargo insta review` to update snapshots.

use parsers::simc::parse;

fn load_fixture(name: &str) -> String {
    let path = format!("tests/fixtures/{}.txt", name);
    std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("Failed to load fixture {}: {}", path, e))
}

// =============================================================================
// Full Profile Snapshots
// =============================================================================

#[test]
fn test_shaman_full_profile() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).expect("Failed to parse shaman profile");
    insta::assert_json_snapshot!("shaman_full", profile);
}

#[test]
fn test_mage_minimal_profile() {
    let input = load_fixture("simc_mage_minimal");
    let profile = parse(&input).expect("Failed to parse mage profile");
    insta::assert_json_snapshot!("mage_minimal", profile);
}

// =============================================================================
// Character Parsing
// =============================================================================

#[test]
fn test_character_fields() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    assert_eq!(profile.character.name, "Wellenwilli");
    assert_eq!(profile.character.level, 80);
    assert_eq!(profile.character.race, "Tauren");
    assert_eq!(profile.character.spec, Some("Restoration".to_string()));
    assert_eq!(profile.character.region, Some("EU".to_string()));
    assert_eq!(profile.character.server, Some("blackmoore".to_string()));
    assert_eq!(profile.character.role, Some("attack".to_string()));
}

#[test]
fn test_professions_parsing() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    assert_eq!(profile.character.professions.len(), 2);

    let alchemy = profile
        .character
        .professions
        .iter()
        .find(|p| p.name == "Alchemy")
        .unwrap();
    assert_eq!(alchemy.rank, 9);

    let jc = profile
        .character
        .professions
        .iter()
        .find(|p| p.name == "Jewelcrafting")
        .unwrap();
    assert_eq!(jc.rank, 1);
}

// =============================================================================
// Equipment Parsing
// =============================================================================

#[test]
fn test_equipment_count() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    // Should have 16 equipped items (head through off_hand, excluding tabard which isn't a Slot)
    assert_eq!(profile.equipment.len(), 16);
}

#[test]
fn test_equipment_head_slot() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    let head = profile
        .equipment
        .iter()
        .find(|e| e.slot == parsers::Slot::Head)
        .unwrap();
    assert_eq!(head.id, 212011);
    assert_eq!(
        head.bonus_ids,
        Some(vec![6652, 10877, 10260, 10356, 8095, 10371, 1524])
    );
    assert!(head.enchant_id.is_none());
    assert!(head.gem_ids.is_none());
}

#[test]
fn test_equipment_with_gems() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    let neck = profile
        .equipment
        .iter()
        .find(|e| e.slot == parsers::Slot::Neck)
        .unwrap();
    assert_eq!(neck.id, 212448);
    assert_eq!(neck.gem_ids, Some(vec![213743, 213461]));
}

#[test]
fn test_equipment_with_enchant() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    let chest = profile
        .equipment
        .iter()
        .find(|e| e.slot == parsers::Slot::Chest)
        .unwrap();
    assert_eq!(chest.id, 212014);
    assert_eq!(chest.enchant_id, Some(7364));
}

#[test]
fn test_equipment_with_crafted_stats() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    let wrist = profile
        .equipment
        .iter()
        .find(|e| e.slot == parsers::Slot::Wrist)
        .unwrap();
    assert_eq!(wrist.id, 219342);
    assert_eq!(wrist.crafted_stats, Some(vec![36, 49]));
    assert_eq!(wrist.crafting_quality, Some(5));
}

#[test]
fn test_ring_with_multiple_gems() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    let finger1 = profile
        .equipment
        .iter()
        .find(|e| e.slot == parsers::Slot::Finger1)
        .unwrap();
    assert_eq!(finger1.id, 228411);
    assert_eq!(finger1.gem_ids, Some(vec![228638, 228644, 228643]));
    assert_eq!(finger1.enchant_id, Some(7334));
}

// =============================================================================
// Talent Parsing
// =============================================================================

#[test]
fn test_talents_encoded_string() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    assert_eq!(
        profile.talents.encoded,
        "CgQAL+iDLHPJSLC+6fqMJ8tubCAAAAAAAAAAYMzMmZZMY2WmtZWmhFbmZBGwEMLMhMWMzDY2YmtZmZmMbLMz0YGmZDLzYGMGmlxAAAD"
    );
}

#[test]
fn test_saved_loadouts() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    assert_eq!(profile.talents.loadouts.len(), 1);
    assert_eq!(profile.talents.loadouts[0].name, "TalentLoadoutManager");
    assert_eq!(
        profile.talents.loadouts[0].encoded,
        "CgQAL+iDLHPJSLC+6fqMJ8tubCAAAAAAAAAAYMzMmZZMY2WmtZWmhFbmZBGwAmFGgxiZeAzGzsNzMzwstwMjxMMzGWmxMYMMLjBAAG"
    );
}

// =============================================================================
// Edge Cases
// =============================================================================

#[test]
fn test_minimal_profile() {
    let input = load_fixture("simc_mage_minimal");
    let profile = parse(&input).unwrap();

    assert_eq!(profile.character.name, "Frostbolt");
    assert_eq!(profile.character.level, 80);
    assert!(profile.equipment.is_empty());
    assert!(profile.talents.encoded.is_empty());
    assert!(profile.talents.loadouts.is_empty());
}

#[test]
fn test_comments_ignored() {
    let input = load_fixture("simc_shaman_full");
    let profile = parse(&input).unwrap();

    // Comments about gear in bags should be ignored
    // Only equipped items should be parsed
    assert_eq!(profile.equipment.len(), 16);
}
