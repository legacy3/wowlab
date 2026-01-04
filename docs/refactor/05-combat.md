# Phase 05: Combat

## Goal

Create combat mechanics: damage pipeline, multipliers, cooldowns, action state (snapshotting).

## Prerequisites

Phase 04 complete. `cargo test -p engine_new` passes (38 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod combat;
└── combat/
    ├── mod.rs
    ├── action/
    │   ├── mod.rs
    │   └── state.rs
    ├── damage/
    │   ├── mod.rs
    │   ├── pipeline.rs
    │   └── multipliers.rs
    └── cooldown/
        ├── mod.rs
        ├── cooldown.rs
        └── charges.rs
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
```

### `src/combat/mod.rs`

```rust
pub mod action;
pub mod damage;
pub mod cooldown;

pub use action::*;
pub use damage::*;
pub use cooldown::*;

#[cfg(test)]
mod tests;
```

### `src/combat/action/mod.rs`

```rust
mod state;

pub use state::*;
```

### `src/combat/action/state.rs`

```rust
use crate::types::{SnapshotFlags, DamageSchool, HitResult};

/// Snapshotted state for an action (DoTs, delayed damage)
#[derive(Clone, Debug, Default)]
pub struct ActionState {
    // Snapshotted stats
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste: f32,
    pub versatility: f32,
    pub mastery: f32,

    // Snapshotted multipliers
    pub da_multiplier: f32,
    pub ta_multiplier: f32,
    pub persistent_multiplier: f32,
    pub player_multiplier: f32,
    pub target_multiplier: f32,

    // Result tracking
    pub result: HitResult,
    pub school: DamageSchool,
}

impl ActionState {
    pub fn new() -> Self {
        Self {
            da_multiplier: 1.0,
            ta_multiplier: 1.0,
            persistent_multiplier: 1.0,
            player_multiplier: 1.0,
            target_multiplier: 1.0,
            ..Default::default()
        }
    }

    /// Snapshot stats from cache based on flags
    pub fn snapshot(
        &mut self,
        cache: &crate::stats::StatCache,
        flags: SnapshotFlags,
    ) {
        if flags.contains(SnapshotFlags::ATTACK_POWER) {
            self.attack_power = cache.attack_power();
        }
        if flags.contains(SnapshotFlags::SPELL_POWER) {
            self.spell_power = cache.spell_power();
        }
        if flags.contains(SnapshotFlags::CRIT) {
            self.crit_chance = cache.crit_chance();
        }
        if flags.contains(SnapshotFlags::HASTE) {
            self.haste = cache.haste();
        }
        if flags.contains(SnapshotFlags::VERSATILITY) {
            self.versatility = cache.versatility();
        }
        if flags.contains(SnapshotFlags::MASTERY) {
            self.mastery = cache.mastery();
        }
    }

    /// Get attack power (snapshotted or live)
    #[inline]
    pub fn get_attack_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::ATTACK_POWER) {
            self.attack_power
        } else {
            live
        }
    }

    /// Get spell power (snapshotted or live)
    #[inline]
    pub fn get_spell_power(&self, live: f32, flags: SnapshotFlags) -> f32 {
        if flags.contains(SnapshotFlags::SPELL_POWER) {
            self.spell_power
        } else {
            live
        }
    }
}

/// Unique ID for tracking snapshots (for delayed damage)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SnapshotId(pub u32);
```

### `src/combat/damage/mod.rs`

```rust
mod pipeline;
mod multipliers;

pub use pipeline::*;
pub use multipliers::*;
```

### `src/combat/damage/multipliers.rs`

```rust
use crate::types::DamageSchool;

/// Layered damage multipliers (applied multiplicatively)
#[derive(Clone, Debug)]
pub struct DamageMultipliers {
    /// Action-specific multiplier
    pub action: f32,
    /// Direct damage multiplier
    pub da: f32,
    /// Tick/periodic damage multiplier
    pub ta: f32,
    /// Persistent (snapshotted at cast)
    pub persistent: f32,
    /// Player-wide (school-based)
    pub player: f32,
    /// Target debuffs
    pub target: f32,
    /// Versatility
    pub versatility: f32,
    /// Pet owner scaling
    pub pet: f32,
    /// Crit multiplier (2.0 base)
    pub crit: f32,
}

impl Default for DamageMultipliers {
    fn default() -> Self {
        Self {
            action: 1.0,
            da: 1.0,
            ta: 1.0,
            persistent: 1.0,
            player: 1.0,
            target: 1.0,
            versatility: 1.0,
            pet: 1.0,
            crit: 2.0,
        }
    }
}

impl DamageMultipliers {
    pub fn new() -> Self {
        Self::default()
    }

    /// Calculate total multiplier for direct damage
    pub fn total_da(&self, is_crit: bool) -> f32 {
        let mut mult = self.action
            * self.da
            * self.persistent
            * self.player
            * self.target
            * (1.0 + self.versatility)
            * self.pet;

        if is_crit {
            mult *= self.crit;
        }

        mult
    }

    /// Calculate total multiplier for periodic damage
    pub fn total_ta(&self, is_crit: bool) -> f32 {
        let mut mult = self.action
            * self.ta
            * self.persistent
            * self.player
            * self.target
            * (1.0 + self.versatility)
            * self.pet;

        if is_crit {
            mult *= self.crit;
        }

        mult
    }
}

/// Per-school damage modifiers (from debuffs, etc.)
#[derive(Clone, Debug, Default)]
pub struct SchoolModifiers {
    pub physical: f32,
    pub holy: f32,
    pub fire: f32,
    pub nature: f32,
    pub frost: f32,
    pub shadow: f32,
    pub arcane: f32,
}

impl SchoolModifiers {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get(&self, school: DamageSchool) -> f32 {
        match school {
            DamageSchool::Physical => self.physical,
            DamageSchool::Holy => self.holy,
            DamageSchool::Fire => self.fire,
            DamageSchool::Nature => self.nature,
            DamageSchool::Frost => self.frost,
            DamageSchool::Shadow => self.shadow,
            DamageSchool::Arcane => self.arcane,
        }
    }

    pub fn set(&mut self, school: DamageSchool, value: f32) {
        match school {
            DamageSchool::Physical => self.physical = value,
            DamageSchool::Holy => self.holy = value,
            DamageSchool::Fire => self.fire = value,
            DamageSchool::Nature => self.nature = value,
            DamageSchool::Frost => self.frost = value,
            DamageSchool::Shadow => self.shadow = value,
            DamageSchool::Arcane => self.arcane = value,
        }
    }
}
```

### `src/combat/damage/pipeline.rs`

```rust
use crate::types::{DamageSchool, HitResult, DamageFlags};
use crate::core::FastRng;
use super::DamageMultipliers;

/// Result of damage calculation
#[derive(Clone, Debug)]
pub struct DamageResult {
    /// Raw damage before mitigation
    pub raw: f32,
    /// Final damage after everything
    pub final_amount: f32,
    /// Hit/crit/miss
    pub hit_result: HitResult,
    /// Damage school
    pub school: DamageSchool,
    /// Flags
    pub flags: DamageFlags,
}

/// Damage calculation pipeline
pub struct DamagePipeline;

impl DamagePipeline {
    /// Calculate damage with full pipeline
    pub fn calculate(
        base: f32,
        ap_coeff: f32,
        sp_coeff: f32,
        attack_power: f32,
        spell_power: f32,
        multipliers: &DamageMultipliers,
        crit_chance: f32,
        school: DamageSchool,
        armor: f32, // Target armor (for physical)
        rng: &mut FastRng,
    ) -> DamageResult {
        // 1. Base damage + scaling
        let mut amount = base;
        amount += ap_coeff * attack_power;
        amount += sp_coeff * spell_power;

        let raw = amount;

        // 2. Roll for crit
        let is_crit = rng.roll(crit_chance);
        let hit_result = if is_crit { HitResult::Crit } else { HitResult::Hit };

        // 3. Apply multipliers
        amount *= multipliers.total_da(is_crit);

        // 4. Apply armor mitigation (physical only)
        if school.is_physical() && armor > 0.0 {
            let mitigation = Self::armor_mitigation(armor);
            amount *= 1.0 - mitigation;
        }

        let mut flags = DamageFlags::empty();
        if is_crit {
            flags |= DamageFlags::CRIT;
        }

        DamageResult {
            raw,
            final_amount: amount,
            hit_result,
            school,
            flags,
        }
    }

    /// Calculate periodic (DoT) tick damage
    pub fn calculate_periodic(
        base: f32,
        ap_coeff: f32,
        sp_coeff: f32,
        attack_power: f32,
        spell_power: f32,
        multipliers: &DamageMultipliers,
        crit_chance: f32,
        school: DamageSchool,
        armor: f32,
        rng: &mut FastRng,
    ) -> DamageResult {
        let mut amount = base;
        amount += ap_coeff * attack_power;
        amount += sp_coeff * spell_power;

        let raw = amount;

        let is_crit = rng.roll(crit_chance);
        let hit_result = if is_crit { HitResult::Crit } else { HitResult::Hit };

        // Use TA multiplier for periodic
        amount *= multipliers.total_ta(is_crit);

        if school.is_physical() && armor > 0.0 {
            let mitigation = Self::armor_mitigation(armor);
            amount *= 1.0 - mitigation;
        }

        let mut flags = DamageFlags::PERIODIC;
        if is_crit {
            flags |= DamageFlags::CRIT;
        }

        DamageResult {
            raw,
            final_amount: amount,
            hit_result,
            school,
            flags,
        }
    }

    /// Armor mitigation formula (level 80)
    fn armor_mitigation(armor: f32) -> f32 {
        // DR formula: armor / (armor + constant)
        // Constant for level 80 target
        const ARMOR_CONSTANT: f32 = 7390.0;
        (armor / (armor + ARMOR_CONSTANT)).min(0.85) // Cap at 85%
    }
}
```

### `src/combat/cooldown/mod.rs`

```rust
mod cooldown;
mod charges;

pub use cooldown::*;
pub use charges::*;
```

### `src/combat/cooldown/cooldown.rs`

```rust
use crate::types::SimTime;

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
```

### `src/combat/cooldown/charges.rs`

```rust
use crate::types::SimTime;

/// Cooldown with charges (like Barbed Shot)
#[derive(Clone, Debug)]
pub struct ChargedCooldown {
    /// Maximum charges
    pub max_charges: u8,
    /// Current charges
    pub current_charges: u8,
    /// Recharge time per charge
    pub recharge_time: SimTime,
    /// When next charge will be ready
    pub next_charge_at: SimTime,
    /// Does haste affect recharge?
    pub hasted: bool,
}

impl ChargedCooldown {
    pub fn new(max_charges: u8, recharge_secs: f32) -> Self {
        Self {
            max_charges,
            current_charges: max_charges,
            recharge_time: SimTime::from_secs_f32(recharge_secs),
            next_charge_at: SimTime::ZERO,
            hasted: false,
        }
    }

    pub fn hasted(mut self) -> Self {
        self.hasted = true;
        self
    }

    /// Has at least one charge?
    #[inline]
    pub fn has_charge(&self) -> bool {
        self.current_charges > 0
    }

    /// Is fully charged?
    #[inline]
    pub fn is_full(&self) -> bool {
        self.current_charges >= self.max_charges
    }

    /// Spend a charge, return true if successful
    pub fn spend(&mut self, now: SimTime, haste: f32) -> bool {
        if self.current_charges == 0 {
            return false;
        }

        let was_full = self.is_full();
        self.current_charges -= 1;

        // Start recharge timer if we weren't already recharging
        if was_full {
            let recharge = if self.hasted {
                SimTime::from_secs_f32(self.recharge_time.as_secs_f32() / haste)
            } else {
                self.recharge_time
            };
            self.next_charge_at = now + recharge;
        }

        true
    }

    /// Gain a charge (e.g., from proc)
    pub fn gain_charge(&mut self, now: SimTime, haste: f32) {
        if self.current_charges < self.max_charges {
            self.current_charges += 1;

            // If now full, stop recharge timer
            if self.is_full() {
                self.next_charge_at = SimTime::MAX;
            }
        }
    }

    /// Check if a charge has regenerated
    pub fn check_recharge(&mut self, now: SimTime, haste: f32) -> bool {
        if self.is_full() {
            return false;
        }

        if now >= self.next_charge_at {
            self.current_charges += 1;

            // Schedule next recharge if not full
            if !self.is_full() {
                let recharge = if self.hasted {
                    SimTime::from_secs_f32(self.recharge_time.as_secs_f32() / haste)
                } else {
                    self.recharge_time
                };
                self.next_charge_at = now + recharge;
            } else {
                self.next_charge_at = SimTime::MAX;
            }

            return true;
        }

        false
    }

    /// Time until next charge (0 if has charge)
    pub fn time_until_charge(&self, now: SimTime) -> SimTime {
        if self.has_charge() {
            SimTime::ZERO
        } else {
            self.next_charge_at.saturating_sub(now)
        }
    }

    /// Fractional charges (for UI/conditions)
    pub fn charges_fractional(&self, now: SimTime) -> f32 {
        let base = self.current_charges as f32;
        if self.is_full() {
            return base;
        }

        let elapsed = now.saturating_sub(
            self.next_charge_at.saturating_sub(self.recharge_time)
        );
        let progress = elapsed.as_secs_f32() / self.recharge_time.as_secs_f32();

        base + progress.clamp(0.0, 1.0)
    }
}
```

### `src/combat/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::core::FastRng;
use crate::stats::StatCache;

#[test]
fn action_state_snapshot() {
    let mut cache = StatCache::new(SpecId::BeastMastery);
    cache.primary.agility = 5000.0;
    cache.ratings.crit = 500.0;
    cache.update(2.0);

    let mut state = ActionState::new();
    state.snapshot(&cache, SnapshotFlags::ATTACK_POWER | SnapshotFlags::CRIT);

    assert!(state.attack_power > 0.0);
    assert!(state.crit_chance > 0.0);
    assert_eq!(state.haste, 0.0); // Not snapshotted
}

#[test]
fn damage_multipliers_stacking() {
    let mut mult = DamageMultipliers::new();
    mult.action = 1.1;
    mult.player = 1.2;
    mult.versatility = 0.1;

    let total = mult.total_da(false);
    // 1.1 * 1.0 * 1.0 * 1.2 * 1.0 * 1.1 * 1.0 = 1.452
    assert!((total - 1.452).abs() < 0.01);
}

#[test]
fn damage_multipliers_crit() {
    let mult = DamageMultipliers::new();

    let no_crit = mult.total_da(false);
    let with_crit = mult.total_da(true);

    assert!((with_crit / no_crit - 2.0).abs() < 0.01); // 2x crit
}

#[test]
fn damage_pipeline_basic() {
    let mut rng = FastRng::new(42);
    let mult = DamageMultipliers::new();

    let result = DamagePipeline::calculate(
        1000.0, // base
        1.0,    // ap coeff
        0.0,    // sp coeff
        5000.0, // ap
        0.0,    // sp
        &mult,
        0.0,    // crit chance (guaranteed no crit)
        DamageSchool::Physical,
        0.0,    // no armor
        &mut rng,
    );

    // 1000 + 5000 = 6000
    assert!((result.final_amount - 6000.0).abs() < 1.0);
}

#[test]
fn damage_pipeline_armor() {
    let mut rng = FastRng::new(42);
    let mult = DamageMultipliers::new();

    let no_armor = DamagePipeline::calculate(
        1000.0, 0.0, 0.0, 0.0, 0.0, &mult, 0.0,
        DamageSchool::Physical, 0.0, &mut rng,
    );

    let with_armor = DamagePipeline::calculate(
        1000.0, 0.0, 0.0, 0.0, 0.0, &mult, 0.0,
        DamageSchool::Physical, 5000.0, &mut rng,
    );

    assert!(with_armor.final_amount < no_armor.final_amount);
}

#[test]
fn cooldown_basic() {
    let mut cd = Cooldown::new(10.0);
    let now = SimTime::ZERO;

    assert!(cd.is_ready(now));

    cd.start(now, 1.0);
    assert!(!cd.is_ready(now));
    assert!(cd.is_ready(SimTime::from_secs(10)));
}

#[test]
fn cooldown_hasted() {
    let mut cd = Cooldown::new(10.0).hasted();

    cd.start(SimTime::ZERO, 2.0); // 100% haste
    // Should be ready at 5 seconds instead of 10
    assert!(!cd.is_ready(SimTime::from_secs(4)));
    assert!(cd.is_ready(SimTime::from_secs(5)));
}

#[test]
fn cooldown_reduce() {
    let mut cd = Cooldown::new(10.0);
    cd.start(SimTime::ZERO, 1.0);

    cd.reduce(SimTime::from_secs(3));
    // Ready at 7 now
    assert!(!cd.is_ready(SimTime::from_secs(6)));
    assert!(cd.is_ready(SimTime::from_secs(7)));
}

#[test]
fn charged_cooldown_basic() {
    let mut cd = ChargedCooldown::new(2, 12.0);

    assert!(cd.has_charge());
    assert_eq!(cd.current_charges, 2);

    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 1);
    assert!(cd.has_charge());

    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 0);
    assert!(!cd.has_charge());
}

#[test]
fn charged_cooldown_recharge() {
    let mut cd = ChargedCooldown::new(2, 12.0);

    cd.spend(SimTime::ZERO, 1.0);
    cd.spend(SimTime::ZERO, 1.0);
    assert_eq!(cd.current_charges, 0);

    // After 12 seconds, should have 1 charge
    let recharged = cd.check_recharge(SimTime::from_secs(12), 1.0);
    assert!(recharged);
    assert_eq!(cd.current_charges, 1);
}

#[test]
fn charged_cooldown_fractional() {
    let mut cd = ChargedCooldown::new(2, 12.0);
    cd.spend(SimTime::ZERO, 1.0);

    // At 6 seconds, should be 1.5 charges
    let frac = cd.charges_fractional(SimTime::from_secs(6));
    assert!((frac - 1.5).abs() < 0.1);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (38 + 13 = 51 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod combat;`
- [ ] Create `src/combat/mod.rs`
- [ ] Create `src/combat/action/mod.rs`
- [ ] Create `src/combat/action/state.rs`
- [ ] Create `src/combat/damage/mod.rs`
- [ ] Create `src/combat/damage/multipliers.rs`
- [ ] Create `src/combat/damage/pipeline.rs`
- [ ] Create `src/combat/cooldown/mod.rs`
- [ ] Create `src/combat/cooldown/cooldown.rs`
- [ ] Create `src/combat/cooldown/charges.rs`
- [ ] Create `src/combat/tests.rs`
- [ ] Run `cargo test` — 51 tests pass
