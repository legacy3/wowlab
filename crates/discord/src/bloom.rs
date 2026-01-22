use sha2::{Digest, Sha256};

/// Bloom filter using SHA-256 double hashing.
///
/// Interoperable format: the filter is stored as a raw byte array.
/// Both Rust and TypeScript sides derive k from the bit length and member count.
///
/// Hash scheme (Kirsch-Mitzenmacher):
///   hash = SHA-256(item as UTF-8 bytes)
///   h1 = first 8 bytes as u64 little-endian
///   h2 = next 8 bytes as u64 little-endian
///   position_i = (h1 + i * h2) % num_bits
pub struct BloomFilter {
    bits: Vec<u8>,
    num_bits: u64,
    num_hashes: u32,
}

impl BloomFilter {
    /// Create a new Bloom filter sized for `n` items at `fp_rate` false positive rate.
    pub fn new(n: usize, fp_rate: f64) -> Self {
        assert!(n > 0, "n must be > 0");
        assert!(fp_rate > 0.0 && fp_rate < 1.0, "fp_rate must be in (0, 1)");

        let raw_bits = optimal_num_bits(n, fp_rate);
        let num_bytes = (raw_bits as usize + 7) / 8;
        // Align to byte boundary so from_bytes reconstructs identically
        let num_bits = num_bytes as u64 * 8;
        let num_hashes = optimal_num_hashes(num_bits, n);

        Self {
            bits: vec![0u8; num_bytes],
            num_bits,
            num_hashes,
        }
    }

    /// Reconstruct a Bloom filter from raw bytes and known member count.
    pub fn from_bytes(bytes: Vec<u8>, member_count: usize) -> Self {
        let num_bits = bytes.len() as u64 * 8;
        let num_hashes = optimal_num_hashes(num_bits, member_count);

        Self {
            bits: bytes,
            num_bits,
            num_hashes,
        }
    }

    /// Insert an item into the filter.
    pub fn insert(&mut self, item: &str) {
        let (h1, h2) = hash_item(item);

        for i in 0..self.num_hashes {
            let pos = self.position(h1, h2, i);
            self.set_bit(pos);
        }
    }

    /// Check if an item might be in the filter.
    /// Returns false = definitely not in set, true = probably in set.
    pub fn might_contain(&self, item: &str) -> bool {
        let (h1, h2) = hash_item(item);

        for i in 0..self.num_hashes {
            let pos = self.position(h1, h2, i);
            if !self.get_bit(pos) {
                return false;
            }
        }

        true
    }

    /// Get the raw byte representation of the filter.
    pub fn as_bytes(&self) -> &[u8] {
        &self.bits
    }

    /// Consume the filter and return the raw bytes.
    pub fn into_bytes(self) -> Vec<u8> {
        self.bits
    }

    fn position(&self, h1: u64, h2: u64, i: u32) -> u64 {
        h1.wrapping_add((i as u64).wrapping_mul(h2)) % self.num_bits
    }

    fn set_bit(&mut self, pos: u64) {
        let byte_idx = (pos / 8) as usize;
        let bit_idx = (pos % 8) as u8;
        self.bits[byte_idx] |= 1 << bit_idx;
    }

    fn get_bit(&self, pos: u64) -> bool {
        let byte_idx = (pos / 8) as usize;
        let bit_idx = (pos % 8) as u8;
        (self.bits[byte_idx] >> bit_idx) & 1 == 1
    }
}

/// SHA-256 double hashing: returns (h1, h2) from the first 16 bytes.
fn hash_item(item: &str) -> (u64, u64) {
    let hash = Sha256::digest(item.as_bytes());
    let h1 = u64::from_le_bytes(hash[0..8].try_into().unwrap());
    let h2 = u64::from_le_bytes(hash[8..16].try_into().unwrap());
    (h1, h2)
}

/// m = -n * ln(p) / (ln(2))^2
fn optimal_num_bits(n: usize, fp_rate: f64) -> u64 {
    let m = -(n as f64) * fp_rate.ln() / (2.0_f64.ln().powi(2));
    m.ceil() as u64
}

/// k = (m/n) * ln(2)
fn optimal_num_hashes(num_bits: u64, n: usize) -> u32 {
    let k = (num_bits as f64 / n as f64) * 2.0_f64.ln();
    let k = k.round() as u32;
    k.max(1)
}

/// The false positive rate used for Discord server filters.
pub const FP_RATE: f64 = 0.001;

/// Create a Bloom filter from a list of Discord user IDs.
pub fn create_server_filter(discord_ids: &[String]) -> BloomFilter {
    let mut filter = BloomFilter::new(discord_ids.len().max(1), FP_RATE);
    for id in discord_ids {
        filter.insert(id);
    }
    filter
}

/// SHA-256 hash of the filter bytes, truncated to 16 hex chars.
pub fn filter_hash(bytes: &[u8]) -> String {
    let hash = Sha256::digest(bytes);
    hash[..8].iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_contains() {
        let ids: Vec<String> = (0..100).map(|i| format!("{}", 100000000000000000u64 + i)).collect();
        let filter = create_server_filter(&ids);

        // All inserted items must be found (no false negatives)
        for id in &ids {
            assert!(filter.might_contain(id), "false negative for {}", id);
        }
    }

    #[test]
    fn test_false_positive_rate() {
        let n = 1000;
        let ids: Vec<String> = (0..n).map(|i| format!("{}", 100000000000000000u64 + i)).collect();
        let filter = create_server_filter(&ids);

        // Test 10000 non-members
        let mut false_positives = 0;
        for i in n..(n + 10000) {
            let id = format!("{}", 100000000000000000u64 + i);
            if filter.might_contain(&id) {
                false_positives += 1;
            }
        }

        let fp_rate = false_positives as f64 / 10000.0;
        // Allow up to 0.5% (5x the target) to account for statistical variance
        assert!(
            fp_rate < 0.005,
            "false positive rate {:.4} exceeds 0.5%",
            fp_rate
        );
    }

    #[test]
    fn test_roundtrip_from_bytes() {
        let ids: Vec<String> = (0..500).map(|i| format!("{}", 200000000000000000u64 + i)).collect();
        let filter = create_server_filter(&ids);
        let bytes = filter.into_bytes();

        let restored = BloomFilter::from_bytes(bytes, 500);
        for id in &ids {
            assert!(restored.might_contain(id), "lost {} after roundtrip", id);
        }
    }

    /// Deterministic test with fixed inputs. The TypeScript side must produce
    /// identical results for the same inputs to prove interoperability.
    #[test]
    fn test_interop_vectors() {
        use base64::Engine;

        let ids = vec![
            "123456789012345678".to_string(),
            "987654321098765432".to_string(),
            "111222333444555666".to_string(),
        ];
        let filter = create_server_filter(&ids);
        let bytes = filter.as_bytes();
        let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
        let hash = filter_hash(bytes);

        // Print for TS test reference (run with `cargo test -- --nocapture`)
        eprintln!("interop vector:");
        eprintln!("  base64: {}", b64);
        eprintln!("  hash: {}", hash);
        eprintln!("  byte_len: {}", bytes.len());

        // Members must be found
        assert!(filter.might_contain("123456789012345678"));
        assert!(filter.might_contain("987654321098765432"));
        assert!(filter.might_contain("111222333444555666"));

        // Non-members must not be found (these specific IDs chosen to not collide)
        assert!(!filter.might_contain("000000000000000000"));
        assert!(!filter.might_contain("999999999999999999"));

        // Snapshot assertions - if these change, the TS side is broken
        assert_eq!(bytes.len(), 6, "filter byte length changed");
        assert_eq!(hash, "554721ba80ba8f66", "filter hash changed");
        assert_eq!(
            b64, "E5Nn44kd",
            "filter base64 changed - update TypeScript test vectors"
        );
    }

    #[test]
    fn test_filter_sizing() {
        // 1000 members at 0.1% FP should be ~1.8 KB
        let ids: Vec<String> = (0..1000).map(|i| format!("{}", i)).collect();
        let filter = create_server_filter(&ids);
        let size = filter.as_bytes().len();

        // Should be around 14.4 bits per element = 1800 bytes
        assert!(size > 1500 && size < 2500, "unexpected filter size: {} bytes", size);
    }
}
