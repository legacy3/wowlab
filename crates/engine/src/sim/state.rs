use crate::actor::{EnemyManager, PetManager, Player};
use crate::aura::AuraTracker;
use crate::combat::DamageMultipliers;
use crate::core::{EventQueue, FastRng};
use wowlab_common::types::SimTime;

/// Configuration for simulation
#[derive(Clone, Debug)]
pub struct SimConfig {
    /// Fight duration
    pub duration: SimTime,
    /// Target count
    pub target_count: usize,
    /// RNG seed
    pub seed: u64,
    /// Whether to track detailed events
    pub trace_events: bool,
    /// Initial distance to target
    pub initial_distance: f32,
    /// Whether targets are stacked
    pub targets_stacked: bool,
}

impl Default for SimConfig {
    fn default() -> Self {
        Self {
            duration: SimTime::from_secs(300), // 5 minute fight
            target_count: 1,
            seed: 42,
            trace_events: false,
            initial_distance: 30.0,
            targets_stacked: true,
        }
    }
}

impl SimConfig {
    pub fn patchwerk() -> Self {
        Self {
            duration: SimTime::from_secs(300),
            target_count: 1,
            ..Default::default()
        }
    }

    pub fn aoe(count: usize) -> Self {
        Self {
            duration: SimTime::from_secs(60),
            target_count: count,
            targets_stacked: true,
            ..Default::default()
        }
    }

    pub fn with_duration(mut self, secs: f32) -> Self {
        self.duration = SimTime::from_secs_f32(secs);
        self
    }

    pub fn with_seed(mut self, seed: u64) -> Self {
        self.seed = seed;
        self
    }

    pub fn with_trace(mut self) -> Self {
        self.trace_events = true;
        self
    }
}

/// Rolling window for DPS calculation (used for TTD estimates)
#[derive(Debug, Clone)]
pub struct DpsWindow {
    /// Circular buffer of (time, damage) samples
    samples: Vec<(SimTime, f32)>,
    /// Window duration in seconds
    window_secs: f32,
    /// Total damage in window
    window_damage: f32,
}

impl Default for DpsWindow {
    fn default() -> Self {
        Self::new(10.0) // 10-second rolling window
    }
}

impl DpsWindow {
    /// Create a new DPS window with the given duration
    pub fn new(window_secs: f32) -> Self {
        Self {
            samples: Vec::with_capacity(256),
            window_secs,
            window_damage: 0.0,
        }
    }

    /// Record damage at the given time
    pub fn record(&mut self, time: SimTime, damage: f32) {
        self.samples.push((time, damage));
        self.window_damage += damage;
    }

    /// Prune old samples and return current DPS
    pub fn current_dps(&mut self, now: SimTime) -> f32 {
        let cutoff = now.saturating_sub(SimTime::from_secs_f32(self.window_secs));

        // Remove old samples
        let mut removed_damage = 0.0;
        self.samples.retain(|(t, d)| {
            if *t < cutoff {
                removed_damage += *d;
                false
            } else {
                true
            }
        });
        self.window_damage -= removed_damage;

        // Calculate DPS
        if self.samples.is_empty() {
            return 0.0;
        }

        // Time span of samples
        let earliest = self.samples.first().map(|(t, _)| *t).unwrap_or(now);
        let span = now.saturating_sub(earliest).as_secs_f32();

        if span < 0.1 {
            // Not enough time to calculate meaningful DPS
            return 0.0;
        }

        self.window_damage / span
    }

    /// Reset the window
    pub fn reset(&mut self) {
        self.samples.clear();
        self.window_damage = 0.0;
    }
}

/// Main simulation state
#[derive(Debug)]
pub struct SimState {
    /// Configuration
    pub config: SimConfig,
    /// Event queue
    pub events: EventQueue,
    /// Current simulation time (tracked separately from queue)
    current_time: SimTime,
    /// RNG
    pub rng: FastRng,
    /// Player
    pub player: Player,
    /// Pets
    pub pets: PetManager,
    /// Enemies
    pub enemies: EnemyManager,
    /// Aura tracker
    pub auras: AuraTracker,
    /// Global damage multipliers
    pub multipliers: DamageMultipliers,
    /// Iteration number (for batch runs)
    pub iteration: u32,
    /// Is simulation complete
    pub finished: bool,
    /// Accumulated damage
    pub total_damage: f64,
    /// Event trace (if enabled)
    pub trace: Vec<TraceEvent>,
    /// Rolling DPS window for TTD calculations (damage in last N seconds)
    dps_window: DpsWindow,
}

/// Traced event for debugging
#[derive(Clone, Debug)]
pub struct TraceEvent {
    pub time: SimTime,
    pub event_type: TraceEventType,
}

#[derive(Clone, Debug)]
pub enum TraceEventType {
    SpellCast {
        spell: wowlab_common::types::SpellIdx,
        target: wowlab_common::types::TargetIdx,
    },
    Damage {
        spell: wowlab_common::types::SpellIdx,
        amount: f32,
        is_crit: bool,
    },
    AuraApply {
        aura: wowlab_common::types::AuraIdx,
        target: wowlab_common::types::TargetIdx,
    },
    AuraExpire {
        aura: wowlab_common::types::AuraIdx,
        target: wowlab_common::types::TargetIdx,
    },
    ResourceGain {
        resource: wowlab_common::types::ResourceType,
        amount: f32,
    },
    CooldownStart {
        spell: wowlab_common::types::SpellIdx,
    },
    ProcTrigger {
        proc: wowlab_common::types::ProcIdx,
    },
}

impl SimState {
    pub fn new(config: SimConfig, player: Player) -> Self {
        let mut events = EventQueue::new();

        // Schedule simulation end
        events.schedule(config.duration, crate::core::SimEvent::SimEnd);

        // Schedule resource ticks (every 100ms for energy/focus)
        events.schedule(
            SimTime::from_millis(100),
            crate::core::SimEvent::ResourceTick,
        );

        // Schedule initial GCD end to start rotation
        events.schedule(SimTime::ZERO, crate::core::SimEvent::GcdEnd);

        Self {
            rng: FastRng::new(config.seed),
            enemies: EnemyManager::with_bosses(config.target_count),
            auras: AuraTracker::new().with_targets(config.target_count),
            config,
            events,
            current_time: SimTime::ZERO,
            player,
            pets: PetManager::new(),
            multipliers: DamageMultipliers::default(),
            iteration: 0,
            finished: false,
            total_damage: 0.0,
            trace: Vec::new(),
            dps_window: DpsWindow::default(),
        }
    }

    /// Reset for new iteration
    pub fn reset(&mut self, iteration: u32) {
        self.iteration = iteration;
        self.finished = false;
        self.total_damage = 0.0;
        self.trace.clear();
        self.current_time = SimTime::ZERO;

        // Reset RNG with new seed based on iteration
        self.rng = FastRng::new(self.config.seed.wrapping_add(iteration as u64));

        // Reset event queue
        self.events.clear();
        self.events
            .schedule(self.config.duration, crate::core::SimEvent::SimEnd);
        self.events.schedule(
            SimTime::from_millis(100),
            crate::core::SimEvent::ResourceTick,
        );
        self.events
            .schedule(SimTime::ZERO, crate::core::SimEvent::GcdEnd);

        // Reset actors
        self.player.reset();
        self.pets.reset();
        self.enemies.reset();
        self.auras.reset();
        self.multipliers = DamageMultipliers::default();
        self.dps_window.reset();
    }

    /// Current simulation time
    #[inline]
    pub fn now(&self) -> SimTime {
        self.current_time
    }

    /// Advance current time (called by executor when processing events)
    #[inline]
    pub fn advance_time(&mut self, time: SimTime) {
        self.current_time = time;
    }

    /// Fight progress (0.0 to 1.0)
    #[inline]
    pub fn progress(&self) -> f32 {
        self.now().as_secs_f32() / self.config.duration.as_secs_f32()
    }

    /// Time remaining in fight
    #[inline]
    pub fn remaining(&self) -> SimTime {
        self.config.duration.saturating_sub(self.now())
    }

    /// Record damage
    pub fn record_damage(&mut self, amount: f32) {
        self.total_damage += amount as f64;
        self.dps_window.record(self.current_time, amount);
    }

    /// Get rolling DPS (for TTD calculations)
    pub fn rolling_dps(&mut self) -> f32 {
        self.dps_window.current_dps(self.current_time)
    }

    /// Get rolling DPS (immutable version using overall DPS as fallback)
    pub fn rolling_dps_estimate(&self) -> f32 {
        // Use overall DPS as fallback since we can't mutate
        self.current_dps() as f32
    }

    /// Add trace event
    pub fn trace(&mut self, event_type: TraceEventType) {
        if self.config.trace_events {
            self.trace.push(TraceEvent {
                time: self.now(),
                event_type,
            });
        }
    }

    /// Calculate DPS so far
    pub fn current_dps(&self) -> f64 {
        let seconds = self.now().as_secs_f32() as f64;
        if seconds > 0.0 {
            self.total_damage / seconds
        } else {
            0.0
        }
    }

    /// Schedule an event relative to current time
    #[inline]
    pub fn schedule_in(&mut self, delay: SimTime, event: crate::core::SimEvent) {
        self.events.schedule_in(self.current_time, delay, event);
    }
}
