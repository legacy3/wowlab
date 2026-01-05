use crate::types::SimTime;
use crate::core::{EventQueue, FastRng};
use crate::actor::{Player, PetManager, EnemyManager};
use crate::aura::AuraTracker;
use crate::combat::DamageMultipliers;

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
}

/// Traced event for debugging
#[derive(Clone, Debug)]
pub struct TraceEvent {
    pub time: SimTime,
    pub event_type: TraceEventType,
}

#[derive(Clone, Debug)]
pub enum TraceEventType {
    SpellCast { spell: crate::types::SpellIdx, target: crate::types::TargetIdx },
    Damage { spell: crate::types::SpellIdx, amount: f32, is_crit: bool },
    AuraApply { aura: crate::types::AuraIdx, target: crate::types::TargetIdx },
    AuraExpire { aura: crate::types::AuraIdx, target: crate::types::TargetIdx },
    ResourceGain { resource: crate::types::ResourceType, amount: f32 },
    CooldownStart { spell: crate::types::SpellIdx },
    ProcTrigger { proc: crate::types::ProcIdx },
}

impl SimState {
    pub fn new(config: SimConfig, player: Player) -> Self {
        let mut events = EventQueue::new();

        // Schedule simulation end
        events.schedule(config.duration, crate::core::SimEvent::SimEnd);

        // Schedule resource ticks (every 100ms for energy/focus)
        events.schedule(SimTime::from_millis(100), crate::core::SimEvent::ResourceTick);

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
        self.events.schedule(self.config.duration, crate::core::SimEvent::SimEnd);
        self.events.schedule(SimTime::from_millis(100), crate::core::SimEvent::ResourceTick);
        self.events.schedule(SimTime::ZERO, crate::core::SimEvent::GcdEnd);

        // Reset actors
        self.player.reset();
        self.pets.reset();
        self.enemies.reset();
        self.auras.reset();
        self.multipliers = DamageMultipliers::default();
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
