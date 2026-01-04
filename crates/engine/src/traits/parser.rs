//! Trait string parser for base64 encoded loadouts.
//!
//! The game exports trait loadouts as base64-encoded binary strings.
//! This parser decodes them into a list of selected trait nodes.
//!
//! # Format (Version 2)
//!
//! ```text
//! | 8 bits  | 16 bits | 128 bits   | variable          |
//! | version | spec_id | tree_hash  | node_selections   |
//! ```
//!
//! Each node selection:
//! - 1 bit: is_selected
//! - 1 bit: is_purchased
//! - 1 bit: is_partial_rank (if true, 6 bits follow for rank)
//! - 1 bit: is_choice_node (if true, 2 bits follow for choice index)

use std::collections::HashMap;

use thiserror::Error;

/// Base64 character set (standard).
const BASE64_CHARS: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// Current serialization version.
const LOADOUT_VERSION: u8 = 2;

/// Errors during trait string parsing.
#[derive(Debug, Error)]
pub enum TraitParseError {
    #[error("invalid base64 character: {0}")]
    InvalidBase64(char),

    #[error("string too short")]
    TooShort,

    #[error("unsupported version: {0} (expected {LOADOUT_VERSION})")]
    UnsupportedVersion(u8),

    #[error("spec ID mismatch: got {got}, expected {expected}")]
    SpecMismatch { got: u16, expected: u16 },

    #[error("unexpected end of data")]
    UnexpectedEnd,
}

/// A parsed trait loadout.
#[derive(Debug, Clone)]
pub struct TraitLoadout {
    /// Serialization version.
    pub version: u8,

    /// Specialization ID.
    pub spec_id: u16,

    /// Tree hash (for validation, can be zeroed).
    pub tree_hash: [u8; 16],

    /// Selected traits: node_entry_id -> rank.
    pub traits: HashMap<u32, u8>,
}

impl TraitLoadout {
    /// Create an empty loadout.
    pub fn new(spec_id: u16) -> Self {
        Self {
            version: LOADOUT_VERSION,
            spec_id,
            tree_hash: [0; 16],
            traits: HashMap::new(),
        }
    }

    /// Check if a trait is selected.
    pub fn has_trait(&self, node_entry_id: u32) -> bool {
        self.traits.contains_key(&node_entry_id)
    }

    /// Get trait rank (0 if not selected).
    pub fn trait_rank(&self, node_entry_id: u32) -> u8 {
        self.traits.get(&node_entry_id).copied().unwrap_or(0)
    }

    /// Add a trait with rank.
    pub fn add_trait(&mut self, node_entry_id: u32, rank: u8) {
        self.traits.insert(node_entry_id, rank);
    }
}

/// Bit reader for parsing base64-decoded data.
struct BitReader<'a> {
    data: &'a [u8],
    byte_pos: usize,
    bit_pos: u8,
}

impl<'a> BitReader<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self {
            data,
            byte_pos: 0,
            bit_pos: 0,
        }
    }

    /// Read n bits (up to 32).
    fn read_bits(&mut self, n: u8) -> Result<u32, TraitParseError> {
        let mut result: u32 = 0;
        let mut bits_read: u8 = 0;

        while bits_read < n {
            if self.byte_pos >= self.data.len() {
                return Err(TraitParseError::UnexpectedEnd);
            }

            let bits_available = 8 - self.bit_pos;
            let bits_to_read = (n - bits_read).min(bits_available);

            // Use u16 for shift to avoid overflow when bits_to_read == 8
            let mask = ((1u16 << bits_to_read) - 1) as u8;
            let value = (self.data[self.byte_pos] >> self.bit_pos) & mask;

            result |= (value as u32) << bits_read;
            bits_read += bits_to_read;
            self.bit_pos += bits_to_read;

            if self.bit_pos >= 8 {
                self.bit_pos = 0;
                self.byte_pos += 1;
            }
        }

        Ok(result)
    }

    /// Read a single bit.
    #[inline]
    fn read_bit(&mut self) -> Result<bool, TraitParseError> {
        Ok(self.read_bits(1)? != 0)
    }

    /// Check if there's more data.
    fn has_more(&self) -> bool {
        self.byte_pos < self.data.len()
    }
}

/// Decode base64 string to bytes.
fn decode_base64(input: &str) -> Result<Vec<u8>, TraitParseError> {
    let mut output = Vec::with_capacity(input.len() * 3 / 4);
    let mut buffer: u32 = 0;
    let mut bits: u8 = 0;

    for c in input.chars() {
        // Skip padding
        if c == '=' {
            continue;
        }

        let value = BASE64_CHARS
            .iter()
            .position(|&b| b == c as u8)
            .ok_or(TraitParseError::InvalidBase64(c))? as u32;

        buffer = (buffer << 6) | value;
        bits += 6;

        if bits >= 8 {
            bits -= 8;
            output.push((buffer >> bits) as u8);
            buffer &= (1 << bits) - 1;
        }
    }

    Ok(output)
}

/// Parse a trait string into a loadout.
///
/// The trait string is a base64-encoded binary format exported from the game.
///
/// # Arguments
///
/// * `trait_string` - Base64 encoded trait loadout
/// * `node_order` - Ordered list of node_entry_ids for this spec (from DBC)
///
/// # Example
///
/// ```ignore
/// let nodes = vec![112345, 112346, 112347]; // From trait DB
/// let loadout = parse_trait_string("B8DAAIXa...", &nodes)?;
/// ```
pub fn parse_trait_string(
    trait_string: &str,
    node_order: &[u32],
) -> Result<TraitLoadout, TraitParseError> {
    let data = decode_base64(trait_string)?;
    if data.len() < 19 {
        // 1 + 2 + 16 minimum
        return Err(TraitParseError::TooShort);
    }

    let mut reader = BitReader::new(&data);

    // Read version (8 bits)
    let version = reader.read_bits(8)? as u8;
    if version != LOADOUT_VERSION {
        return Err(TraitParseError::UnsupportedVersion(version));
    }

    // Read spec ID (16 bits)
    let spec_id = reader.read_bits(16)? as u16;

    // Read tree hash (128 bits = 16 bytes)
    let mut tree_hash = [0u8; 16];
    for byte in &mut tree_hash {
        *byte = reader.read_bits(8)? as u8;
    }

    let mut loadout = TraitLoadout {
        version,
        spec_id,
        tree_hash,
        traits: HashMap::new(),
    };

    // Parse node selections
    for &node_id in node_order {
        if !reader.has_more() {
            break;
        }

        let is_selected = reader.read_bit()?;
        if !is_selected {
            continue;
        }

        let is_purchased = reader.read_bit()?;
        if !is_purchased {
            continue;
        }

        // Check for partial rank
        let is_partial = reader.read_bit()?;
        let rank = if is_partial {
            reader.read_bits(6)? as u8
        } else {
            1 // Default to 1 rank if not partial
        };

        // Check for choice node
        let is_choice = reader.read_bit()?;
        if is_choice {
            let _choice_index = reader.read_bits(2)?;
            // Choice index indicates which option was selected
            // The node_id we have is already the specific choice
        }

        if rank > 0 {
            loadout.traits.insert(node_id, rank);
        }
    }

    Ok(loadout)
}

/// Parse trait string without node order validation.
///
/// This is a simpler parser that just extracts the header.
/// Use this when you don't have the full node order available.
pub fn parse_trait_header(trait_string: &str) -> Result<(u8, u16), TraitParseError> {
    let data = decode_base64(trait_string)?;
    if data.len() < 3 {
        return Err(TraitParseError::TooShort);
    }

    let mut reader = BitReader::new(&data);
    let version = reader.read_bits(8)? as u8;
    let spec_id = reader.read_bits(16)? as u16;

    Ok((version, spec_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64_decode() {
        let decoded = decode_base64("SGVsbG8=").unwrap();
        assert_eq!(decoded, b"Hello");
    }

    #[test]
    fn test_bit_reader() {
        let data = [0b10110100, 0b11001010];
        let mut reader = BitReader::new(&data);

        // Read 4 bits: 0100 = 4
        assert_eq!(reader.read_bits(4).unwrap(), 0b0100);
        // Read 4 bits: 1011 = 11
        assert_eq!(reader.read_bits(4).unwrap(), 0b1011);
        // Read 8 bits: 11001010 = 202
        assert_eq!(reader.read_bits(8).unwrap(), 0b11001010);
    }

    #[test]
    fn test_empty_loadout() {
        let loadout = TraitLoadout::new(253); // BM Hunter
        assert_eq!(loadout.spec_id, 253);
        assert_eq!(loadout.traits.len(), 0);
    }
}
