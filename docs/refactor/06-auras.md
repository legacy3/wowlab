# Phase 06: Auras

## Goal

Create the aura system: buffs, debuffs, periodic effects, per-target tracking.

## Prerequisites

Phase 05 complete. `cargo test -p engine_new` passes (51 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod aura;
└── aura/
    ├── mod.rs
    ├── instance.rs
    ├── tracker.rs
    └── periodic.rs
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
```

### `src/aura/mod.rs`

```rust
mod instance;
mod tracker;
mod periodic;

pub use instance::*;
pub use tracker::*;
pub use periodic::*;

#[cfg(test)]
mod tests;
```

### `src/aura/instance.rs`

```rust
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
```

### `src/aura/tracker.rs`

```rust
use crate::types::{AuraIdx, TargetIdx, SimTime};
use super::AuraInstance;

/// Per-target aura tracking
#[derive(Clone, Debug, Default)]
pub struct TargetAuras {
    auras: Vec<AuraInstance>,
}

impl TargetAuras {
    pub fn new() -> Self {
        Self { auras: Vec::with_capacity(16) }
    }

    /// Get aura by ID
    pub fn get(&self, aura_id: AuraIdx) -> Option<&AuraInstance> {
        self.auras.iter().find(|a| a.aura_id == aura_id)
    }

    /// Get mutable aura by ID
    pub fn get_mut(&mut self, aura_id: AuraIdx) -> Option<&mut AuraInstance> {
        self.auras.iter_mut().find(|a| a.aura_id == aura_id)
    }

    /// Check if aura is active
    pub fn has(&self, aura_id: AuraIdx, now: SimTime) -> bool {
        self.auras.iter().any(|a| a.aura_id == aura_id && a.is_active(now))
    }

    /// Get stack count (0 if not present)
    pub fn stacks(&self, aura_id: AuraIdx, now: SimTime) -> u8 {
        self.auras
            .iter()
            .find(|a| a.aura_id == aura_id && a.is_active(now))
            .map(|a| a.stacks)
            .unwrap_or(0)
    }

    /// Apply or refresh aura
    pub fn apply(&mut self, aura: AuraInstance, now: SimTime) {
        if let Some(existing) = self.get_mut(aura.aura_id) {
            if existing.flags.refreshable {
                existing.refresh(now);
                existing.add_stack();
            }
            // If not refreshable, do nothing (or replace based on game rules)
        } else {
            self.auras.push(aura);
        }
    }

    /// Remove aura by ID
    pub fn remove(&mut self, aura_id: AuraIdx) -> Option<AuraInstance> {
        if let Some(pos) = self.auras.iter().position(|a| a.aura_id == aura_id) {
            Some(self.auras.swap_remove(pos))
        } else {
            None
        }
    }

    /// Remove expired auras
    pub fn cleanup(&mut self, now: SimTime) {
        self.auras.retain(|a| a.is_active(now));
    }

    /// Iterate all active auras
    pub fn iter(&self) -> impl Iterator<Item = &AuraInstance> {
        self.auras.iter()
    }

    /// Iterate active auras mutably
    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut AuraInstance> {
        self.auras.iter_mut()
    }

    /// Count of active debuffs
    pub fn debuff_count(&self, now: SimTime) -> usize {
        self.auras.iter().filter(|a| a.flags.is_debuff && a.is_active(now)).count()
    }

    /// Count of active buffs
    pub fn buff_count(&self, now: SimTime) -> usize {
        self.auras.iter().filter(|a| !a.flags.is_debuff && a.is_active(now)).count()
    }
}

/// Tracks auras across all targets
#[derive(Clone, Debug, Default)]
pub struct AuraTracker {
    /// Player's own buffs
    pub player: TargetAuras,
    /// Per-target debuffs (indexed by TargetIdx)
    targets: Vec<TargetAuras>,
}

impl AuraTracker {
    pub fn new() -> Self {
        Self {
            player: TargetAuras::new(),
            targets: Vec::new(),
        }
    }

    pub fn with_targets(mut self, count: usize) -> Self {
        self.targets = (0..count).map(|_| TargetAuras::new()).collect();
        self
    }

    /// Reset for new simulation
    pub fn reset(&mut self) {
        self.player = TargetAuras::new();
        for target in &mut self.targets {
            *target = TargetAuras::new();
        }
    }

    /// Get target's auras
    pub fn target(&self, target: TargetIdx) -> Option<&TargetAuras> {
        self.targets.get(target.0 as usize)
    }

    /// Get target's auras mutably
    pub fn target_mut(&mut self, target: TargetIdx) -> Option<&mut TargetAuras> {
        self.targets.get_mut(target.0 as usize)
    }

    /// Check if aura is on any target
    pub fn on_any_target(&self, aura_id: AuraIdx, now: SimTime) -> bool {
        self.targets.iter().any(|t| t.has(aura_id, now))
    }

    /// Count targets with specific aura
    pub fn targets_with_aura(&self, aura_id: AuraIdx, now: SimTime) -> usize {
        self.targets.iter().filter(|t| t.has(aura_id, now)).count()
    }

    /// Get all periodic auras that need ticking
    pub fn get_pending_ticks(&self, now: SimTime) -> Vec<(TargetIdx, AuraIdx)> {
        let mut pending = Vec::new();

        // Player buffs
        for aura in self.player.iter() {
            if let Some(next) = aura.next_tick {
                if next <= now && aura.is_active(now) {
                    pending.push((TargetIdx(0), aura.aura_id));
                }
            }
        }

        // Target debuffs
        for (i, target) in self.targets.iter().enumerate() {
            for aura in target.iter() {
                if let Some(next) = aura.next_tick {
                    if next <= now && aura.is_active(now) {
                        pending.push((TargetIdx(i as u8), aura.aura_id));
                    }
                }
            }
        }

        pending
    }

    /// Clean up all expired auras
    pub fn cleanup_all(&mut self, now: SimTime) {
        self.player.cleanup(now);
        for target in &mut self.targets {
            target.cleanup(now);
        }
    }
}
```

### `src/aura/periodic.rs`

```rust
use crate::types::{SimTime, AuraIdx};
use crate::combat::ActionState;

/// Defines periodic effect behavior
#[derive(Clone, Debug)]
pub struct PeriodicEffect {
    /// Aura this periodic belongs to
    pub aura_id: AuraIdx,
    /// Tick interval
    pub interval: SimTime,
    /// Base tick damage/heal coefficient
    pub coefficient: f32,
    /// Scales with haste (changes interval)
    pub haste_scales_interval: bool,
    /// Scales with haste (adds ticks)
    pub haste_adds_ticks: bool,
    /// Spell power coefficient for scaling
    pub sp_coefficient: f32,
    /// Attack power coefficient for scaling
    pub ap_coefficient: f32,
}

impl PeriodicEffect {
    pub fn new(aura_id: AuraIdx, interval: SimTime) -> Self {
        Self {
            aura_id,
            interval,
            coefficient: 1.0,
            haste_scales_interval: true,
            haste_adds_ticks: false,
            sp_coefficient: 0.0,
            ap_coefficient: 0.0,
        }
    }

    pub fn with_coefficient(mut self, coef: f32) -> Self {
        self.coefficient = coef;
        self
    }

    pub fn with_sp_scaling(mut self, coef: f32) -> Self {
        self.sp_coefficient = coef;
        self
    }

    pub fn with_ap_scaling(mut self, coef: f32) -> Self {
        self.ap_coefficient = coef;
        self
    }

    /// Calculate effective interval with haste
    pub fn effective_interval(&self, haste: f32) -> SimTime {
        if self.haste_scales_interval {
            let ms = (self.interval.as_millis() as f32 / haste) as u32;
            SimTime::from_millis(ms.max(1))
        } else {
            self.interval
        }
    }

    /// Calculate total ticks for a duration
    pub fn total_ticks(&self, duration: SimTime, haste: f32) -> u8 {
        let effective = self.effective_interval(haste);
        let base_ticks = (duration.as_millis() / effective.as_millis()) as u8;

        if self.haste_adds_ticks {
            // Haste adds ticks instead of reducing interval
            ((base_ticks as f32) * haste) as u8
        } else {
            base_ticks
        }
    }

    /// Calculate tick damage
    pub fn tick_damage(&self, snapshot: &ActionState) -> f32 {
        let base = if self.sp_coefficient > 0.0 {
            snapshot.spell_power * self.sp_coefficient
        } else if self.ap_coefficient > 0.0 {
            snapshot.attack_power * self.ap_coefficient
        } else {
            0.0
        };

        base * self.coefficient
    }
}
```

### `src/aura/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::combat::ActionState;

#[test]
fn aura_instance_basic() {
    let now = SimTime::ZERO;
    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    );

    assert!(aura.is_active(now));
    assert_eq!(aura.stacks, 1);
    assert_eq!(aura.remaining(now).as_secs_f32(), 10.0);
}

#[test]
fn aura_instance_expiry() {
    let now = SimTime::ZERO;
    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    );

    assert!(aura.is_active(SimTime::from_secs(5)));
    assert!(aura.is_active(SimTime::from_secs(9)));
    assert!(!aura.is_active(SimTime::from_secs(10)));
    assert!(!aura.is_active(SimTime::from_secs(15)));
}

#[test]
fn aura_instance_stacks() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags::default(),
    ).with_stacks(3);

    assert_eq!(aura.stacks, 1);
    assert!(aura.add_stack());
    assert_eq!(aura.stacks, 2);
    assert!(aura.add_stack());
    assert_eq!(aura.stacks, 3);
    assert!(!aura.add_stack()); // At max
    assert_eq!(aura.stacks, 3);
}

#[test]
fn aura_pandemic_refresh() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags { can_pandemic: true, refreshable: true, ..Default::default() },
    );

    // Refresh at 7 seconds (3 sec remaining, 30% of 10 = 3)
    let refresh_time = SimTime::from_secs(7);
    aura.refresh(refresh_time);

    // Should be 10 (base) + 3 (carryover) = 13 seconds from refresh
    let expected = refresh_time + SimTime::from_secs(13);
    assert_eq!(aura.expires_at, expected);
}

#[test]
fn aura_pandemic_cap() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags { can_pandemic: true, refreshable: true, ..Default::default() },
    );

    // Refresh immediately (10 sec remaining, but cap at 30% = 3)
    aura.refresh(now);

    // Should be 10 (base) + 3 (capped carryover) = 13 seconds
    let expected = now + SimTime::from_secs(13);
    assert_eq!(aura.expires_at, expected);
}

#[test]
fn target_auras_basic() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags { refreshable: true, ..Default::default() },
    );

    tracker.apply(aura, now);

    assert!(tracker.has(AuraIdx(1), now));
    assert!(!tracker.has(AuraIdx(2), now));
    assert_eq!(tracker.stacks(AuraIdx(1), now), 1);
}

#[test]
fn target_auras_refresh() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    let aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(10),
        now,
        AuraFlags { refreshable: true, ..Default::default() },
    ).with_stacks(5);

    tracker.apply(aura.clone(), now);
    tracker.apply(aura, now); // Refresh

    assert_eq!(tracker.stacks(AuraIdx(1), now), 2);
}

#[test]
fn target_auras_cleanup() {
    let now = SimTime::ZERO;
    let mut tracker = TargetAuras::new();

    tracker.apply(AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(5),
        now,
        AuraFlags::default(),
    ), now);

    tracker.apply(AuraInstance::new(
        AuraIdx(2),
        TargetIdx(0),
        SimTime::from_secs(15),
        now,
        AuraFlags::default(),
    ), now);

    let later = SimTime::from_secs(10);
    tracker.cleanup(later);

    assert!(!tracker.has(AuraIdx(1), later)); // Expired
    assert!(tracker.has(AuraIdx(2), later)); // Still active
}

#[test]
fn aura_tracker_multi_target() {
    let now = SimTime::ZERO;
    let mut tracker = AuraTracker::new().with_targets(3);

    // Apply debuff to target 0
    tracker.target_mut(TargetIdx(0)).unwrap().apply(
        AuraInstance::new(
            AuraIdx(1),
            TargetIdx(0),
            SimTime::from_secs(10),
            now,
            AuraFlags { is_debuff: true, ..Default::default() },
        ),
        now,
    );

    // Apply same debuff to target 2
    tracker.target_mut(TargetIdx(2)).unwrap().apply(
        AuraInstance::new(
            AuraIdx(1),
            TargetIdx(2),
            SimTime::from_secs(10),
            now,
            AuraFlags { is_debuff: true, ..Default::default() },
        ),
        now,
    );

    assert!(tracker.on_any_target(AuraIdx(1), now));
    assert_eq!(tracker.targets_with_aura(AuraIdx(1), now), 2);
}

#[test]
fn periodic_tick_calculation() {
    let effect = PeriodicEffect::new(AuraIdx(1), SimTime::from_secs(3))
        .with_coefficient(1.0);

    // Base: 10 seconds / 3 second interval = 3 ticks
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.0), 3);

    // With haste (interval reduced)
    let hasted_interval = effect.effective_interval(1.5);
    assert_eq!(hasted_interval.as_millis(), 2000); // 3000 / 1.5 = 2000
}

#[test]
fn periodic_with_haste_ticks() {
    let mut effect = PeriodicEffect::new(AuraIdx(1), SimTime::from_secs(3));
    effect.haste_scales_interval = false;
    effect.haste_adds_ticks = true;

    // Base: 3 ticks, with 50% haste: 4 ticks
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.0), 3);
    assert_eq!(effect.total_ticks(SimTime::from_secs(10), 1.5), 4);
}

#[test]
fn aura_instance_periodic() {
    let now = SimTime::ZERO;
    let mut aura = AuraInstance::new(
        AuraIdx(1),
        TargetIdx(0),
        SimTime::from_secs(12),
        now,
        AuraFlags { is_periodic: true, ..Default::default() },
    ).with_periodic(SimTime::from_secs(3), now);

    assert_eq!(aura.remaining_ticks, 4);
    assert_eq!(aura.next_tick, Some(SimTime::from_secs(3)));

    // Process a tick
    assert!(aura.tick());
    assert_eq!(aura.remaining_ticks, 3);
    assert_eq!(aura.next_tick, Some(SimTime::from_secs(6)));
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (51 + 13 = 64 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod aura;`
- [ ] Create `src/aura/mod.rs`
- [ ] Create `src/aura/instance.rs`
- [ ] Create `src/aura/tracker.rs`
- [ ] Create `src/aura/periodic.rs`
- [ ] Create `src/aura/tests.rs`
- [ ] Run `cargo test` — 64 tests pass
