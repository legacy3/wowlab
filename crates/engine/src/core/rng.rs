/// Fast, high-quality RNG wrapper around fastrand
#[derive(Debug)]
pub struct FastRng {
    inner: fastrand::Rng,
}

impl FastRng {
    /// Create new RNG with seed
    #[inline]
    pub fn new(seed: u64) -> Self {
        Self {
            inner: fastrand::Rng::with_seed(seed),
        }
    }

    /// Generate random u64
    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        self.inner.u64(..)
    }

    /// Generate random f32 in [0, 1)
    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        self.inner.f32()
    }

    /// Generate random f64 in [0, 1)
    #[inline]
    pub fn next_f64(&mut self) -> f64 {
        self.inner.f64()
    }

    /// Roll against probability (0.0 to 1.0)
    #[inline]
    pub fn roll(&mut self, probability: f32) -> bool {
        self.inner.f32() < probability
    }

    /// Random integer in [0, max)
    #[inline]
    pub fn next_u32(&mut self, max: u32) -> u32 {
        self.inner.u32(0..max)
    }

    /// Random value in range [min, max]
    #[inline]
    pub fn range(&mut self, min: f32, max: f32) -> f32 {
        min + self.inner.f32() * (max - min)
    }
}
