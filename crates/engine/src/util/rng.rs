/// Fast xorshift64 RNG - deterministic, no allocations
#[derive(Debug, Clone)]
pub struct FastRng {
    state: u64,
}

impl FastRng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 1 } else { seed },
        }
    }

    pub fn reseed(&mut self, seed: u64) {
        self.state = if seed == 0 { 1 } else { seed };
    }

    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        (self.next_u64() as f32) / (u64::MAX as f32)
    }

    #[inline]
    pub fn next_f64(&mut self) -> f64 {
        (self.next_u64() as f64) / (u64::MAX as f64)
    }

    /// Returns true with probability `chance` (0.0 to 1.0)
    #[inline]
    pub fn roll(&mut self, chance: f32) -> bool {
        self.next_f32() < chance
    }

    /// Returns a random value in [min, max)
    #[inline]
    pub fn range_f32(&mut self, min: f32, max: f32) -> f32 {
        min + self.next_f32() * (max - min)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic() {
        let mut rng1 = FastRng::new(12345);
        let mut rng2 = FastRng::new(12345);

        for _ in 0..100 {
            assert_eq!(rng1.next_u64(), rng2.next_u64());
        }
    }

    #[test]
    fn test_range() {
        let mut rng = FastRng::new(12345);
        for _ in 0..1000 {
            let v = rng.range_f32(10.0, 20.0);
            assert!(v >= 10.0 && v < 20.0);
        }
    }
}
