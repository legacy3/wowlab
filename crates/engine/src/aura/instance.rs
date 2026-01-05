use crate::types::{SimTime, AuraIdx, TargetIdx};
use crate::combat::ActionState;

/// Flags for aura behavior
#[derive(Clone, Copy, Debug, Default)]
pub struct AuraFlags {
    /// Is a debuff (on enemy)
    pub is_debuff: bool,
    /// Has periodic damage/heal
    pub is_periodic: bool,
    /// Can pandemic (extend duration)
    pub can_pandemic: bool,
    /// Snapshots stats at application
    pub snapshots: bool,
    /// Is a hidden aura (internal tracking only)
    pub is_hidden: bool,
    /// Refreshes on reapply instead of replacing
    pub refreshable: bool,
}

/// A single aura instance on a target
#[derive(Clone, Debug)]
pub struct AuraInstance {
    /// Which aura this is
    pub aura_id: AuraIdx,
    /// Target it's applied to
    pub target: TargetIdx,
    /// When it expires
    pub expires_at: SimTime,
    /// Base duration (for pandemic calc)
    pub base_duration: SimTime,
    /// Current stack count
    pub stacks: u8,
    /// Max stacks
    pub max_stacks: u8,
    /// Snapshotted stats (if applicable)
    pub snapshot: Option<ActionState>,
    /// Behavior flags
    pub flags: AuraFlags,
    /// Next tick time (for periodic)
    pub next_tick: Option<SimTime>,
    /// Tick interval
    pub tick_interval: Option<SimTime>,
    /// Remaining ticks (for partial tick tracking)
    pub remaining_ticks: u8,
}

impl AuraInstance {
    pub fn new(
        aura_id: AuraIdx,
        target: TargetIdx,
        duration: SimTime,
        now: SimTime,
        flags: AuraFlags,
    ) -> Self {
        Self {
            aura_id,
            target,
            expires_at: now + duration,
            base_duration: duration,
            stacks: 1,
            max_stacks: 1,
            snapshot: None,
            flags,
            next_tick: None,
            tick_interval: None,
            remaining_ticks: 0,
        }
    }

    pub fn with_stacks(mut self, max: u8) -> Self {
        self.max_stacks = max;
        self
    }

    pub fn with_snapshot(mut self, snapshot: ActionState) -> Self {
        self.snapshot = Some(snapshot);
        self
    }

    pub fn with_periodic(mut self, interval: SimTime, now: SimTime) -> Self {
        self.tick_interval = Some(interval);
        self.next_tick = Some(now + interval);
        // Calculate total ticks
        let duration_ms = self.base_duration.as_millis();
        let interval_ms = interval.as_millis();
        self.remaining_ticks = (duration_ms / interval_ms) as u8;
        self
    }

    /// Is the aura still active?
    #[inline]
    pub fn is_active(&self, now: SimTime) -> bool {
        now < self.expires_at
    }

    /// Remaining duration
    #[inline]
    pub fn remaining(&self, now: SimTime) -> SimTime {
        if now >= self.expires_at {
            SimTime::ZERO
        } else {
            self.expires_at - now
        }
    }

    /// Add stack (returns true if added, false if at max)
    pub fn add_stack(&mut self) -> bool {
        if self.stacks < self.max_stacks {
            self.stacks += 1;
            true
        } else {
            false
        }
    }

    /// Remove stack (returns remaining)
    pub fn remove_stack(&mut self) -> u8 {
        self.stacks = self.stacks.saturating_sub(1);
        self.stacks
    }

    /// Refresh duration with pandemic
    pub fn refresh(&mut self, now: SimTime) {
        let remaining = self.remaining(now);

        if self.flags.can_pandemic {
            // Pandemic: up to 30% of base duration can carry over
            let max_pandemic = SimTime::from_millis(
                (self.base_duration.as_millis() as f32 * 0.3) as u32
            );
            let carryover = remaining.min(max_pandemic);
            self.expires_at = now + self.base_duration + carryover;
        } else {
            // Just reset to base duration
            self.expires_at = now + self.base_duration;
        }

        // Reset tick timer
        if let Some(interval) = self.tick_interval {
            self.next_tick = Some(now + interval);
            let new_duration = self.expires_at - now;
            self.remaining_ticks = (new_duration.as_millis() / interval.as_millis()) as u8;
        }
    }

    /// Process a tick, returns true if more ticks remain
    pub fn tick(&mut self) -> bool {
        if self.remaining_ticks > 0 {
            self.remaining_ticks -= 1;
        }

        if let Some(interval) = self.tick_interval {
            if let Some(ref mut next) = self.next_tick {
                *next = *next + interval;
            }
        }

        self.remaining_ticks > 0
    }
}
