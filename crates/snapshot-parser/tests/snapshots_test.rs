//! Golden file tests using insta for regression detection
//!
//! Run `cargo insta review` to review/approve snapshot changes.

use std::path::PathBuf;
use std::sync::OnceLock;

use insta::{assert_json_snapshot, with_settings};
use snapshot_parser::{
    transform_aura, transform_item, transform_spell, transform_trait_tree, DbcData,
};

fn data_dir() -> PathBuf {
    let home = std::env::var("HOME").expect("HOME not set");
    PathBuf::from(home).join("Source/wowlab-data")
}

static DBC: OnceLock<DbcData> = OnceLock::new();

fn dbc() -> &'static DbcData {
    DBC.get_or_init(|| DbcData::load_all(&data_dir()).expect("Failed to load DBC data"))
}

// ============================================================================
// Spell Snapshots
// ============================================================================

#[test]
fn snapshot_spell_fireball() {
    let spell = transform_spell(dbc(), 133, None).expect("Fireball");
    assert_json_snapshot!(spell);
}

#[test]
fn snapshot_spell_frostbolt() {
    let spell = transform_spell(dbc(), 116, None).expect("Frostbolt");
    assert_json_snapshot!(spell);
}

#[test]
fn snapshot_spell_mortal_strike() {
    let spell = transform_spell(dbc(), 12294, None).expect("Mortal Strike");
    assert_json_snapshot!(spell);
}

#[test]
fn snapshot_spell_kill_shot() {
    let spell = transform_spell(dbc(), 53351, None).expect("Kill Shot");
    assert_json_snapshot!(spell);
}

#[test]
fn snapshot_spell_moonfire() {
    // DoT with periodic damage
    let spell = transform_spell(dbc(), 8921, None).expect("Moonfire");
    assert_json_snapshot!(spell);
}

// ============================================================================
// Talent Tree Snapshots
// ============================================================================

#[test]
fn snapshot_trait_tree_arcane_mage() {
    let tree = transform_trait_tree(dbc(), 62).expect("Arcane Mage");
    with_settings!({
        // Redact node count to avoid snapshot churn on minor changes
        info => &format!("nodes: {}, edges: {}", tree.nodes.len(), tree.edges.len()),
    }, {
        assert_json_snapshot!(tree);
    });
}

#[test]
fn snapshot_trait_tree_fury_warrior() {
    let tree = transform_trait_tree(dbc(), 72).expect("Fury Warrior");
    with_settings!({
        info => &format!("nodes: {}, edges: {}", tree.nodes.len(), tree.edges.len()),
    }, {
        assert_json_snapshot!(tree);
    });
}

#[test]
fn snapshot_trait_tree_havoc_dh() {
    let tree = transform_trait_tree(dbc(), 577).expect("Havoc DH");
    with_settings!({
        info => &format!("nodes: {}, edges: {}", tree.nodes.len(), tree.edges.len()),
    }, {
        assert_json_snapshot!(tree);
    });
}

// ============================================================================
// Item Snapshots
// ============================================================================

#[test]
fn snapshot_item_worn_shortsword() {
    if let Ok(item) = transform_item(dbc(), 25) {
        assert_json_snapshot!(item);
    }
}

#[test]
fn snapshot_item_hearthstone() {
    if let Ok(item) = transform_item(dbc(), 6948) {
        assert_json_snapshot!(item);
    }
}

// ============================================================================
// Aura Snapshots
// ============================================================================

#[test]
fn snapshot_aura_renew() {
    if let Ok(aura) = transform_aura(dbc(), 139) {
        assert_json_snapshot!(aura);
    }
}

#[test]
fn snapshot_aura_moonfire() {
    if let Ok(aura) = transform_aura(dbc(), 8921) {
        assert_json_snapshot!(aura);
    }
}
