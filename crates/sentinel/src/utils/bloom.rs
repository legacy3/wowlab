use sha2::{Digest, Sha256};

/// Kirsch-Mitzenmacher hash scheme with SHA-256.
/// Interoperable with TypeScript implementation.
pub struct BloomFilter {
    bits: Vec<u8>,
    num_bits: u64,
    num_hashes: u32,
}

impl BloomFilter {
    pub fn new(n: usize, fp_rate: f64) -> Self {
        assert!(n > 0, "n must be > 0");
        assert!(fp_rate > 0.0 && fp_rate < 1.0, "fp_rate must be in (0, 1)");

        let raw_bits = optimal_num_bits(n, fp_rate);
        let num_bytes = (raw_bits as usize).div_ceil(8);
        // Align to byte boundary so from_bytes reconstructs identically
        let num_bits = num_bytes as u64 * 8;
        let num_hashes = optimal_num_hashes(num_bits, n);

        Self {
            bits: vec![0u8; num_bytes],
            num_bits,
            num_hashes,
        }
    }

    pub fn from_bytes(bytes: Vec<u8>, member_count: usize) -> Self {
        let num_bits = bytes.len() as u64 * 8;
        let num_hashes = optimal_num_hashes(num_bits, member_count);

        Self {
            bits: bytes,
            num_bits,
            num_hashes,
        }
    }

    pub fn insert(&mut self, item: &str) {
        let (h1, h2) = hash_item(item);

        for i in 0..self.num_hashes {
            let pos = self.position(h1, h2, i);
            self.set_bit(pos);
        }
    }

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

    pub fn as_bytes(&self) -> &[u8] {
        &self.bits
    }

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

fn hash_item(item: &str) -> (u64, u64) {
    let hash = Sha256::digest(item.as_bytes());
    let h1 = u64::from_le_bytes(hash[0..8].try_into().unwrap());
    let h2 = u64::from_le_bytes(hash[8..16].try_into().unwrap());
    (h1, h2)
}

fn optimal_num_bits(n: usize, fp_rate: f64) -> u64 {
    let m = -(n as f64) * fp_rate.ln() / (2.0_f64.ln().powi(2));
    m.ceil() as u64
}

fn optimal_num_hashes(num_bits: u64, n: usize) -> u32 {
    let k = (num_bits as f64 / n as f64) * 2.0_f64.ln();
    let k = k.round() as u32;
    k.max(1)
}

pub const FP_RATE: f64 = 0.001;

pub fn create_server_filter(discord_ids: &[String]) -> BloomFilter {
    let mut filter = BloomFilter::new(discord_ids.len().max(1), FP_RATE);
    for id in discord_ids {
        filter.insert(id);
    }
    filter
}

pub fn filter_hash(bytes: &[u8]) -> String {
    let hash = Sha256::digest(bytes);
    hash[..8].iter().map(|b| format!("{:02x}", b)).collect()
}
