/// Fast, high-quality RNG (xoshiro256++)
pub struct FastRng {
    state: [u64; 4],
}

impl FastRng {
    /// Create new RNG with seed
    pub fn new(seed: u64) -> Self {
        // Use SplitMix64 to initialize state from seed
        let mut sm = seed;
        let mut state = [0u64; 4];
        for s in &mut state {
            sm = sm.wrapping_add(0x9e3779b97f4a7c15);
            let mut z = sm;
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            *s = z ^ (z >> 31);
        }
        Self { state }
    }

    /// Generate random u64
    #[inline]
    pub fn next_u64(&mut self) -> u64 {
        let result = (self.state[0].wrapping_add(self.state[3]))
            .rotate_left(23)
            .wrapping_add(self.state[0]);

        let t = self.state[1] << 17;

        self.state[2] ^= self.state[0];
        self.state[3] ^= self.state[1];
        self.state[1] ^= self.state[2];
        self.state[0] ^= self.state[3];

        self.state[2] ^= t;
        self.state[3] = self.state[3].rotate_left(45);

        result
    }

    /// Generate random f32 in [0, 1)
    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        // Use upper 24 bits for mantissa
        (self.next_u64() >> 40) as f32 * (1.0 / (1u64 << 24) as f32)
    }

    /// Generate random f64 in [0, 1)
    #[inline]
    pub fn next_f64(&mut self) -> f64 {
        // Use upper 53 bits for mantissa
        (self.next_u64() >> 11) as f64 * (1.0 / (1u64 << 53) as f64)
    }

    /// Roll against probability (0.0 to 1.0)
    #[inline]
    pub fn roll(&mut self, probability: f32) -> bool {
        self.next_f32() < probability
    }

    /// Random integer in [0, max)
    #[inline]
    pub fn next_u32(&mut self, max: u32) -> u32 {
        ((self.next_u64() >> 32) as u32) % max
    }

    /// Random value in range [min, max]
    #[inline]
    pub fn range(&mut self, min: f32, max: f32) -> f32 {
        min + self.next_f32() * (max - min)
    }
}
