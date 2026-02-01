//! Zero-copy binary data structures for DBC parsing.
//!
//! These structures use zerocopy for safe, zero-copy parsing of binary data.
//! Only flat #[repr(C)] structs are supported - no pointers, no heap types.

use zerocopy::{FromBytes, Immutable, IntoBytes, KnownLayout};

/// Flat spell record for binary DBC parsing.
#[derive(Debug, Clone, Copy, FromBytes, IntoBytes, Immutable, KnownLayout)]
#[repr(C)]
pub struct SpellRecord {
    pub id: u32,
    pub school: u8,
    pub _pad1: [u8; 3], // Padding for alignment
    pub flags: u32,
    pub cast_time: u32,
    pub cooldown: u32,
    pub base_damage: f32,
    pub ap_coeff: f32,
    pub sp_coeff: f32,
}

impl SpellRecord {
    /// Load spell records from a byte slice (zero-copy).
    #[inline]
    pub fn slice_from_bytes(bytes: &[u8]) -> Option<&[Self]> {
        <[Self]>::ref_from_bytes(bytes).ok()
    }

    /// Load spell records from a mutable byte slice (zero-copy).
    #[inline]
    pub fn slice_from_bytes_mut(bytes: &mut [u8]) -> Option<&mut [Self]> {
        <[Self]>::mut_from_bytes(bytes).ok()
    }
}

/// Flat aura record for binary DBC parsing.
#[derive(Debug, Clone, Copy, FromBytes, IntoBytes, Immutable, KnownLayout)]
#[repr(C)]
pub struct AuraRecord {
    pub id: u32,
    pub duration_ms: u32,
    pub tick_interval_ms: u32,
    pub max_stacks: u8,
    pub flags: u8,
    pub _pad: [u8; 2],
}

impl AuraRecord {
    /// Load aura records from a byte slice (zero-copy).
    #[inline]
    pub fn slice_from_bytes(bytes: &[u8]) -> Option<&[Self]> {
        <[Self]>::ref_from_bytes(bytes).ok()
    }
}

/// Flat item stat record for binary parsing.
#[derive(Debug, Clone, Copy, FromBytes, IntoBytes, Immutable, KnownLayout)]
#[repr(C)]
pub struct ItemStatRecord {
    pub item_id: u32,
    pub stat_type: u8,
    pub _pad: [u8; 3],
    pub stat_value: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spell_record_size() {
        // Verify struct is the expected size for binary compatibility
        assert_eq!(std::mem::size_of::<SpellRecord>(), 32);
    }

    #[test]
    fn test_spell_record_alignment() {
        assert_eq!(std::mem::align_of::<SpellRecord>(), 4);
    }

    #[test]
    fn test_aura_record_size() {
        assert_eq!(std::mem::size_of::<AuraRecord>(), 16);
    }

    #[test]
    fn test_zero_copy_parse() {
        let bytes: [u8; 32] = [
            0x01, 0x00, 0x00, 0x00, // id = 1
            0x01, // school = 1
            0x00, 0x00, 0x00, // padding
            0x00, 0x00, 0x00, 0x00, // flags = 0
            0xE8, 0x03, 0x00, 0x00, // cast_time = 1000
            0x00, 0x00, 0x00, 0x00, // cooldown = 0
            0x00, 0x00, 0xC8, 0x42, // base_damage = 100.0
            0x00, 0x00, 0x00, 0x00, // ap_coeff = 0.0
            0x00, 0x00, 0x00, 0x00, // sp_coeff = 0.0
        ];

        let record = SpellRecord::ref_from_bytes(&bytes).unwrap();
        assert_eq!(record.id, 1);
        assert_eq!(record.school, 1);
        assert_eq!(record.cast_time, 1000);
    }
}
