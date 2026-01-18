use wowlab_types::SimTime;

/// Basic cooldown state
#[derive(Clone, Debug)]
pub struct Cooldown {
    /// Base duration
    pub base_duration: SimTime,
    /// Current duration (after modifiers)
    pub duration: SimTime,
    /// When cooldown will be ready
    pub ready_at: SimTime,
    /// Does haste affect this cooldown?
    pub hasted: bool,
}

impl Cooldown {
    pub fn new(duration_secs: f32) -> Self {
        let duration = SimTime::from_secs_f32(duration_secs);
        Self {
            base_duration: duration,
            duration,
            ready_at: SimTime::ZERO,
            hasted: false,
        }
    }

    pub fn hasted(mut self) -> Self {
        self.hasted = true;
        self
    }

    /// Is cooldown ready?
    #[inline]
    pub fn is_ready(&self, now: SimTime) -> bool {
        now >= self.ready_at
    }

    /// Start the cooldown
    pub fn start(&mut self, now: SimTime, haste: f32) {
        let duration = if self.hasted {
            SimTime::from_secs_f32(self.duration.as_secs_f32() / haste)
        } else {
            self.duration
        };
        self.ready_at = now + duration;
    }

    /// Remaining time
    pub fn remaining(&self, now: SimTime) -> SimTime {
        self.ready_at.saturating_sub(now)
    }

    /// Reduce cooldown by amount
    pub fn reduce(&mut self, amount: SimTime) {
        self.ready_at = self.ready_at.saturating_sub(amount);
    }

    /// Reset cooldown (make ready now)
    pub fn reset(&mut self) {
        self.ready_at = SimTime::ZERO;
    }

    /// Adjust duration multiplier (for mid-fight changes)
    pub fn set_duration_mult(&mut self, mult: f32) {
        self.duration = SimTime::from_secs_f32(self.base_duration.as_secs_f32() * mult);
    }
}

impl Default for Cooldown {
    fn default() -> Self {
        Self::new(0.0)
    }
}
