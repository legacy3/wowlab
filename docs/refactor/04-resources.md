# Phase 04: Resources

## Goal

Create the resource system: resource pools, regeneration, DK runes.

## Prerequisites

Phase 03 complete. `cargo test -p engine_new` passes (26 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod resource;
└── resource/
    ├── mod.rs
    ├── pool.rs
    ├── regen.rs
    └── runes.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
pub mod resource;
```

### `src/resource/mod.rs`

```rust
mod pool;
mod regen;
mod runes;

pub use pool::*;
pub use regen::*;
pub use runes::*;

#[cfg(test)]
mod tests;
```

### `src/resource/pool.rs`

```rust
use crate::types::ResourceType;

/// A single resource pool (Focus, Energy, Rage, etc.)
#[derive(Clone, Debug)]
pub struct ResourcePool {
    pub resource_type: ResourceType,
    pub current: f32,
    pub max: f32,
}

impl ResourcePool {
    pub fn new(resource_type: ResourceType) -> Self {
        let max = resource_type.base_max() as f32;
        Self {
            resource_type,
            current: max,
            max,
        }
    }

    pub fn new_empty(resource_type: ResourceType) -> Self {
        Self {
            resource_type,
            current: 0.0,
            max: resource_type.base_max() as f32,
        }
    }

    /// Set max, clamping current if needed
    pub fn set_max(&mut self, max: f32) {
        self.max = max;
        if self.current > self.max {
            self.current = self.max;
        }
    }

    /// Current as integer (for display, thresholds)
    #[inline]
    pub fn current_int(&self) -> u32 {
        self.current as u32
    }

    /// Can afford cost?
    #[inline]
    pub fn can_afford(&self, cost: f32) -> bool {
        self.current >= cost
    }

    /// Spend resource (returns false if can't afford)
    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            true
        } else {
            false
        }
    }

    /// Gain resource (capped at max)
    pub fn gain(&mut self, amount: f32) {
        self.current = (self.current + amount).min(self.max);
    }

    /// Set to specific value
    pub fn set(&mut self, value: f32) {
        self.current = value.clamp(0.0, self.max);
    }

    /// Percentage full (0.0 to 1.0)
    #[inline]
    pub fn percent(&self) -> f32 {
        self.current / self.max
    }

    /// How much is missing
    #[inline]
    pub fn deficit(&self) -> f32 {
        self.max - self.current
    }
}

/// Container for all resources a unit might have
#[derive(Clone, Debug, Default)]
pub struct UnitResources {
    /// Primary resource (Focus, Energy, etc.)
    pub primary: Option<ResourcePool>,
    /// Secondary resource (Combo Points, etc.)
    pub secondary: Option<ResourcePool>,
    /// Mana (for hybrids)
    pub mana: Option<ResourcePool>,
}

impl UnitResources {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_primary(mut self, resource_type: ResourceType) -> Self {
        self.primary = Some(ResourcePool::new(resource_type));
        self
    }

    pub fn with_primary_empty(mut self, resource_type: ResourceType) -> Self {
        self.primary = Some(ResourcePool::new_empty(resource_type));
        self
    }

    pub fn with_secondary(mut self, resource_type: ResourceType) -> Self {
        self.secondary = Some(ResourcePool::new_empty(resource_type));
        self
    }

    /// Get resource by type
    pub fn get(&self, resource_type: ResourceType) -> Option<&ResourcePool> {
        if let Some(ref p) = self.primary {
            if p.resource_type == resource_type {
                return Some(p);
            }
        }
        if let Some(ref s) = self.secondary {
            if s.resource_type == resource_type {
                return Some(s);
            }
        }
        if let Some(ref m) = self.mana {
            if m.resource_type == resource_type {
                return Some(m);
            }
        }
        None
    }

    /// Get mutable resource by type
    pub fn get_mut(&mut self, resource_type: ResourceType) -> Option<&mut ResourcePool> {
        if let Some(ref mut p) = self.primary {
            if p.resource_type == resource_type {
                return Some(p);
            }
        }
        if let Some(ref mut s) = self.secondary {
            if s.resource_type == resource_type {
                return Some(s);
            }
        }
        if let Some(ref mut m) = self.mana {
            if m.resource_type == resource_type {
                return Some(m);
            }
        }
        None
    }
}
```

### `src/resource/regen.rs`

```rust
use crate::types::{ResourceType, SimTime};
use super::ResourcePool;

/// Handles resource regeneration
pub struct ResourceRegen;

impl ResourceRegen {
    /// Calculate regen amount for a time period
    pub fn calculate(
        resource_type: ResourceType,
        duration: SimTime,
        haste: f32,
    ) -> f32 {
        let base_per_sec = resource_type.base_regen_per_sec();
        if base_per_sec == 0.0 {
            return 0.0;
        }

        let seconds = duration.as_secs_f32();
        let regen_per_sec = base_per_sec * haste;

        regen_per_sec * seconds
    }

    /// Apply regen to a pool
    pub fn apply(
        pool: &mut ResourcePool,
        duration: SimTime,
        haste: f32,
    ) {
        let amount = Self::calculate(pool.resource_type, duration, haste);
        if amount > 0.0 {
            pool.gain(amount);
        }
    }

    /// Time until resource reaches target (for predictive gating)
    pub fn time_to_reach(
        pool: &ResourcePool,
        target: f32,
        haste: f32,
    ) -> Option<SimTime> {
        if pool.current >= target {
            return Some(SimTime::ZERO);
        }

        let base_per_sec = pool.resource_type.base_regen_per_sec();
        if base_per_sec == 0.0 {
            return None; // Will never reach via regen
        }

        let needed = target - pool.current;
        let regen_per_sec = base_per_sec * haste;
        let seconds = needed / regen_per_sec;

        Some(SimTime::from_secs_f32(seconds))
    }
}
```

### `src/resource/runes.rs`

```rust
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

    /// Update runes (call at regen tick or when checking)
    pub fn tick(&mut self, _now: SimTime) {
        // Runes automatically become ready when time passes
        // No explicit action needed - ready_at comparison handles it
    }
}

impl Default for RuneState {
    fn default() -> Self {
        Self::new()
    }
}
```

### `src/resource/tests.rs`

```rust
use super::*;
use crate::types::*;

#[test]
fn resource_pool_basic() {
    let mut pool = ResourcePool::new(ResourceType::Focus);
    assert_eq!(pool.max, 100.0);
    assert_eq!(pool.current, 100.0);

    pool.spend(30.0);
    assert_eq!(pool.current, 70.0);

    pool.gain(50.0);
    assert_eq!(pool.current, 100.0); // Capped at max
}

#[test]
fn resource_pool_empty() {
    let pool = ResourcePool::new_empty(ResourceType::Rage);
    assert_eq!(pool.current, 0.0);
    assert_eq!(pool.max, 100.0);
}

#[test]
fn resource_pool_can_afford() {
    let mut pool = ResourcePool::new(ResourceType::Energy);
    pool.set(50.0);

    assert!(pool.can_afford(50.0));
    assert!(pool.can_afford(30.0));
    assert!(!pool.can_afford(60.0));
}

#[test]
fn resource_pool_spend_fail() {
    let mut pool = ResourcePool::new_empty(ResourceType::Focus);
    pool.gain(20.0);

    assert!(!pool.spend(30.0)); // Can't afford
    assert_eq!(pool.current, 20.0); // Unchanged
}

#[test]
fn unit_resources_lookup() {
    let resources = UnitResources::new()
        .with_primary(ResourceType::Focus)
        .with_secondary(ResourceType::ComboPoints);

    assert!(resources.get(ResourceType::Focus).is_some());
    assert!(resources.get(ResourceType::ComboPoints).is_some());
    assert!(resources.get(ResourceType::Rage).is_none());
}

#[test]
fn regen_calculation() {
    let amount = ResourceRegen::calculate(
        ResourceType::Energy,
        SimTime::from_secs(1),
        1.0, // No haste
    );
    assert!((amount - 10.0).abs() < 0.01); // 10 energy per second base

    let hasted = ResourceRegen::calculate(
        ResourceType::Energy,
        SimTime::from_secs(1),
        1.3, // 30% haste
    );
    assert!((hasted - 13.0).abs() < 0.01);
}

#[test]
fn regen_time_to_reach() {
    let mut pool = ResourcePool::new_empty(ResourceType::Energy);
    pool.gain(50.0);

    let time = ResourceRegen::time_to_reach(&pool, 70.0, 1.0);
    assert!(time.is_some());
    assert!((time.unwrap().as_secs_f32() - 2.0).abs() < 0.01); // 20 / 10 = 2 seconds
}

#[test]
fn regen_no_regen_resource() {
    let time = ResourceRegen::time_to_reach(
        &ResourcePool::new_empty(ResourceType::Rage),
        50.0,
        1.0,
    );
    assert!(time.is_none()); // Rage doesn't regen passively
}

#[test]
fn runes_basic() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    assert_eq!(runes.ready_count(now), 6);
    assert!(runes.can_spend(3, now));

    runes.spend(2, now, SimTime::from_secs(10));
    assert_eq!(runes.ready_count(now), 4);
}

#[test]
fn runes_recharge() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    runes.spend(2, now, SimTime::from_secs(10));

    // After 10 seconds, all should be ready
    let later = SimTime::from_secs(10);
    assert_eq!(runes.ready_count(later), 6);
}

#[test]
fn runes_time_until_ready() {
    let mut runes = RuneState::new();
    let now = SimTime::ZERO;

    runes.spend(6, now, SimTime::from_secs(10)); // Spend all

    let time = runes.time_until_ready(3, now);
    // Need to wait for 3rd rune to recharge
    assert!(time.as_secs_f32() > 0.0);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (26 + 12 = 38 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod resource;`
- [ ] Create `src/resource/mod.rs`
- [ ] Create `src/resource/pool.rs`
- [ ] Create `src/resource/regen.rs`
- [ ] Create `src/resource/runes.rs`
- [ ] Create `src/resource/tests.rs`
- [ ] Run `cargo test` — 38 tests pass
