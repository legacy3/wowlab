//! Fast pseudo-random number generator.

/// Fast xorshift64 RNG - deterministic and allocation-free.
///
/// Uses xorshift64 for high-quality pseudo-random numbers suitable
/// for simulation work. Deterministic seeding enables reproducible runs.
#[derive(Debug, Clone)]
pub struct FastRng {
    state: u64,
}

/// Reciprocal of 2^32 for fast f32 conversion.
#[allow(clippy::unreadable_literal)]
const F32_SCALE: f32 = 1.0 / 4_294_967_296.0;

impl FastRng {
    /// Creates a new RNG with the given seed.
    ///
    /// A seed of 0 is treated as 1 (xorshift requires non-zero state).
    #[must_use]
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 1 } else { seed },
        }
    }

    /// Reseeds the RNG with a new seed.
    pub fn reseed(&mut self, seed: u64) {
        self.state = if seed == 0 { 1 } else { seed };
    }

    /// Returns the next 64-bit random value.
    #[inline(always)]
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.state = x;
        x
    }

    /// Returns a random f32 in `[0, 1)`.
    ///
    /// Uses upper 32 bits for better randomness quality.
    #[inline(always)]
    #[allow(clippy::cast_precision_loss)]
    pub fn next_f32(&mut self) -> f32 {
        ((self.next_u64() >> 32) as u32 as f32) * F32_SCALE
    }

    /// Returns a random f64 in `[0, 1)`.
    #[inline]
    #[allow(clippy::cast_precision_loss)]
    pub fn next_f64(&mut self) -> f64 {
        (self.next_u64() as f64) / (u64::MAX as f64)
    }

    /// Returns true with probability `chance` (0.0 to 1.0).
    #[inline(always)]
    pub fn roll(&mut self, chance: f32) -> bool {
        self.next_f32() < chance
    }

    /// Returns a random value in `[min, max)`.
    #[inline(always)]
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
