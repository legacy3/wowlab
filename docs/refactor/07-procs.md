# Phase 07: Procs

## Goal

Create the proc system: RPPM, Bad Luck Protection, proc flags, callbacks.

## Prerequisites

Phase 06 complete. `cargo test -p engine_new` passes (64 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod proc;
└── proc/
    ├── mod.rs
    ├── flags.rs
    ├── rppm.rs
    ├── handler.rs
    └── registry.rs
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
```

### `src/proc/mod.rs`

```rust
mod flags;
mod rppm;
mod handler;
mod registry;

pub use flags::*;
pub use rppm::*;
pub use handler::*;
pub use registry::*;

#[cfg(test)]
mod tests;
```

### `src/proc/flags.rs`

```rust
use bitflags::bitflags;

bitflags! {
    /// Flags for what triggers a proc
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
    pub struct ProcFlags: u32 {
        /// Triggered by dealing damage
        const ON_DAMAGE = 1 << 0;
        /// Triggered by dealing periodic damage
        const ON_PERIODIC_DAMAGE = 1 << 1;
        /// Triggered by direct damage
        const ON_DIRECT_DAMAGE = 1 << 2;
        /// Triggered by critical strike
        const ON_CRIT = 1 << 3;
        /// Triggered by auto-attack
        const ON_AUTO_ATTACK = 1 << 4;
        /// Triggered by spell cast
        const ON_SPELL_CAST = 1 << 5;
        /// Triggered by ability use
        const ON_ABILITY = 1 << 6;
        /// Triggered when taking damage
        const ON_DAMAGE_TAKEN = 1 << 7;
        /// Triggered by healing
        const ON_HEAL = 1 << 8;
        /// Triggered by periodic heal
        const ON_PERIODIC_HEAL = 1 << 9;
        /// Triggered by applying aura
        const ON_AURA_APPLY = 1 << 10;
        /// Triggered by aura expiring
        const ON_AURA_EXPIRE = 1 << 11;
        /// Triggered by killing enemy
        const ON_KILL = 1 << 12;
        /// Triggered by pet damage
        const ON_PET_DAMAGE = 1 << 13;
        /// Triggered by pet ability
        const ON_PET_ABILITY = 1 << 14;
        /// Triggered only by main hand attacks
        const MAIN_HAND_ONLY = 1 << 15;
        /// Triggered only by off hand attacks
        const OFF_HAND_ONLY = 1 << 16;
        /// Triggered by harmful spells
        const ON_HARMFUL_SPELL = 1 << 17;
        /// Triggered by beneficial spells
        const ON_BENEFICIAL_SPELL = 1 << 18;
    }
}

/// Categories for proc chance modifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProcCategory {
    /// Standard RPPM proc
    Rppm,
    /// Fixed percentage chance
    FixedChance,
    /// Guaranteed proc
    Guaranteed,
    /// Proc Per Minute (legacy, no BLP)
    Ppm,
}

/// Context passed to proc handlers
#[derive(Clone, Debug)]
pub struct ProcContext {
    /// What triggered this proc check
    pub trigger: ProcFlags,
    /// Spell that triggered (if any)
    pub spell_id: Option<crate::types::SpellIdx>,
    /// Target involved
    pub target: Option<crate::types::TargetIdx>,
    /// Was it a critical strike
    pub is_crit: bool,
    /// Damage dealt (if applicable)
    pub damage: f32,
    /// Current haste for RPPM calculation
    pub haste: f32,
}

impl Default for ProcContext {
    fn default() -> Self {
        Self {
            trigger: ProcFlags::empty(),
            spell_id: None,
            target: None,
            is_crit: false,
            damage: 0.0,
            haste: 1.0,
        }
    }
}

impl ProcContext {
    pub fn damage(trigger: ProcFlags, damage: f32, is_crit: bool) -> Self {
        Self {
            trigger,
            damage,
            is_crit,
            ..Default::default()
        }
    }

    pub fn spell_cast(spell_id: crate::types::SpellIdx) -> Self {
        Self {
            trigger: ProcFlags::ON_SPELL_CAST,
            spell_id: Some(spell_id),
            ..Default::default()
        }
    }

    pub fn with_haste(mut self, haste: f32) -> Self {
        self.haste = haste;
        self
    }
}
```

### `src/proc/rppm.rs`

```rust
use crate::types::{SimTime, ProcIdx};
use crate::core::FastRng;

/// RPPM (Real Procs Per Minute) state with Bad Luck Protection
#[derive(Clone, Debug)]
pub struct RppmState {
    /// Proc identifier
    pub proc_id: ProcIdx,
    /// Base procs per minute
    pub base_ppm: f32,
    /// Last successful proc time
    last_proc: SimTime,
    /// Last attempt time (for BLP calculation)
    last_attempt: SimTime,
    /// Accumulated BLP multiplier
    blp_multiplier: f32,
    /// Whether this RPPM scales with haste
    pub haste_scaling: bool,
    /// Whether this RPPM scales with crit
    pub crit_scaling: bool,
    /// Internal cooldown (if any)
    pub icd: Option<SimTime>,
}

impl RppmState {
    pub fn new(proc_id: ProcIdx, base_ppm: f32) -> Self {
        Self {
            proc_id,
            base_ppm,
            last_proc: SimTime::ZERO,
            last_attempt: SimTime::ZERO,
            blp_multiplier: 1.0,
            haste_scaling: true,
            crit_scaling: false,
            icd: None,
        }
    }

    pub fn with_haste_scaling(mut self, scales: bool) -> Self {
        self.haste_scaling = scales;
        self
    }

    pub fn with_crit_scaling(mut self, scales: bool) -> Self {
        self.crit_scaling = scales;
        self
    }

    pub fn with_icd(mut self, icd: SimTime) -> Self {
        self.icd = Some(icd);
        self
    }

    /// Reset state for new simulation
    pub fn reset(&mut self) {
        self.last_proc = SimTime::ZERO;
        self.last_attempt = SimTime::ZERO;
        self.blp_multiplier = 1.0;
    }

    /// Check if on internal cooldown
    pub fn on_icd(&self, now: SimTime) -> bool {
        if let Some(icd) = self.icd {
            now < self.last_proc + icd
        } else {
            false
        }
    }

    /// Calculate effective PPM with scaling
    pub fn effective_ppm(&self, haste: f32, crit: f32) -> f32 {
        let mut ppm = self.base_ppm;

        if self.haste_scaling {
            ppm *= haste;
        }

        if self.crit_scaling {
            ppm *= 1.0 + crit;
        }

        ppm
    }

    /// Calculate proc chance for this attempt
    ///
    /// Formula: PPM * (time_since_last / 60) * BLP
    /// BLP increases based on time since last proc
    pub fn proc_chance(&self, now: SimTime, haste: f32, crit: f32) -> f32 {
        let ppm = self.effective_ppm(haste, crit);

        // Time since last attempt (minimum 100ms to avoid division issues)
        let time_since_attempt = (now - self.last_attempt).as_secs_f32().max(0.1);

        // Base chance: PPM * time / 60
        let base_chance = ppm * time_since_attempt / 60.0;

        // Apply BLP multiplier
        let chance = base_chance * self.blp_multiplier;

        // Cap at 100%
        chance.min(1.0)
    }

    /// Attempt to proc, returns true if successful
    pub fn attempt(
        &mut self,
        now: SimTime,
        haste: f32,
        crit: f32,
        rng: &mut FastRng,
    ) -> bool {
        // Check ICD
        if self.on_icd(now) {
            return false;
        }

        let chance = self.proc_chance(now, haste, crit);
        let rolled = rng.next_f32();

        // Update last attempt time
        let time_since = now - self.last_attempt;
        self.last_attempt = now;

        if rolled < chance {
            // Proc succeeded
            self.last_proc = now;
            self.blp_multiplier = 1.0; // Reset BLP
            true
        } else {
            // Proc failed, increase BLP
            // BLP formula: multiplier increases based on time since last proc
            self.update_blp(time_since);
            false
        }
    }

    /// Update Bad Luck Protection multiplier
    fn update_blp(&mut self, time_since_attempt: SimTime) {
        // BLP formula varies by proc type, this is a common implementation:
        // Multiplier increases by (1 + time * 3) for each failed attempt
        let time_factor = time_since_attempt.as_secs_f32();
        let increase = 1.0 + time_factor * 3.0;

        // BLP multiplier stacks multiplicatively, capped at ~100x
        self.blp_multiplier = (self.blp_multiplier * increase).min(100.0);
    }

    /// Get current BLP multiplier (for debugging/display)
    pub fn current_blp(&self) -> f32 {
        self.blp_multiplier
    }

    /// Time since last proc
    pub fn time_since_proc(&self, now: SimTime) -> SimTime {
        now - self.last_proc
    }
}

/// Simple fixed-chance proc
#[derive(Clone, Debug)]
pub struct FixedProc {
    pub proc_id: ProcIdx,
    pub chance: f32,
    pub icd: Option<SimTime>,
    last_proc: SimTime,
}

impl FixedProc {
    pub fn new(proc_id: ProcIdx, chance: f32) -> Self {
        Self {
            proc_id,
            chance,
            icd: None,
            last_proc: SimTime::ZERO,
        }
    }

    pub fn with_icd(mut self, icd: SimTime) -> Self {
        self.icd = Some(icd);
        self
    }

    pub fn reset(&mut self) {
        self.last_proc = SimTime::ZERO;
    }

    pub fn on_icd(&self, now: SimTime) -> bool {
        if let Some(icd) = self.icd {
            now < self.last_proc + icd
        } else {
            false
        }
    }

    pub fn attempt(&mut self, now: SimTime, rng: &mut FastRng) -> bool {
        if self.on_icd(now) {
            return false;
        }

        if rng.roll(self.chance) {
            self.last_proc = now;
            true
        } else {
            false
        }
    }
}
```

### `src/proc/handler.rs`

```rust
use crate::types::{ProcIdx, SpellIdx, AuraIdx};
use super::{ProcFlags, ProcContext};

/// Result of a proc trigger
#[derive(Clone, Debug)]
pub enum ProcEffect {
    /// Apply an aura
    ApplyAura { aura: AuraIdx },
    /// Cast a spell
    CastSpell { spell: SpellIdx },
    /// Deal damage
    Damage { base: f32, coefficient: f32 },
    /// Grant resource
    Resource { resource: crate::types::ResourceType, amount: f32 },
    /// Reduce cooldown
    ReduceCooldown { spell: SpellIdx, amount: crate::types::SimTime },
    /// Extend aura
    ExtendAura { aura: AuraIdx, amount: crate::types::SimTime },
    /// Add stacks to aura
    AddStacks { aura: AuraIdx, stacks: u8 },
    /// Multiple effects
    Multiple(Vec<ProcEffect>),
}

/// Definition of a proc handler
#[derive(Clone, Debug)]
pub struct ProcHandler {
    /// Unique proc ID
    pub id: ProcIdx,
    /// Display name
    pub name: &'static str,
    /// What triggers this proc
    pub triggers: ProcFlags,
    /// Effect when proc occurs
    pub effect: ProcEffect,
    /// Only procs from specific spells (empty = all)
    pub spell_filter: Vec<SpellIdx>,
    /// Requires specific aura to be active
    pub requires_aura: Option<AuraIdx>,
}

impl ProcHandler {
    pub fn new(id: ProcIdx, name: &'static str, triggers: ProcFlags, effect: ProcEffect) -> Self {
        Self {
            id,
            name,
            triggers,
            effect,
            spell_filter: Vec::new(),
            requires_aura: None,
        }
    }

    pub fn with_spell_filter(mut self, spells: Vec<SpellIdx>) -> Self {
        self.spell_filter = spells;
        self
    }

    pub fn with_requires_aura(mut self, aura: AuraIdx) -> Self {
        self.requires_aura = Some(aura);
        self
    }

    /// Check if this proc can trigger from context
    pub fn can_trigger(&self, ctx: &ProcContext) -> bool {
        // Check trigger flags match
        if !self.triggers.intersects(ctx.trigger) {
            return false;
        }

        // Check spell filter
        if !self.spell_filter.is_empty() {
            if let Some(spell) = ctx.spell_id {
                if !self.spell_filter.contains(&spell) {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }
}
```

### `src/proc/registry.rs`

```rust
use crate::types::ProcIdx;
use super::{RppmState, FixedProc, ProcHandler, ProcFlags, ProcContext, ProcEffect};
use crate::core::FastRng;
use crate::types::SimTime;

/// Manages all procs for a unit
#[derive(Clone, Debug)]
pub struct ProcRegistry {
    /// RPPM-based procs
    rppm: Vec<RppmState>,
    /// Fixed-chance procs
    fixed: Vec<FixedProc>,
    /// Proc handlers
    handlers: Vec<ProcHandler>,
}

impl ProcRegistry {
    pub fn new() -> Self {
        Self {
            rppm: Vec::new(),
            fixed: Vec::new(),
            handlers: Vec::new(),
        }
    }

    /// Register an RPPM proc
    pub fn register_rppm(&mut self, state: RppmState, handler: ProcHandler) {
        self.rppm.push(state);
        self.handlers.push(handler);
    }

    /// Register a fixed-chance proc
    pub fn register_fixed(&mut self, state: FixedProc, handler: ProcHandler) {
        self.fixed.push(state);
        self.handlers.push(handler);
    }

    /// Get handler by proc ID
    pub fn get_handler(&self, id: ProcIdx) -> Option<&ProcHandler> {
        self.handlers.iter().find(|h| h.id == id)
    }

    /// Get RPPM state by proc ID
    pub fn get_rppm_mut(&mut self, id: ProcIdx) -> Option<&mut RppmState> {
        self.rppm.iter_mut().find(|r| r.proc_id == id)
    }

    /// Get fixed proc state by proc ID
    pub fn get_fixed_mut(&mut self, id: ProcIdx) -> Option<&mut FixedProc> {
        self.fixed.iter_mut().find(|f| f.proc_id == id)
    }

    /// Reset all procs for new simulation
    pub fn reset(&mut self) {
        for rppm in &mut self.rppm {
            rppm.reset();
        }
        for fixed in &mut self.fixed {
            fixed.reset();
        }
    }

    /// Check all procs, returns effects that triggered
    pub fn check_procs(
        &mut self,
        ctx: &ProcContext,
        now: SimTime,
        rng: &mut FastRng,
    ) -> Vec<(ProcIdx, ProcEffect)> {
        let mut triggered = Vec::new();

        // Check RPPM procs
        for rppm in &mut self.rppm {
            if let Some(handler) = self.handlers.iter().find(|h| h.id == rppm.proc_id) {
                if handler.can_trigger(ctx) {
                    if rppm.attempt(now, ctx.haste, 0.0, rng) {
                        triggered.push((rppm.proc_id, handler.effect.clone()));
                    }
                }
            }
        }

        // Check fixed procs
        for fixed in &mut self.fixed {
            if let Some(handler) = self.handlers.iter().find(|h| h.id == fixed.proc_id) {
                if handler.can_trigger(ctx) {
                    if fixed.attempt(now, rng) {
                        triggered.push((fixed.proc_id, handler.effect.clone()));
                    }
                }
            }
        }

        triggered
    }

    /// Get all handlers that match a trigger
    pub fn handlers_for(&self, flags: ProcFlags) -> impl Iterator<Item = &ProcHandler> {
        self.handlers.iter().filter(move |h| h.triggers.intersects(flags))
    }
}

impl Default for ProcRegistry {
    fn default() -> Self {
        Self::new()
    }
}
```

### `src/proc/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::core::FastRng;

#[test]
fn proc_flags_basic() {
    let flags = ProcFlags::ON_DAMAGE | ProcFlags::ON_CRIT;

    assert!(flags.contains(ProcFlags::ON_DAMAGE));
    assert!(flags.contains(ProcFlags::ON_CRIT));
    assert!(!flags.contains(ProcFlags::ON_HEAL));
}

#[test]
fn proc_flags_intersects() {
    let handler_flags = ProcFlags::ON_DAMAGE | ProcFlags::ON_PERIODIC_DAMAGE;
    let trigger = ProcFlags::ON_DAMAGE;

    assert!(handler_flags.intersects(trigger));
}

#[test]
fn rppm_basic_chance() {
    let rppm = RppmState::new(ProcIdx(1), 1.0); // 1 PPM

    // At exactly 1 minute since last attempt, should be 100% * BLP
    let now = SimTime::from_secs(60);
    let chance = rppm.proc_chance(now, 1.0, 0.0);

    // Base chance = 1.0 * 60/60 = 1.0
    assert!((chance - 1.0).abs() < 0.01);
}

#[test]
fn rppm_haste_scaling() {
    let rppm = RppmState::new(ProcIdx(1), 1.0).with_haste_scaling(true);

    let ppm_no_haste = rppm.effective_ppm(1.0, 0.0);
    let ppm_with_haste = rppm.effective_ppm(1.5, 0.0);

    assert!((ppm_no_haste - 1.0).abs() < 0.01);
    assert!((ppm_with_haste - 1.5).abs() < 0.01);
}

#[test]
fn rppm_icd() {
    let mut rppm = RppmState::new(ProcIdx(1), 100.0) // High PPM to guarantee proc
        .with_icd(SimTime::from_secs(10));

    let mut rng = FastRng::new(42);
    let now = SimTime::ZERO;

    // First attempt succeeds (high PPM)
    rppm.last_attempt = SimTime::ZERO;
    let proc1 = rppm.attempt(SimTime::from_secs(1), 1.0, 0.0, &mut rng);

    // If proc1 succeeded, check ICD
    if proc1 {
        // Attempt during ICD should fail
        assert!(rppm.on_icd(SimTime::from_secs(5)));
        assert!(!rppm.on_icd(SimTime::from_secs(15)));
    }
}

#[test]
fn rppm_blp_increases() {
    let mut rppm = RppmState::new(ProcIdx(1), 0.001); // Very low PPM
    let mut rng = FastRng::new(42);

    // Make several failed attempts
    let now = SimTime::ZERO;
    rppm.last_attempt = now;

    for i in 1..10 {
        let time = SimTime::from_secs(i);
        rppm.attempt(time, 1.0, 0.0, &mut rng);
    }

    // BLP should have increased
    assert!(rppm.current_blp() > 1.0);
}

#[test]
fn rppm_blp_resets_on_proc() {
    let mut rppm = RppmState::new(ProcIdx(1), 100.0); // Very high PPM
    let mut rng = FastRng::new(42);

    // Set high BLP
    rppm.blp_multiplier = 50.0;

    // Proc should succeed with high PPM
    rppm.last_attempt = SimTime::ZERO;
    let did_proc = rppm.attempt(SimTime::from_secs(1), 1.0, 0.0, &mut rng);

    if did_proc {
        // BLP should reset
        assert!((rppm.current_blp() - 1.0).abs() < 0.01);
    }
}

#[test]
fn fixed_proc_basic() {
    let mut proc = FixedProc::new(ProcIdx(1), 1.0); // 100% chance
    let mut rng = FastRng::new(42);

    assert!(proc.attempt(SimTime::ZERO, &mut rng));
}

#[test]
fn fixed_proc_icd() {
    let mut proc = FixedProc::new(ProcIdx(1), 1.0)
        .with_icd(SimTime::from_secs(5));
    let mut rng = FastRng::new(42);

    // First proc succeeds
    assert!(proc.attempt(SimTime::ZERO, &mut rng));

    // During ICD, fails
    assert!(!proc.attempt(SimTime::from_secs(2), &mut rng));

    // After ICD, succeeds
    assert!(proc.attempt(SimTime::from_secs(6), &mut rng));
}

#[test]
fn proc_handler_trigger_check() {
    let handler = ProcHandler::new(
        ProcIdx(1),
        "Test Proc",
        ProcFlags::ON_DAMAGE | ProcFlags::ON_CRIT,
        ProcEffect::Damage { base: 100.0, coefficient: 1.0 },
    );

    let damage_ctx = ProcContext::damage(ProcFlags::ON_DAMAGE, 1000.0, false);
    let heal_ctx = ProcContext {
        trigger: ProcFlags::ON_HEAL,
        ..Default::default()
    };

    assert!(handler.can_trigger(&damage_ctx));
    assert!(!handler.can_trigger(&heal_ctx));
}

#[test]
fn proc_handler_spell_filter() {
    let handler = ProcHandler::new(
        ProcIdx(1),
        "Filtered Proc",
        ProcFlags::ON_SPELL_CAST,
        ProcEffect::ApplyAura { aura: AuraIdx(1) },
    ).with_spell_filter(vec![SpellIdx(10), SpellIdx(20)]);

    let matching = ProcContext {
        trigger: ProcFlags::ON_SPELL_CAST,
        spell_id: Some(SpellIdx(10)),
        ..Default::default()
    };

    let not_matching = ProcContext {
        trigger: ProcFlags::ON_SPELL_CAST,
        spell_id: Some(SpellIdx(99)),
        ..Default::default()
    };

    assert!(handler.can_trigger(&matching));
    assert!(!handler.can_trigger(&not_matching));
}

#[test]
fn proc_registry_check() {
    let mut registry = ProcRegistry::new();
    let mut rng = FastRng::new(42);

    // Register a fixed proc with 100% chance
    registry.register_fixed(
        FixedProc::new(ProcIdx(1), 1.0),
        ProcHandler::new(
            ProcIdx(1),
            "Damage Proc",
            ProcFlags::ON_DAMAGE,
            ProcEffect::Damage { base: 50.0, coefficient: 1.0 },
        ),
    );

    let ctx = ProcContext::damage(ProcFlags::ON_DAMAGE, 1000.0, false);
    let triggered = registry.check_procs(&ctx, SimTime::ZERO, &mut rng);

    assert_eq!(triggered.len(), 1);
    assert_eq!(triggered[0].0, ProcIdx(1));
}

#[test]
fn proc_effect_multiple() {
    let effect = ProcEffect::Multiple(vec![
        ProcEffect::ApplyAura { aura: AuraIdx(1) },
        ProcEffect::Damage { base: 100.0, coefficient: 1.0 },
    ]);

    match effect {
        ProcEffect::Multiple(effects) => {
            assert_eq!(effects.len(), 2);
        }
        _ => panic!("Expected Multiple effect"),
    }
}
```

## Dependencies

Add to `Cargo.toml`:

```toml
bitflags = "2"
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (64 + 14 = 78 tests).

## Todo Checklist

- [ ] Add `bitflags = "2"` to `Cargo.toml`
- [ ] Update `src/lib.rs` to add `pub mod proc;`
- [ ] Create `src/proc/mod.rs`
- [ ] Create `src/proc/flags.rs`
- [ ] Create `src/proc/rppm.rs`
- [ ] Create `src/proc/handler.rs`
- [ ] Create `src/proc/registry.rs`
- [ ] Create `src/proc/tests.rs`
- [ ] Run `cargo test` — 78 tests pass
