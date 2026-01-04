# Phase 09: Spec Framework

## Goal

Create the spec framework: Spell/Aura traits, CastContext, builders.

## Prerequisites

Phase 08 complete. `cargo test -p engine_new` passes (93 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod spec;
└── spec/
    ├── mod.rs
    ├── spell.rs
    ├── aura_def.rs
    ├── context.rs
    └── builder.rs
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
```

### `src/spec/mod.rs`

```rust
mod spell;
mod aura_def;
mod context;
mod builder;

pub use spell::*;
pub use aura_def::*;
pub use context::*;
pub use builder::*;

#[cfg(test)]
mod tests;
```

### `src/spec/spell.rs`

```rust
use crate::types::{SpellIdx, AuraIdx, ResourceType, SimTime, TargetIdx};
use crate::combat::ActionState;

/// Spell school for damage type
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum SpellSchool {
    Physical,
    Holy,
    Fire,
    Nature,
    Frost,
    Shadow,
    Arcane,
    /// Multi-school (e.g., Chaos = all schools)
    Chaos,
}

/// Target type for spells
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SpellTarget {
    /// Single enemy target
    Enemy,
    /// Self
    Player,
    /// Friendly target
    Friendly,
    /// All enemies in range
    AllEnemies,
    /// Primary target + nearby
    Cleave { max_targets: u8 },
    /// Ground-targeted AoE
    Ground { radius: f32 },
    /// Pet
    Pet,
}

/// GCD behavior
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GcdType {
    /// Standard GCD (affected by haste)
    Normal,
    /// Fixed GCD (not affected by haste)
    Fixed(u32), // milliseconds
    /// No GCD
    None,
}

/// Cast time behavior
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CastType {
    /// Instant cast
    Instant,
    /// Cast time (affected by haste)
    Cast(u32), // base milliseconds
    /// Fixed cast time
    FixedCast(u32),
    /// Channeled (affected by haste)
    Channel { duration: u32, ticks: u8 },
}

/// Resource cost definition
#[derive(Clone, Debug)]
pub struct ResourceCost {
    pub resource: ResourceType,
    pub amount: f32,
    /// Cost is percentage of max
    pub is_percent: bool,
}

impl ResourceCost {
    pub fn new(resource: ResourceType, amount: f32) -> Self {
        Self {
            resource,
            amount,
            is_percent: false,
        }
    }

    pub fn percent(resource: ResourceType, amount: f32) -> Self {
        Self {
            resource,
            amount,
            is_percent: true,
        }
    }
}

/// Damage effect definition
#[derive(Clone, Debug)]
pub struct DamageEffect {
    pub school: SpellSchool,
    /// Base damage (at level 80)
    pub base_damage: f32,
    /// Spell power coefficient
    pub sp_coefficient: f32,
    /// Attack power coefficient
    pub ap_coefficient: f32,
    /// Weapon damage coefficient (for melee)
    pub weapon_coefficient: f32,
    /// Variance range (e.g., 0.1 = +/- 10%)
    pub variance: f32,
    /// Can this crit
    pub can_crit: bool,
    /// Is this direct damage (vs periodic)
    pub is_direct: bool,
}

impl Default for DamageEffect {
    fn default() -> Self {
        Self {
            school: SpellSchool::Physical,
            base_damage: 0.0,
            sp_coefficient: 0.0,
            ap_coefficient: 0.0,
            weapon_coefficient: 0.0,
            variance: 0.0,
            can_crit: true,
            is_direct: true,
        }
    }
}

/// Spell definition
#[derive(Clone, Debug)]
pub struct SpellDef {
    /// Unique spell ID
    pub id: SpellIdx,
    /// Display name
    pub name: &'static str,
    /// Spell school
    pub school: SpellSchool,
    /// Cast type
    pub cast_type: CastType,
    /// GCD behavior
    pub gcd: GcdType,
    /// Resource costs
    pub costs: Vec<ResourceCost>,
    /// Resource gains
    pub gains: Vec<ResourceCost>,
    /// Cooldown duration (0 = no cooldown)
    pub cooldown: SimTime,
    /// Charges (0 = no charges, use cooldown)
    pub charges: u8,
    /// Charge recharge time
    pub charge_time: SimTime,
    /// Range in yards
    pub range: f32,
    /// Target type
    pub target: SpellTarget,
    /// Damage effect (if any)
    pub damage: Option<DamageEffect>,
    /// Auras to apply
    pub apply_auras: Vec<AuraIdx>,
    /// Required aura to cast
    pub requires_aura: Option<AuraIdx>,
    /// Consumes aura on cast
    pub consumes_aura: Option<AuraIdx>,
    /// Travel time in ms (for projectiles)
    pub travel_time: u32,
    /// Whether this can be cast while moving
    pub castable_while_moving: bool,
    /// Spell flags for special handling
    pub flags: SpellFlags,
}

bitflags::bitflags! {
    /// Flags for special spell behavior
    #[derive(Clone, Copy, Debug, PartialEq, Eq)]
    pub struct SpellFlags: u32 {
        /// Spell is on the GCD
        const ON_GCD = 1 << 0;
        /// Triggers auto-attack reset
        const RESETS_AUTO = 1 << 1;
        /// Is a pet ability
        const PET_ABILITY = 1 << 2;
        /// Is a proc effect (not directly cast)
        const IS_PROC = 1 << 3;
        /// Ignores GCD
        const IGNORES_GCD = 1 << 4;
        /// Usable while GCD is active
        const OFF_GCD = 1 << 5;
        /// Background spell (no APL interaction)
        const BACKGROUND = 1 << 6;
    }
}

impl SpellDef {
    pub fn new(id: SpellIdx, name: &'static str) -> Self {
        Self {
            id,
            name,
            school: SpellSchool::Physical,
            cast_type: CastType::Instant,
            gcd: GcdType::Normal,
            costs: Vec::new(),
            gains: Vec::new(),
            cooldown: SimTime::ZERO,
            charges: 0,
            charge_time: SimTime::ZERO,
            range: 40.0,
            target: SpellTarget::Enemy,
            damage: None,
            apply_auras: Vec::new(),
            requires_aura: None,
            consumes_aura: None,
            travel_time: 0,
            castable_while_moving: true,
            flags: SpellFlags::ON_GCD,
        }
    }

    /// Get effective cast time with haste
    pub fn cast_time(&self, haste: f32) -> SimTime {
        match self.cast_type {
            CastType::Instant => SimTime::ZERO,
            CastType::Cast(base) => {
                let ms = (base as f32 / haste) as u32;
                SimTime::from_millis(ms)
            }
            CastType::FixedCast(ms) => SimTime::from_millis(ms),
            CastType::Channel { duration, .. } => {
                let ms = (duration as f32 / haste) as u32;
                SimTime::from_millis(ms)
            }
        }
    }

    /// Get effective GCD with haste
    pub fn gcd_duration(&self, haste: f32) -> SimTime {
        match self.gcd {
            GcdType::Normal => {
                let base = 1500.0; // 1.5s base GCD
                let ms = (base / haste) as u32;
                // GCD floor is 750ms
                SimTime::from_millis(ms.max(750))
            }
            GcdType::Fixed(ms) => SimTime::from_millis(ms),
            GcdType::None => SimTime::ZERO,
        }
    }

    /// Is this an instant cast?
    pub fn is_instant(&self) -> bool {
        matches!(self.cast_type, CastType::Instant)
    }

    /// Is this a channeled spell?
    pub fn is_channel(&self) -> bool {
        matches!(self.cast_type, CastType::Channel { .. })
    }

    /// Has cooldown?
    pub fn has_cooldown(&self) -> bool {
        self.cooldown > SimTime::ZERO || self.charges > 0
    }
}
```

### `src/spec/aura_def.rs`

```rust
use crate::types::{AuraIdx, SpellIdx, SimTime};
use crate::aura::{AuraFlags, PeriodicEffect};

/// Type of aura effect
#[derive(Clone, Debug)]
pub enum AuraEffect {
    /// Flat stat increase
    StatFlat { stat: crate::stats::Stat, amount: f32 },
    /// Percentage stat increase
    StatPercent { stat: crate::stats::Stat, amount: f32 },
    /// Damage multiplier
    DamageMultiplier { amount: f32, school: Option<crate::spec::SpellSchool> },
    /// Haste increase
    Haste { amount: f32 },
    /// Crit chance increase
    Crit { amount: f32 },
    /// Periodic damage
    PeriodicDamage(PeriodicEffect),
    /// Resource regen modifier
    ResourceRegen { resource: crate::types::ResourceType, amount: f32 },
    /// Cooldown reduction
    CooldownReduction { spell: SpellIdx, amount: f32 },
    /// Proc chance modifier
    ProcChance { proc: crate::types::ProcIdx, amount: f32 },
    /// Custom effect (handled by spec)
    Custom { id: u32 },
}

/// Aura definition
#[derive(Clone, Debug)]
pub struct AuraDef {
    /// Unique aura ID
    pub id: AuraIdx,
    /// Display name
    pub name: &'static str,
    /// Base duration
    pub duration: SimTime,
    /// Max stacks
    pub max_stacks: u8,
    /// Behavior flags
    pub flags: AuraFlags,
    /// Effects while active
    pub effects: Vec<AuraEffect>,
    /// Periodic effect (for DoTs/HoTs)
    pub periodic: Option<PeriodicEffect>,
    /// Spell that applies this aura
    pub applied_by: Option<SpellIdx>,
}

impl AuraDef {
    pub fn new(id: AuraIdx, name: &'static str, duration: SimTime) -> Self {
        Self {
            id,
            name,
            duration,
            max_stacks: 1,
            flags: AuraFlags::default(),
            effects: Vec::new(),
            periodic: None,
            applied_by: None,
        }
    }

    /// Create a buff
    pub fn buff(id: AuraIdx, name: &'static str, duration: SimTime) -> Self {
        Self::new(id, name, duration)
    }

    /// Create a debuff
    pub fn debuff(id: AuraIdx, name: &'static str, duration: SimTime) -> Self {
        let mut aura = Self::new(id, name, duration);
        aura.flags.is_debuff = true;
        aura
    }

    /// Create a DoT
    pub fn dot(
        id: AuraIdx,
        name: &'static str,
        duration: SimTime,
        tick_interval: SimTime,
    ) -> Self {
        let mut aura = Self::debuff(id, name, duration);
        aura.flags.is_periodic = true;
        aura.flags.can_pandemic = true;
        aura.flags.snapshots = true;
        aura.flags.refreshable = true;
        aura.periodic = Some(PeriodicEffect::new(id, tick_interval));
        aura
    }

    pub fn with_stacks(mut self, max: u8) -> Self {
        self.max_stacks = max;
        self
    }

    pub fn with_effect(mut self, effect: AuraEffect) -> Self {
        self.effects.push(effect);
        self
    }

    pub fn with_periodic(mut self, periodic: PeriodicEffect) -> Self {
        self.periodic = Some(periodic);
        self.flags.is_periodic = true;
        self
    }

    pub fn pandemic(mut self) -> Self {
        self.flags.can_pandemic = true;
        self
    }

    pub fn snapshots(mut self) -> Self {
        self.flags.snapshots = true;
        self
    }

    pub fn refreshable(mut self) -> Self {
        self.flags.refreshable = true;
        self
    }

    pub fn hidden(mut self) -> Self {
        self.flags.is_hidden = true;
        self
    }
}
```

### `src/spec/context.rs`

```rust
use crate::types::{SpellIdx, TargetIdx, SimTime};
use crate::combat::ActionState;
use crate::actor::{Player, Pet, Enemy};
use crate::aura::AuraTracker;

/// Context for checking if a spell can be cast
#[derive(Clone, Debug)]
pub struct CastCheck<'a> {
    pub player: &'a Player,
    pub target: Option<&'a Enemy>,
    pub auras: &'a AuraTracker,
    pub now: SimTime,
}

impl<'a> CastCheck<'a> {
    pub fn new(player: &'a Player, auras: &'a AuraTracker, now: SimTime) -> Self {
        Self {
            player,
            target: None,
            auras,
            now,
        }
    }

    pub fn with_target(mut self, target: &'a Enemy) -> Self {
        self.target = Some(target);
        self
    }
}

/// Context for executing a spell
#[derive(Clone, Debug)]
pub struct CastContext {
    /// Spell being cast
    pub spell: SpellIdx,
    /// Target
    pub target: TargetIdx,
    /// Cast start time
    pub start_time: SimTime,
    /// When cast completes
    pub complete_time: SimTime,
    /// Snapshotted stats
    pub snapshot: ActionState,
    /// Was this a proc (not directly cast)
    pub is_proc: bool,
}

impl CastContext {
    pub fn new(spell: SpellIdx, target: TargetIdx, now: SimTime) -> Self {
        Self {
            spell,
            target,
            start_time: now,
            complete_time: now,
            snapshot: ActionState::new(),
            is_proc: false,
        }
    }

    pub fn with_cast_time(mut self, cast_time: SimTime) -> Self {
        self.complete_time = self.start_time + cast_time;
        self
    }

    pub fn with_snapshot(mut self, snapshot: ActionState) -> Self {
        self.snapshot = snapshot;
        self
    }

    pub fn as_proc(mut self) -> Self {
        self.is_proc = true;
        self
    }

    /// Cast duration
    pub fn duration(&self) -> SimTime {
        self.complete_time - self.start_time
    }
}

/// Result of attempting to cast
#[derive(Clone, Debug)]
pub enum CastResult {
    /// Cast started (or completed if instant)
    Success(CastContext),
    /// On GCD
    OnGcd { remaining: SimTime },
    /// On cooldown
    OnCooldown { remaining: SimTime },
    /// Not enough resource
    NotEnoughResource { resource: crate::types::ResourceType, have: f32, need: f32 },
    /// Missing required aura
    MissingRequiredAura { aura: crate::types::AuraIdx },
    /// Invalid target
    InvalidTarget,
    /// Out of range
    OutOfRange { distance: f32, range: f32 },
    /// Currently casting
    AlreadyCasting,
    /// Cannot cast while moving
    Moving,
}

impl CastResult {
    pub fn is_success(&self) -> bool {
        matches!(self, CastResult::Success(_))
    }
}

/// Damage event produced by spell
#[derive(Clone, Debug)]
pub struct DamageEvent {
    pub spell: SpellIdx,
    pub target: TargetIdx,
    pub amount: f32,
    pub school: super::SpellSchool,
    pub is_crit: bool,
    pub is_periodic: bool,
    pub timestamp: SimTime,
}

/// Resource event
#[derive(Clone, Debug)]
pub struct ResourceEvent {
    pub resource: crate::types::ResourceType,
    pub amount: f32,
    pub is_gain: bool,
    pub source: SpellIdx,
    pub timestamp: SimTime,
}
```

### `src/spec/builder.rs`

```rust
use super::{SpellDef, AuraDef, SpellSchool, CastType, GcdType, SpellTarget, SpellFlags, DamageEffect, ResourceCost, AuraEffect};
use crate::types::{SpellIdx, AuraIdx, ResourceType, SimTime};
use crate::aura::PeriodicEffect;

/// Builder for spell definitions
pub struct SpellBuilder {
    spell: SpellDef,
}

impl SpellBuilder {
    pub fn new(id: SpellIdx, name: &'static str) -> Self {
        Self {
            spell: SpellDef::new(id, name),
        }
    }

    pub fn school(mut self, school: SpellSchool) -> Self {
        self.spell.school = school;
        self
    }

    pub fn instant(mut self) -> Self {
        self.spell.cast_type = CastType::Instant;
        self
    }

    pub fn cast_time(mut self, ms: u32) -> Self {
        self.spell.cast_type = CastType::Cast(ms);
        self.spell.castable_while_moving = false;
        self
    }

    pub fn channel(mut self, duration_ms: u32, ticks: u8) -> Self {
        self.spell.cast_type = CastType::Channel { duration: duration_ms, ticks };
        self.spell.castable_while_moving = false;
        self
    }

    pub fn gcd(mut self, gcd: GcdType) -> Self {
        self.spell.gcd = gcd;
        self
    }

    pub fn no_gcd(mut self) -> Self {
        self.spell.gcd = GcdType::None;
        self.spell.flags.remove(SpellFlags::ON_GCD);
        self.spell.flags.insert(SpellFlags::IGNORES_GCD);
        self
    }

    pub fn off_gcd(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::OFF_GCD);
        self
    }

    pub fn cooldown(mut self, secs: f32) -> Self {
        self.spell.cooldown = SimTime::from_secs_f32(secs);
        self
    }

    pub fn charges(mut self, count: u8, recharge_secs: f32) -> Self {
        self.spell.charges = count;
        self.spell.charge_time = SimTime::from_secs_f32(recharge_secs);
        self
    }

    pub fn cost(mut self, resource: ResourceType, amount: f32) -> Self {
        self.spell.costs.push(ResourceCost::new(resource, amount));
        self
    }

    pub fn cost_percent(mut self, resource: ResourceType, percent: f32) -> Self {
        self.spell.costs.push(ResourceCost::percent(resource, percent));
        self
    }

    pub fn gain(mut self, resource: ResourceType, amount: f32) -> Self {
        self.spell.gains.push(ResourceCost::new(resource, amount));
        self
    }

    pub fn target(mut self, target: SpellTarget) -> Self {
        self.spell.target = target;
        self
    }

    pub fn range(mut self, yards: f32) -> Self {
        self.spell.range = yards;
        self
    }

    pub fn melee_range(mut self) -> Self {
        self.spell.range = 5.0;
        self
    }

    pub fn damage(mut self, effect: DamageEffect) -> Self {
        self.spell.damage = Some(effect);
        self
    }

    pub fn physical_damage(mut self, ap_coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school: SpellSchool::Physical,
            ap_coefficient: ap_coef,
            ..Default::default()
        });
        self.spell.school = SpellSchool::Physical;
        self
    }

    pub fn spell_damage(mut self, school: SpellSchool, sp_coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school,
            sp_coefficient: sp_coef,
            ..Default::default()
        });
        self.spell.school = school;
        self
    }

    pub fn weapon_damage(mut self, coef: f32) -> Self {
        self.spell.damage = Some(DamageEffect {
            school: SpellSchool::Physical,
            weapon_coefficient: coef,
            ..Default::default()
        });
        self.spell.school = SpellSchool::Physical;
        self
    }

    pub fn apply_aura(mut self, aura: AuraIdx) -> Self {
        self.spell.apply_auras.push(aura);
        self
    }

    pub fn requires(mut self, aura: AuraIdx) -> Self {
        self.spell.requires_aura = Some(aura);
        self
    }

    pub fn consumes(mut self, aura: AuraIdx) -> Self {
        self.spell.consumes_aura = Some(aura);
        self
    }

    pub fn travel_time(mut self, ms: u32) -> Self {
        self.spell.travel_time = ms;
        self
    }

    pub fn movable(mut self) -> Self {
        self.spell.castable_while_moving = true;
        self
    }

    pub fn pet_ability(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::PET_ABILITY);
        self
    }

    pub fn background(mut self) -> Self {
        self.spell.flags.insert(SpellFlags::BACKGROUND);
        self
    }

    pub fn build(self) -> SpellDef {
        self.spell
    }
}

/// Builder for aura definitions
pub struct AuraBuilder {
    aura: AuraDef,
}

impl AuraBuilder {
    pub fn buff(id: AuraIdx, name: &'static str, duration_secs: f32) -> Self {
        Self {
            aura: AuraDef::buff(id, name, SimTime::from_secs_f32(duration_secs)),
        }
    }

    pub fn debuff(id: AuraIdx, name: &'static str, duration_secs: f32) -> Self {
        Self {
            aura: AuraDef::debuff(id, name, SimTime::from_secs_f32(duration_secs)),
        }
    }

    pub fn dot(id: AuraIdx, name: &'static str, duration_secs: f32, tick_interval_secs: f32) -> Self {
        Self {
            aura: AuraDef::dot(
                id,
                name,
                SimTime::from_secs_f32(duration_secs),
                SimTime::from_secs_f32(tick_interval_secs),
            ),
        }
    }

    pub fn stacks(mut self, max: u8) -> Self {
        self.aura.max_stacks = max;
        self
    }

    pub fn pandemic(mut self) -> Self {
        self.aura.flags.can_pandemic = true;
        self
    }

    pub fn snapshots(mut self) -> Self {
        self.aura.flags.snapshots = true;
        self
    }

    pub fn refreshable(mut self) -> Self {
        self.aura.flags.refreshable = true;
        self
    }

    pub fn hidden(mut self) -> Self {
        self.aura.flags.is_hidden = true;
        self
    }

    pub fn stat_flat(mut self, stat: crate::stats::Stat, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::StatFlat { stat, amount });
        self
    }

    pub fn stat_percent(mut self, stat: crate::stats::Stat, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::StatPercent { stat, amount });
        self
    }

    pub fn damage_multiplier(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DamageMultiplier { amount, school: None });
        self
    }

    pub fn school_damage(mut self, school: SpellSchool, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::DamageMultiplier { amount, school: Some(school) });
        self
    }

    pub fn haste(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::Haste { amount });
        self
    }

    pub fn crit(mut self, amount: f32) -> Self {
        self.aura.effects.push(AuraEffect::Crit { amount });
        self
    }

    pub fn periodic_damage(mut self, tick_interval_secs: f32, ap_coef: f32) -> Self {
        let mut periodic = PeriodicEffect::new(self.aura.id, SimTime::from_secs_f32(tick_interval_secs));
        periodic = periodic.with_ap_scaling(ap_coef);
        self.aura.periodic = Some(periodic);
        self.aura.flags.is_periodic = true;
        self
    }

    pub fn build(self) -> AuraDef {
        self.aura
    }
}
```

### `src/spec/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::stats::Stat;

#[test]
fn spell_builder_basic() {
    let spell = SpellBuilder::new(SpellIdx(1), "Fireball")
        .school(SpellSchool::Fire)
        .cast_time(2500)
        .cooldown(0.0)
        .spell_damage(SpellSchool::Fire, 1.5)
        .build();

    assert_eq!(spell.id, SpellIdx(1));
    assert_eq!(spell.name, "Fireball");
    assert_eq!(spell.school, SpellSchool::Fire);
    assert!(!spell.is_instant());
}

#[test]
fn spell_cast_time_haste() {
    let spell = SpellBuilder::new(SpellIdx(1), "Cast")
        .cast_time(2000)
        .build();

    // Base cast time
    let base = spell.cast_time(1.0);
    assert_eq!(base.as_millis(), 2000);

    // With 30% haste
    let hasted = spell.cast_time(1.3);
    assert!(hasted.as_millis() < 2000);
    assert!(hasted.as_millis() > 1500);
}

#[test]
fn spell_gcd_floor() {
    let spell = SpellBuilder::new(SpellIdx(1), "Fast")
        .instant()
        .build();

    // GCD should be floored at 750ms even with massive haste
    let gcd = spell.gcd_duration(3.0);
    assert_eq!(gcd.as_millis(), 750);
}

#[test]
fn spell_no_gcd() {
    let spell = SpellBuilder::new(SpellIdx(1), "OffGCD")
        .no_gcd()
        .build();

    let gcd = spell.gcd_duration(1.0);
    assert_eq!(gcd, SimTime::ZERO);
}

#[test]
fn spell_charges() {
    let spell = SpellBuilder::new(SpellIdx(1), "Charged")
        .charges(2, 15.0)
        .build();

    assert_eq!(spell.charges, 2);
    assert_eq!(spell.charge_time.as_secs_f32(), 15.0);
}

#[test]
fn spell_costs() {
    let spell = SpellBuilder::new(SpellIdx(1), "Costed")
        .cost(ResourceType::Focus, 35.0)
        .gain(ResourceType::ComboPoints, 1.0)
        .build();

    assert_eq!(spell.costs.len(), 1);
    assert_eq!(spell.costs[0].resource, ResourceType::Focus);
    assert_eq!(spell.costs[0].amount, 35.0);

    assert_eq!(spell.gains.len(), 1);
}

#[test]
fn aura_builder_buff() {
    let aura = AuraBuilder::buff(AuraIdx(1), "Power", 20.0)
        .damage_multiplier(1.1)
        .stacks(3)
        .build();

    assert_eq!(aura.id, AuraIdx(1));
    assert_eq!(aura.max_stacks, 3);
    assert!(!aura.flags.is_debuff);
    assert_eq!(aura.effects.len(), 1);
}

#[test]
fn aura_builder_dot() {
    let aura = AuraBuilder::dot(AuraIdx(1), "Bleed", 18.0, 3.0)
        .periodic_damage(3.0, 0.4)
        .build();

    assert!(aura.flags.is_debuff);
    assert!(aura.flags.is_periodic);
    assert!(aura.flags.can_pandemic);
    assert!(aura.flags.snapshots);
    assert!(aura.periodic.is_some());
}

#[test]
fn cast_context_basic() {
    let ctx = CastContext::new(SpellIdx(1), TargetIdx(0), SimTime::ZERO)
        .with_cast_time(SimTime::from_secs(2));

    assert_eq!(ctx.start_time, SimTime::ZERO);
    assert_eq!(ctx.complete_time, SimTime::from_secs(2));
    assert_eq!(ctx.duration().as_secs_f32(), 2.0);
}

#[test]
fn cast_result_variants() {
    let success = CastResult::Success(CastContext::new(SpellIdx(1), TargetIdx(0), SimTime::ZERO));
    assert!(success.is_success());

    let on_cd = CastResult::OnCooldown { remaining: SimTime::from_secs(5) };
    assert!(!on_cd.is_success());
}

#[test]
fn damage_effect_default() {
    let effect = DamageEffect::default();

    assert_eq!(effect.school, SpellSchool::Physical);
    assert!(effect.can_crit);
    assert!(effect.is_direct);
}

#[test]
fn spell_target_variants() {
    let cleave = SpellTarget::Cleave { max_targets: 3 };
    let ground = SpellTarget::Ground { radius: 8.0 };

    assert!(matches!(cleave, SpellTarget::Cleave { max_targets: 3 }));
    assert!(matches!(ground, SpellTarget::Ground { radius: _ }));
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (93 + 12 = 105 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod spec;`
- [ ] Create `src/spec/mod.rs`
- [ ] Create `src/spec/spell.rs`
- [ ] Create `src/spec/aura_def.rs`
- [ ] Create `src/spec/context.rs`
- [ ] Create `src/spec/builder.rs`
- [ ] Create `src/spec/tests.rs`
- [ ] Run `cargo test` — 105 tests pass
