//! Death Knight rune system.
//!
//! DKs have 6 runes that recharge independently over time.
//! Runes are spent by abilities and recharge based on haste.

/// State of a single rune.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuneState {
    /// Rune is ready to use.
    Ready,
    /// Rune is recharging, will be ready at given time (ms).
    Recharging { ready_at: u32 },
}

impl Default for RuneState {
    fn default() -> Self {
        Self::Ready
    }
}

/// A single rune.
#[derive(Debug, Clone, Copy, Default)]
pub struct Rune {
    state: RuneState,
}

impl Rune {
    /// Create a ready rune.
    pub fn ready() -> Self {
        Self {
            state: RuneState::Ready,
        }
    }

    /// Create a recharging rune.
    pub fn recharging(ready_at: u32) -> Self {
        Self {
            state: RuneState::Recharging { ready_at },
        }
    }

    /// Check if rune is ready.
    #[inline]
    pub fn is_ready(&self) -> bool {
        matches!(self.state, RuneState::Ready)
    }

    /// Get time when rune will be ready (0 if already ready).
    #[inline]
    pub fn ready_at(&self) -> u32 {
        match self.state {
            RuneState::Ready => 0,
            RuneState::Recharging { ready_at } => ready_at,
        }
    }

    /// Spend the rune, starting recharge.
    /// Returns false if rune wasn't ready.
    #[inline]
    pub fn spend(&mut self, current_time: u32, recharge_ms: u32) -> bool {
        if self.is_ready() {
            self.state = RuneState::Recharging {
                ready_at: current_time + recharge_ms,
            };
            true
        } else {
            false
        }
    }

    /// Update rune state based on current time.
    #[inline]
    pub fn update(&mut self, current_time: u32) {
        if let RuneState::Recharging { ready_at } = self.state {
            if current_time >= ready_at {
                self.state = RuneState::Ready;
            }
        }
    }

    /// Force rune to ready state.
    #[inline]
    pub fn make_ready(&mut self) {
        self.state = RuneState::Ready;
    }
}

/// A set of 6 Death Knight runes.
#[derive(Debug, Clone, Copy)]
pub struct RuneSet {
    /// The 6 runes.
    runes: [Rune; 6],
    /// Base recharge time in milliseconds (before haste).
    base_recharge_ms: u32,
}

impl Default for RuneSet {
    fn default() -> Self {
        Self::new(10000) // 10 second base recharge
    }
}

impl RuneSet {
    /// Create a new rune set with all runes ready.
    pub fn new(base_recharge_ms: u32) -> Self {
        Self {
            runes: [Rune::ready(); 6],
            base_recharge_ms,
        }
    }

    /// Count ready runes.
    #[inline]
    pub fn ready_count(&self) -> u8 {
        self.runes.iter().filter(|r| r.is_ready()).count() as u8
    }

    /// Check if at least N runes are ready.
    #[inline]
    pub fn has_runes(&self, count: u8) -> bool {
        self.ready_count() >= count
    }

    /// Get recharge time with haste applied.
    #[inline]
    pub fn recharge_time(&self, haste_mult: f32) -> u32 {
        (self.base_recharge_ms as f32 / haste_mult) as u32
    }

    /// Spend N runes. Returns actual number spent.
    pub fn spend(&mut self, count: u8, current_time: u32, haste_mult: f32) -> u8 {
        let recharge_ms = self.recharge_time(haste_mult);
        let mut spent = 0u8;

        for rune in &mut self.runes {
            if spent >= count {
                break;
            }
            if rune.spend(current_time, recharge_ms) {
                spent += 1;
            }
        }

        spent
    }

    /// Update all runes based on current time.
    pub fn update(&mut self, current_time: u32) {
        for rune in &mut self.runes {
            rune.update(current_time);
        }
    }

    /// Get time until next rune is ready (None if all ready).
    pub fn time_to_next(&self) -> Option<u32> {
        self.runes
            .iter()
            .filter_map(|r| match r.state {
                RuneState::Recharging { ready_at } => Some(ready_at),
                RuneState::Ready => None,
            })
            .min()
    }

    /// Get time until N runes are ready (None if already have N).
    pub fn time_to_runes(&self, count: u8) -> Option<u32> {
        if self.ready_count() >= count {
            return Some(0);
        }

        // Get sorted list of recharge times
        let mut times: Vec<u32> = self
            .runes
            .iter()
            .filter_map(|r| match r.state {
                RuneState::Recharging { ready_at } => Some(ready_at),
                RuneState::Ready => None,
            })
            .collect();
        times.sort_unstable();

        let needed = count.saturating_sub(self.ready_count()) as usize;
        times.get(needed.saturating_sub(1)).copied()
    }

    /// Reset all runes to ready.
    pub fn reset(&mut self) {
        for rune in &mut self.runes {
            rune.make_ready();
        }
    }

    /// Access runes directly.
    pub fn runes(&self) -> &[Rune; 6] {
        &self.runes
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rune_ready() {
        let rune = Rune::ready();
        assert!(rune.is_ready());
        assert_eq!(rune.ready_at(), 0);
    }

    #[test]
    fn test_rune_spend() {
        let mut rune = Rune::ready();
        assert!(rune.spend(1000, 10000)); // Spend at time 1000, 10s recharge
        assert!(!rune.is_ready());
        assert_eq!(rune.ready_at(), 11000);

        // Can't spend again
        assert!(!rune.spend(1000, 10000));
    }

    #[test]
    fn test_rune_update() {
        let mut rune = Rune::recharging(5000);

        rune.update(4000); // Not ready yet
        assert!(!rune.is_ready());

        rune.update(5000); // Now ready
        assert!(rune.is_ready());
    }

    #[test]
    fn test_rune_set_ready_count() {
        let set = RuneSet::new(10000);
        assert_eq!(set.ready_count(), 6);
        assert!(set.has_runes(6));
    }

    #[test]
    fn test_rune_set_spend() {
        let mut set = RuneSet::new(10000);

        let spent = set.spend(2, 0, 1.0); // Spend 2 at time 0, no haste
        assert_eq!(spent, 2);
        assert_eq!(set.ready_count(), 4);
    }

    #[test]
    fn test_rune_set_spend_with_haste() {
        let mut set = RuneSet::new(10000);

        // With 25% haste, recharge = 10000 / 1.25 = 8000ms
        set.spend(1, 0, 1.25);

        let next = set.time_to_next();
        assert_eq!(next, Some(8000));
    }

    #[test]
    fn test_rune_set_time_to_runes() {
        let mut set = RuneSet::new(10000);
        set.spend(3, 0, 1.0); // Spend 3 at different times

        // We have 3 ready, need 4
        let time = set.time_to_runes(4);
        assert!(time.is_some());
    }
}
