use crate::types::SimTime;

/// Number of runes DKs have
pub const NUM_RUNES: usize = 6;

/// Death Knight rune state
#[derive(Clone, Debug)]
pub struct RuneState {
    /// When each rune will be ready (0 = ready now)
    ready_at: [SimTime; NUM_RUNES],
}

impl RuneState {
    pub fn new() -> Self {
        Self {
            ready_at: [SimTime::ZERO; NUM_RUNES],
        }
    }

    /// Count of ready runes
    pub fn ready_count(&self, now: SimTime) -> u8 {
        self.ready_at.iter().filter(|&&t| t <= now).count() as u8
    }

    /// Are N runes available?
    pub fn can_spend(&self, count: u8, now: SimTime) -> bool {
        self.ready_count(now) >= count
    }

    /// Spend N runes, returns false if not enough
    pub fn spend(&mut self, count: u8, now: SimTime, recharge_time: SimTime) -> bool {
        if !self.can_spend(count, now) {
            return false;
        }

        let mut spent = 0;
        for ready in &mut self.ready_at {
            if *ready <= now && spent < count {
                *ready = now + recharge_time;
                spent += 1;
            }
        }

        true
    }

    /// Time until N runes are ready
    pub fn time_until_ready(&self, count: u8, now: SimTime) -> SimTime {
        if self.can_spend(count, now) {
            return SimTime::ZERO;
        }

        // Sort ready times
        let mut times: Vec<_> = self.ready_at.iter().copied().collect();
        times.sort();

        // Time until the Nth rune is ready
        times.get(count as usize - 1)
            .map(|&t| t.saturating_sub(now))
            .unwrap_or(SimTime::MAX)
    }

}

impl Default for RuneState {
    fn default() -> Self {
        Self::new()
    }
}
