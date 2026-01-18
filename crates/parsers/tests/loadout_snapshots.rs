//! Snapshot tests for talent loadout encoding/decoding
//!
//! Uses insta for golden file testing. Run `cargo insta review` to update snapshots.

use parsers::loadout::{
    decode_trait_loadout, encode_trait_loadout, DecodedTraitLoadout, DecodedTraitNode,
};
use serde::Serialize;

// Real talent strings from the game
const SHAMAN_RESTO_TALENTS: &str = "CgQAL+iDLHPJSLC+6fqMJ8tubCAAAAAAAAAAYMzMmZZMY2WmtZWmhFbmZBGwEMLMhMWMzDY2YmtZmZmMbLMz0YGmZDLzYGMGmlxAAAD";
const MAGE_ARCANE_TALENTS: &str =
    "CgGAAAAAAAAAAAAAAAAAAAAAAoABAAAAAAJJJJJJRSkopJRSACAAAAAAAEAAAAAA";
const WARRIOR_ARMS_TALENTS: &str = "CYQAAAAAAAAAAAAAAAAAAAAAgCAAAEBAAAA";
const HUNTER_BM_TALENTS: &str = "C0PAAAAAAAAAAAAAAAAAAAAAAYMbDMgBMbsFyYBAAAAAAzY2GmlZGMjZMzyYmZGMjZyMmxMjZGmZYgxMzAzY2WmhZDAAAAAAmB";

// Wrapper for snapshot serialization (DecodedTraitLoadout doesn't derive Serialize)
#[derive(Serialize)]
struct LoadoutSnapshot {
    version: u8,
    spec_id: u16,
    tree_hash_hex: String,
    node_count: usize,
    selected_count: usize,
    purchased_count: usize,
    choice_nodes_count: usize,
}

impl From<&DecodedTraitLoadout> for LoadoutSnapshot {
    fn from(loadout: &DecodedTraitLoadout) -> Self {
        Self {
            version: loadout.version,
            spec_id: loadout.spec_id,
            tree_hash_hex: hex::encode(loadout.tree_hash),
            node_count: loadout.nodes.len(),
            selected_count: loadout.nodes.iter().filter(|n| n.selected).count(),
            purchased_count: loadout.nodes.iter().filter(|n| n.purchased).count(),
            choice_nodes_count: loadout.nodes.iter().filter(|n| n.choice_node).count(),
        }
    }
}

// =============================================================================
// Decode Snapshots
// =============================================================================

#[test]
fn test_decode_shaman_resto() {
    let decoded =
        decode_trait_loadout(SHAMAN_RESTO_TALENTS).expect("Failed to decode shaman talents");
    let snapshot = LoadoutSnapshot::from(&decoded);
    insta::assert_json_snapshot!("loadout_shaman_resto", snapshot);
}

#[test]
fn test_decode_mage_arcane() {
    let decoded = decode_trait_loadout(MAGE_ARCANE_TALENTS).expect("Failed to decode mage talents");
    let snapshot = LoadoutSnapshot::from(&decoded);
    insta::assert_json_snapshot!("loadout_mage_arcane", snapshot);
}

#[test]
fn test_decode_warrior_arms() {
    let decoded =
        decode_trait_loadout(WARRIOR_ARMS_TALENTS).expect("Failed to decode warrior talents");
    let snapshot = LoadoutSnapshot::from(&decoded);
    insta::assert_json_snapshot!("loadout_warrior_arms", snapshot);
}

#[test]
fn test_decode_hunter_bm() {
    let decoded = decode_trait_loadout(HUNTER_BM_TALENTS).expect("Failed to decode hunter talents");
    let snapshot = LoadoutSnapshot::from(&decoded);
    insta::assert_json_snapshot!("loadout_hunter_bm", snapshot);
}

// =============================================================================
// Roundtrip Tests
// =============================================================================

#[test]
fn test_roundtrip_shaman() {
    let decoded = decode_trait_loadout(SHAMAN_RESTO_TALENTS).unwrap();
    let encoded = encode_trait_loadout(&decoded);
    let redecoded = decode_trait_loadout(&encoded).unwrap();

    assert_eq!(decoded.version, redecoded.version);
    assert_eq!(decoded.spec_id, redecoded.spec_id);
    assert_eq!(decoded.tree_hash, redecoded.tree_hash);
    assert!(redecoded.nodes.len() >= decoded.nodes.len());
}

#[test]
fn test_roundtrip_mage() {
    let decoded = decode_trait_loadout(MAGE_ARCANE_TALENTS).unwrap();
    let encoded = encode_trait_loadout(&decoded);
    let redecoded = decode_trait_loadout(&encoded).unwrap();

    assert_eq!(decoded.version, redecoded.version);
    assert_eq!(decoded.spec_id, redecoded.spec_id);
}

#[test]
fn test_roundtrip_hunter() {
    let decoded = decode_trait_loadout(HUNTER_BM_TALENTS).unwrap();
    let encoded = encode_trait_loadout(&decoded);
    let redecoded = decode_trait_loadout(&encoded).unwrap();

    assert_eq!(decoded.version, redecoded.version);
    assert_eq!(decoded.spec_id, redecoded.spec_id);
    assert_eq!(decoded.tree_hash, redecoded.tree_hash);
}

#[test]
fn test_roundtrip_custom() {
    let original = DecodedTraitLoadout {
        version: 1,
        spec_id: 62, // Arcane Mage
        tree_hash: [0xDE, 0xAD, 0xBE, 0xEF, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        nodes: vec![
            DecodedTraitNode {
                selected: true,
                purchased: true,
                partially_ranked: false,
                ranks_purchased: None,
                choice_node: false,
                choice_index: None,
            },
            DecodedTraitNode {
                selected: true,
                purchased: true,
                partially_ranked: true,
                ranks_purchased: Some(2),
                choice_node: false,
                choice_index: None,
            },
            DecodedTraitNode {
                selected: true,
                purchased: true,
                partially_ranked: false,
                ranks_purchased: None,
                choice_node: true,
                choice_index: Some(1),
            },
            DecodedTraitNode {
                selected: false,
                purchased: false,
                partially_ranked: false,
                ranks_purchased: None,
                choice_node: false,
                choice_index: None,
            },
        ],
    };

    let encoded = encode_trait_loadout(&original);
    let decoded = decode_trait_loadout(&encoded).unwrap();

    assert_eq!(decoded.version, original.version);
    assert_eq!(decoded.spec_id, original.spec_id);
    assert_eq!(decoded.tree_hash, original.tree_hash);

    // Verify node data matches
    for (i, (orig, dec)) in original.nodes.iter().zip(decoded.nodes.iter()).enumerate() {
        assert_eq!(orig.selected, dec.selected, "Node {} selected mismatch", i);
        if orig.selected && orig.purchased {
            assert_eq!(
                orig.purchased, dec.purchased,
                "Node {} purchased mismatch",
                i
            );
            assert_eq!(
                orig.partially_ranked, dec.partially_ranked,
                "Node {} partially_ranked mismatch",
                i
            );
            if orig.partially_ranked {
                assert_eq!(
                    orig.ranks_purchased, dec.ranks_purchased,
                    "Node {} ranks_purchased mismatch",
                    i
                );
            }
            assert_eq!(
                orig.choice_node, dec.choice_node,
                "Node {} choice_node mismatch",
                i
            );
            if orig.choice_node {
                assert_eq!(
                    orig.choice_index, dec.choice_index,
                    "Node {} choice_index mismatch",
                    i
                );
            }
        }
    }
}

// =============================================================================
// Error Cases
// =============================================================================

#[test]
fn test_decode_empty_string() {
    let result = decode_trait_loadout("");
    assert!(result.is_err());
}

#[test]
fn test_decode_invalid_characters() {
    let result = decode_trait_loadout("!!!invalid!!!");
    assert!(result.is_err());
}

#[test]
fn test_decode_too_short() {
    let result = decode_trait_loadout("AB");
    assert!(result.is_err());
}

// Simple hex encoding for the snapshot
mod hex {
    pub fn encode(bytes: [u8; 16]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }
}
