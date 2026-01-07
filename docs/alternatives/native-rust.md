# Native Rust Rotations: A Pure-Code Alternative to Rhai

## Executive Summary

This document analyzes **pure native Rust** as an alternative to Rhai for rotation scripting in the wowlab simulation engine. The current Rhai-based system, while heavily optimized, introduces unavoidable overhead from AST optimization (~2-8 microseconds per state change) and evaluation (~0.05-1.6 microseconds per tick). A native Rust approach eliminates this entirely, offering **optimal performance** at the cost of requiring recompilation for rotation changes.

**Recommendation**: For production simulations where performance is critical, native Rust rotations using **enum-based action trees with closures** provide the best balance of performance, expressiveness, and maintainability. For development and user customization, retain Rhai as an optional path.

---

## Table of Contents

1. [Motivation](#motivation)
2. [Approach 1: Enum-Based Action Trees](#approach-1-enum-based-action-trees)
3. [Approach 2: Trait Object Dispatch](#approach-2-trait-object-dispatch)
4. [Approach 3: Closure-Based Conditions](#approach-3-closure-based-conditions)
5. [Approach 4: Hybrid Enum + Closure](#approach-4-hybrid-enum--closure-recommended)
6. [Builder Pattern for Rotation Construction](#builder-pattern-for-rotation-construction)
7. [SimulationCraft's Native Action Lists](#simulationcrafts-native-action-lists)
8. [Performance Analysis](#performance-analysis)
9. [Serialization and Configuration](#serialization-and-configuration)
10. [WASM Considerations](#wasm-considerations)
11. [Tradeoffs and Recommendations](#tradeoffs-and-recommendations)

---

## Motivation

The current Rhai rotation system in wowlab has undergone extensive optimization:

```
| Operation                  | Cost        | When                |
|----------------------------|-------------|---------------------|
| optimize_partial()         | ~12 microseconds      | On talent change    |
| optimize_from_partial()    | ~2 microseconds       | On state change     |
| evaluate_optimized()       | ~0.05 microseconds    | Every tick          |
| Plain Rhai eval            | ~1.6 microseconds     | Every tick          |
```

Despite these optimizations achieving a 6.6x speedup over naive Rhai evaluation, the fundamental overhead remains:

1. **AST Walking**: Even "optimized" ASTs require traversal
2. **Dynamic Type Handling**: Rhai's `Dynamic` type has runtime overhead
3. **Scope Construction**: Building Rhai scopes from game state
4. **Cache Invalidation**: State changes trigger re-optimization

For a 5-minute (300-second) simulation at ~1.5-second GCDs, that's ~200 rotation decisions. With state changes occurring roughly every other GCD, the overhead compounds to ~400-800 microseconds of pure scripting overhead per simulation. At 10,000+ iterations, this becomes measurable.

---

## Approach 1: Enum-Based Action Trees

The most straightforward native approach represents rotations as nested enums encoding the decision tree directly.

### Core Data Structures

```rust
use crate::types::{SpellIdx, AuraIdx, SimTime};
use crate::sim::SimState;

/// A condition that can be evaluated against game state
#[derive(Clone, Debug)]
pub enum Condition {
    // Boolean conditions
    And(Box<Condition>, Box<Condition>),
    Or(Box<Condition>, Box<Condition>),
    Not(Box<Condition>),
    True,
    False,

    // Spell conditions
    SpellReady(SpellIdx),
    SpellCharges(SpellIdx, Comparator, u8),
    SpellCooldownRemaining(SpellIdx, Comparator, f32),

    // Aura conditions
    AuraActive(AuraIdx),
    AuraStacks(AuraIdx, Comparator, u8),
    AuraRemaining(AuraIdx, Comparator, f32),

    // Resource conditions
    ResourceAbove(f32),
    ResourceBelow(f32),
    ResourceDeficitBelow(f32),

    // Target conditions
    TargetHealthBelow(f32),
    TargetHealthAbove(f32),
    EnemyCount(Comparator, usize),

    // Combat state
    InCombat,
    ExecutePhase,
    BurstWindow,

    // Time-based
    FightRemaining(Comparator, f32),
    TimeInCombat(Comparator, f32),
}

#[derive(Clone, Copy, Debug)]
pub enum Comparator {
    Lt,
    Le,
    Eq,
    Ge,
    Gt,
}

/// A rotation action
#[derive(Clone, Debug)]
pub enum RotationAction {
    /// Cast a spell on the primary target
    Cast(SpellIdx),
    /// Cast a spell on a specific target
    CastOn(SpellIdx, TargetSelector),
    /// Wait for GCD
    WaitGcd,
    /// Wait for a specific duration
    Wait(f32),
    /// Pool resources until a condition is met
    Pool(SpellIdx, f32),
    /// No action (fallback)
    None,
}

#[derive(Clone, Debug)]
pub enum TargetSelector {
    Primary,
    Self_,
    Pet,
    LowestHealth,
    HighestHealth,
}

/// A rotation entry: condition -> action
#[derive(Clone, Debug)]
pub struct RotationEntry {
    pub condition: Condition,
    pub action: RotationAction,
}

/// Complete rotation as a priority list
#[derive(Clone, Debug)]
pub struct Rotation {
    pub entries: Vec<RotationEntry>,
    pub fallback: RotationAction,
}
```

### Evaluation Implementation

```rust
impl Condition {
    /// Evaluate condition against current game state
    /// This compiles to efficient branching with no vtable lookups
    #[inline]
    pub fn evaluate(&self, state: &SimState) -> bool {
        match self {
            // Boolean combinators
            Condition::And(a, b) => a.evaluate(state) && b.evaluate(state),
            Condition::Or(a, b) => a.evaluate(state) || b.evaluate(state),
            Condition::Not(c) => !c.evaluate(state),
            Condition::True => true,
            Condition::False => false,

            // Spell conditions
            Condition::SpellReady(spell) => {
                state.player.cooldown(*spell)
                    .map(|cd| cd.is_ready(state.now()))
                    .unwrap_or(true)
            }
            Condition::SpellCharges(spell, cmp, val) => {
                let charges = state.player.charged_cooldown(*spell)
                    .map(|cd| cd.current_charges)
                    .unwrap_or(0);
                cmp.compare(charges, *val)
            }
            Condition::SpellCooldownRemaining(spell, cmp, secs) => {
                let remaining = state.player.cooldown(*spell)
                    .map(|cd| cd.remaining(state.now()).as_secs_f32())
                    .unwrap_or(0.0);
                cmp.compare_f32(remaining, *secs)
            }

            // Aura conditions
            Condition::AuraActive(aura) => {
                state.player.buffs.has(*aura, state.now())
            }
            Condition::AuraStacks(aura, cmp, val) => {
                let stacks = state.player.buffs.stacks(*aura, state.now());
                cmp.compare(stacks, *val)
            }
            Condition::AuraRemaining(aura, cmp, secs) => {
                let remaining = state.player.buffs.get(*aura)
                    .map(|a| a.remaining(state.now()).as_secs_f32())
                    .unwrap_or(0.0);
                cmp.compare_f32(remaining, *secs)
            }

            // Resource conditions
            Condition::ResourceAbove(threshold) => {
                state.player.resources.primary
                    .as_ref()
                    .map(|r| r.current >= *threshold)
                    .unwrap_or(false)
            }
            Condition::ResourceBelow(threshold) => {
                state.player.resources.primary
                    .as_ref()
                    .map(|r| r.current < *threshold)
                    .unwrap_or(true)
            }
            Condition::ResourceDeficitBelow(threshold) => {
                state.player.resources.primary
                    .as_ref()
                    .map(|r| r.deficit() < *threshold)
                    .unwrap_or(true)
            }

            // Target conditions
            Condition::TargetHealthBelow(pct) => {
                state.enemies.primary()
                    .map(|e| e.health_percent() < *pct)
                    .unwrap_or(false)
            }
            Condition::TargetHealthAbove(pct) => {
                state.enemies.primary()
                    .map(|e| e.health_percent() >= *pct)
                    .unwrap_or(true)
            }
            Condition::EnemyCount(cmp, count) => {
                cmp.compare(state.enemies.alive_count(), *count)
            }

            // Combat state
            Condition::InCombat => state.in_combat,
            Condition::ExecutePhase => {
                state.enemies.primary()
                    .map(|e| e.health_percent() < 0.20)
                    .unwrap_or(false)
            }
            Condition::BurstWindow => {
                // Spec-specific, could be parameterized
                state.player.buffs.has(BESTIAL_WRATH_BUFF, state.now()) ||
                state.player.buffs.has(CALL_OF_THE_WILD_BUFF, state.now())
            }

            // Time-based
            Condition::FightRemaining(cmp, secs) => {
                let remaining = state.fight_remaining().as_secs_f32();
                cmp.compare_f32(remaining, *secs)
            }
            Condition::TimeInCombat(cmp, secs) => {
                let elapsed = state.combat_time().as_secs_f32();
                cmp.compare_f32(elapsed, *secs)
            }
        }
    }
}

impl Comparator {
    #[inline]
    fn compare<T: PartialOrd>(&self, a: T, b: T) -> bool {
        match self {
            Comparator::Lt => a < b,
            Comparator::Le => a <= b,
            Comparator::Eq => a == b,
            Comparator::Ge => a >= b,
            Comparator::Gt => a > b,
        }
    }

    #[inline]
    fn compare_f32(&self, a: f32, b: f32) -> bool {
        self.compare(a, b)
    }
}

impl Rotation {
    /// Evaluate the rotation and return the next action
    /// This is O(n) in the number of entries, but with no allocations
    #[inline]
    pub fn next_action(&self, state: &SimState) -> &RotationAction {
        for entry in &self.entries {
            if entry.condition.evaluate(state) {
                return &entry.action;
            }
        }
        &self.fallback
    }
}
```

### Example BM Hunter Rotation

```rust
use super::constants::*;

pub fn bm_hunter_rotation() -> Rotation {
    use Condition::*;
    use RotationAction::*;
    use Comparator::*;

    Rotation {
        entries: vec![
            // Kill Shot in execute
            RotationEntry {
                condition: And(
                    Box::new(SpellReady(KILL_SHOT)),
                    Box::new(TargetHealthBelow(0.20)),
                ),
                action: Cast(KILL_SHOT),
            },

            // Call of the Wild on cooldown
            RotationEntry {
                condition: SpellReady(CALL_OF_THE_WILD),
                action: Cast(CALL_OF_THE_WILD),
            },

            // Bestial Wrath on cooldown
            RotationEntry {
                condition: SpellReady(BESTIAL_WRATH),
                action: Cast(BESTIAL_WRATH),
            },

            // Bloodshed with Bestial Wrath
            RotationEntry {
                condition: And(
                    Box::new(SpellReady(BLOODSHED)),
                    Box::new(AuraActive(BESTIAL_WRATH_BUFF)),
                ),
                action: Cast(BLOODSHED),
            },

            // Barbed Shot to maintain Frenzy
            RotationEntry {
                condition: And(
                    Box::new(SpellCharges(BARBED_SHOT, Ge, 1)),
                    Box::new(Or(
                        Box::new(AuraRemaining(FRENZY, Le, 2.0)),
                        Box::new(Not(Box::new(AuraActive(FRENZY)))),
                    )),
                ),
                action: Cast(BARBED_SHOT),
            },

            // Barbed Shot at 2 charges
            RotationEntry {
                condition: SpellCharges(BARBED_SHOT, Ge, 2),
                action: Cast(BARBED_SHOT),
            },

            // Kill Command on cooldown
            RotationEntry {
                condition: And(
                    Box::new(SpellReady(KILL_COMMAND)),
                    Box::new(ResourceAbove(30.0)),
                ),
                action: Cast(KILL_COMMAND),
            },

            // Dire Beast
            RotationEntry {
                condition: SpellReady(DIRE_BEAST),
                action: Cast(DIRE_BEAST),
            },

            // Cobra Shot as filler
            RotationEntry {
                condition: And(
                    Box::new(ResourceAbove(35.0)),
                    Box::new(Or(
                        Box::new(SpellCooldownRemaining(KILL_COMMAND, Gt, 2.0)),
                        Box::new(ResourceAbove(80.0)),
                    )),
                ),
                action: Cast(COBRA_SHOT),
            },
        ],
        fallback: WaitGcd,
    }
}
```

### Pros and Cons

| Aspect | Assessment |
|--------|------------|
| Performance | Excellent - pure match dispatch, no allocations |
| Type Safety | Full compile-time checking |
| Expressiveness | Limited to predefined conditions |
| Extensibility | Requires adding enum variants |
| Serialization | Easy with serde |
| Readability | Verbose but explicit |

---

## Approach 2: Trait Object Dispatch

Use trait objects for maximum extensibility at the cost of some performance.

```rust
/// Trait for rotation conditions
pub trait RotationCondition: Send + Sync {
    fn evaluate(&self, state: &SimState) -> bool;
    fn description(&self) -> &str;
}

/// Trait for rotation entries
pub trait RotationRule: Send + Sync {
    fn should_execute(&self, state: &SimState) -> bool;
    fn action(&self) -> &RotationAction;
    fn priority(&self) -> i32 { 0 }
}

/// Dynamic rotation using trait objects
pub struct DynamicRotation {
    rules: Vec<Box<dyn RotationRule>>,
    fallback: RotationAction,
}

impl DynamicRotation {
    pub fn next_action(&self, state: &SimState) -> &RotationAction {
        for rule in &self.rules {
            if rule.should_execute(state) {
                return rule.action();
            }
        }
        &self.fallback
    }
}

// Example implementation
struct SpellReadyCondition {
    spell: SpellIdx,
}

impl RotationCondition for SpellReadyCondition {
    fn evaluate(&self, state: &SimState) -> bool {
        state.player.cooldown(self.spell)
            .map(|cd| cd.is_ready(state.now()))
            .unwrap_or(true)
    }

    fn description(&self) -> &str {
        "Spell ready"
    }
}

struct CompositeCondition {
    conditions: Vec<Box<dyn RotationCondition>>,
    mode: CompositeMode,
}

enum CompositeMode {
    All, // AND
    Any, // OR
}

impl RotationCondition for CompositeCondition {
    fn evaluate(&self, state: &SimState) -> bool {
        match self.mode {
            CompositeMode::All => self.conditions.iter().all(|c| c.evaluate(state)),
            CompositeMode::Any => self.conditions.iter().any(|c| c.evaluate(state)),
        }
    }

    fn description(&self) -> &str {
        match self.mode {
            CompositeMode::All => "All conditions",
            CompositeMode::Any => "Any condition",
        }
    }
}
```

### Performance Impact

Based on [benchmarks from enum_dispatch](https://docs.rs/enum_dispatch/latest/enum_dispatch/):

- Trait object dispatch: ~5.9 milliseconds per 1024 calls
- Enum dispatch: ~0.48 milliseconds per 1024 calls
- **Result: ~12x slowdown** for trait objects vs enums

For rotation evaluation, this translates to:
- Enum: ~5-20 nanoseconds per evaluation
- Trait object: ~50-200 nanoseconds per evaluation

While both are faster than Rhai (~50-1600 nanoseconds), the enum approach is significantly better for this hot path.

---

## Approach 3: Closure-Based Conditions

Use closures for maximum flexibility while keeping evaluation inline.

```rust
/// Condition as a closure
pub struct ClosureCondition<F>
where
    F: Fn(&SimState) -> bool + Send + Sync,
{
    evaluator: F,
    description: &'static str,
}

impl<F> ClosureCondition<F>
where
    F: Fn(&SimState) -> bool + Send + Sync,
{
    pub fn new(description: &'static str, evaluator: F) -> Self {
        Self { evaluator, description }
    }

    #[inline]
    pub fn evaluate(&self, state: &SimState) -> bool {
        (self.evaluator)(state)
    }
}

/// Rotation entry with closure condition
pub struct ClosureEntry<F>
where
    F: Fn(&SimState) -> bool + Send + Sync,
{
    pub condition: ClosureCondition<F>,
    pub action: RotationAction,
}

/// Rotation using type-erased closures (for heterogeneous storage)
pub struct ClosureRotation {
    entries: Vec<(Box<dyn Fn(&SimState) -> bool + Send + Sync>, RotationAction)>,
    fallback: RotationAction,
}

impl ClosureRotation {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            fallback: RotationAction::WaitGcd,
        }
    }

    pub fn add_entry<F>(&mut self, condition: F, action: RotationAction)
    where
        F: Fn(&SimState) -> bool + Send + Sync + 'static,
    {
        self.entries.push((Box::new(condition), action));
    }

    pub fn set_fallback(&mut self, action: RotationAction) {
        self.fallback = action;
    }

    #[inline]
    pub fn next_action(&self, state: &SimState) -> &RotationAction {
        for (condition, action) in &self.entries {
            if condition(state) {
                return action;
            }
        }
        &self.fallback
    }
}
```

### Example Usage

```rust
fn create_bm_rotation() -> ClosureRotation {
    let mut rotation = ClosureRotation::new();

    // Kill Shot in execute
    rotation.add_entry(
        |state| {
            state.player.cooldown(KILL_SHOT)
                .map(|cd| cd.is_ready(state.now()))
                .unwrap_or(true)
            && state.enemies.primary()
                .map(|e| e.health_percent() < 0.20)
                .unwrap_or(false)
        },
        RotationAction::Cast(KILL_SHOT),
    );

    // Call of the Wild
    rotation.add_entry(
        |state| {
            state.player.cooldown(CALL_OF_THE_WILD)
                .map(|cd| cd.is_ready(state.now()))
                .unwrap_or(true)
        },
        RotationAction::Cast(CALL_OF_THE_WILD),
    );

    // Bestial Wrath
    rotation.add_entry(
        |state| {
            state.player.cooldown(BESTIAL_WRATH)
                .map(|cd| cd.is_ready(state.now()))
                .unwrap_or(true)
        },
        RotationAction::Cast(BESTIAL_WRATH),
    );

    // ... more entries

    rotation
}
```

### Pros and Cons

| Aspect | Assessment |
|--------|------------|
| Performance | Good - indirect call, but inlinable in some cases |
| Type Safety | Full - closures are type-checked |
| Expressiveness | Maximum - arbitrary Rust code |
| Extensibility | Excellent - just add closures |
| Serialization | Impossible - closures can't be serialized |
| Readability | Mixed - inline closures can be verbose |

---

## Approach 4: Hybrid Enum + Closure (Recommended)

Combine enum-based conditions for common patterns with closure escape hatches for complex logic.

```rust
/// Condition that can be either enum-based or closure-based
pub enum HybridCondition {
    // Standard enum conditions (fast path)
    SpellReady(SpellIdx),
    SpellCharges(SpellIdx, Comparator, u8),
    AuraActive(AuraIdx),
    AuraStacks(AuraIdx, Comparator, u8),
    AuraRemaining(AuraIdx, Comparator, f32),
    ResourceAbove(f32),
    ResourceBelow(f32),
    TargetHealthBelow(f32),
    ExecutePhase,

    // Combinators
    And(Box<HybridCondition>, Box<HybridCondition>),
    Or(Box<HybridCondition>, Box<HybridCondition>),
    Not(Box<HybridCondition>),

    // Closure escape hatch for complex conditions
    Custom(Box<dyn Fn(&SimState) -> bool + Send + Sync>),
}

impl HybridCondition {
    #[inline]
    pub fn evaluate(&self, state: &SimState) -> bool {
        match self {
            // Fast enum paths
            HybridCondition::SpellReady(spell) => {
                state.player.cooldown(*spell)
                    .map(|cd| cd.is_ready(state.now()))
                    .unwrap_or(true)
            }
            HybridCondition::SpellCharges(spell, cmp, val) => {
                let charges = state.player.charged_cooldown(*spell)
                    .map(|cd| cd.current_charges)
                    .unwrap_or(0);
                cmp.compare(charges, *val)
            }
            HybridCondition::AuraActive(aura) => {
                state.player.buffs.has(*aura, state.now())
            }
            HybridCondition::AuraStacks(aura, cmp, val) => {
                let stacks = state.player.buffs.stacks(*aura, state.now());
                cmp.compare(stacks, *val)
            }
            HybridCondition::AuraRemaining(aura, cmp, secs) => {
                let remaining = state.player.buffs.get(*aura)
                    .map(|a| a.remaining(state.now()).as_secs_f32())
                    .unwrap_or(0.0);
                cmp.compare_f32(remaining, *secs)
            }
            HybridCondition::ResourceAbove(threshold) => {
                state.player.resources.primary
                    .as_ref()
                    .map(|r| r.current >= *threshold)
                    .unwrap_or(false)
            }
            HybridCondition::ResourceBelow(threshold) => {
                state.player.resources.primary
                    .as_ref()
                    .map(|r| r.current < *threshold)
                    .unwrap_or(true)
            }
            HybridCondition::TargetHealthBelow(pct) => {
                state.enemies.primary()
                    .map(|e| e.health_percent() < *pct)
                    .unwrap_or(false)
            }
            HybridCondition::ExecutePhase => {
                state.enemies.primary()
                    .map(|e| e.health_percent() < 0.20)
                    .unwrap_or(false)
            }

            // Combinators
            HybridCondition::And(a, b) => a.evaluate(state) && b.evaluate(state),
            HybridCondition::Or(a, b) => a.evaluate(state) || b.evaluate(state),
            HybridCondition::Not(c) => !c.evaluate(state),

            // Closure escape hatch (slightly slower but maximum flexibility)
            HybridCondition::Custom(f) => f(state),
        }
    }

    // Builder methods for ergonomic construction
    pub fn and(self, other: Self) -> Self {
        HybridCondition::And(Box::new(self), Box::new(other))
    }

    pub fn or(self, other: Self) -> Self {
        HybridCondition::Or(Box::new(self), Box::new(other))
    }

    pub fn not(self) -> Self {
        HybridCondition::Not(Box::new(self))
    }
}

/// Rotation with hybrid conditions
pub struct HybridRotation {
    entries: Vec<(HybridCondition, RotationAction)>,
    fallback: RotationAction,
}

impl HybridRotation {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            fallback: RotationAction::WaitGcd,
        }
    }

    pub fn add(&mut self, condition: HybridCondition, action: RotationAction) -> &mut Self {
        self.entries.push((condition, action));
        self
    }

    pub fn fallback(&mut self, action: RotationAction) -> &mut Self {
        self.fallback = action;
        self
    }

    #[inline]
    pub fn next_action(&self, state: &SimState) -> &RotationAction {
        for (condition, action) in &self.entries {
            if condition.evaluate(state) {
                return action;
            }
        }
        &self.fallback
    }
}
```

---

## Builder Pattern for Rotation Construction

A fluent builder API makes rotation construction more readable and less error-prone.

```rust
/// Fluent builder for rotations
pub struct RotationBuilder {
    entries: Vec<(HybridCondition, RotationAction)>,
    fallback: RotationAction,
}

impl RotationBuilder {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            fallback: RotationAction::WaitGcd,
        }
    }

    /// Add a simple spell cast when it's ready
    pub fn cast_when_ready(mut self, spell: SpellIdx) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add a spell cast with resource requirement
    pub fn cast_with_resource(mut self, spell: SpellIdx, min_resource: f32) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell).and(
                HybridCondition::ResourceAbove(min_resource)
            ),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add a spell cast with custom condition
    pub fn cast_if(mut self, spell: SpellIdx, condition: HybridCondition) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell).and(condition),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add a priority execute ability
    pub fn execute_spell(mut self, spell: SpellIdx, threshold: f32) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell).and(
                HybridCondition::TargetHealthBelow(threshold)
            ),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add a maintenance buff/dot
    pub fn maintain_aura(mut self, spell: SpellIdx, aura: AuraIdx, pandemic: f32) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell).and(
                HybridCondition::AuraRemaining(aura, Comparator::Le, pandemic)
                    .or(HybridCondition::AuraActive(aura).not())
            ),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add a cooldown during burst
    pub fn cast_during_burst(
        mut self,
        spell: SpellIdx,
        burst_aura: AuraIdx
    ) -> Self {
        self.entries.push((
            HybridCondition::SpellReady(spell).and(
                HybridCondition::AuraActive(burst_aura)
            ),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Add charged spell usage
    pub fn use_charge(
        mut self,
        spell: SpellIdx,
        min_charges: u8,
        condition: Option<HybridCondition>,
    ) -> Self {
        let base = HybridCondition::SpellCharges(spell, Comparator::Ge, min_charges);
        let cond = match condition {
            Some(c) => base.and(c),
            None => base,
        };
        self.entries.push((cond, RotationAction::Cast(spell)));
        self
    }

    /// Add a filler spell
    pub fn filler(mut self, spell: SpellIdx, min_resource: f32) -> Self {
        self.entries.push((
            HybridCondition::ResourceAbove(min_resource),
            RotationAction::Cast(spell),
        ));
        self
    }

    /// Set fallback action
    pub fn fallback(mut self, action: RotationAction) -> Self {
        self.fallback = action;
        self
    }

    /// Build the rotation
    pub fn build(self) -> HybridRotation {
        HybridRotation {
            entries: self.entries,
            fallback: self.fallback,
        }
    }
}

// Example: BM Hunter rotation using builder
pub fn bm_hunter_builder() -> HybridRotation {
    RotationBuilder::new()
        // Execute phase
        .execute_spell(KILL_SHOT, 0.20)

        // Major cooldowns
        .cast_when_ready(CALL_OF_THE_WILD)
        .cast_when_ready(BESTIAL_WRATH)

        // Bloodshed during burst
        .cast_during_burst(BLOODSHED, BESTIAL_WRATH_BUFF)

        // Maintain Frenzy
        .maintain_aura(BARBED_SHOT, FRENZY, 2.0)

        // Use charges at cap
        .use_charge(BARBED_SHOT, 2, None)

        // Core rotational spells
        .cast_with_resource(KILL_COMMAND, 30.0)
        .cast_when_ready(DIRE_BEAST)

        // Filler
        .filler(COBRA_SHOT, 50.0)

        // Fallback
        .fallback(RotationAction::WaitGcd)
        .build()
}
```

---

## SimulationCraft's Native Action Lists

SimulationCraft uses a hybrid approach that's worth understanding for comparison.

### Architecture Overview

Based on the [SimulationCraft Wiki](https://github.com/simulationcraft/simc/wiki/ActionLists):

1. **Text-based APL Definition**: Users write APLs in a text format:
   ```
   actions=auto_attack
   actions+=/call_action_list,name=trinkets
   actions+=/bestial_wrath
   actions+=/kill_command,if=cooldown.bestial_wrath.remains>2
   ```

2. **Parsing to C++ Objects**: The APL text is parsed into `action_t` objects with `expr_t` condition trees.

3. **Expression Compilation**: Conditions like `cooldown.bestial_wrath.remains>2` are compiled into expression objects that evaluate efficiently at runtime.

4. **Native Fallback**: For each spec, there's a native C++ fallback APL defined in methods like `mage_t::apl_fire()` in `sc_mage.cpp`.

### Key Implementation Details

From the [Python APL Converter documentation](https://simulationcraft.org/doc/md__var_lib_jenkins_jobs_build-doc_workspace_engine_class_modules_apl__r_e_a_d_m_e.html):

- APL text is converted to C++ code at build time
- Generated code goes into `engine/class_modules/apl/`
- Each line becomes an `action_t` creation with optional conditions
- Conditions are parsed into `expr_t` expression trees

### Expression System

SimC's `expr_t` is essentially an enum-based expression tree similar to our `Condition` enum:

```cpp
// Simplified conceptual representation
struct expr_t {
    virtual double evaluate() = 0;
};

struct and_expr_t : expr_t {
    std::unique_ptr<expr_t> left, right;
    double evaluate() override {
        return left->evaluate() && right->evaluate();
    }
};

struct cooldown_remains_expr_t : expr_t {
    cooldown_t* cd;
    double evaluate() override {
        return cd->remains().total_seconds();
    }
};
```

### Key Takeaway

SimulationCraft achieves good performance despite text-based APLs because:
1. Expressions are parsed once and cached as objects
2. Evaluation is done via virtual dispatch (similar to our trait approach)
3. Hot paths are optimized in the expression tree structure

Our enum-based approach will be **faster** than SimC's because we avoid virtual dispatch entirely.

---

## Performance Analysis

### Benchmark Expectations

Based on [Rust dispatch benchmarks](https://docs.rs/enum_dispatch/latest/enum_dispatch/):

| Approach | Cost per Evaluation | Relative to Rhai |
|----------|--------------------:|-----------------|
| Enum dispatch | ~5-20 ns | 80-320x faster |
| Trait object | ~50-200 ns | 8-32x faster |
| Closure (boxed) | ~30-100 ns | 16-53x faster |
| Rhai optimized | ~50-1600 ns | baseline |
| Rhai naive | ~1600 ns | baseline |

### Memory Overhead

| Approach | Memory per Entry | Notes |
|----------|------------------|-------|
| Enum condition | 16-48 bytes | Stack-allocated, cache-friendly |
| Trait object | 16 bytes (2 pointers) + heap | Indirection, fragmentation |
| Closure (boxed) | 16 bytes + closure size | Similar to trait objects |

### Real-World Impact

For a 5-minute simulation with 200 rotation decisions:

| Approach | Total Rotation Time | Improvement |
|----------|-------------------:|-------------|
| Rhai (current) | ~100-400 microseconds | baseline |
| Native enum | ~1-4 microseconds | 100x faster |
| Native trait | ~10-40 microseconds | 10x faster |

At 10,000 iterations:
- Rhai: 1-4 seconds of pure rotation overhead
- Native enum: 10-40 milliseconds
- **Savings: 1-4 seconds per batch**

---

## Serialization and Configuration

### The Tradeoff

Native Rust rotations require recompilation for changes. However, we can support **serializable configuration** for the enum-based approach.

### Serde Integration

Using [Serde's enum representations](https://serde.rs/enum-representations.html):

```rust
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SerializableCondition {
    #[serde(rename = "spell_ready")]
    SpellReady { spell_id: u32 },

    #[serde(rename = "spell_charges")]
    SpellCharges {
        spell_id: u32,
        #[serde(default)]
        comparator: String,  // ">=", "<=", "==", etc.
        value: u8,
    },

    #[serde(rename = "aura_active")]
    AuraActive { aura_id: u32 },

    #[serde(rename = "aura_remaining")]
    AuraRemaining {
        aura_id: u32,
        comparator: String,
        seconds: f32,
    },

    #[serde(rename = "resource_above")]
    ResourceAbove { amount: f32 },

    #[serde(rename = "target_health_below")]
    TargetHealthBelow { percent: f32 },

    #[serde(rename = "and")]
    And { conditions: Vec<SerializableCondition> },

    #[serde(rename = "or")]
    Or { conditions: Vec<SerializableCondition> },

    #[serde(rename = "not")]
    Not { condition: Box<SerializableCondition> },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SerializableAction {
    #[serde(rename = "cast")]
    Cast { spell_id: u32 },

    #[serde(rename = "wait_gcd")]
    WaitGcd,

    #[serde(rename = "wait")]
    Wait { seconds: f32 },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableEntry {
    pub condition: SerializableCondition,
    pub action: SerializableAction,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableRotation {
    pub name: String,
    pub spec: String,
    pub entries: Vec<SerializableEntry>,
    pub fallback: SerializableAction,
}
```

### Example TOML Configuration

```toml
name = "BM Hunter Single Target"
spec = "beast_mastery"

[[entries]]
[entries.condition]
type = "and"
conditions = [
    { type = "spell_ready", spell_id = 53351 },
    { type = "target_health_below", percent = 0.20 }
]
[entries.action]
type = "cast"
spell_id = 53351  # Kill Shot

[[entries]]
[entries.condition]
type = "spell_ready"
spell_id = 359844  # Call of the Wild
[entries.action]
type = "cast"
spell_id = 359844

[[entries]]
[entries.condition]
type = "spell_ready"
spell_id = 19574  # Bestial Wrath
[entries.action]
type = "cast"
spell_id = 19574

[[entries]]
[entries.condition]
type = "and"
conditions = [
    { type = "spell_charges", spell_id = 217200, comparator = ">=", value = 1 },
    { type = "or", conditions = [
        { type = "aura_remaining", aura_id = 272790, comparator = "<=", seconds = 2.0 },
        { type = "not", condition = { type = "aura_active", aura_id = 272790 } }
    ]}
]
[entries.action]
type = "cast"
spell_id = 217200  # Barbed Shot

[fallback]
type = "wait_gcd"
```

### Conversion to Runtime

```rust
impl SerializableRotation {
    /// Convert to runtime rotation (requires spell ID resolution)
    pub fn to_rotation(&self, spell_lookup: &impl SpellLookup) -> Result<HybridRotation, ConversionError> {
        let mut rotation = HybridRotation::new();

        for entry in &self.entries {
            let condition = entry.condition.to_condition(spell_lookup)?;
            let action = entry.action.to_action(spell_lookup)?;
            rotation.add(condition, action);
        }

        rotation.fallback = self.fallback.to_action(spell_lookup)?;
        Ok(rotation)
    }
}

impl SerializableCondition {
    fn to_condition(&self, lookup: &impl SpellLookup) -> Result<HybridCondition, ConversionError> {
        match self {
            SerializableCondition::SpellReady { spell_id } => {
                Ok(HybridCondition::SpellReady(SpellIdx(*spell_id)))
            }
            SerializableCondition::SpellCharges { spell_id, comparator, value } => {
                let cmp = parse_comparator(comparator)?;
                Ok(HybridCondition::SpellCharges(SpellIdx(*spell_id), cmp, *value))
            }
            SerializableCondition::And { conditions } => {
                let mut iter = conditions.iter();
                let first = iter.next()
                    .ok_or(ConversionError::EmptyConditionList)?
                    .to_condition(lookup)?;
                iter.try_fold(first, |acc, c| {
                    Ok(acc.and(c.to_condition(lookup)?))
                })
            }
            // ... other variants
        }
    }
}
```

### Hybrid Approach: Compile-Time + Runtime Override

```rust
pub struct ConfigurableRotation {
    /// Built-in rotation (fast)
    native: HybridRotation,
    /// Optional runtime override (still fast, but configurable)
    override_: Option<HybridRotation>,
}

impl ConfigurableRotation {
    pub fn new(native: HybridRotation) -> Self {
        Self { native, override_: None }
    }

    pub fn with_override(mut self, config_path: &Path) -> Result<Self, Error> {
        let toml_str = std::fs::read_to_string(config_path)?;
        let serializable: SerializableRotation = toml::from_str(&toml_str)?;
        self.override_ = Some(serializable.to_rotation(&DefaultSpellLookup)?);
        Ok(self)
    }

    #[inline]
    pub fn next_action(&self, state: &SimState) -> &RotationAction {
        self.override_.as_ref()
            .unwrap_or(&self.native)
            .next_action(state)
    }
}
```

---

## WASM Considerations

### Compatibility

Native Rust rotations compile to WASM without issues:

```rust
// All of these work in WASM:
// - Enum matching
// - Closures (with 'static lifetime)
// - Trait objects (with Send + Sync bounds removed for single-threaded WASM)

#[cfg(target_arch = "wasm32")]
pub trait RotationCondition {
    fn evaluate(&self, state: &SimState) -> bool;
}

#[cfg(not(target_arch = "wasm32"))]
pub trait RotationCondition: Send + Sync {
    fn evaluate(&self, state: &SimState) -> bool;
}
```

### Performance in WASM

WASM performance characteristics:

1. **Enum dispatch**: Excellent - compiles to efficient table switches
2. **Trait objects**: Good - vtables work normally in WASM
3. **Closures**: Good - but no SIMD optimizations in some runtimes
4. **Serialization**: Works - can load rotation configs via fetch

### Bundle Size Impact

Compared to Rhai:

| Component | Size (compressed) |
|-----------|------------------:|
| Rhai runtime | ~200-400 KB |
| Native enums only | ~5-20 KB |
| + Serde support | +50-100 KB |

**Total savings: 100-300 KB** smaller WASM bundle.

### Example WASM Integration

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmRotation {
    inner: HybridRotation,
}

#[wasm_bindgen]
impl WasmRotation {
    /// Create from built-in spec
    #[wasm_bindgen(constructor)]
    pub fn new(spec: &str) -> Result<WasmRotation, JsValue> {
        let inner = match spec {
            "bm_hunter" => bm_hunter_builder(),
            "mm_hunter" => mm_hunter_builder(),
            _ => return Err(JsValue::from_str("Unknown spec")),
        };
        Ok(Self { inner })
    }

    /// Create from JSON configuration
    #[wasm_bindgen(js_name = fromJson)]
    pub fn from_json(json: &str) -> Result<WasmRotation, JsValue> {
        let serializable: SerializableRotation = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let inner = serializable.to_rotation(&DefaultSpellLookup)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(Self { inner })
    }
}
```

---

## Tradeoffs and Recommendations

### Summary Matrix

| Aspect | Rhai | Native Enum | Native Trait | Native Closure | Hybrid |
|--------|------|-------------|--------------|----------------|--------|
| **Performance** | Fair | Excellent | Good | Good | Excellent |
| **Flexibility** | Excellent | Limited | Good | Excellent | Good |
| **Type Safety** | None | Full | Full | Full | Full |
| **Serialization** | N/A | Yes | No | No | Partial |
| **WASM Size** | Large | Small | Small | Small | Small |
| **Hot Reload** | Yes | No | No | No | Partial |
| **Complexity** | Low | Medium | Medium | Low | Medium |

### Recommended Approach

**Use the Hybrid Enum + Closure approach with serialization support:**

1. **Core rotation logic** as enum-based conditions for maximum performance
2. **Custom closures** for spec-specific complex conditions
3. **Serializable configuration** for runtime customization (loads to enums)
4. **Builder API** for readable rotation construction

### Migration Path

1. **Phase 1**: Implement `HybridCondition` and `HybridRotation` types
2. **Phase 2**: Create `RotationBuilder` API
3. **Phase 3**: Port BM Hunter rotation to native (keep Rhai as fallback)
4. **Phase 4**: Add serialization support for configuration files
5. **Phase 5**: Benchmark and optimize
6. **Phase 6**: Port remaining specs, deprecate Rhai for production

### Code Organization

```
crates/engine/src/rotation/
    mod.rs              # Public API

    # Existing Rhai system (deprecated for prod)
    rhai/
        mod.rs
        compiler.rs
        bindings.rs
        schema.rs

    # New native system
    native/
        mod.rs
        condition.rs    # HybridCondition enum
        action.rs       # RotationAction enum
        rotation.rs     # HybridRotation struct
        builder.rs      # RotationBuilder API
        serialize.rs    # Serde integration

    # Spec-specific rotations
    specs/
        mod.rs
        bm_hunter.rs
        mm_hunter.rs
        # ...
```

### Final Recommendation

For a WoW simulation engine where rotation evaluation is on the hot path and executed millions of times during batch simulations, **native Rust with enum-based conditions is the clear winner**. The 100x performance improvement over Rhai, combined with full type safety and compile-time checking, makes it the optimal choice.

The tradeoff of requiring recompilation for rotation changes is mitigated by:
1. Serializable configuration files for tuning
2. Builder API for readable rotation construction
3. Optional Rhai fallback for development/experimentation

This approach aligns with how SimulationCraft handles APLs (text -> compiled C++) while achieving even better performance through Rust's enum dispatch optimization.

---

## References

- [Rust Dispatch Explained: When Enums Beat dyn Trait](https://www.somethingsblog.com/2025/04/20/rust-dispatch-explained-when-enums-beat-dyn-trait/)
- [enum_dispatch crate](https://docs.rs/enum_dispatch/latest/enum_dispatch/)
- [Enum or Trait Object - Possible Rust](https://www.possiblerust.com/guide/enum-or-trait-object)
- [Serde Enum Representations](https://serde.rs/enum-representations.html)
- [SimulationCraft Action Lists Wiki](https://github.com/simulationcraft/simc/wiki/ActionLists)
- [SimulationCraft Conditional Expressions](https://github.com/simulationcraft/simc/wiki/Action-List-Conditional-Expressions)
