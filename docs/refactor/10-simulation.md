# Phase 10: Simulation

## Goal

Create the simulation core: SimState, main loop, batch runner.

## Prerequisites

Phase 09 complete. `cargo test -p engine_new` passes (105 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod sim;
└── sim/
    ├── mod.rs
    ├── state.rs
    ├── executor.rs
    └── batch.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
pub mod resource;
pub mod combat;
pub mod aura;
pub mod proc;
pub mod actor;
pub mod spec;
pub mod sim;
```

### `src/sim/mod.rs`

```rust
mod state;
mod executor;
mod batch;

pub use state::*;
pub use executor::*;
pub use batch::*;

#[cfg(test)]
mod tests;
```

### `src/sim/state.rs`

```rust
use crate::types::{SimTime, SpecId};
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
pub struct SimState {
    /// Configuration
    pub config: SimConfig,
    /// Event queue
    pub events: EventQueue,
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

        Self {
            rng: FastRng::new(config.seed),
            enemies: EnemyManager::with_bosses(config.target_count),
            auras: AuraTracker::new().with_targets(config.target_count),
            config,
            events,
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

        // Reset RNG with new seed based on iteration
        self.rng = FastRng::new(self.config.seed.wrapping_add(iteration as u64));

        // Reset event queue
        self.events.reset();
        self.events.schedule(self.config.duration, crate::core::SimEvent::SimEnd);
        self.events.schedule(SimTime::from_millis(100), crate::core::SimEvent::ResourceTick);

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
        self.events.now()
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
        let seconds = self.now().as_secs_f64();
        if seconds > 0.0 {
            self.total_damage / seconds
        } else {
            0.0
        }
    }
}
```

### `src/sim/executor.rs`

```rust
use crate::types::SimTime;
use crate::core::{SimEvent, ScheduledEvent};
use crate::resource::ResourceRegen;
use super::SimState;

/// Handles event execution
pub struct SimExecutor;

impl SimExecutor {
    /// Run one iteration of the simulation
    pub fn run(state: &mut SimState) {
        while let Some(event) = state.events.pop() {
            if state.finished {
                break;
            }

            Self::handle_event(state, event);
        }
    }

    /// Process a single event
    fn handle_event(state: &mut SimState, event: ScheduledEvent) {
        match event.event {
            SimEvent::SimEnd => {
                state.finished = true;
            }

            SimEvent::GcdEnd => {
                // GCD finished, rotation can proceed
                // The APL will be called on the next decision point
            }

            SimEvent::CastComplete { spell, target } => {
                // Cast finished, apply effects
                // This would be handled by the spec-specific logic
            }

            SimEvent::SpellDamage { spell, target, snapshot_id } => {
                // Damage lands after travel time
                // Apply damage using snapshotted stats
            }

            SimEvent::AuraExpire { aura, target } => {
                // Remove aura from target
                if let Some(auras) = state.auras.target_mut(target) {
                    auras.remove(aura);
                }
            }

            SimEvent::AuraTick { aura, target } => {
                // Process periodic tick
                // Calculate damage using snapshotted stats
            }

            SimEvent::CooldownReady { spell } => {
                // Cooldown finished, can cast again
            }

            SimEvent::ChargeReady { spell } => {
                // Charge regenerated
                if let Some(cd) = state.player.charged_cooldown_mut(spell) {
                    cd.add_charge(state.now());
                }
            }

            SimEvent::AutoAttack { unit } => {
                // Process auto-attack
                // Schedule next auto
            }

            SimEvent::PetAttack { pet } => {
                // Process pet auto-attack
                if let Some(p) = state.pets.get_mut(pet) {
                    if p.is_valid(state.now()) {
                        // Deal damage, schedule next
                    }
                }
            }

            SimEvent::ResourceTick => {
                // Regenerate resources
                Self::handle_resource_tick(state);

                // Schedule next tick
                if !state.finished {
                    state.events.schedule_in(
                        SimTime::from_millis(100),
                        SimEvent::ResourceTick,
                    );
                }
            }

            SimEvent::ProcIcdEnd { proc } => {
                // ICD finished, proc can trigger again
            }
        }
    }

    /// Handle resource regeneration
    fn handle_resource_tick(state: &mut SimState) {
        let haste = state.player.stats.get_haste();
        let tick_duration = SimTime::from_millis(100);

        if let Some(ref mut primary) = state.player.resources.primary {
            ResourceRegen::apply(primary, tick_duration, haste);
        }
    }
}

/// Decision context for APL
#[derive(Clone, Debug)]
pub struct DecisionContext<'a> {
    pub state: &'a SimState,
    pub now: SimTime,
}

impl<'a> DecisionContext<'a> {
    pub fn new(state: &'a SimState) -> Self {
        Self {
            now: state.now(),
            state,
        }
    }

    /// Time until something happens
    pub fn time_until(&self, target_time: SimTime) -> SimTime {
        target_time.saturating_sub(self.now)
    }

    /// Check if buff is active
    pub fn buff_up(&self, aura: crate::types::AuraIdx) -> bool {
        self.state.player.buffs.has(aura, self.now)
    }

    /// Get buff stacks
    pub fn buff_stacks(&self, aura: crate::types::AuraIdx) -> u8 {
        self.state.player.buffs.stacks(aura, self.now)
    }

    /// Check if cooldown is ready
    pub fn cooldown_ready(&self, spell: crate::types::SpellIdx) -> bool {
        self.state.player.cooldown(spell)
            .map(|cd| cd.is_ready(self.now))
            .unwrap_or(true)
    }

    /// Get cooldown remaining
    pub fn cooldown_remaining(&self, spell: crate::types::SpellIdx) -> SimTime {
        self.state.player.cooldown(spell)
            .map(|cd| cd.remaining(self.now))
            .unwrap_or(SimTime::ZERO)
    }

    /// Check if player can cast (not on GCD, not casting)
    pub fn can_cast(&self) -> bool {
        self.state.player.can_cast(self.now)
    }

    /// Get primary resource amount
    pub fn resource(&self) -> f32 {
        self.state.player.resources.primary
            .as_ref()
            .map(|r| r.current)
            .unwrap_or(0.0)
    }

    /// Get resource deficit
    pub fn resource_deficit(&self) -> f32 {
        self.state.player.resources.primary
            .as_ref()
            .map(|r| r.deficit())
            .unwrap_or(0.0)
    }

    /// Get primary target health percent
    pub fn target_health_pct(&self) -> f32 {
        self.state.enemies.primary()
            .map(|e| e.health_percent())
            .unwrap_or(1.0)
    }

    /// Get active enemy count
    pub fn enemy_count(&self) -> usize {
        self.state.enemies.alive_count()
    }
}
```

### `src/sim/batch.rs`

```rust
use super::{SimState, SimConfig, SimExecutor};
use crate::actor::Player;
use std::sync::atomic::{AtomicU32, Ordering};

/// Results from a batch of iterations
#[derive(Clone, Debug)]
pub struct BatchResults {
    /// Number of iterations
    pub iterations: u32,
    /// Mean DPS
    pub mean_dps: f64,
    /// Std dev of DPS
    pub std_dev: f64,
    /// Minimum DPS
    pub min_dps: f64,
    /// Maximum DPS
    pub max_dps: f64,
    /// All DPS values (for percentile calculations)
    pub dps_values: Vec<f64>,
}

impl BatchResults {
    pub fn from_values(values: Vec<f64>) -> Self {
        let n = values.len() as f64;
        let mean = values.iter().sum::<f64>() / n;

        let variance = values.iter()
            .map(|v| (v - mean).powi(2))
            .sum::<f64>() / n;
        let std_dev = variance.sqrt();

        let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

        Self {
            iterations: values.len() as u32,
            mean_dps: mean,
            std_dev,
            min_dps: min,
            max_dps: max,
            dps_values: values,
        }
    }

    /// Get DPS at percentile (0-100)
    pub fn percentile(&self, p: f64) -> f64 {
        if self.dps_values.is_empty() {
            return 0.0;
        }

        let mut sorted = self.dps_values.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let index = ((p / 100.0) * (sorted.len() - 1) as f64) as usize;
        sorted[index.min(sorted.len() - 1)]
    }

    /// Median DPS
    pub fn median(&self) -> f64 {
        self.percentile(50.0)
    }

    /// Coefficient of variation (std_dev / mean)
    pub fn cv(&self) -> f64 {
        if self.mean_dps > 0.0 {
            self.std_dev / self.mean_dps
        } else {
            0.0
        }
    }
}

/// Runs multiple simulation iterations
pub struct BatchRunner {
    config: SimConfig,
    player_template: Player,
    iterations: u32,
}

impl BatchRunner {
    pub fn new(config: SimConfig, player: Player) -> Self {
        Self {
            config,
            player_template: player,
            iterations: 1000,
        }
    }

    pub fn with_iterations(mut self, count: u32) -> Self {
        self.iterations = count;
        self
    }

    /// Run all iterations (single-threaded)
    pub fn run(&self) -> BatchResults {
        let mut dps_values = Vec::with_capacity(self.iterations as usize);

        for i in 0..self.iterations {
            let mut config = self.config.clone();
            config.seed = config.seed.wrapping_add(i as u64);

            let mut state = SimState::new(config, self.player_template.clone());
            SimExecutor::run(&mut state);

            dps_values.push(state.current_dps());
        }

        BatchResults::from_values(dps_values)
    }

    /// Run with progress callback
    pub fn run_with_progress<F>(&self, mut callback: F) -> BatchResults
    where
        F: FnMut(u32, u32),
    {
        let mut dps_values = Vec::with_capacity(self.iterations as usize);

        for i in 0..self.iterations {
            let mut config = self.config.clone();
            config.seed = config.seed.wrapping_add(i as u64);

            let mut state = SimState::new(config, self.player_template.clone());
            SimExecutor::run(&mut state);

            dps_values.push(state.current_dps());

            callback(i + 1, self.iterations);
        }

        BatchResults::from_values(dps_values)
    }
}

/// Progress tracking for parallel execution
pub struct Progress {
    completed: AtomicU32,
    total: u32,
}

impl Progress {
    pub fn new(total: u32) -> Self {
        Self {
            completed: AtomicU32::new(0),
            total,
        }
    }

    pub fn increment(&self) -> u32 {
        self.completed.fetch_add(1, Ordering::Relaxed) + 1
    }

    pub fn completed(&self) -> u32 {
        self.completed.load(Ordering::Relaxed)
    }

    pub fn total(&self) -> u32 {
        self.total
    }

    pub fn percent(&self) -> f32 {
        (self.completed() as f32 / self.total as f32) * 100.0
    }
}
```

### `src/sim/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::actor::Player;

#[test]
fn sim_config_defaults() {
    let config = SimConfig::default();

    assert_eq!(config.duration.as_secs_f32(), 300.0);
    assert_eq!(config.target_count, 1);
}

#[test]
fn sim_config_patchwerk() {
    let config = SimConfig::patchwerk();

    assert_eq!(config.target_count, 1);
    assert_eq!(config.duration.as_secs_f32(), 300.0);
}

#[test]
fn sim_config_aoe() {
    let config = SimConfig::aoe(5);

    assert_eq!(config.target_count, 5);
    assert!(config.targets_stacked);
}

#[test]
fn sim_state_creation() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);

    assert_eq!(state.now(), SimTime::ZERO);
    assert!(!state.finished);
    assert_eq!(state.iteration, 0);
}

#[test]
fn sim_state_progress() {
    let config = SimConfig::default().with_duration(100.0);
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);

    assert!((state.progress() - 0.0).abs() < 0.01);
    assert!((state.remaining().as_secs_f32() - 100.0).abs() < 0.1);
}

#[test]
fn sim_state_reset() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    state.total_damage = 1000000.0;
    state.iteration = 5;

    state.reset(10);

    assert_eq!(state.iteration, 10);
    assert_eq!(state.total_damage, 0.0);
}

#[test]
fn sim_state_record_damage() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    state.record_damage(1000.0);
    state.record_damage(2000.0);

    assert_eq!(state.total_damage, 3000.0);
}

#[test]
fn batch_results_statistics() {
    let values = vec![100.0, 110.0, 120.0, 130.0, 140.0];
    let results = BatchResults::from_values(values);

    assert_eq!(results.iterations, 5);
    assert!((results.mean_dps - 120.0).abs() < 0.01);
    assert!((results.min_dps - 100.0).abs() < 0.01);
    assert!((results.max_dps - 140.0).abs() < 0.01);
}

#[test]
fn batch_results_percentile() {
    let values: Vec<f64> = (1..=100).map(|i| i as f64).collect();
    let results = BatchResults::from_values(values);

    assert!((results.percentile(50.0) - 50.0).abs() < 1.0);
    assert!((results.percentile(0.0) - 1.0).abs() < 0.01);
    assert!((results.percentile(100.0) - 100.0).abs() < 0.01);
}

#[test]
fn batch_results_cv() {
    let values = vec![100.0, 100.0, 100.0]; // No variance
    let results = BatchResults::from_values(values);

    assert!((results.cv() - 0.0).abs() < 0.01);
}

#[test]
fn batch_runner_basic() {
    let config = SimConfig::default().with_duration(10.0);
    let player = Player::new(SpecId::BeastMastery);
    let runner = BatchRunner::new(config, player)
        .with_iterations(10);

    let results = runner.run();

    assert_eq!(results.iterations, 10);
}

#[test]
fn progress_tracking() {
    let progress = Progress::new(100);

    assert_eq!(progress.completed(), 0);
    assert_eq!(progress.total(), 100);

    progress.increment();
    progress.increment();

    assert_eq!(progress.completed(), 2);
    assert!((progress.percent() - 2.0).abs() < 0.01);
}

#[test]
fn decision_context_basic() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let state = SimState::new(config, player);
    let ctx = DecisionContext::new(&state);

    assert!(ctx.can_cast());
    assert!((ctx.target_health_pct() - 1.0).abs() < 0.01);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (105 + 13 = 118 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod sim;`
- [ ] Create `src/sim/mod.rs`
- [ ] Create `src/sim/state.rs`
- [ ] Create `src/sim/executor.rs`
- [ ] Create `src/sim/batch.rs`
- [ ] Create `src/sim/tests.rs`
- [ ] Run `cargo test` — 118 tests pass
