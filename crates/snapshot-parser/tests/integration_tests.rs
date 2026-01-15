//! Integration tests for snapshot-parser
//!
//! These tests load real CSV data from ~/Source/wowlab-data

use std::path::PathBuf;
use std::sync::OnceLock;

use snapshot_parser::{
    apply_decoded_talents, decode_talent_loadout, encode_talent_loadout, transform_all_auras,
    transform_all_items, transform_all_spells, transform_aura, transform_item, transform_spell,
    transform_trait_tree, DbcData, DecodedTalentLoadout, DecodedTraitNode,
};

fn data_dir() -> PathBuf {
    let home = std::env::var("HOME").expect("HOME not set");
    PathBuf::from(home).join("Source/wowlab-data")
}

static DBC: OnceLock<DbcData> = OnceLock::new();

fn dbc() -> &'static DbcData {
    DBC.get_or_init(|| DbcData::load_all(&data_dir()).expect("Failed to load DBC data"))
}

#[test]
fn test_load_dbc_data() {
    let dbc = dbc();

    assert!(!dbc.spell_name.is_empty());
    assert!(!dbc.spell.is_empty());
    assert!(!dbc.spell_misc.is_empty());
    assert!(!dbc.chr_specialization.is_empty());
    assert!(!dbc.trait_node.is_empty());

    println!("Loaded {} spell names", dbc.spell_name.len());
    println!("Loaded {} spells", dbc.spell.len());
    println!("Loaded {} specs", dbc.chr_specialization.len());
    println!("Loaded {} trait nodes", dbc.trait_node.len());
}

// ============================================================================
// Spell Transform Tests
// ============================================================================

#[test]
fn test_transform_fireball() {
    let spell = transform_spell(dbc(), 133, None).expect("Failed to transform Fireball");

    assert_eq!(spell.id, 133);
    assert_eq!(spell.name, "Fireball");
    assert!(spell.cast_time > 0);
    assert!(spell.school_mask > 0);
}

#[test]
fn test_transform_frostbolt() {
    let spell = transform_spell(dbc(), 116, None).expect("Failed to transform Frostbolt");

    assert_eq!(spell.id, 116);
    assert_eq!(spell.name, "Frostbolt");
}

#[test]
fn test_transform_mortal_strike() {
    let spell = transform_spell(dbc(), 12294, None).expect("Failed to transform Mortal Strike");

    assert_eq!(spell.id, 12294);
    assert!(!spell.name.is_empty());
}

// ============================================================================
// Talent Tree Transform Tests
// ============================================================================

#[test]
fn test_transform_arcane_mage_talents() {
    let tree = transform_trait_tree(dbc(), 62).expect("Failed to transform Arcane Mage");

    assert_eq!(tree.spec_id, 62);
    assert_eq!(tree.spec_name, "Arcane");
    assert_eq!(tree.class_name, "Mage");
    assert!(!tree.nodes.is_empty());
    assert!(!tree.edges.is_empty());
}

#[test]
fn test_transform_fury_warrior_talents() {
    let tree = transform_trait_tree(dbc(), 72).expect("Failed to transform Fury Warrior");

    assert_eq!(tree.spec_id, 72);
    assert_eq!(tree.spec_name, "Fury");
    assert_eq!(tree.class_name, "Warrior");
}

// ============================================================================
// Talent Codec Tests
// ============================================================================

fn make_node(selected: bool, purchased: bool) -> DecodedTraitNode {
    DecodedTraitNode {
        selected,
        purchased,
        partially_ranked: false,
        ranks_purchased: None,
        choice_node: false,
        choice_index: None,
    }
}

fn make_partial_node(ranks: u8) -> DecodedTraitNode {
    DecodedTraitNode {
        selected: true,
        purchased: true,
        partially_ranked: true,
        ranks_purchased: Some(ranks),
        choice_node: false,
        choice_index: None,
    }
}

fn make_choice_node(choice: u8) -> DecodedTraitNode {
    DecodedTraitNode {
        selected: true,
        purchased: true,
        partially_ranked: false,
        ranks_purchased: None,
        choice_node: true,
        choice_index: Some(choice),
    }
}

#[test]
fn test_talent_codec_roundtrip() {
    let loadout = DecodedTalentLoadout {
        version: 1,
        spec_id: 62,
        tree_hash: [0u8; 16],
        nodes: vec![
            make_node(true, true),
            make_partial_node(2),
            make_choice_node(1),
            make_node(false, false),
        ],
    };

    let encoded = encode_talent_loadout(&loadout);
    let decoded = decode_talent_loadout(&encoded).expect("Failed to decode");

    assert_eq!(decoded.version, loadout.version);
    assert_eq!(decoded.spec_id, loadout.spec_id);
    assert!(decoded.nodes.len() >= loadout.nodes.len());

    for (i, (original, decoded)) in loadout.nodes.iter().zip(decoded.nodes.iter()).enumerate() {
        assert_eq!(original.selected, decoded.selected, "Node {} selected mismatch", i);
        assert_eq!(original.purchased, decoded.purchased, "Node {} purchased mismatch", i);
        assert_eq!(original.choice_node, decoded.choice_node, "Node {} choice_node mismatch", i);
    }
}

#[test]
fn test_decode_real_talent_string() {
    let talent_string = "BYGAAAAAAAAAAAAAAAAAAAAAAIIkIhQQSSAAAAAA";

    if let Ok(loadout) = decode_talent_loadout(talent_string) {
        let selected = loadout.nodes.iter().filter(|n| n.selected).count();
        let purchased = loadout.nodes.iter().filter(|n| n.purchased).count();
        println!("Decoded: version={} spec={} selected={} purchased={}",
            loadout.version, loadout.spec_id, selected, purchased);
    }
}

// ============================================================================
// Verbose Debug Tests (run with --nocapture)
// ============================================================================

#[test]
fn test_show_spell_details() {
    let spells = [133, 116, 12294, 853, 589];

    for spell_id in spells {
        let spell = transform_spell(dbc(), spell_id, None).expect("Failed to transform");
        println!("{} ({}): cast={}ms cd={}ms school={}",
            spell.name, spell.id, spell.cast_time, spell.recovery_time, spell.school_mask);
    }
}

#[test]
fn test_show_trait_tree_details() {
    let tree = transform_trait_tree(dbc(), 71).expect("Failed to transform Arms Warrior");

    println!("{} {} (spec {}): {} nodes, {} edges, {} subtrees",
        tree.class_name, tree.spec_name, tree.spec_id,
        tree.nodes.len(), tree.edges.len(), tree.sub_trees.len());
    println!("Points: class={} spec={} hero={}",
        tree.point_limits.class, tree.point_limits.spec, tree.point_limits.hero);

    for sub in &tree.sub_trees {
        println!("  Hero tree: {} ({})", sub.name, sub.id);
    }
}

#[test]
fn test_show_mage_tree_details() {
    let tree = transform_trait_tree(dbc(), 62).expect("Failed to transform Arcane Mage");

    println!("{} {} (spec {}): {} nodes, {} subtrees",
        tree.class_name, tree.spec_name, tree.spec_id,
        tree.nodes.len(), tree.sub_trees.len());

    for sub in &tree.sub_trees {
        println!("  Hero tree: {}", sub.name);
    }
}

// ============================================================================
// Item Transform Tests
// ============================================================================

#[test]
fn test_transform_item_basic() {
    // Test a basic item (Worn Shortsword is ID 25)
    if let Ok(item) = transform_item(dbc(), 25) {
        assert_eq!(item.id, 25);
        assert!(!item.name.is_empty());
        println!("Item {}: {} (ilvl {})", item.id, item.name, item.item_level);
    }
}

#[test]
fn test_transform_all_items_sample() {
    let items = transform_all_items(dbc());
    assert!(!items.is_empty());
    println!("Transformed {} items", items.len());
}

// ============================================================================
// Aura Transform Tests
// ============================================================================

#[test]
fn test_transform_aura_basic() {
    // Fireball is 133, has no aura; Renew (139) is a healing aura
    if let Ok(aura) = transform_aura(dbc(), 139) {
        assert_eq!(aura.spell_id, 139);
        println!(
            "Aura {}: duration={}ms, tick={}ms",
            aura.spell_id, aura.base_duration_ms, aura.tick_period_ms
        );
    }
}

#[test]
fn test_transform_all_auras_sample() {
    let auras = transform_all_auras(dbc());
    assert!(!auras.is_empty());
    println!("Transformed {} auras", auras.len());
}

// ============================================================================
// Batch Transform Tests
// ============================================================================

#[test]
fn test_transform_all_spells_sample() {
    let spells = transform_all_spells(dbc());
    assert!(!spells.is_empty());
    println!("Transformed {} spells", spells.len());
}

// ============================================================================
// Apply Decoded Talents Tests
// ============================================================================

#[test]
fn test_apply_decoded_talents() {
    let tree = transform_trait_tree(dbc(), 62).expect("Failed to transform Arcane Mage");
    let loadout = DecodedTalentLoadout {
        version: 1,
        spec_id: 62,
        tree_hash: [0u8; 16],
        nodes: vec![
            make_node(true, true),
            make_node(true, true),
            make_node(false, false),
        ],
    };

    let with_selections = apply_decoded_talents(tree, &loadout);
    assert!(!with_selections.selections.is_empty());
    println!("Applied {} selections", with_selections.selections.len());
}

// ============================================================================
// Debug Tests
// ============================================================================

/// Debug test for investigating talent tree hero talent issues.
/// Run with: cargo test -p snapshot-parser test_debug_trait_tree -- --nocapture --ignored
#[test]
#[ignore]
fn test_debug_trait_tree() {
    let specs = [
        (71, "Arms Warrior"),
        (72, "Fury Warrior"),
        (62, "Arcane Mage"),
        (63, "Fire Mage"),
        (577, "Havoc DH"),
    ];

    println!("\nTalent Tree Comparison:");
    println!("{:-<80}", "");

    for (spec_id, name) in specs {
        match transform_trait_tree(dbc(), spec_id) {
            Ok(tree) => {
                let hero_nodes = tree.nodes.iter().filter(|n| n.tree_index == 3).count();
                println!("{:20} nodes={:3} hero={:2} subtrees={}",
                    name, tree.nodes.len(), hero_nodes, tree.sub_trees.len());
            }
            Err(e) => println!("{}: ERROR - {:?}", name, e),
        }
    }
}
