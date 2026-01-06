# Engine Architecture Redesign

## Quick Start for Implementers

**Read these sections in order:**

1. [Identified Problems](#identified-problems) - Understand what's broken
2. [Alternative 3: Hybrid Registry](#alternative-3-hybrid-registry-recommended) - The chosen solution
3. [Critical Implementation Details](#critical-implementation-details) - Borrow checker solution, full trait signature
4. [Implementation Roadmap](#implementation-roadmap) - Phase-by-phase with checklists

**Start implementation at Phase 1**. Each phase has a completion checklist - don't proceed until all boxes are checked.

---

## Executive Summary

This document analyzes the current simulation engine architecture and proposes three alternatives for a more sustainable spec/class system that can scale to support all 39 WoW specializations.

**Recommendation**: Alternative 3 (Hybrid Registry + Trait Composition) provides the best balance of flexibility, performance, and maintainability.

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Identified Problems](#identified-problems)
3. [Alternative 1: Trait-Based Polymorphism](#alternative-1-trait-based-polymorphism)
4. [Alternative 2: Data-Driven ECS](#alternative-2-data-driven-ecs)
5. [Alternative 3: Hybrid Registry (Recommended)](#alternative-3-hybrid-registry-recommended)
6. [Comparison Matrix](#comparison-matrix)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture Analysis

### Directory Structure

```
crates/engine/
├── src/
│   ├── lib.rs                  # Library entry point
│   ├── main.rs                 # CLI binary
│   ├── prelude.rs              # Common imports
│   │
│   ├── actor/                  # Game actors (player, pets, enemies)
│   ├── aura/                   # Buff/debuff system
│   ├── cli/                    # Command-line interface
│   ├── combat/                 # Damage calculation
│   ├── core/                   # Events, RNG, queue
│   ├── proc/                   # Proc system
│   ├── resource/               # Resource management
│   ├── results/                # Statistics collection
│   ├── rotation/               # Rhai scripting system
│   ├── sim/                    # Simulation executor
│   ├── spec/                   # Spec definition framework
│   ├── specs/                  # Individual spec implementations
│   │   └── hunter/
│   │       └── bm/
│   │           ├── mod.rs
│   │           ├── constants.rs
│   │           ├── spells.rs
│   │           ├── auras.rs
│   │           ├── procs.rs
│   │           ├── pet.rs
│   │           ├── handler.rs
│   │           ├── rotation.rs
│   │           └── tests.rs
│   ├── stats/                  # Character stats
│   └── types/                  # Shared type definitions
│
├── rotations/                  # Rhai rotation scripts
│   └── bm_hunter.rhai
└── data/                       # (empty - data is in code)
```

### Current Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          CURRENT DATA FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

   CLI Args                                    .rhai rotation script
      │                                              │
      ▼                                              ▼
┌──────────┐     spec match      ┌──────────────────────────────┐
│  Runner  │─────────────────────│ BeastMasteryHandler          │
└──────────┘                     │ ::init_rotation(script)      │
      │                          └──────────────────────────────┘
      │                                    │
      │                                    ▼
      │                          ┌──────────────────────────────┐
      │                          │ static OnceLock<Rotation>    │ ◄── Global state
      │                          └──────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             SimExecutor::run()                               │
│                                                                              │
│  while let Some(event) = state.events.pop() {                                │
│      match event {                                                           │
│          SimEvent::GcdEnd => {                                               │
│              match state.player.spec {           ◄── Repeated for every      │
│                  SpecId::BeastMastery =>             event type              │
│                      BeastMasteryHandler::handle_gcd()                       │
│                  SpecId::Marksmanship =>                                     │
│                      MarksmanshipHandler::handle_gcd()                       │
│                  ... 37 more specs ...                                       │
│              }                                                               │
│          }                                                                   │
│          SimEvent::CastComplete => { ... same match ... }                    │
│          SimEvent::SpellDamage => { ... same match ... }                     │
│          SimEvent::AutoAttack => { ... same match ... }                      │
│          SimEvent::PetAttack => { ... same match ... }                       │
│          SimEvent::AuraTick => { ... same match ... }                        │
│      }                                                                       │
│  }                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     BeastMasteryHandler::cast_spell()                        │
│                                                                              │
│  fn cast_spell(state, spell_id, target) {                                    │
│      let spell = get_spell(spell_id);  ◄── Lookup in hardcoded Vec           │
│                                                                              │
│      // spend resources                                                      │
│      // trigger cooldowns                                                    │
│      // apply auras                                                          │
│                                                                              │
│      // Custom spec effects (hardcoded):                                     │
│      if spell_id == COBRA_SHOT {       ◄── Must add for every spell effect  │
│          reduce_kill_command_cd()                                            │
│      }                                                                       │
│  }                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Current Handler Pattern (executor.rs)

```rust
// Current: Match-based dispatching for EVERY event type
fn handle_event(state: &mut SimState, event: ScheduledEvent) {
    match event.event {
        SimEvent::GcdEnd => {
            match state.player.spec {
                SpecId::BeastMastery => BeastMasteryHandler::handle_gcd(state),
                _ => {}  // Must add arm for every new spec
            }
        }
        SimEvent::CastComplete { spell, target } => {
            match state.player.spec {
                SpecId::BeastMastery => BeastMasteryHandler::handle_cast_complete(state, spell, target),
                _ => {}  // Same problem
            }
        }
        // ... 6+ more event types, each with the same match
    }
}
```

### Current Spec Handler Pattern (handler.rs)

```rust
// Current: Static methods, no trait, global state
static BM_ROTATION: std::sync::OnceLock<Rotation<BmHunterBindings>> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

pub struct BeastMasteryHandler;

impl BeastMasteryHandler {
    pub fn init_rotation(script: &str) -> Result<(), String> { ... }
    pub fn init_player(player: &mut Player) { ... }
    pub fn init_sim(state: &mut SimState) { ... }
    pub fn handle_gcd(state: &mut SimState) { ... }
    pub fn cast_spell(state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) { ... }
    // ... more static methods
}
```

### Current Rotation Bindings Pattern (rotation.rs)

```rust
// Current: Manual string-to-ID mapping for every spell/aura
fn evaluate_cooldown_ready(sim: &SimState, spell_name: &str, now: SimTime) -> bool {
    let spell = match spell_name {
        "kill_command" => KILL_COMMAND,
        "bestial_wrath" => BESTIAL_WRATH,
        "kill_shot" => KILL_SHOT,
        _ => return false,  // Must add every spell manually
    };
    sim.player.cooldown(spell).map(|cd| cd.is_ready(now)).unwrap_or(true)
}

pub fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "kill_command" => Some(KILL_COMMAND),
        "cobra_shot" => Some(COBRA_SHOT),
        "barbed_shot" => Some(BARBED_SHOT),
        // ... must add every spell
        _ => None,
    }
}
```

---

## Identified Problems

### Problem 1: Match Explosion

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MATCH EXPLOSION IN EXECUTOR                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current: 1 spec implemented                                                │
│  Target: 39 specs                                                           │
│                                                                             │
│  Event types requiring spec dispatch:                                       │
│    - GcdEnd                                                                 │
│    - CastComplete                                                           │
│    - SpellDamage                                                            │
│    - AutoAttack                                                             │
│    - PetAttack                                                              │
│    - AuraTick                                                               │
│    - ChannelTick (future)                                                   │
│    - ProcTrigger (future)                                                   │
│                                                                             │
│  Total match arms needed: 39 specs × 8+ events = 312+ match arms            │
│                                                                             │
│  Problems:                                                                  │
│    - Massive code duplication                                               │
│    - Easy to forget adding new spec to an event                             │
│    - No compile-time checking for completeness                              │
│    - Difficult to maintain                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem 2: No Class Inheritance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NO CLASS-LEVEL CODE SHARING                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WoW Class Structure:                                                       │
│                                                                             │
│    Hunter (Class)                                                           │
│    ├── Shared abilities: Kill Shot, Tranquilizing Shot, Aspect of the      │
│    │   Cheetah, Misdirection, Feign Death, Exhilaration                     │
│    ├── Shared resource: Focus (5/sec regen)                                 │
│    ├── Shared mechanic: Pet system                                          │
│    │                                                                        │
│    ├── Beast Mastery (Spec)                                                 │
│    │   └── Unique: Kill Command, Barbed Shot, Bestial Wrath, Frenzy        │
│    ├── Marksmanship (Spec)                                                  │
│    │   └── Unique: Aimed Shot, Rapid Fire, Trueshot, Lone Wolf             │
│    └── Survival (Spec)                                                      │
│        └── Unique: Raptor Strike, Wildfire Bomb, Coordinated Assault       │
│                                                                             │
│  Current Implementation:                                                    │
│    - BM Hunter is completely standalone                                     │
│    - Kill Shot would be duplicated in MM and SV                             │
│    - Pet attack logic would be duplicated                                   │
│    - Focus regeneration would be duplicated                                 │
│                                                                             │
│  With 13 classes × 3 specs average = massive duplication                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem 3: Hardcoded String Mappings

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MANUAL STRING-TO-ID MAPPING                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Each spec requires manual mapping in rotation.rs:                          │
│                                                                             │
│    spell_name_to_idx("kill_command") → SpellIdx(34026)                      │
│    evaluate_cooldown_ready("bestial_wrath") → lookup & check                │
│    evaluate_aura_active("frenzy") → lookup & check                          │
│                                                                             │
│  Problems:                                                                  │
│    - Must manually add every spell/aura                                     │
│    - String typos cause silent failures                                     │
│    - No IDE autocompletion                                                  │
│    - Duplicated across specs for shared abilities                           │
│                                                                             │
│  Example failure:                                                           │
│    Rotation script: $cooldown.kill_comand.ready()  // typo                  │
│    Result: Always returns false, no error                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem 4: Static Singleton Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GLOBAL STATE VIA OnceLock                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current:                                                                   │
│    static BM_ROTATION: OnceLock<Rotation<BmHunterBindings>>                 │
│    static SPELL_DEFS: OnceLock<Vec<SpellDef>>                               │
│    static AURA_DEFS: OnceLock<Vec<AuraDef>>                                 │
│                                                                             │
│  Problems:                                                                  │
│    - Only one rotation per spec at a time                                   │
│    - Can't compare two different rotations in parallel                      │
│    - Can't run multiple sim configs simultaneously                          │
│    - Testing requires careful isolation                                     │
│    - "Rotation already initialized" errors                                  │
│                                                                             │
│  Desired capability:                                                        │
│    - Compare rotation A vs rotation B for same spec                         │
│    - Run talent config A vs config B in parallel                            │
│    - Independent test instances                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem 5: No Polymorphism

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STATIC METHODS INSTEAD OF TRAITS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current:                                                                   │
│    pub struct BeastMasteryHandler;                                          │
│    impl BeastMasteryHandler {                                               │
│        pub fn handle_gcd(state: &mut SimState) { ... }                      │
│        // All static methods, no trait                                      │
│    }                                                                        │
│                                                                             │
│  Problems:                                                                  │
│    - Cannot store handler reference in SimState                             │
│    - Cannot pass handler to generic functions                               │
│    - Cannot mock handlers for testing                                       │
│    - Cannot compose handlers (decorator pattern)                            │
│                                                                             │
│  Desired:                                                                   │
│    trait SpecHandler {                                                      │
│        fn handle_gcd(&self, state: &mut SimState);                          │
│    }                                                                        │
│    // Then: state.handler.handle_gcd(state)                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem 6: Data Embedded in Code

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SPELL DATA IN RUST CODE                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current (spells.rs):                                                       │
│    fn kill_command() -> SpellDef {                                          │
│        SpellBuilder::new(KILL_COMMAND, "Kill Command")                      │
│            .cooldown(7.5)                    // ◄── Tuning value in code    │
│            .cost(ResourceType::Focus, 30.0) // ◄── Tuning value in code    │
│            .physical_damage(2.0)            // ◄── Tuning value in code    │
│            .build()                                                         │
│    }                                                                        │
│                                                                             │
│  Problems:                                                                  │
│    - Any tuning change requires recompilation                               │
│    - Cannot hot-reload during development                                   │
│    - Difficult to import data from WoW datamining                           │
│    - Non-programmers cannot adjust values                                   │
│                                                                             │
│  Alternative: data/tuning/bm_hunter.toml                                    │
│    [kill_command]                                                           │
│    cooldown = 7.5                                                           │
│    cost_focus = 30.0                                                        │
│    ap_coefficient = 2.0                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Problem Summary Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROBLEMS OVERVIEW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        SCALABILITY                                   │   │
│  │  • 39 specs × 8 events = 312+ match arms (Problem 1)                 │   │
│  │  • 13 classes with duplicated shared code (Problem 2)                │   │
│  │  • ~400 spells with manual string mappings (Problem 3)               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        FLEXIBILITY                                   │   │
│  │  • Global singletons prevent parallel testing (Problem 4)            │   │
│  │  • No polymorphism limits composition (Problem 5)                    │   │
│  │  • Embedded data requires recompilation (Problem 6)                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        MAINTAINABILITY                               │   │
│  │  • Adding new spec requires changes in 10+ locations                 │   │
│  │  • Easy to miss updating a match arm                                 │   │
│  │  • String typos cause silent failures                                │   │
│  │  • No compile-time verification of completeness                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alternative 1: Trait-Based Polymorphism

### Overview

Replace static method handlers with trait objects, enabling dynamic dispatch and eliminating match explosion.

### Design Principles

- `SpecHandler` trait with default implementations
- `ClassHandler` intermediate traits for shared class behavior
- Dynamic dispatch via `Box<dyn SpecHandler>`
- Handler instances stored in `SimState`

### Trait Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TRAIT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   // Core trait - all specs implement this                                  │
│   trait SpecHandler {                                                       │
│       fn spec_id(&self) -> SpecId;                                          │
│       fn init(&self, state: &mut SimState);                                 │
│       fn on_gcd(&self, state: &mut SimState);                               │
│       fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx);    │
│       fn on_spell_damage(&self, state: &mut SimState, spell: SpellIdx);     │
│       fn on_auto_attack(&self, state: &mut SimState);                       │
│       fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx);          │
│       fn on_aura_tick(&self, state: &mut SimState, aura: AuraIdx);          │
│       fn cast_spell(&self, state: &mut SimState, spell: SpellIdx);          │
│                                                                             │
│       // Default implementations for common behavior                        │
│       fn calculate_damage(&self, state: &SimState, ...) -> f32 {            │
│           DamagePipeline::calculate(...)  // Shared default                 │
│       }                                                                     │
│   }                                                                         │
│                                                                             │
│   // Class-level trait - shared within a class                              │
│   trait HunterHandler: SpecHandler {                                        │
│       fn focus_regen(&self) -> f32 { 5.0 }                                  │
│       fn pet_attack_common(&self, state: &mut SimState, pet: UnitIdx);      │
│       fn kill_shot(&self, state: &mut SimState);  // Shared ability         │
│       fn tranq_shot(&self, state: &mut SimState); // Shared ability         │
│   }                                                                         │
│                                                                             │
│   // Concrete spec implementation                                           │
│   struct BmHunter {                                                         │
│       rotation: Rotation<BmHunterBindings>,                                 │
│       spell_defs: Vec<SpellDef>,                                            │
│       aura_defs: Vec<AuraDef>,                                              │
│   }                                                                         │
│                                                                             │
│   impl HunterHandler for BmHunter { ... }                                   │
│   impl SpecHandler for BmHunter {                                           │
│       fn on_gcd(&self, state: &mut SimState) {                              │
│           match self.rotation.next_action(state) { ... }                    │
│       }                                                                     │
│   }                                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── handler/
│   ├── mod.rs              # Exports
│   ├── traits.rs           # SpecHandler, ClassHandler traits
│   └── registry.rs         # SpecId → Box<dyn SpecHandler>
│
├── class/
│   ├── mod.rs
│   ├── hunter.rs           # HunterHandler trait + shared code
│   ├── mage.rs             # MageHandler trait
│   ├── warrior.rs          # WarriorHandler trait
│   └── ... (13 classes)
│
└── specs/
    ├── mod.rs              # register_all_specs()
    ├── hunter/
    │   ├── mod.rs
    │   ├── bm.rs           # BmHunter: HunterHandler + SpecHandler
    │   ├── mm.rs           # MmHunter: HunterHandler + SpecHandler
    │   └── sv.rs           # SvHunter: HunterHandler + SpecHandler
    └── mage/
        ├── mod.rs
        ├── fire.rs
        ├── frost.rs
        └── arcane.rs
```

### New Executor Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               ALTERNATIVE 1: NEW EXECUTOR DATA FLOW                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌──────────────────┐         ┌─────────────────────────┐
│  CLI Args   │────────▶│  HandlerRegistry │────────▶│ Box<dyn SpecHandler>    │
│  spec: bm   │         │  ::get(SpecId)   │         │ (BmHunter instance)     │
└─────────────┘         └──────────────────┘         └─────────────────────────┘
                                                               │
                                                               ▼
                                              ┌────────────────────────────────┐
                                              │  SimState {                    │
                                              │    handler: &dyn SpecHandler,  │
                                              │    player: Player,             │
                                              │    events: EventQueue,         │
                                              │    ...                         │
                                              │  }                             │
                                              └────────────────────────────────┘
                                                               │
                                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SimExecutor::run()                                    │
│                                                                              │
│  while let Some(event) = state.events.pop() {                                │
│      match event {                                                           │
│          SimEvent::GcdEnd =>                                                 │
│              state.handler.on_gcd(state),           // ◄── Dynamic dispatch  │
│          SimEvent::CastComplete { spell, .. } =>                             │
│              state.handler.on_cast_complete(state, spell),                   │
│          SimEvent::AutoAttack { .. } =>                                      │
│              state.handler.on_auto_attack(state),                            │
│          // NO spec-specific matching needed!                                │
│      }                                                                       │
│  }                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Pros and Cons

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ALTERNATIVE 1: EVALUATION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROS:                                                                      │
│    ✓ Clean executor with no match explosion                                 │
│    ✓ Class inheritance via trait composition                                │
│    ✓ Default implementations reduce boilerplate                             │
│    ✓ Each spec can override only what differs                               │
│    ✓ Easy to test with mock handlers                                        │
│    ✓ Handler instances enable parallel configs                              │
│                                                                             │
│  CONS:                                                                      │
│    ✗ Dynamic dispatch overhead (~2-5% for hot path)                         │
│    ✗ Handler stored with state (lifetime complexity)                        │
│    ✗ Still requires Rust code for all spec behavior                         │
│    ✗ Trait object limitations (no generics in trait methods)                │
│    ✗ Medium refactoring effort                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alternative 2: Data-Driven ECS

### Overview

Move spell/aura/proc definitions to external data files (TOML/JSON). Generic handlers process data-driven effects. Only truly unique mechanics require Rust code.

### Design Principles

- Spells, auras, procs defined in external TOML files
- Generic handlers operate on data, not hardcoded spec logic
- "Effects" define what happens on cast (typed enum)
- Spec "hooks" for mechanics that can't be data-driven

### Data File Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FILE STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  data/                                                                      │
│    classes/                                                                 │
│      hunter.toml              # Class-level shared data                     │
│                                                                             │
│        [class]                                                              │
│        id = 3                                                               │
│        name = "Hunter"                                                      │
│        primary_resource = "focus"                                           │
│        resource_regen = 5.0                                                 │
│                                                                             │
│        [shared_abilities.kill_shot]                                         │
│        id = 53351                                                           │
│        cooldown = 10.0                                                      │
│        cost = { focus = 10 }                                                │
│        damage = { ap = 4.0, school = "physical" }                           │
│        usable_below_health = 0.20                                           │
│                                                                             │
│    specs/                                                                   │
│      hunter/                                                                │
│        bm.toml                                                              │
│                                                                             │
│          [spec]                                                             │
│          id = 7                                                             │
│          name = "Beast Mastery"                                             │
│          class = "hunter"                                                   │
│                                                                             │
│          [spells.kill_command]                                              │
│          id = 34026                                                         │
│          cost = { focus = 30 }                                              │
│          cooldown = 7.5                                                     │
│          damage = { ap = 2.0, school = "physical" }                         │
│          flags = ["pet_ability"]                                            │
│                                                                             │
│          [spells.cobra_shot]                                                │
│          id = 193455                                                        │
│          cost = { focus = 35 }                                              │
│          damage = { sp = 0.4, school = "nature" }                           │
│          effects = [                                                        │
│            { type = "reduce_cooldown", spell = "kill_command", amount = 1 } │
│          ]                                                                  │
│                                                                             │
│          [spells.barbed_shot]                                               │
│          id = 217200                                                        │
│          charges = 2                                                        │
│          recharge = 12.0                                                    │
│          damage = { ap = 0.3, school = "physical" }                         │
│          apply_auras = ["barbed_shot_dot", "frenzy"]                        │
│          effects = [                                                        │
│            { type = "gain_resource", resource = "focus", amount = 5 }       │
│          ]                                                                  │
│                                                                             │
│    auras/                                                                   │
│      bm_hunter.toml                                                         │
│                                                                             │
│        [bestial_wrath]                                                      │
│        id = 19574                                                           │
│        duration = 15.0                                                      │
│        effects = [                                                          │
│          { type = "damage_multiplier", amount = 1.25 }                      │
│        ]                                                                    │
│                                                                             │
│        [frenzy]                                                             │
│        id = 272790                                                          │
│        duration = 8.0                                                       │
│        max_stacks = 3                                                       │
│        refreshable = true                                                   │
│        effects = [                                                          │
│          { type = "haste_per_stack", amount = 0.10 }                        │
│        ]                                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rust Code Structure

```
src/
├── data/
│   ├── mod.rs
│   ├── loader.rs           # Load TOML → typed structs
│   ├── spell_data.rs       # SpellData struct (from TOML)
│   ├── aura_data.rs        # AuraData struct (from TOML)
│   └── effect.rs           # Effect enum
│
├── handler/
│   ├── mod.rs
│   ├── generic.rs          # GenericHandler processes any spec
│   ├── effects.rs          # execute_effect(Effect, state)
│   └── hooks/
│       ├── mod.rs          # SpecHook trait
│       ├── bm_hunter.rs    # Wild Call custom logic
│       └── fire_mage.rs    # Ignite spreading logic
│
└── sim/
    └── executor.rs         # Uses GenericHandler
```

### Effect Enum

```rust
/// All possible spell/aura effects (data-driven)
pub enum Effect {
    // Damage
    Damage { school: DamageSchool, ap: f32, sp: f32, base: f32 },
    DamageOverTime { school: DamageSchool, ap: f32, sp: f32, ticks: u8, interval: f32 },

    // Auras
    ApplyAura { aura_id: AuraIdx, target: EffectTarget },
    RemoveAura { aura_id: AuraIdx, target: EffectTarget },
    RefreshAura { aura_id: AuraIdx },

    // Resources
    GainResource { resource: ResourceType, amount: f32 },
    SpendResource { resource: ResourceType, amount: f32 },

    // Cooldowns
    ReduceCooldown { spell_id: SpellIdx, amount: f32 },
    ResetCooldown { spell_id: SpellIdx },
    GainCharge { spell_id: SpellIdx },

    // Triggers
    TriggerSpell { spell_id: SpellIdx, target: EffectTarget },
    ScheduleEvent { event: DelayedEffect, delay: f32 },

    // Stat mods
    DamageMultiplier { amount: f32, school: Option<DamageSchool> },
    HastePercent { amount: f32 },
    CritPercent { amount: f32 },

    // Special
    ExecuteHook { hook_id: &'static str },  // Calls Rust code for complex mechanics
}
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              ALTERNATIVE 2: DATA-DRIVEN FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐      ┌────────────────────┐
│ data/specs/*.toml │─────▶│  DataLoader        │
│ data/auras/*.toml │      │  ::load_spec(id)   │
│ data/classes/*    │      └────────────────────┘
└───────────────────┘                │
                                     ▼
                       ┌──────────────────────────────┐
                       │  SpecData {                  │
                       │    spells: HashMap<Id,Spell>,│
                       │    auras: HashMap<Id,Aura>,  │
                       │    class_abilities: Vec<Id>, │
                       │    procs: Vec<ProcDef>,      │
                       │  }                           │
                       └──────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    GenericHandler::cast_spell()                              │
│                                                                              │
│  fn cast_spell(&self, state: &mut SimState, spell_id: SpellIdx) {            │
│      let spell = self.data.spells.get(&spell_id)?;                           │
│                                                                              │
│      // Generic resource handling                                            │
│      for cost in &spell.costs {                                              │
│          state.player.resources.spend(cost);                                 │
│      }                                                                       │
│                                                                              │
│      // Generic cooldown handling                                            │
│      state.player.start_cooldown(spell_id, spell.cooldown);                  │
│                                                                              │
│      // Data-driven effects (no hardcoding!)                                 │
│      for effect in &spell.effects {                                          │
│          execute_effect(effect, state);  // ◄── Generic processor            │
│      }                                                                       │
│                                                                              │
│      // Spec hook for truly unique mechanics                                 │
│      if let Some(hook) = self.hooks.get(&spell_id) {                         │
│          hook.on_cast(state);            // ◄── Only for complex cases       │
│      }                                                                       │
│  }                                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Pros and Cons

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ALTERNATIVE 2: EVALUATION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROS:                                                                      │
│    ✓ Tuning changes without recompilation                                   │
│    ✓ Single generic handler for all specs                                   │
│    ✓ 95% of spells need zero Rust code                                      │
│    ✓ Easy to import data from WoW datamining (wowhead, simc)                │
│    ✓ Class sharing via class.toml inheritance                               │
│    ✓ Non-programmers can adjust values                                      │
│                                                                             │
│  CONS:                                                                      │
│    ✗ Complex effects still need Rust hooks                                  │
│    ✗ Data validation complexity (schema enforcement)                        │
│    ✗ Harder to debug data-driven behavior                                   │
│    ✗ Performance overhead from HashMap lookups                              │
│    ✗ Type safety reduced (string IDs in TOML)                               │
│    ✗ Large refactoring effort                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Alternative 3: Hybrid Registry (Recommended)

### Overview

Combines the best of both approaches:

- **Registry pattern** for compile-time spell/aura lookup (zero runtime cost)
- **Trait composition** for class → spec inheritance
- **Macros** to eliminate boilerplate
- **External data files** for tuning values only

### Design Principles

- Compile-time generated registries via macros
- Trait hierarchy: `SpecHandler` → `ClassHandler` → concrete spec
- Generic executor with pluggable handlers
- Tuning coefficients in external files, mechanics in Rust

### File Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FILE STRUCTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  crates/engine/                                                             │
│    src/                                                                     │
│      lib.rs                                                                 │
│      prelude.rs                                                             │
│      │                                                                      │
│      ├── types/                   # Core types                              │
│      │     mod.rs                                                           │
│      │     class.rs               # ClassId, SpecId enums                   │
│      │     ids.rs                 # SpellIdx, AuraIdx newtypes              │
│      │                                                                      │
│      ├── registry/                # Central registries (compile-time)       │
│      │     mod.rs                                                           │
│      │     spell_registry.rs      # phf::Map<SpellIdx, SpellDef>            │
│      │     aura_registry.rs       # phf::Map<AuraIdx, AuraDef>              │
│      │     handler_registry.rs    # SpecId → Handler factory                │
│      │                                                                      │
│      ├── handler/                 # Handler traits & defaults               │
│      │     mod.rs                                                           │
│      │     traits.rs              # SpecHandler trait                       │
│      │     generic.rs             # Default method implementations          │
│      │     effects.rs             # Effect execution helpers                │
│      │                                                                      │
│      ├── class/                   # Class-level shared behavior             │
│      │     mod.rs                                                           │
│      │     hunter/                                                          │
│      │       mod.rs               # HunterClass struct                      │
│      │       focus.rs             # Focus regeneration                      │
│      │       pet.rs               # Pet attack handling                     │
│      │       shared.rs            # Kill Shot, Tranq Shot, etc.             │
│      │     mage/                                                            │
│      │       mod.rs               # MageClass struct                        │
│      │       mana.rs              # Mana handling                           │
│      │       shared.rs            # Ice Block, Time Warp, etc.              │
│      │     warrior/                                                         │
│      │       mod.rs                                                         │
│      │       rage.rs                                                        │
│      │       shared.rs                                                      │
│      │     ... (13 classes)                                                 │
│      │                                                                      │
│      ├── specs/                   # Spec implementations                    │
│      │     mod.rs                 # register_all_specs()                    │
│      │     hunter/                                                          │
│      │       mod.rs                                                         │
│      │       bm/                                                            │
│      │         mod.rs             # BmHunter struct                         │
│      │         spells.rs          # define_spells! macro invocation         │
│      │         auras.rs           # define_auras! macro invocation          │
│      │         rotation.rs        # BmHunterBindings                        │
│      │       mm/                                                            │
│      │         mod.rs                                                       │
│      │         spells.rs                                                    │
│      │         rotation.rs                                                  │
│      │       sv/                                                            │
│      │         mod.rs                                                       │
│      │         spells.rs                                                    │
│      │         rotation.rs                                                  │
│      │     mage/                                                            │
│      │       fire/                                                          │
│      │         mod.rs                                                       │
│      │         spells.rs                                                    │
│      │         ignite.rs          # Ignite-specific mechanics               │
│      │         rotation.rs                                                  │
│      │       frost/                                                         │
│      │       arcane/                                                        │
│      │     ... (13 classes × 3 specs)                                       │
│      │                                                                      │
│      ├── sim/                     # Simulation engine                       │
│      │     mod.rs                                                           │
│      │     state.rs               # SimState (owns handler)                 │
│      │     executor.rs            # Generic event loop                      │
│      │                                                                      │
│      └── macros/                  # Declarative macros                      │
│            mod.rs                                                           │
│            define_spells.rs       # define_spells! macro                    │
│            define_auras.rs        # define_auras! macro                     │
│            register_handler.rs    # register_handler! macro                 │
│                                                                             │
│    data/                          # External tuning data (optional)         │
│      tuning/                                                                │
│        bm_hunter.toml             # Override coefficients                   │
│        fire_mage.toml                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Trait Hierarchy Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│             ALTERNATIVE 3: TRAIT HIERARCHY                                   │
└──────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────────┐
                        │      SpecHandler        │◄── Core trait (object-safe)
                        │      (trait)            │
                        ├─────────────────────────┤
                        │ + spec_id() -> SpecId   │
                        │ + class_id() -> ClassId │
                        │ + init(state)           │
                        │ + on_gcd(state)         │
                        │ + on_cast(state, spell) │
                        │ + on_damage(state, ..)  │
                        │ + cast_spell(state, id) │◄── Has default impl
                        │ + calculate_dmg(..)     │◄── Has default impl
                        │ + rotation() -> &Rot    │
                        └─────────────────────────┘
                                    ▲
                                    │ extends
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────────────────┐       ┌───────────────────────┐
        │     HunterClass       │       │      MageClass        │
        │   (trait: SpecHandler)│       │   (trait: SpecHandler)│
        ├───────────────────────┤       ├───────────────────────┤
        │ + focus_regen() -> f32│       │ + mana_regen() -> f32 │
        │ + pet_attack(state)   │       │ + spellsteal(state)   │
        │ + kill_shot(state)    │       │ + ice_block(state)    │
        │ + tranq_shot(state)   │       │ + time_warp(state)    │
        │ + aspect_wild(state)  │       │ + evocation(state)    │
        └───────────────────────┘       └───────────────────────┘
                    ▲                               ▲
         ┌──────────┼──────────┐         ┌─────────┼─────────┐
         │          │          │         │         │         │
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │BmHunter │ │MmHunter │ │SvHunter │ │FireMage │ │FrostMage│ │ArcaneMag│
    │ (struct)│ │ (struct)│ │ (struct)│ │ (struct)│ │ (struct)│ │ (struct)│
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
         │          │          │             │          │           │
    Overrides:  Inherits   Overrides:   Overrides:  Overrides:  Overrides:
    - barbed    most from  - melee      - ignite    - shatter   - arcane
      shot      class      - bombs        pooling   - deep        charges
    - frenzy    - aimed    - mongoose   - combust     freeze    - touch of
    - bestial   - rapid    - coordin-   - hot       - icy        the magi
      wrath       fire       ated         streak      veins
```

### Macro System

```rust
// Define spells with compile-time registry generation
define_spells! {
    mod bm_hunter;

    kill_command {
        id: 34026,
        name: "Kill Command",
        school: Physical,
        instant: true,
        cooldown: 7.5,
        cost: focus(30.0),
        damage: ap(2.0),
        flags: [PET_ABILITY],
    }

    cobra_shot {
        id: 193455,
        name: "Cobra Shot",
        school: Nature,
        instant: true,
        cost: focus(35.0),
        damage: sp(0.4),
        effects: [
            reduce_cooldown(kill_command, 1.0),
        ],
    }

    barbed_shot {
        id: 217200,
        name: "Barbed Shot",
        school: Physical,
        instant: true,
        charges: 2,
        recharge: 12.0,
        damage: ap(0.3),
        apply_auras: [BARBED_SHOT_DOT, FRENZY],
        effects: [
            gain_resource(focus, 5.0),
        ],
    }
}

// Generates:
// - SpellIdx constants (KILL_COMMAND, COBRA_SHOT, etc.)
// - spell_definitions() function returning Vec<SpellDef>
// - spell_name_to_idx() function with all mappings
// - Compile-time validation
```

```rust
// Register handler with compile-time type checking
register_handler! {
    BmHunter => SpecId::BeastMastery,
    MmHunter => SpecId::Marksmanship,
    SvHunter => SpecId::Survival,
    FireMage => SpecId::Fire,
    FrostMage => SpecId::FrostMage,
    ArcaneMage => SpecId::Arcane,
    // ...
}

// Generates:
// - HandlerRegistry with all mappings
// - get_handler(SpecId) -> Box<dyn SpecHandler>
// - Compile error if spec is missing
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                ALTERNATIVE 3: REGISTRY DATA FLOW                             │
└──────────────────────────────────────────────────────────────────────────────┘

                            COMPILE TIME
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  define_spells! {                       ┌─────────────────────────────────┐ │
│      mod bm_hunter;                     │   SPELL_REGISTRY                │ │
│      kill_command {                ───▶ │   HashMap<SpellIdx, &SpellDef>  │ │
│          id: 34026,                     │   - kill_command (34026)        │ │
│          ...                            │   - cobra_shot (193455)         │ │
│      }                                  │   - ...all BM spells            │ │
│  }                                      └─────────────────────────────────┘ │
│                                                                             │
│  register_handler!(BmHunter, SpecId::BeastMastery);                         │
│                       │                                                     │
│                       ▼                                                     │
│             ┌─────────────────────────────────────────┐                     │
│             │  HANDLER_REGISTRY                       │                     │
│             │  HashMap<SpecId, fn() -> Box<dyn..>>    │                     │
│             │  - BeastMastery → || BmHunter::new()    │                     │
│             │  - Fire → || FireMage::new()            │                     │
│             │  - ... all 39 specs                     │                     │
│             └─────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              RUN TIME
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌───────────┐      ┌──────────────────┐      ┌──────────────────────────┐ │
│   │  CLI:     │      │ HandlerRegistry  │      │  Box<dyn SpecHandler>    │ │
│   │  spec=bm  │─────▶│ ::get(SpecId::BM)│─────▶│  (BmHunter instance)     │ │
│   └───────────┘      └──────────────────┘      └──────────────────────────┘ │
│                                                            │                │
│   ┌───────────┐                                            │                │
│   │ rotation  │─────────────────────────────────────────────                │
│   │ .rhai     │                                            │                │
│   └───────────┘                                            ▼                │
│                              ┌──────────────────────────────────────────┐   │
│                              │  SimState {                              │   │
│                              │    handler: Box<dyn SpecHandler>,        │   │
│                              │    player: Player,                       │   │
│                              │    events: EventQueue,                   │   │
│                              │    ...                                   │   │
│                              │  }                                       │   │
│                              └──────────────────────────────────────────┘   │
│                                                            │                │
│                                                            ▼                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SimExecutor::run()                               │   │
│   │                                                                     │   │
│   │  while let Some(event) = state.events.pop() {                       │   │
│   │      match event {                                                  │   │
│   │          GcdEnd => state.handler.on_gcd(&mut state),                │   │
│   │          CastComplete { spell } =>                                  │   │
│   │              state.handler.on_cast_complete(&mut state, spell),     │   │
│   │          AutoAttack =>                                              │   │
│   │              state.handler.on_auto_attack(&mut state),              │   │
│   │          PetAttack { pet } =>                                       │   │
│   │              state.handler.on_pet_attack(&mut state, pet),          │   │
│   │          // ALL events use trait dispatch - no spec matching!       │   │
│   │      }                                                              │   │
│   │  }                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Adding a New Spec Example

```
┌──────────────────────────────────────────────────────────────────────────────┐
│          ALTERNATIVE 3: ADDING A NEW SPEC (Fire Mage)                        │
└──────────────────────────────────────────────────────────────────────────────┘

STEP 1: Create spec directory
────────────────────────────────────────────────────────────────────────────────
  mkdir -p src/specs/mage/fire

STEP 2: Define spells (spells.rs)
────────────────────────────────────────────────────────────────────────────────
  // src/specs/mage/fire/spells.rs

  define_spells! {
      mod fire_mage;

      fireball {
          id: 133,
          name: "Fireball",
          school: Fire,
          cast_time: 2000,  // ms
          cost: mana_pct(2.0),
          damage: sp(1.43),
          apply_auras: [HEATING_UP_TRIGGER],
      }

      pyroblast {
          id: 11366,
          name: "Pyroblast",
          school: Fire,
          cast_time: 4000,
          cost: mana_pct(2.0),
          damage: sp(2.5),
          requires_aura: HOT_STREAK,
          consumes_aura: HOT_STREAK,
      }

      fire_blast {
          id: 108853,
          name: "Fire Blast",
          school: Fire,
          instant: true,
          cooldown: 12.0,
          charges: 2,
          damage: sp(0.85),
          flags: [OFF_GCD, ALWAYS_CRIT],
      }

      combustion {
          id: 190319,
          name: "Combustion",
          instant: true,
          no_gcd: true,
          cooldown: 120.0,
          apply_auras: [COMBUSTION_BUFF],
      }
  }

STEP 3: Implement spec struct (mod.rs)
────────────────────────────────────────────────────────────────────────────────
  // src/specs/mage/fire/mod.rs

  mod spells;
  mod ignite;
  mod rotation;

  use crate::handler::SpecHandler;
  use crate::class::mage::MageClass;
  use crate::rotation::Rotation;

  pub struct FireMage {
      rotation: Rotation<FireMageBindings>,
  }

  impl FireMage {
      pub fn new(rotation_script: &str) -> Result<Self, String> {
          Ok(Self {
              rotation: Rotation::new(rotation_script, FireMageBindings::new())?,
          })
      }
  }

  // Inherit from MageClass (gets mana_regen, ice_block, time_warp, etc.)
  impl MageClass for FireMage {}

  impl SpecHandler for FireMage {
      fn spec_id(&self) -> SpecId { SpecId::Fire }
      fn class_id(&self) -> ClassId { ClassId::Mage }

      fn rotation(&self) -> &dyn RotationHandler {
          &self.rotation
      }

      fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx) {
          // Call parent class handler first
          <Self as MageClass>::on_cast_complete(self, state, spell);

          // Fire-specific: Hot Streak tracking
          if spell == FIREBALL || spell == FIRE_BLAST || spell == PYROBLAST {
              ignite::track_heating_up(state, spell);
          }

          // Fire-specific: Ignite spreading
          if state.player.buffs.has(COMBUSTION_BUFF, state.now()) {
              ignite::spread_ignite(state);
          }
      }

      fn on_spell_damage(&self, state: &mut SimState, spell: SpellIdx, amount: f32) {
          // Apply Ignite DoT from Fire damage
          ignite::apply_ignite(state, spell, amount);
      }
  }

STEP 4: Register the handler
────────────────────────────────────────────────────────────────────────────────
  // src/specs/mage/mod.rs

  pub mod fire;
  pub mod frost;
  pub mod arcane;

  register_handler! {
      fire::FireMage => SpecId::Fire,
      frost::FrostMage => SpecId::FrostMage,
      arcane::ArcaneMage => SpecId::Arcane,
  }

STEP 5: Create rotation script
────────────────────────────────────────────────────────────────────────────────
  // rotations/fire_mage.rhai

  if $aura.hot_streak.active() {
      cast($spell.pyroblast)
  } else if $cooldown.combustion.ready() && $aura.rune_of_power.active() {
      cast($spell.combustion)
  } else if $cooldown.fire_blast.has_charge() && $aura.heating_up.active() {
      cast($spell.fire_blast)
  } else {
      cast($spell.fireball)
  }

DONE! Fire Mage is now available via: engine sim -s fire -r rotations/fire_mage.rhai
```

### Pros and Cons

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ALTERNATIVE 3: EVALUATION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROS:                                                                      │
│    ✓ Clean executor with trait dispatch (no match explosion)                │
│    ✓ Class inheritance via trait composition                                │
│    ✓ Macros eliminate boilerplate (~60% less code per spec)                 │
│    ✓ Compile-time validation catches errors                                 │
│    ✓ Zero-cost abstractions (no HashMap lookups)                            │
│    ✓ External tuning data when needed                                       │
│    ✓ Easy to add new specs (follow template)                                │
│    ✓ IDE autocomplete for spell names                                       │
│    ✓ Handler instances enable parallel testing                              │
│                                                                             │
│  CONS:                                                                      │
│    ✗ Macros add compilation complexity                                      │
│    ✗ Still requires Rust for all mechanics                                  │
│    ✗ Moderate refactoring effort                                            │
│    ✗ Learning curve for macro syntax                                        │
│                                                                             │
│  COMPLEXITY:                                                                │
│    - Adding a new spec: ~4 files, ~200 lines                                │
│    - Class inheritance: Automatic via trait                                 │
│    - Tuning changes: Edit macro args or external TOML                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison Matrix

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ALTERNATIVES COMPARISON                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Criterion               │ Current │ Alt 1   │ Alt 2   │ Alt 3 (Rec)        │
│  ────────────────────────┼─────────┼─────────┼─────────┼────────────────────│
│  Match explosion         │ ✗ Bad   │ ✓ Solved│ ✓ Solved│ ✓ Solved           │
│  Class inheritance       │ ✗ None  │ ✓ Yes   │ ~ Partial│ ✓ Yes             │
│  Tuning w/o recompile    │ ✗ No    │ ✗ No    │ ✓ Yes   │ ~ Optional         │
│  Complex mechanics       │ ✓ Easy  │ ✓ Easy  │ ✗ Hooks │ ✓ Easy             │
│  Boilerplate per spec    │ High    │ Medium  │ Low     │ Low (macros)       │
│  Performance             │ ✓ Best  │ ✓ Good  │ ~ OK    │ ✓ Excellent        │
│  Debug-ability           │ ✓ Easy  │ ✓ Easy  │ ✗ Hard  │ ✓ Easy             │
│  Import WoW data         │ ✗ Manual│ ✗ Manual│ ✓ Easy  │ ~ Macro-assisted   │
│  Test isolation          │ ✗ Global│ ✓ Yes   │ ✓ Yes   │ ✓ Yes              │
│  Compile-time checks     │ ~ Some  │ ~ Some  │ ✗ None  │ ✓ Full             │
│  IDE support             │ ✓ Good  │ ✓ Good  │ ✗ Poor  │ ✓ Good             │
│  Refactoring effort      │ N/A     │ Medium  │ High    │ Medium             │
│  ────────────────────────┴─────────┴─────────┴─────────┴────────────────────│
│                                                                              │
│  RECOMMENDATION: Alternative 3 (Hybrid Registry + Trait Composition)        │
│                                                                              │
│  Rationale:                                                                  │
│    - Best balance of flexibility and performance                             │
│    - Class inheritance without dynamic dispatch overhead for hot paths       │
│    - Macros eliminate boilerplate while keeping Rust compile-time safety     │
│    - External tuning data available when needed                              │
│    - Clear template for adding new specs                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Handler Traits + Registry)

**Goal**: Eliminate match explosion, enable polymorphism

**Changes**:

1. Create `SpecHandler` trait with all handler methods
2. Create `HandlerRegistry` for `SpecId → Box<dyn SpecHandler>`
3. Create `Simulation` struct that owns both handler and state (borrow checker solution)
4. Update `SimExecutor` to use trait dispatch
5. Migrate `BeastMasteryHandler` to implement `SpecHandler`

**Files**:

- `src/handler/mod.rs` (new)
- `src/handler/traits.rs` (new)
- `src/handler/registry.rs` (new)
- `src/sim/simulation.rs` (new) - owns handler + state
- `src/sim/state.rs` (modify - remove handler)
- `src/sim/executor.rs` (modify - use trait dispatch)
- `src/specs/hunter/bm/mod.rs` (modify - impl SpecHandler)

**Completion Checklist**:

- [ ] `SpecHandler` trait defined with all methods from "Complete SpecHandler Trait" section
- [ ] `HandlerRegistry::get(SpecId) -> Box<dyn SpecHandler>` works
- [ ] `Simulation { handler, state }` struct created
- [ ] `executor.rs` has NO `match state.player.spec` statements
- [ ] `BmHunter` struct implements `SpecHandler`
- [ ] All existing tests pass
- [ ] `cargo build --release` succeeds
- [ ] Simulation produces same DPS as before refactor (regression test)

### Phase 2: Class Inheritance

**Goal**: Enable code sharing within classes

**Changes**:

1. Create `HunterClass` trait extending `SpecHandler`
2. Move shared Hunter code (focus regen, pet attacks, Kill Shot)
3. Make `BmHunter` implement `HunterClass`
4. Create placeholder traits for other classes

**Files**:

- `src/class/mod.rs` (new)
- `src/class/hunter/mod.rs` (new)
- `src/class/hunter/focus.rs` (new)
- `src/class/hunter/pet.rs` (new)
- `src/class/hunter/shared.rs` (new)

**Completion Checklist**:

- [ ] `HunterClass` trait exists with `focus_regen()`, `pet_attack()`, `kill_shot()`
- [ ] `BmHunter` implements `HunterClass` (not just `SpecHandler`)
- [ ] Focus regeneration code is in `class/hunter/focus.rs`, not `specs/hunter/bm/`
- [ ] Pet attack code is in `class/hunter/pet.rs`
- [ ] Kill Shot implementation is in `class/hunter/shared.rs`
- [ ] BM Hunter still works (regression test)
- [ ] No duplicate focus/pet code remains in BM handler

### Phase 3: Macro System

**Goal**: Reduce boilerplate for spell/aura definitions

**Changes**:

1. Create `define_spells!` macro
2. Create `define_auras!` macro
3. Create `register_handler!` macro
4. Migrate BM Hunter spells/auras to macro syntax
5. Generate `spell_name_to_idx` automatically

**Files**:

- `src/macros/mod.rs` (new)
- `src/macros/define_spells.rs` (new)
- `src/macros/define_auras.rs` (new)
- `src/macros/register_handler.rs` (new)
- `src/specs/hunter/bm/spells.rs` (rewrite)
- `src/specs/hunter/bm/auras.rs` (rewrite)

**Completion Checklist**:

- [ ] `define_spells!` macro compiles and generates `SpellDef` constants
- [ ] `define_spells!` auto-generates `spell_name_to_idx()` function
- [ ] `define_spells!` auto-generates `SpellIdx` constants (KILL_COMMAND, etc.)
- [ ] `define_auras!` macro works similarly for auras
- [ ] `register_handler!` macro registers spec in `HandlerRegistry`
- [ ] BM Hunter uses macro syntax (no manual `SpellBuilder` calls)
- [ ] Old `constants.rs` file is deleted or empty
- [ ] Rotation bindings use generated `spell_name_to_idx`
- [ ] All tests pass, DPS unchanged

### Phase 4: Validation (Second Spec)

**Goal**: Prove the pattern works for multiple specs

**Changes**:

1. Implement Marksmanship Hunter using new pattern
2. Verify class sharing works (Kill Shot, pet system)
3. Validate rotation bindings generation
4. Performance comparison with old pattern

**Files**:

- `src/specs/hunter/mm/mod.rs` (new)
- `src/specs/hunter/mm/spells.rs` (new)
- `src/specs/hunter/mm/auras.rs` (new)
- `src/specs/hunter/mm/rotation.rs` (new)
- `rotations/mm_hunter.rhai` (new)

**Completion Checklist**:

- [ ] `MmHunter` struct exists and implements `HunterClass` + `SpecHandler`
- [ ] MM uses `define_spells!` macro for Aimed Shot, Rapid Fire, etc.
- [ ] MM inherits Kill Shot from `HunterClass` (no duplication)
- [ ] MM rotation script works: `engine sim -s mm -r rotations/mm_hunter.rhai`
- [ ] Can run BM and MM simulations in same process (no global state conflicts)
- [ ] Adding MM required < 300 lines of new code (macro benefit)
- [ ] Performance within 5% of pre-refactor (benchmark)

### Phase 5: External Tuning (Optional)

**Goal**: Enable runtime tuning without recompilation

**Changes**:

1. Create tuning data schema (TOML)
2. Add tuning loader
3. Override macro-defined values with external data
4. Hot-reload support for development

**Files**:

- `data/tuning/bm_hunter.toml` (new)
- `data/tuning/mm_hunter.toml` (new)
- `src/data/mod.rs` (new)
- `src/data/tuning.rs` (new)
- `src/data/loader.rs` (new)

**Completion Checklist**:

- [ ] `TuningData` struct defined with optional fields for all spell properties
- [ ] `load_tuning(path) -> TuningData` function works
- [ ] `apply_tuning_overrides(&mut spells, &tuning)` merges TOML into macro defaults
- [ ] CLI flag: `--tuning data/tuning/bm_hunter.toml`
- [ ] Without TOML file, simulation uses macro defaults (no error)
- [ ] With TOML file, values are overridden correctly
- [ ] Test: change cooldown in TOML, verify DPS changes appropriately

---

## Critical Implementation Details

### Borrow Checker Solution

The pattern `state.handler.on_gcd(&mut state)` won't compile because you can't borrow `state.handler` and `&mut state` simultaneously. Solution:

```rust
// WRONG - won't compile
state.handler.on_gcd(&mut state);

// SOLUTION 1: Handler outside state (recommended)
struct Simulation {
    handler: Box<dyn SpecHandler>,
    state: SimState,
}

impl Simulation {
    fn run(&mut self) {
        while let Some(event) = self.state.events.pop() {
            match event {
                SimEvent::GcdEnd => self.handler.on_gcd(&mut self.state),
                // ...
            }
        }
    }
}

// SOLUTION 2: Pass handler separately to executor
fn run(handler: &dyn SpecHandler, state: &mut SimState) {
    while let Some(event) = state.events.pop() {
        match event {
            SimEvent::GcdEnd => handler.on_gcd(state),
            // ...
        }
    }
}
```

### Complete SpecHandler Trait

```rust
/// Core trait all specs must implement
pub trait SpecHandler: Send + Sync {
    // === Identity ===
    fn spec_id(&self) -> SpecId;
    fn class_id(&self) -> ClassId;

    // === Initialization ===
    fn init(&self, state: &mut SimState);
    fn init_player(&self, player: &mut Player);

    // === Event Handlers ===
    fn on_gcd(&self, state: &mut SimState);
    fn on_cast_complete(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx);
    fn on_spell_damage(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx, amount: f32);
    fn on_auto_attack(&self, state: &mut SimState, unit: UnitIdx);
    fn on_pet_attack(&self, state: &mut SimState, pet: UnitIdx);
    fn on_aura_tick(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx);
    fn on_aura_apply(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx);
    fn on_aura_expire(&self, state: &mut SimState, aura: AuraIdx, target: TargetIdx);

    // === Actions ===
    fn cast_spell(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx);

    // === Rotation ===
    fn next_action(&self, state: &SimState) -> Action;

    // === Spell/Aura Lookup ===
    fn get_spell(&self, id: SpellIdx) -> Option<&SpellDef>;
    fn get_aura(&self, id: AuraIdx) -> Option<&AuraDef>;
    fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx>;
    fn aura_name_to_idx(&self, name: &str) -> Option<AuraIdx>;

    // === Default Implementations ===
    fn calculate_damage(&self, state: &SimState, base: f32, ap: f32, sp: f32, school: DamageSchool) -> f32 {
        // Default damage calculation - specs can override
        DamagePipeline::calculate(...)
    }
}
```

### TOML Override Mechanism

The TOML override is **optional** and works via a loader at startup:

```rust
// 1. Macro defines spell with default values (compile-time)
define_spells! {
    kill_command {
        id: 34026,
        cooldown: 7.5,      // Default
        cost: focus(30.0),  // Default
    }
}

// 2. This generates a SpellDef with those defaults
static KILL_COMMAND_DEF: SpellDef = SpellDef {
    id: SpellIdx(34026),
    cooldown: SimTime::from_secs_f32(7.5),
    costs: vec![ResourceCost::new(Focus, 30.0)],
    // ...
};

// 3. At runtime, handler loads optional TOML and applies overrides
impl BmHunter {
    pub fn new(rotation: &str, tuning_path: Option<&Path>) -> Result<Self, Error> {
        let mut spells = spell_definitions();  // Get macro-generated defaults

        // Optional: load TOML overrides
        if let Some(path) = tuning_path {
            let tuning: TuningData = toml::from_str(&std::fs::read_to_string(path)?)?;
            apply_tuning_overrides(&mut spells, &tuning);
        }

        Ok(Self { spells, ... })
    }
}

fn apply_tuning_overrides(spells: &mut [SpellDef], tuning: &TuningData) {
    for spell in spells {
        if let Some(override_data) = tuning.spells.get(&spell.name) {
            if let Some(cd) = override_data.cooldown {
                spell.cooldown = SimTime::from_secs_f32(cd);
            }
            if let Some(cost) = override_data.cost_focus {
                spell.costs[0].amount = cost;
            }
            // ... etc
        }
    }
}
```

**Key point**: If no TOML file exists, the macro defaults are used. TOML is purely additive.

### Rotation Bindings Integration

Each spec generates its own `spell_name_to_idx` via the macro, which the rotation bindings use:

```rust
// Generated by define_spells! macro
impl BmHunter {
    pub fn spell_name_to_idx(&self, name: &str) -> Option<SpellIdx> {
        match name {
            "kill_command" => Some(KILL_COMMAND),
            "cobra_shot" => Some(COBRA_SHOT),
            "barbed_shot" => Some(BARBED_SHOT),
            // ... auto-generated from macro
            _ => None,
        }
    }
}

// Rotation bindings delegate to handler
impl RotationBindings for BmHunterBindings {
    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState, handler: &dyn SpecHandler) -> Vec<(usize, bool)> {
        for call in schema.method_calls() {
            let result = match (call.namespace.as_str(), call.method.as_str()) {
                ("cooldown", "ready") => {
                    // Use handler's generated mapping
                    if let Some(spell) = handler.spell_name_to_idx(&call.path[0]) {
                        sim.player.cooldown(spell).map(|cd| cd.is_ready(sim.now())).unwrap_or(true)
                    } else {
                        false
                    }
                }
                // ...
            };
        }
    }
}
```

### Effect System in Alternative 3

Effects are part of the spell definition and processed generically:

```rust
// In macro-generated spell definition
define_spells! {
    cobra_shot {
        id: 193455,
        effects: [
            reduce_cooldown(kill_command, 1.0),  // Effect 1
            damage(sp: 0.4),                      // Effect 2
        ],
    }
}

// Generic effect processing in default cast_spell implementation
fn cast_spell(&self, state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) {
    let spell = self.get_spell(spell_id)?;

    // Process costs, cooldowns, etc...

    // Process effects generically
    for effect in &spell.effects {
        match effect {
            Effect::ReduceCooldown { spell, amount } => {
                if let Some(cd) = state.player.cooldown_mut(*spell) {
                    cd.reduce(SimTime::from_secs_f32(*amount));
                }
            }
            Effect::Damage { school, ap, sp, base } => {
                let dmg = self.calculate_damage(state, *base, *ap, *sp, *school);
                state.record_damage(dmg);
            }
            Effect::ApplyAura { aura, target } => {
                self.apply_aura(state, *aura, *target);
            }
            Effect::GainResource { resource, amount } => {
                state.player.resources.gain(*resource, *amount);
            }
            // ... ~15 effect types cover 95% of spells
        }
    }

    // Spec can override on_cast_complete for truly unique mechanics
}
```

**Unique mechanics** (like Fire Mage Ignite) override `on_spell_damage`:

```rust
impl SpecHandler for FireMage {
    fn on_spell_damage(&self, state: &mut SimState, spell: SpellIdx, target: TargetIdx, amount: f32) {
        // Call default first
        self.default_on_spell_damage(state, spell, target, amount);

        // Fire-specific: add to Ignite
        if self.get_spell(spell).map(|s| s.school == Fire).unwrap_or(false) {
            let ignite_amount = amount * 0.08;
            self.add_to_ignite(state, target, ignite_amount);
        }
    }
}
```

---

## Appendix: Current Code Reference

### Current Handler (handler.rs)

```rust
static BM_ROTATION: std::sync::OnceLock<Rotation<BmHunterBindings>> = std::sync::OnceLock::new();
static SPELL_DEFS: std::sync::OnceLock<Vec<SpellDef>> = std::sync::OnceLock::new();
static AURA_DEFS: std::sync::OnceLock<Vec<AuraDef>> = std::sync::OnceLock::new();

pub struct BeastMasteryHandler;

impl BeastMasteryHandler {
    pub fn init_rotation(script: &str) -> Result<(), String> { ... }
    pub fn init_player(player: &mut Player) { ... }
    pub fn init_sim(state: &mut SimState) { ... }
    pub fn handle_gcd(state: &mut SimState) { ... }
    pub fn handle_cast_complete(state: &mut SimState, spell: SpellIdx, target: TargetIdx) { ... }
    pub fn handle_spell_damage(state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) { ... }
    pub fn handle_auto_attack(state: &mut SimState, unit: UnitIdx) { ... }
    pub fn handle_pet_attack(state: &mut SimState, pet: UnitIdx) { ... }
    pub fn handle_aura_tick(state: &mut SimState, aura_id: AuraIdx, target: TargetIdx) { ... }
    pub fn cast_spell(state: &mut SimState, spell_id: SpellIdx, target: TargetIdx) { ... }
    fn calculate_damage(state: &mut SimState, base: f32, ap: f32, sp: f32, school: DamageSchool) -> f32 { ... }
}
```

### Current Executor (executor.rs)

```rust
impl SimExecutor {
    fn handle_event(state: &mut SimState, event: ScheduledEvent) {
        match event.event {
            SimEvent::GcdEnd => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_gcd(state),
                    _ => {}
                }
            }
            SimEvent::CastComplete { spell, target } => {
                match state.player.spec {
                    SpecId::BeastMastery => BeastMasteryHandler::handle_cast_complete(state, spell, target),
                    _ => {}
                }
            }
            // ... 6+ more event types with same pattern
        }
    }
}
```

### Current Spell Definitions (spells.rs)

```rust
pub fn spell_definitions() -> Vec<SpellDef> {
    vec![
        kill_command(),
        cobra_shot(),
        barbed_shot(),
        bestial_wrath(),
        multi_shot(),
        kill_shot(),
    ]
}

fn kill_command() -> SpellDef {
    SpellBuilder::new(KILL_COMMAND, "Kill Command")
        .school(DamageSchool::Physical)
        .instant()
        .cooldown(7.5)
        .cost(ResourceType::Focus, KILL_COMMAND_COST)
        .physical_damage(2.0)
        .pet_ability()
        .build()
}
```

### Current Rotation Bindings (rotation.rs)

```rust
impl RotationBindings for BmHunterBindings {
    fn update_state(&self, state: &mut GameState, schema: &StateSchema, sim: &SimState) {
        if let Some(slot) = schema.slot("power_focus") {
            let focus = sim.player.resources.primary.as_ref().map(|r| r.current).unwrap_or(0.0);
            state.set_float(slot, focus as f64);
        }
        // ... more manual bindings
    }

    fn evaluate_methods(&self, schema: &StateSchema, sim: &SimState) -> Vec<(usize, bool)> {
        for call in schema.method_calls() {
            let result = match (call.namespace.as_str(), call.path.as_slice(), call.method.as_str()) {
                ("cooldown", [spell], "ready") => evaluate_cooldown_ready(sim, spell, now),
                // ... more manual mappings
            };
        }
    }
}

fn spell_name_to_idx(name: &str) -> Option<SpellIdx> {
    match name {
        "kill_command" => Some(KILL_COMMAND),
        "cobra_shot" => Some(COBRA_SHOT),
        // ... manual for every spell
        _ => None,
    }
}
```
