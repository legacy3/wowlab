//! Trait loadout string encoding/decoding
//!
//! Implements the WoW trait loadout string format used by the game client,
//! Wowhead, and SimC. The format is a base64-encoded bitstream containing:
//!
//! - Version (8 bits)
//! - Spec ID (16 bits)
//! - Tree hash (128 bits) - identifies the trait tree structure
//! - Node data (variable) - selection state for each node in order

use std::collections::HashMap;

use crate::errors::TraitError;
use crate::flat::{TraitSelection, TraitTreeFlat, TraitTreeWithSelections};

/// A decoded trait loadout containing all node selections.
#[derive(Debug, Clone)]
pub struct DecodedTraitLoadout {
    pub version: u8,
    pub spec_id: u16,
    pub tree_hash: [u8; 16],
    pub nodes: Vec<DecodedTraitNode>,
}

/// Selection state for a single talent node.
#[derive(Debug, Clone)]
pub struct DecodedTraitNode {
    pub selected: bool,
    pub purchased: bool,
    pub partially_ranked: bool,
    pub ranks_purchased: Option<u8>,
    pub choice_node: bool,
    pub choice_index: Option<u8>,
}

const BASE64_URL_SAFE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/// Pre-computed char map for base64 decoding (built at compile time)
const BASE64_CHAR_MAP: [u8; 256] = build_char_map();

const fn build_char_map() -> [u8; 256] {
    let standard = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let url_safe = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut map = [255u8; 256];
    let mut i = 0;
    while i < standard.len() {
        map[standard[i] as usize] = i as u8;
        i += 1;
    }
    i = 0;
    while i < url_safe.len() {
        map[url_safe[i] as usize] = i as u8;
        i += 1;
    }
    map
}

// ============================================================================
// Bit Stream Reader
// ============================================================================

/// Reads bits from a base64-encoded string, LSB first within each 6-bit character.
struct BitReader<'a> {
    data: &'a str,
    position: usize,
    total_bits: usize,
}

impl<'a> BitReader<'a> {
    fn new(data: &'a str) -> Self {
        Self {
            data,
            position: 0,
            total_bits: data.len() * 6,
        }
    }

    fn read(&mut self, bit_count: usize) -> Result<u32, TraitError> {
        if self.position + bit_count > self.total_bits {
            return Err(TraitError::NotEnoughData);
        }

        let mut value = 0u32;
        for i in 0..bit_count {
            let char_idx = self.position / 6;
            let bit_offset = self.position % 6;

            let byte = self.data.as_bytes().get(char_idx).copied().unwrap_or(0);
            let char_value = BASE64_CHAR_MAP[byte as usize];
            if char_value == 255 {
                return Err(TraitError::InvalidCharacters);
            }

            let bit = (char_value >> bit_offset) & 1;
            value |= (bit as u32) << i;
            self.position += 1;
        }

        Ok(value)
    }

    fn has_remaining(&self, bit_count: usize) -> bool {
        self.position + bit_count <= self.total_bits
    }
}

// ============================================================================
// Bit Stream Writer
// ============================================================================

/// Writes bits to a base64-encoded string, LSB first within each 6-bit character.
struct BitWriter {
    output: String,
    bit_position: usize,
    current_char: u8,
}

impl BitWriter {
    fn new() -> Self {
        Self {
            output: String::new(),
            bit_position: 0,
            current_char: 0,
        }
    }

    fn write(&mut self, value: u32, bit_count: usize) {
        for i in 0..bit_count {
            let bit = ((value >> i) & 1) as u8;
            self.current_char |= bit << self.bit_position;
            self.bit_position += 1;

            if self.bit_position == 6 {
                self.flush_char();
            }
        }
    }

    fn flush_char(&mut self) {
        self.output.push(BASE64_URL_SAFE[self.current_char as usize] as char);
        self.current_char = 0;
        self.bit_position = 0;
    }

    fn finish(mut self) -> String {
        if self.bit_position > 0 {
            self.flush_char();
        }
        self.output
    }
}

// ============================================================================
// Public API
// ============================================================================

/// Decode a trait loadout string into structured data.
///
/// The bitstream format for each node:
/// - 1 bit: selected flag
/// - If selected:
///   - 1 bit: purchased flag
///   - If purchased:
///     - 1 bit: partially_ranked flag
///     - If partially_ranked: 6 bits for ranks_purchased
///     - 1 bit: choice_node flag
///     - If choice_node: 2 bits for choice_index
pub fn decode_trait_loadout(talent_string: &str) -> Result<DecodedTraitLoadout, TraitError> {
    if talent_string.is_empty() {
        return Err(TraitError::TooShort);
    }

    validate_base64_chars(talent_string)?;

    let mut reader = BitReader::new(talent_string);

    let version = reader.read(8)? as u8;
    let spec_id = reader.read(16)? as u16;

    let mut tree_hash = [0u8; 16];
    for byte in &mut tree_hash {
        *byte = reader.read(8)? as u8;
    }

    let mut nodes = Vec::new();
    while reader.has_remaining(1) {
        nodes.push(decode_node(&mut reader)?);
    }

    Ok(DecodedTraitLoadout {
        version,
        spec_id,
        tree_hash,
        nodes,
    })
}

fn validate_base64_chars(s: &str) -> Result<(), TraitError> {
    for c in s.chars() {
        let valid = c.is_ascii_alphanumeric() || matches!(c, '+' | '/' | '-' | '_');
        if !valid {
            return Err(TraitError::InvalidCharacters);
        }
    }
    Ok(())
}

fn decode_node(reader: &mut BitReader) -> Result<DecodedTraitNode, TraitError> {
    let selected = reader.read(1)? == 1;
    if !selected {
        return Ok(DecodedTraitNode {
            selected: false,
            purchased: false,
            partially_ranked: false,
            ranks_purchased: None,
            choice_node: false,
            choice_index: None,
        });
    }

    let purchased = reader.read(1)? == 1;
    if !purchased {
        return Ok(DecodedTraitNode {
            selected: true,
            purchased: false,
            partially_ranked: false,
            ranks_purchased: None,
            choice_node: false,
            choice_index: None,
        });
    }

    let partially_ranked = reader.read(1)? == 1;
    let ranks_purchased = if partially_ranked {
        Some(reader.read(6)? as u8)
    } else {
        None
    };

    let choice_node = reader.read(1)? == 1;
    let choice_index = if choice_node {
        Some(reader.read(2)? as u8)
    } else {
        None
    };

    Ok(DecodedTraitNode {
        selected: true,
        purchased: true,
        partially_ranked,
        ranks_purchased,
        choice_node,
        choice_index,
    })
}

/// Encode a trait loadout into a string.
pub fn encode_trait_loadout(loadout: &DecodedTraitLoadout) -> String {
    let mut writer = BitWriter::new();

    writer.write(loadout.version as u32, 8);
    writer.write(loadout.spec_id as u32, 16);

    for &byte in &loadout.tree_hash {
        writer.write(byte as u32, 8);
    }

    for node in &loadout.nodes {
        encode_node(&mut writer, node);
    }

    writer.finish()
}

fn encode_node(writer: &mut BitWriter, node: &DecodedTraitNode) {
    writer.write(u32::from(node.selected), 1);
    if !node.selected {
        return;
    }

    writer.write(u32::from(node.purchased), 1);
    if !node.purchased {
        return;
    }

    writer.write(u32::from(node.partially_ranked), 1);
    if node.partially_ranked {
        writer.write(node.ranks_purchased.unwrap_or(0) as u32, 6);
    }

    writer.write(u32::from(node.choice_node), 1);
    if node.choice_node {
        writer.write(node.choice_index.unwrap_or(0) as u32, 2);
    }
}

// ============================================================================
// Apply Decoded Traits
// ============================================================================

/// Apply decoded trait selections to a trait tree.
///
/// Maps the decoded node data to the tree nodes using `all_node_ids` for correct
/// positioning. The decoded nodes array is indexed by position in the loadout
/// string, which corresponds to the sorted order of all node IDs.
pub fn apply_decoded_traits(
    tree: TraitTreeFlat,
    decoded: &DecodedTraitLoadout,
) -> TraitTreeWithSelections {
    // Build a map from node ID to the actual node (for looking up maxRanks)
    let node_by_id: HashMap<i32, _> = tree.nodes.iter().map(|n| (n.id, n)).collect();

    let mut selections = Vec::new();

    // Map decoded nodes to tree nodes using allNodeIds for correct positioning
    for (i, decoded_node) in decoded.nodes.iter().enumerate() {
        if i >= tree.all_node_ids.len() {
            break;
        }

        let node_id = tree.all_node_ids[i];

        // Only create selections for nodes that exist in the filtered tree
        if let Some(tree_node) = node_by_id.get(&node_id) {
            let ranks_purchased = decoded_node
                .ranks_purchased
                .map(|r| r as i32)
                .unwrap_or_else(|| {
                    if decoded_node.purchased {
                        tree_node.max_ranks
                    } else {
                        0
                    }
                });

            selections.push(TraitSelection {
                node_id,
                selected: decoded_node.selected,
                ranks_purchased,
                choice_index: decoded_node.choice_index,
            });
        }
    }

    TraitTreeWithSelections { tree, selections }
}

#[cfg(test)]
mod tests;
