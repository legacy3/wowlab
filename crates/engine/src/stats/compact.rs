//! Compact stat storage using half-precision floats.
//!
//! Uses f16 for storage to reduce memory bandwidth, with f32 accessors
//! for actual calculations. Good for caching stat snapshots.

use half::f16;

/// Maximum number of stat slots in compact storage.
pub const COMPACT_STAT_SLOTS: usize = 32;

/// Compact stat storage using half-precision floats.
///
/// Stores stats as f16 (2 bytes each) for memory efficiency.
/// Use for stat snapshots, historical data, or bulk stat storage.
/// For active calculations, convert to f32.
#[derive(Debug, Clone, Copy)]
pub struct CompactStats {
    values: [f16; COMPACT_STAT_SLOTS],
}

impl Default for CompactStats {
    fn default() -> Self {
        Self::new()
    }
}

impl CompactStats {
    /// Create new compact stats with all zeros.
    #[inline]
    pub const fn new() -> Self {
        Self {
            values: [f16::ZERO; COMPACT_STAT_SLOTS],
        }
    }

    /// Get stat value at index, converted to f32.
    #[inline]
    pub fn get(&self, idx: usize) -> f32 {
        self.values.get(idx).map(|v| v.to_f32()).unwrap_or(0.0)
    }

    /// Set stat value at index from f32.
    #[inline]
    pub fn set(&mut self, idx: usize, val: f32) {
        if let Some(slot) = self.values.get_mut(idx) {
            *slot = f16::from_f32(val);
        }
    }

    /// Get raw f16 value at index.
    #[inline]
    pub fn get_raw(&self, idx: usize) -> Option<f16> {
        self.values.get(idx).copied()
    }

    /// Set raw f16 value at index.
    #[inline]
    pub fn set_raw(&mut self, idx: usize, val: f16) {
        if let Some(slot) = self.values.get_mut(idx) {
            *slot = val;
        }
    }

    /// Get all values as f32 array.
    #[inline]
    pub fn to_f32_array(&self) -> [f32; COMPACT_STAT_SLOTS] {
        let mut result = [0.0f32; COMPACT_STAT_SLOTS];
        for (i, v) in self.values.iter().enumerate() {
            result[i] = v.to_f32();
        }
        result
    }

    /// Set all values from f32 array.
    #[inline]
    pub fn from_f32_array(values: &[f32; COMPACT_STAT_SLOTS]) -> Self {
        let mut result = Self::new();
        for (i, &v) in values.iter().enumerate() {
            result.values[i] = f16::from_f32(v);
        }
        result
    }

    /// Get the size in bytes (for memory tracking).
    #[inline]
    pub const fn size_bytes() -> usize {
        COMPACT_STAT_SLOTS * 2 // f16 = 2 bytes
    }

    /// Copy from another CompactStats.
    #[inline]
    pub fn copy_from(&mut self, other: &Self) {
        self.values = other.values;
    }

    /// Check if all values are zero.
    #[inline]
    pub fn is_zero(&self) -> bool {
        self.values.iter().all(|v| *v == f16::ZERO)
    }
}

/// Well-known stat indices for CompactStats.
pub mod stat_idx {
    pub const STRENGTH: usize = 0;
    pub const AGILITY: usize = 1;
    pub const INTELLECT: usize = 2;
    pub const STAMINA: usize = 3;
    pub const CRIT_RATING: usize = 4;
    pub const HASTE_RATING: usize = 5;
    pub const MASTERY_RATING: usize = 6;
    pub const VERSATILITY_RATING: usize = 7;
    pub const ATTACK_POWER: usize = 8;
    pub const SPELL_POWER: usize = 9;
    pub const ARMOR: usize = 10;
    pub const CRIT_CHANCE: usize = 11;
    pub const HASTE: usize = 12;
    pub const MASTERY: usize = 13;
    pub const VERSATILITY: usize = 14;
    pub const DAMAGE_MULT: usize = 15;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compact_stats_size() {
        // f16 = 2 bytes, 32 slots = 64 bytes
        assert_eq!(std::mem::size_of::<CompactStats>(), 64);
        assert_eq!(CompactStats::size_bytes(), 64);
    }

    #[test]
    fn test_get_set() {
        let mut stats = CompactStats::new();
        stats.set(stat_idx::AGILITY, 1500.0);

        let val = stats.get(stat_idx::AGILITY);
        // f16 has limited precision, so check approximate equality
        assert!((val - 1500.0).abs() < 1.0);
    }

    #[test]
    fn test_precision_loss() {
        let mut stats = CompactStats::new();

        // f16 has ~3 decimal digits of precision
        stats.set(0, 12345.678);
        let val = stats.get(0);

        // Should be close but not exact
        assert!((val - 12345.678).abs() < 20.0);
    }

    #[test]
    fn test_is_zero() {
        let stats = CompactStats::new();
        assert!(stats.is_zero());

        let mut stats2 = CompactStats::new();
        stats2.set(5, 1.0);
        assert!(!stats2.is_zero());
    }

    #[test]
    fn test_from_f32_array() {
        let mut arr = [0.0f32; COMPACT_STAT_SLOTS];
        arr[0] = 100.0;
        arr[1] = 200.0;

        let stats = CompactStats::from_f32_array(&arr);
        assert!((stats.get(0) - 100.0).abs() < 0.1);
        assert!((stats.get(1) - 200.0).abs() < 0.1);
    }
}
