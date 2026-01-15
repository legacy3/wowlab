use pretty_assertions::assert_eq;

use super::*;
use crate::types::WowClass;

#[test]
fn test_simple_profile() {
    let input = r#"
warrior="TestChar"
level=80
race=human
spec=arms
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.character.name, "TestChar");
    assert_eq!(profile.character.level, 80);
    assert_eq!(profile.character.race, "Human");
    assert_eq!(profile.character.spec, Some("Arms".to_string()));
    assert_eq!(profile.character.class, WowClass::Warrior);
}

#[test]
fn test_equipment() {
    let input = r#"
warrior="Test"
level=80
race=human
head=,id=123456,bonus_id=1/2/3,enchant_id=999
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.equipment.len(), 1);
    assert_eq!(profile.equipment[0].slot, Slot::Head);
    assert_eq!(profile.equipment[0].id, 123456);
    assert_eq!(profile.equipment[0].bonus_ids, Some(vec![1, 2, 3]));
    assert_eq!(profile.equipment[0].enchant_id, Some(999));
}

#[test]
fn test_all_classes() {
    for (name, expected) in [
        ("death_knight", WowClass::DeathKnight),
        ("demon_hunter", WowClass::DemonHunter),
        ("druid", WowClass::Druid),
        ("evoker", WowClass::Evoker),
        ("hunter", WowClass::Hunter),
        ("mage", WowClass::Mage),
        ("monk", WowClass::Monk),
        ("paladin", WowClass::Paladin),
        ("priest", WowClass::Priest),
        ("rogue", WowClass::Rogue),
        ("shaman", WowClass::Shaman),
        ("warlock", WowClass::Warlock),
        ("warrior", WowClass::Warrior),
    ] {
        let input = format!("{}=\"Test\"\nlevel=80\nrace=human", name);
        let profile = parse(&input).unwrap();
        assert_eq!(profile.character.class, expected, "Failed for {}", name);
    }
}

#[test]
fn test_all_slots() {
    for (name, expected) in [
        ("head", Slot::Head),
        ("neck", Slot::Neck),
        ("shoulder", Slot::Shoulder),
        ("back", Slot::Back),
        ("chest", Slot::Chest),
        ("wrist", Slot::Wrist),
        ("hands", Slot::Hands),
        ("waist", Slot::Waist),
        ("legs", Slot::Legs),
        ("feet", Slot::Feet),
        ("finger1", Slot::Finger1),
        ("finger2", Slot::Finger2),
        ("trinket1", Slot::Trinket1),
        ("trinket2", Slot::Trinket2),
        ("main_hand", Slot::MainHand),
        ("off_hand", Slot::OffHand),
    ] {
        let input = format!("warrior=\"Test\"\nlevel=80\nrace=human\n{}=,id=123", name);
        let profile = parse(&input).unwrap();
        assert_eq!(profile.equipment.len(), 1, "Failed for {}", name);
        assert_eq!(profile.equipment[0].slot, expected, "Failed for {}", name);
    }
}

#[test]
fn test_professions() {
    let input = r#"
warrior="Test"
level=80
race=human
professions=blacksmithing=375/mining=450
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.character.professions.len(), 2);
    assert_eq!(profile.character.professions[0].name, "Blacksmithing");
    assert_eq!(profile.character.professions[0].rank, 375);
    assert_eq!(profile.character.professions[1].name, "Mining");
    assert_eq!(profile.character.professions[1].rank, 450);
}

#[test]
fn test_talents() {
    let input = r#"
warrior="Test"
level=80
race=human
talents=CwEAABCDxyz
"#;
    let profile = parse(input).unwrap();
    assert_eq!(profile.talents.encoded, "CwEAABCDxyz");
}

#[test]
fn test_missing_class() {
    let result = parse("level=80");
    assert!(matches!(result, Err(ParseError::MissingClass)));
}

#[test]
fn test_full_profile() {
    let input = r#"
# SimC profile
warrior="TestChar"
level=80
race=human
spec=arms
region=us
server=Illidan
role=attack

head=,id=123456,bonus_id=1/2/3,enchant_id=999
neck=,id=234567
main_hand=,id=345678,enchant_id=888

talents=CwEAABCDxyz
professions=blacksmithing=375/mining=450
"#;

    let profile = parse(input).unwrap();

    assert_eq!(profile.character.name, "TestChar");
    assert_eq!(profile.character.level, 80);
    assert_eq!(profile.character.race, "Human");
    assert_eq!(profile.character.spec, Some("Arms".to_string()));
    assert_eq!(profile.character.region, Some("US".to_string()));
    assert_eq!(profile.character.server, Some("Illidan".to_string()));
    assert_eq!(profile.character.role, Some("attack".to_string()));
    assert_eq!(profile.character.class, WowClass::Warrior);
    assert_eq!(profile.character.professions.len(), 2);

    assert_eq!(profile.equipment.len(), 3);
    assert_eq!(profile.talents.encoded, "CwEAABCDxyz");
}

/// Real-world test based on portal UI demo fixtures (Wellenwilli shaman)
#[test]
fn test_wellenwilli_shaman() {
    let input = r#"
# Wellenwilli - Restoration Shaman
# Blackmoore - EU
# Exported from SimulationCraft addon

shaman="Wellenwilli"
level=80
race=tauren
region=eu
server=blackmoore
spec=restoration
role=heal

# Saved Loadout: Raid Build
# talents=CgQAL_iDLHPJSLCAAAAAAAAAAAAAAAAAAgWGzYYMGmZmZ0MzMzMzYBwMLzCzsNGYGAAAAAA

talents=CgQAL_iDLHPJSLCAAAAAAAAAAAAAAAAAAgWGzYYMGmZmZ0MzMzMzYBwMLzCzsNGYGAAAAAA

professions=alchemy=525/herbalism=525

head=,id=212009,bonus_id=6652/10877/10383/1594/10255
neck=,id=215134,bonus_id=10421/10879/10394/1617/10255,gem_id=213485
shoulder=,id=212003,bonus_id=6652/10877/10383/1594/10255,enchant_id=7443
back=,id=222817,bonus_id=10421/10879/10394/1617/10255,enchant_id=7403
chest=,id=212011,bonus_id=6652/10877/10383/1594/10255,enchant_id=7364
wrist=,id=212007,bonus_id=6652/10877/10383/1594/10255,enchant_id=7385,gem_id=213485
hands=,id=212006,bonus_id=6652/10877/10383/1594/10255
waist=,id=212002,bonus_id=6652/10877/10383/1594/10255,gem_id=213485
legs=,id=212004,bonus_id=6652/10877/10383/1594/10255,enchant_id=7534
feet=,id=212000,bonus_id=6652/10877/10383/1594/10255,enchant_id=7418
finger1=,id=215135,bonus_id=10421/10879/10394/1617/10255,enchant_id=7340,gem_id=213485
finger2=,id=215136,bonus_id=10421/10879/10394/1617/10255,enchant_id=7340,gem_id=213485
trinket1=,id=219314,bonus_id=6652/10877/10383/1594/10255
trinket2=,id=219315,bonus_id=6652/10877/10383/1594/10255
main_hand=,id=222446,bonus_id=10421/10879/10394/1617/10255,enchant_id=7460
"#;

    let profile = parse(input).unwrap();

    // Character
    assert_eq!(profile.character.name, "Wellenwilli");
    assert_eq!(profile.character.level, 80);
    assert_eq!(profile.character.race, "Tauren");
    assert_eq!(profile.character.class, WowClass::Shaman);
    assert_eq!(profile.character.spec, Some("Restoration".to_string()));
    assert_eq!(profile.character.region, Some("EU".to_string()));
    assert_eq!(profile.character.server, Some("blackmoore".to_string()));
    assert_eq!(profile.character.role, Some("heal".to_string()));

    // Professions
    assert_eq!(profile.character.professions.len(), 2);
    assert_eq!(profile.character.professions[0].name, "Alchemy");
    assert_eq!(profile.character.professions[0].rank, 525);
    assert_eq!(profile.character.professions[1].name, "Herbalism");
    assert_eq!(profile.character.professions[1].rank, 525);

    // Talents
    assert!(profile.talents.encoded.starts_with("CgQAL"));

    // Equipment - 15 slots (no off_hand for 2H staff)
    assert_eq!(profile.equipment.len(), 15);

    // Spot check some items
    let head = profile
        .equipment
        .iter()
        .find(|i| i.slot == Slot::Head)
        .unwrap();
    assert_eq!(head.id, 212009);
    assert_eq!(head.bonus_ids, Some(vec![6652, 10877, 10383, 1594, 10255]));

    let neck = profile
        .equipment
        .iter()
        .find(|i| i.slot == Slot::Neck)
        .unwrap();
    assert_eq!(neck.id, 215134);
    assert_eq!(neck.gem_ids, Some(vec![213485]));

    let back = profile
        .equipment
        .iter()
        .find(|i| i.slot == Slot::Back)
        .unwrap();
    assert_eq!(back.id, 222817);
    assert_eq!(back.enchant_id, Some(7403));

    let main_hand = profile
        .equipment
        .iter()
        .find(|i| i.slot == Slot::MainHand)
        .unwrap();
    assert_eq!(main_hand.id, 222446);
    assert_eq!(main_hand.enchant_id, Some(7460));
}
