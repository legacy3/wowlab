---
name: engine-content
description: Add new classes, specs, spells, auras, procs, and talents to the Rust simulation engine. Use when implementing new WoW content in crates/engine/.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Engine Content Implementation Guide

Comprehensive guide for adding classes, specs, spells, auras, procs, and talents to the WoW simulation engine at `crates/engine/`.

## Architecture Overview

```
crates/engine/src/
├── types/class.rs      # ClassId, SpecId enums (add new IDs here)
├── class/              # Class-level shared behavior (HunterClass trait)
│   └── <class>/        # One folder per class
├── specs/              # Spec implementations
│   └── <class>/        # One folder per class
│       └── <spec>/     # One folder per spec
├── handler/
│   ├── traits.rs       # SpecHandler trait (core interface)
│   └── registry.rs     # Register new specs here
├── spec/
│   └── builder.rs      # SpellBuilder, AuraBuilder
└── proc/               # Proc system
```

## Key Patterns

1. **Trait-based polymorphism** - No match on SpecId in core code
2. **Builder pattern** - Fluent spell/aura definitions
3. **OnceLock** - Lazy static initialization
4. **Type-safe IDs** - SpellIdx, AuraIdx, ProcIdx wrappers

---

## Part 1: Adding a New Class

### Step 1: Add ClassId and SpecIds

Edit `crates/engine/src/types/class.rs`:

```rust
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ClassId {
    // ... existing classes ...
    NewClass = 14,  // Next available ID
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum SpecId {
    // ... existing specs ...
    // NewClass specs (use next available IDs)
    SpecOne = 40,
    SpecTwo = 41,
    SpecThree = 42,
}

impl SpecId {
    pub const COUNT: usize = 42;  // Update count

    pub const fn class(self) -> ClassId {
        match self {
            // ... existing mappings ...
            Self::SpecOne | Self::SpecTwo | Self::SpecThree => ClassId::NewClass,
        }
    }

    pub const fn primary_resource(self) -> ResourceType {
        match self {
            // ... existing mappings ...
            Self::SpecOne | Self::SpecTwo | Self::SpecThree => ResourceType::SomeResource,
        }
    }
}
```

### Step 2: Create Class Module

Create `crates/engine/src/class/newclass/mod.rs`:

```rust
//! NewClass shared behavior.

pub mod resource;  // Resource management
pub mod shared;    // Shared abilities

pub use resource::{RESOURCE_REGEN_BASE, RESOURCE_MAX};
pub use shared::{SHARED_ABILITY_ONE, SHARED_ABILITY_TWO};

use crate::handler::SpecHandler;
use crate::sim::SimState;
use crate::types::UnitIdx;

/// Shared behavior for all NewClass specs.
pub trait NewClassClass: SpecHandler {
    // Override defaults as needed per spec
    fn base_resource_regen(&self) -> f32 {
        RESOURCE_REGEN_BASE
    }

    fn resource_regen(&self, state: &SimState) -> f32 {
        let haste = state.player.stats.haste();
        self.base_resource_regen() * haste
    }

    // Shared mechanic (e.g., pet, combo points, etc.)
    fn on_shared_mechanic(&self, state: &mut SimState) {
        // Default implementation
    }
}
```

Export in `crates/engine/src/class/mod.rs`:

```rust
pub mod hunter;
pub mod newclass;  // Add this

pub use hunter::HunterClass;
pub use newclass::NewClassClass;  // Add this
```

---

## Part 2: Adding a New Spec

### Step 1: Create Spec Directory Structure

```
crates/engine/src/specs/newclass/specone/
├── mod.rs           # Module exports
├── constants.rs     # Spell/aura/proc IDs and tuning values
├── spells.rs        # Spell definitions
├── auras.rs         # Aura definitions
├── procs.rs         # Proc setup
├── handler.rs       # SpecHandler impl
├── rotation.rs      # Rotation bindings
└── tests.rs         # Unit tests
```

### Step 2: Define Constants (`constants.rs`)

```rust
use crate::types::{SpellIdx, AuraIdx, ProcIdx};

// ============================================================================
// Spell IDs (use actual WoW spell IDs)
// ============================================================================

/// Primary ability
pub const PRIMARY_ABILITY: SpellIdx = SpellIdx(123456);
/// Secondary ability
pub const SECONDARY_ABILITY: SpellIdx = SpellIdx(123457);
/// Main cooldown
pub const MAIN_COOLDOWN: SpellIdx = SpellIdx(123458);
/// Generator ability
pub const GENERATOR: SpellIdx = SpellIdx(123459);

// ============================================================================
// Aura IDs
// ============================================================================

/// Main buff
pub const MAIN_BUFF: AuraIdx = AuraIdx(123456);
/// Stacking buff
pub const STACKING_BUFF: AuraIdx = AuraIdx(123457);
/// DoT on target
pub const DOT_DEBUFF: AuraIdx = AuraIdx(123458);

// ============================================================================
// Proc IDs (internal, can use sequential numbers)
// ============================================================================

pub const PROC_ONE: ProcIdx = ProcIdx(1);
pub const PROC_TWO: ProcIdx = ProcIdx(2);

// ============================================================================
// Tuning Constants
// ============================================================================

pub const PRIMARY_ABILITY_COST: f32 = 30.0;
pub const GENERATOR_GAIN: f32 = 10.0;
pub const MAIN_BUFF_DURATION: f32 = 15.0;
pub const MAIN_COOLDOWN_CD: f32 = 90.0;
pub const DOT_DURATION: f32 = 18.0;
pub const DOT_TICK_INTERVAL: f32 = 3.0;
```

### Step 3: Define Spells (`spells.rs`)

```rust
use crate::spec::{SpellBuilder, SpellDef, SpellTarget};
use crate::types::{ResourceType, DamageSchool};
use super::constants::*;

/// Get all spec spell definitions
pub fn spell_definitions() -> Vec<SpellDef> {
    vec![
        primary_ability(),
        secondary_ability(),
        main_cooldown(),
        generator(),
    ]
}

fn primary_ability() -> SpellDef {
    SpellBuilder::new(PRIMARY_ABILITY, "Primary Ability")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(7.5)
        .cost(ResourceType::Focus, PRIMARY_ABILITY_COST)  // Use spec's resource
        .physical_damage(2.0)  // AP coefficient
        .build()
}

fn secondary_ability() -> SpellDef {
    SpellBuilder::new(SECONDARY_ABILITY, "Secondary Ability")
        .school(DamageSchool::Nature)
        .cast_time(2000)  // 2 second cast
        .cost(ResourceType::Focus, 40.0)
        .spell_damage(DamageSchool::Nature, 1.5)  // SP coefficient
        .apply_aura(DOT_DEBUFF)
        .build()
}

fn main_cooldown() -> SpellDef {
    SpellBuilder::new(MAIN_COOLDOWN, "Main Cooldown")
        .instant()
        .no_gcd()  // Off GCD
        .cooldown(MAIN_COOLDOWN_CD)
        .apply_aura(MAIN_BUFF)
        .build()
}

fn generator() -> SpellDef {
    SpellBuilder::new(GENERATOR, "Generator")
        .school(DamageSchool::Physical)
        .instant()
        .gain(ResourceType::Focus, GENERATOR_GAIN)
        .physical_damage(0.5)
        .build()
}
```

### Step 4: Define Auras (`auras.rs`)

```rust
use crate::spec::{AuraBuilder, AuraDef};
use super::constants::*;

/// Get all spec aura definitions
pub fn aura_definitions() -> Vec<AuraDef> {
    vec![
        main_buff(),
        stacking_buff(),
        dot_debuff(),
    ]
}

fn main_buff() -> AuraDef {
    AuraBuilder::buff(MAIN_BUFF, "Main Buff", MAIN_BUFF_DURATION)
        .damage_multiplier(1.25)  // 25% increased damage
        .build()
}

fn stacking_buff() -> AuraDef {
    AuraBuilder::buff(STACKING_BUFF, "Stacking Buff", 8.0)
        .stacks(5)        // Max 5 stacks
        .refreshable()    // Refresh duration on reapply
        .crit(0.05)       // 5% crit per stack
        .build()
}

fn dot_debuff() -> AuraDef {
    AuraBuilder::dot(DOT_DEBUFF, "DoT", DOT_DURATION, DOT_TICK_INTERVAL)
        .periodic_damage(DOT_TICK_INTERVAL, 0.2)  // 20% AP per tick
        .pandemic()       // Extend up to 130% duration on refresh
        .snapshots()      // Stats snapshot at application
        .build()
}
```

### Step 5: Setup Procs (`procs.rs`)

```rust
use crate::proc::{ProcHandler, ProcFlags, ProcEffect, FixedProc, ProcRegistry};
use crate::types::SimTime;
use super::constants::*;

/// Setup spec procs
pub fn setup_procs(registry: &mut ProcRegistry) {
    // Proc One: 20% chance on crit to reduce cooldown
    registry.register_fixed(
        FixedProc::new(PROC_ONE, 0.20),
        ProcHandler::new(
            PROC_ONE,
            "Proc One",
            ProcFlags::ON_SPELL_CAST | ProcFlags::ON_CRIT,
            ProcEffect::ReduceCooldown {
                spell: MAIN_COOLDOWN,
                amount: SimTime::from_secs(5),
            },
        ),
    );

    // Proc Two: Always add stack when casting primary ability
    registry.register_fixed(
        FixedProc::new(PROC_TWO, 1.0),  // 100% chance
        ProcHandler::new(
            PROC_TWO,
            "Proc Two",
            ProcFlags::ON_SPELL_CAST,
            ProcEffect::AddStacks {
                aura: STACKING_BUFF,
                stacks: 1,
            },
        ).with_spell_filter(vec![PRIMARY_ABILITY]),
    );
}
```

### Step 6: Implement Handler (`handler.rs`)

```rust
use crate::handler::SpecHandler;
use crate::class::NewClassClass;  // Or HunterClass, etc.
use crate::types::{SpecId, ClassId, SpellIdx, AuraIdx, TargetIdx, UnitIdx, SimTime, DamageSchool};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::spec::{SpellDef, AuraDef, AuraEffect, GcdType, SpellFlags};
use crate::combat::{Cooldown, ChargedCooldown, DamagePipeline};
use crate::aura::AuraInstance;
use crate::actor::Player;
use crate::rotation::{Rotation, Action};
use crate::data::{TuningData, apply_spell_overrides, apply_aura_overrides};
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::procs::setup_procs;
use super::rotation::{SpecOneBindings, spell_name_to_idx};
use tracing::debug;

// Static storage for lazy initialization
static ROTATION: std::sync::OnceLock<Rotation<SpecOneBindings>> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

fn get_rotation() -> &'static Rotation<SpecOneBindings> {
    ROTATION.get().expect("Rotation not initialized")
}

fn get_spell(id: SpellIdx) -> Option<&'static SpellDef> {
    SPELL_DEFS.get()?.iter().find(|s| s.id == id)
}

fn get_aura(id: AuraIdx) -> Option<&'static AuraDef> {
    AURA_DEFS.get()?.iter().find(|a| a.id == id)
}

fn get_spell_defs() -> &'static [SpellDef] {
    SPELL_DEFS.get().expect("Spell definitions not initialized")
}

/// SpecOne spec handler
pub struct SpecOne;

impl SpecOne {
    pub fn new() -> Self { Self }

    pub fn init_rotation(script: &str) -> Result<(), String> {
        Self::init_rotation_with_tuning(script, &TuningData::empty())
    }

    pub fn init_rotation_with_tuning(script: &str, tuning: &TuningData) -> Result<(), String> {
        let mut spells = spell_definitions();
        apply_spell_overrides(&mut spells, &tuning.spell);
        SPELL_DEFS.set(spells).map_err(|_| "Already initialized")?;

        let mut auras = aura_definitions();
        apply_aura_overrides(&mut auras, &tuning.aura);
        AURA_DEFS.set(auras).map_err(|_| "Already initialized")?;

        let rotation = Rotation::new(script, SpecOneBindings::new())
            .map_err(|e| format!("Rotation compile error: {}", e))?;
        ROTATION.set(rotation).map_err(|_| "Already initialized")?;

        Ok(())
    }

    fn do_cast_spell(&self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let now = state.now();
        let haste = state.player.stats.haste();

        // Handle resource costs
        for cost in &spell.costs {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.spend(cost.amount);
            }
        }

        // Handle resource gains
        for gain in &spell.gains {
            if let Some(ref mut primary) = state.player.resources.primary {
                primary.gain(gain.amount);
            }
        }

        // Handle cooldowns
        if spell.charges > 0 {
            if let Some(cd) = state.player.charged_cooldown_mut(spell_id) {
                cd.spend(now, haste);
            }
        } else if spell.cooldown > SimTime::ZERO {
            if let Some(cd) = state.player.cooldown_mut(spell_id) {
                cd.start(now, haste);
            }
        }

        // Apply auras
        for &aura_id in &spell.apply_auras {
            self.apply_aura(state, aura_id, target);
        }

        // Handle GCD
        let is_off_gcd = spell.gcd == GcdType::None || spell.flags.contains(SpellFlags::OFF_GCD);
        if is_off_gcd {
            state.events.schedule(now, SimEvent::GcdEnd);
        } else {
            let gcd = spell.gcd_duration(haste);
            state.player.start_gcd(gcd, now);
            state.schedule_in(gcd, SimEvent::GcdEnd);
        }

        state.events.schedule(now, SimEvent::CastComplete { spell: spell_id, target });
    }

    fn apply_aura(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        let Some(aura) = get_aura(aura_id) else { return };

        let mut instance = AuraInstance::new(aura_id, target, aura.duration, now, aura.flags);
        if aura.max_stacks > 1 {
            instance = instance.with_stacks(aura.max_stacks);
        }

        if aura.flags.is_debuff {
            if let Some(target_auras) = state.auras.target_mut(target) {
                if let Some(ref periodic) = aura.periodic {
                    instance = instance.with_periodic(periodic.interval, now);
                }
                target_auras.apply(instance, now);
            }
            if let Some(ref periodic) = aura.periodic {
                state.schedule_in(periodic.interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        } else {
            state.player.buffs.apply(instance, now);
        }
    }

    fn do_calculate_damage(&self, state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool) -> f32 {
        let ap = state.player.stats.attack_power();
        let sp = state.player.stats.spell_power();
        let crit = state.player.stats.crit_chance();
        let armor = state.enemies.primary().map(|e| e.armor).unwrap_or(0.0);

        let result = DamagePipeline::calculate(base, ap_coef, sp_coef, ap, sp, &state.multipliers, crit, school, armor, &mut state.rng);
        let mut damage = result.final_amount;

        // Apply spec-specific modifiers
        if state.player.buffs.has(MAIN_BUFF, state.now()) {
            if let Some(aura) = get_aura(MAIN_BUFF) {
                for effect in &aura.effects {
                    if let AuraEffect::DamageMultiplier { amount, .. } = effect {
                        damage *= amount;
                    }
                }
            }
        }

        damage
    }
}

impl Default for SpecOne {
    fn default() -> Self { Self::new() }
}

impl SpecHandler for SpecOne {
    fn spec_id(&self) -> SpecId { SpecId::SpecOne }
    fn class_id(&self) -> ClassId { ClassId::NewClass }

    fn init(&self, state: &mut SimState) {
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });
    }

    fn init_player(&self, player: &mut Player) {
        player.spec = SpecId::SpecOne;
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);  // Use spec's resource

        for spell in get_spell_defs() {
            if spell.charges > 0 {
                player.add_charged_cooldown(spell.id, ChargedCooldown::new(spell.charges, spell.charge_time.as_secs_f32()));
            } else if spell.cooldown > SimTime::ZERO {
                player.add_cooldown(spell.id, Cooldown::new(spell.cooldown.as_secs_f32()));
            }
        }
        setup_procs(&mut player.procs);
    }

    fn on_gcd(&self, state: &mut SimState) {
        if state.finished { return; }

        match get_rotation().next_action(state) {
            Action::Cast(name) => {
                if let Some(spell) = spell_name_to_idx(&name) {
                    self.cast_spell(state, spell, TargetIdx(0));
                } else {
                    state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd);
                }
            }
            Action::Wait(secs) => {
                state.schedule_in(SimTime::from_secs_f32(secs as f32), SimEvent::GcdEnd);
            }
            _ => state.schedule_in(SimTime::from_millis(100), SimEvent::GcdEnd),
        }
    }

    fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        self.on_spell_damage(state, spell, target);
    }

    fn on_spell_damage(&self, state: &mut SimState, spell_id: SpellIdx, _target: TargetIdx) {
        let Some(spell) = get_spell(spell_id) else { return };
        let Some(ref dmg) = spell.damage else { return };

        let damage = self.do_calculate_damage(state, dmg.base_damage, dmg.ap_coefficient, dmg.sp_coefficient, dmg.school);
        state.record_damage(damage);
        debug!(spell = spell_id.0, damage, "Spell damage");
    }

    fn on_auto_attack(&self, state: &mut SimState, unit: UnitIdx) {
        let damage = self.do_calculate_damage(state, 0.0, 0.3, 0.0, DamageSchool::Physical);
        state.record_damage(damage);

        if !state.finished {
            let haste = state.player.stats.haste();
            let base_speed = 2600.0;  // Base swing timer
            let speed = SimTime::from_millis(((base_speed / haste) as u32).max(100));
            state.schedule_in(speed, SimEvent::AutoAttack { unit });
        }
    }

    fn on_pet_attack(&self, _state: &mut SimState, _pet: UnitIdx) {
        // Implement if spec has pets
    }

    fn on_aura_tick(&self, state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) {
        let now = state.now();
        if !state.auras.target(target).map(|a| a.has(aura_id, now)).unwrap_or(false) { return; }

        if let Some(aura) = get_aura(aura_id) {
            if let Some(ref periodic) = aura.periodic {
                let damage = self.do_calculate_damage(state, 0.0, periodic.ap_coefficient, periodic.sp_coefficient, DamageSchool::Physical);
                state.record_damage(damage);
                state.schedule_in(periodic.interval, SimEvent::AuraTick { aura: aura_id, target });
            }
        }
    }

    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx) {
        self.do_cast_spell(state, spell, target);
    }

    fn next_action(&self, state: &SimState) -> Action {
        get_rotation().next_action(state)
    }

    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef> { get_spell(id) }
    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef> { get_aura(id) }
    fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx> { spell_name_to_idx(name) }

    fn aura_name_to_idx(&self, name: &str) -> Option<AuraIdx> {
        match name {
            "main_buff" => Some(MAIN_BUFF),
            "stacking_buff" => Some(STACKING_BUFF),
            "dot" => Some(DOT_DEBUFF),
            _ => None,
        }
    }

    fn calculate_damage(&self, state: &mut SimState, base: f32, ap_coef: f32, sp_coef: f32, school: DamageSchool) -> f32 {
        self.do_calculate_damage(state, base, ap_coef, sp_coef, school)
    }
}

// Implement class trait if applicable
impl NewClassClass for SpecOne {
    // Override methods as needed
}
```

### Step 7: Create Rotation Bindings (`rotation.rs`)

```rust
use crate::rotation::bindings::RotationBindings;
use crate::rotation::schema::{GameState, StateSchema};
use crate::sim::SimState;
use crate::types::SpellIdx;
use super::constants::*;

#[derive(Debug, Clone, Default)]
pub struct SpecOneBindings;

impl SpecOneBindings {
    pub fn new() -> Self { Self }
}

impl RotationBindings for SpecOneBindings {
    fn update_state(&self, state: &mut GameState, schema: &StateSchema, sim: &SimState) {
        let now = sim.now();

        // Power (resource)
        if let Some(slot) = schema.slot("power_focus") {
            let focus = sim.player.resources.primary
                .as_ref()
                .map(|r| r.current)
                .unwrap_or(0.0);
            state.set_float(slot, focus as f64);
        }

        // Target health
        if let Some(slot) = schema.slot("target_health_pct") {
            let health_pct = sim.enemies.primary()
                .map(|e| e.health_percent())
                .unwrap_or(1.0);
            state.set_float(slot, health_pct as f64);
        }

        // Aura remaining times
        if let Some(slot) = schema.slot("aura_main_buff_remaining") {
            let remaining = sim.player.buffs.get(MAIN_BUFF)
                .map(|a| a.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }

        // Cooldown remaining times
        if let Some(slot) = schema.slot("cooldown_main_cooldown_remaining") {
            let remaining = sim.player.cooldown(MAIN_COOLDOWN)
                .map(|cd| cd.remaining(now).as_secs_f32())
                .unwrap_or(0.0);
            state.set_float(slot, remaining as f64);
        }
    }

    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState) -> Vec<(usize, bool)> {
        let now = sim.now();
        let mut results = Vec::new();

        for call in schema.method_calls() {
            let result = match (call.namespace.as_str(), call.path.as_slice(), call.method.as_str()) {
                ("cooldown", [spell], "ready") => evaluate_cooldown_ready(sim, spell, now),
                ("aura", [aura], "active") => evaluate_aura_active(sim, aura, now),
                _ => false,
            };

            if let Some(slot) = schema.slot(&call.var) {
                results.push((slot, result));
            }
        }

        results
    }
}

fn evaluate_cooldown_ready(sim: &SimState, spell_name: &str, now: crate::types::SimTime) -> bool {
    let spell = match spell_name {
        "primary_ability" => PRIMARY_ABILITY,
        "secondary_ability" => SECONDARY_ABILITY,
        "main_cooldown" => MAIN_COOLDOWN,
        "generator" => GENERATOR,
        _ => return false,
    };

    sim.player.cooldown(spell)
        .map(|cd| cd.is_ready(now))
        .unwrap_or(true)
}

fn evaluate_aura_active(sim: &SimState, aura_name: &str, now: crate::types::SimTime) -> bool {
    let aura = match aura_name {
        "main_buff" => MAIN_BUFF,
        "stacking_buff" => STACKING_BUFF,
        _ => return false,
    };

    sim.player.buffs.has(aura, now)
}

pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "primary_ability" => Some(PRIMARY_ABILITY),
        "secondary_ability" => Some(SECONDARY_ABILITY),
        "main_cooldown" => Some(MAIN_COOLDOWN),
        "generator" => Some(GENERATOR),
        _ => None,
    }
}
```

### Step 8: Create Module Export (`mod.rs`)

```rust
mod constants;
mod spells;
mod auras;
mod procs;
mod handler;
mod rotation;

pub use constants::*;
pub use spells::*;
pub use auras::*;
pub use procs::*;
pub use handler::SpecOne;
pub use rotation::*;

#[cfg(test)]
mod tests;
```

### Step 9: Wire Up Parent Modules

Edit `crates/engine/src/specs/newclass/mod.rs`:

```rust
pub mod specone;

// Additional specs for this class
// pub mod spectwo;
// pub mod specthree;
```

Edit `crates/engine/src/specs/mod.rs`:

```rust
pub mod hunter;
pub mod newclass;  // Add this

pub use hunter::bm::BmHunter;
pub use hunter::mm::MmHunter;
pub use newclass::specone::SpecOne;  // Add this
```

### Step 10: Register Handler

Edit `crates/engine/src/handler/registry.rs`:

```rust
pub fn create_default_registry() -> HandlerRegistry {
    use crate::specs::hunter::bm::BmHunter;
    use crate::specs::newclass::specone::SpecOne;  // Add this

    let mut registry = HandlerRegistry::new();

    registry.register(BmHunter::new());
    registry.register(SpecOne::new());  // Add this

    registry
}
```

---

## Part 3: Spell Types Reference

### SpellBuilder Methods

```rust
SpellBuilder::new(id, name)
    // Cast type
    .instant()                    // Instant cast
    .cast_time(ms)                // Cast time in ms
    .channel(duration_ms, ticks)  // Channeled spell

    // GCD
    .gcd(GcdType::Normal)         // Normal GCD (1.5s base)
    .gcd(GcdType::Fixed(ms))      // Fixed GCD
    .no_gcd()                     // No GCD at all
    .off_gcd()                    // Off GCD flag

    // Resources
    .cost(ResourceType, amount)   // Costs resource
    .cost_percent(ResourceType, pct) // % of max resource
    .gain(ResourceType, amount)   // Generates resource

    // Cooldown
    .cooldown(secs)               // Regular cooldown
    .charges(count, recharge_secs) // Charged ability

    // Damage
    .physical_damage(ap_coef)     // Physical (AP scaling)
    .spell_damage(school, sp_coef) // Magic (SP scaling)
    .weapon_damage(coef)          // Weapon damage
    .damage(DamageEffect {...})   // Custom damage

    // Targeting
    .target(SpellTarget::Enemy)
    .target(SpellTarget::AllEnemies)
    .target(SpellTarget::Cleave { max: 5 })
    .range(yards)
    .melee_range()

    // Aura interaction
    .apply_aura(aura_id)          // Apply aura on cast
    .requires(aura_id)            // Requires aura active
    .consumes(aura_id)            // Consumes aura on cast

    // Misc
    .travel_time(ms)              // Projectile delay
    .movable()                    // Castable while moving
    .pet_ability()                // Pet ability flag
    .background()                 // Background spell

    .build()
```

---

## Part 4: Aura Types Reference

### AuraBuilder Methods

```rust
// Buffs (positive)
AuraBuilder::buff(id, name, duration_secs)

// Debuffs (on targets)
AuraBuilder::debuff(id, name, duration_secs)

// DoTs
AuraBuilder::dot(id, name, duration_secs, tick_interval_secs)

// Common modifiers
    .stacks(max)                  // Max stacks
    .pandemic()                   // Can extend to 130%
    .snapshots()                  // Stats snapshot at apply
    .refreshable()                // Extend on reapply
    .hidden()                     // Internal tracking

// Stat effects
    .damage_multiplier(amount)    // All damage
    .school_damage(school, amt)   // School-specific
    .haste(percent)               // Haste
    .crit(percent)                // Crit chance
    .attribute_flat(attr, amt)    // Flat stat
    .attribute_percent(attr, amt) // % stat
    .rating_flat(rating, amt)     // Rating

// Periodic damage
    .periodic_damage(interval, ap_coef)

    .build()
```

---

## Part 5: Proc System Reference

### ProcFlags

```rust
ProcFlags::ON_SPELL_CAST      // Any spell cast
ProcFlags::ON_AUTO_ATTACK     // Auto-attacks
ProcFlags::ON_CRIT            // Critical strikes
ProcFlags::ON_DAMAGE          // Any damage dealt
ProcFlags::ON_SPELL_HIT       // Spell lands
ProcFlags::ON_AURA_APPLY      // Aura applied
ProcFlags::ON_AURA_EXPIRE     // Aura expires
```

### ProcEffect Types

```rust
ProcEffect::ApplyAura { aura: AuraIdx }
ProcEffect::CastSpell { spell: SpellIdx }
ProcEffect::Damage { base: f32, coefficient: f32 }
ProcEffect::Resource { resource: ResourceType, amount: f32 }
ProcEffect::ReduceCooldown { spell: SpellIdx, amount: SimTime }
ProcEffect::ExtendAura { aura: AuraIdx, amount: SimTime }
ProcEffect::AddStacks { aura: AuraIdx, stacks: u8 }
ProcEffect::Multiple(Vec<ProcEffect>)  // Chain effects
```

---

## Part 6: Testing

Create `tests.rs`:

```rust
use super::*;
use crate::sim::{SimConfig, Simulation};

const TEST_ROTATION: &str = r#"
if $cooldown.main_cooldown.ready() {
    cast($spell.main_cooldown)
} else if $cooldown.primary_ability.ready() && $power.focus >= 30.0 {
    cast($spell.primary_ability)
} else {
    cast($spell.generator)
}
"#;

#[test]
fn test_spec_initialization() {
    SpecOne::init_rotation(TEST_ROTATION).unwrap();
    let handler = SpecOne::new();
    assert_eq!(handler.spec_id(), SpecId::SpecOne);
}

#[test]
fn test_simulation_runs() {
    SpecOne::init_rotation(TEST_ROTATION).unwrap();
    let config = SimConfig::default()
        .with_spec(SpecId::SpecOne)
        .with_duration(10);

    let mut sim = Simulation::new(config);
    sim.run();

    assert!(sim.state.total_damage > 0.0);
}
```

Run tests:

```bash
cd crates/engine
cargo test specone  # Test specific spec
cargo test          # All tests
```

---

## Checklist for New Content

### New Class

- [ ] Add `ClassId` variant in `types/class.rs`
- [ ] Add `SpecId` variants for all specs
- [ ] Update `SpecId::class()` mapping
- [ ] Update `SpecId::primary_resource()` mapping
- [ ] Update `SpecId::COUNT`
- [ ] Create `class/<classname>/mod.rs`
- [ ] Create class trait (e.g., `NewClassClass`)
- [ ] Export trait in `class/mod.rs`

### New Spec

- [ ] Create directory: `specs/<class>/<spec>/`
- [ ] Create `constants.rs` with spell/aura/proc IDs
- [ ] Create `spells.rs` with spell definitions
- [ ] Create `auras.rs` with aura definitions
- [ ] Create `procs.rs` with proc setup
- [ ] Create `rotation.rs` with bindings
- [ ] Create `handler.rs` implementing `SpecHandler`
- [ ] Create `mod.rs` exporting all modules
- [ ] Export spec in `specs/<class>/mod.rs`
- [ ] Export spec in `specs/mod.rs`
- [ ] Register in `handler/registry.rs`
- [ ] Create `tests.rs` with basic tests
- [ ] Run `cargo build` and fix errors
- [ ] Run `cargo test` to verify

### New Spell

- [ ] Add `SpellIdx` constant in `constants.rs`
- [ ] Add tuning constants if needed
- [ ] Create spell function in `spells.rs`
- [ ] Add to `spell_definitions()` vec
- [ ] Add to `spell_name_to_idx()` match
- [ ] Add cooldown bindings if needed
- [ ] Handle special effects in handler if needed

### New Aura

- [ ] Add `AuraIdx` constant in `constants.rs`
- [ ] Add duration/effect constants
- [ ] Create aura function in `auras.rs`
- [ ] Add to `aura_definitions()` vec
- [ ] Add to `aura_name_to_idx()` match
- [ ] Add rotation bindings for tracking

### New Proc

- [ ] Add `ProcIdx` constant in `constants.rs`
- [ ] Add proc registration in `setup_procs()`
- [ ] Handle special proc logic in handler if needed

---

## References

- BM Hunter reference: `crates/engine/src/specs/hunter/bm/`
- MM Hunter reference: `crates/engine/src/specs/hunter/mm/`
- Hunter class trait: `crates/engine/src/class/hunter/mod.rs`
- Builder patterns: `crates/engine/src/spec/builder.rs`
- SpecHandler trait: `crates/engine/src/handler/traits.rs`
