#[derive(Debug)]
pub struct FastRng {
    inner: fastrand::Rng,
}

impl FastRng {
    #[inline]
    pub fn new(seed: u64) -> Self {
        Self {
            inner: fastrand::Rng::with_seed(seed),
        }
    }

    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        self.inner.u64(..)
    }

    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        self.inner.f32()
    }

    #[inline]
    pub fn next_f64(&mut self) -> f64 {
        self.inner.f64()
    }

    #[inline]
    pub fn roll(&mut self, probability: f32) -> bool {
        self.inner.f32() < probability
    }

    #[inline]
    pub fn next_u32(&mut self, max: u32) -> u32 {
        self.inner.u32(0..max)
    }

    #[inline]
    pub fn range(&mut self, min: f32, max: f32) -> f32 {
        min + self.inner.f32() * (max - min)
    }
}
