use super::*;

fn make_node(selected: bool, purchased: bool, choice_index: Option<u8>) -> DecodedTraitNode {
    DecodedTraitNode {
        selected,
        purchased,
        partially_ranked: false,
        ranks_purchased: None,
        choice_node: choice_index.is_some(),
        choice_index,
    }
}

#[test]
fn test_roundtrip() {
    let original = DecodedTraitLoadout {
        version: 1,
        spec_id: 62,
        tree_hash: [0; 16],
        nodes: vec![make_node(true, true, None), make_node(false, false, None)],
    };

    let encoded = encode_trait_loadout(&original);
    let decoded = decode_trait_loadout(&encoded).unwrap();

    assert_eq!(decoded.version, original.version);
    assert_eq!(decoded.spec_id, original.spec_id);
    assert!(decoded.nodes.len() >= original.nodes.len());

    for (i, (orig, dec)) in original.nodes.iter().zip(decoded.nodes.iter()).enumerate() {
        assert_eq!(orig.selected, dec.selected, "Node {} selected mismatch", i);
        if orig.selected {
            assert_eq!(
                orig.purchased, dec.purchased,
                "Node {} purchased mismatch",
                i
            );
        }
    }
}
