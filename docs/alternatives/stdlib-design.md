# Stdlib Design for the WoW Rotation DSL

## Executive Summary

This document proposes a comprehensive design for a **standard library (stdlib)** and reusable code ecosystem for the wowlab rotation DSL. The goal is to enable developers to write, share, and distribute reusable rotation logic while maintaining the performance characteristics required for high-iteration simulations.

**Key Recommendations:**

1. **Hybrid Architecture**: Stdlib functions written in Rust (compiled into engine) with a DSL-level import/macro system for user-facing abstractions
2. **Library Concept**: A `use` directive for importing reusable rotation fragments from versioned packages
3. **Visual GUI Integration**: Stdlib functions exposed as "blocks" that can be composed visually
4. **Versioning**: Semantic versioning with compatibility guarantees for API stability

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Design Goals](#design-goals)
3. [How Other Systems Handle This](#how-other-systems-handle-this)
4. [Architecture Recommendation](#architecture-recommendation)
5. [Stdlib in Rust](#stdlib-in-rust)
6. [DSL Library System](#dsl-library-system)
7. [Visual GUI Integration](#visual-gui-integration)
8. [Versioning Strategy](#versioning-strategy)
9. [Implementation Plan](#implementation-plan)
10. [Complete Example](#complete-example)

---

## Problem Statement

Looking at the BM Hunter DSL example (`dsl-example-bm-hunter.wowrot`), several patterns emerge that cry out for reusable abstractions:

### Pattern 1: Repeated Cooldown Sync Logic

```
# This pattern appears 6+ times with slight variations:
when:
  call_of_the_wild.active
  or (not talent.call_of_the_wild and bestial_wrath.active)
  or fight.remains < 16
```

### Pattern 2: Complex Tier Set Conditions

```
when:
  howl_of_the_pack_leader.cooldown.remains - lead_from_the_front.duration
    < lead_from_the_front.duration / gcd * 0.5
  or not set_bonus.tww3_4pc
```

### Pattern 3: Withering Fire Tick Synchronization (Dark Ranger)

```
when:
  (withering_fire.tick_remains > gcd and withering_fire.tick_remains < 3)
  or not withering_fire.active
```

### The Problem

1. **Duplication**: Same logic copied across multiple rotations
2. **Maintenance burden**: Bug fixes require updating every copy
3. **Knowledge silos**: Complex optimizations aren't easily shared
4. **User confusion**: Understanding requires reading 50+ lines of conditions

### What We Need

- A way to **name** complex conditions (`sync_with_burst`, `tww3_4pc_timing`)
- A way to **share** these across rotations and with the community
- A way for **users** to use them without understanding implementation
- A way for the **GUI** to present them as simple blocks

---

## Design Goals

| Goal | Priority | Rationale |
|------|----------|-----------|
| **Performance** | Critical | Stdlib cannot add overhead to the hot path |
| **Usability** | High | Non-technical users should be able to use stdlib |
| **Extensibility** | High | Community should be able to create packages |
| **Type Safety** | High | Catch errors at compile/parse time, not runtime |
| **Composability** | Medium | Stdlib functions should compose naturally |
| **Versioning** | Medium | Breaking changes should be explicit |
| **Documentation** | Medium | Self-documenting with examples |

---

## How Other Systems Handle This

### SimulationCraft

SimC uses **variables** and **action list calls** for reuse:

```simc
# Define a variable (computed once per evaluation)
actions+=/variable,name=sync_active,value=buff.call_of_the_wild.up|!talent.call_of_the_wild&buff.bestial_wrath.up

# Use the variable
actions+=/berserking,if=variable.sync_active|fight_remains<13
actions+=/blood_fury,if=variable.sync_active|fight_remains<16

# Call another action list
actions+=/call_action_list,name=cds
actions+=/call_action_list,name=st,if=active_enemies<2
```

**Pros:**
- Variables reduce duplication
- Action lists provide organization
- No external dependencies

**Cons:**
- Variables are spec-local, not shareable
- No package/import system
- No semantic versioning
- Complex logic still becomes unreadable

### WeakAuras (WoW Addon)

WeakAuras allows **importing** complex displays via encoded strings:

```
!WA:2!...base64-encoded-aura...
```

**Pros:**
- Easy sharing (paste string)
- Version-independent import
- Community-driven ecosystem (wago.io)

**Cons:**
- No semantic versioning
- No dependency management
- Binary format, not human-readable
- No composition - just copy/paste

### Factorio Blueprints

Factorio uses a **blueprint book** system:

- Blueprints are shareable, encoded strings
- Blueprint books contain multiple blueprints
- Mods can provide standard blueprint libraries
- Version compatibility tracked

**Pros:**
- Composable (blueprints within books)
- Version tracking
- Mod ecosystem

**Cons:**
- Binary format
- No semantic versioning
- No API contracts

### Lua Ecosystem (for WoW Addons)

Lua addons use:

```lua
-- Library approach (like LibStub)
local LibCooldowns = LibStub("LibCooldowns-1.0")
local isReady = LibCooldowns:IsSpellReady(spellId)

-- Mixin approach
Mixin(MyAddon, CallbackHandlerMixin)
```

**Pros:**
- Familiar to WoW addon authors
- Mature versioning (LibStub)
- Composable mixins

**Cons:**
- Runtime overhead
- Dynamic typing
- Not suitable for hot-path simulation code

### Rust Ecosystem

Rust uses crates with `Cargo.toml`:

```toml
[dependencies]
wow-stdlib = "0.3"
bm-hunter-patterns = { version = "1.0", features = ["tww3"] }
```

**Pros:**
- Semantic versioning
- Compile-time type checking
- Excellent documentation
- Zero runtime overhead

**Cons:**
- Requires Rust knowledge
- Recompilation for changes
- Heavy toolchain

---

## Architecture Recommendation

### The Hybrid Model

We recommend a **three-layer architecture**:

```
+------------------------------------------------------------------+
|                      User-Facing Layer                            |
|  DSL with `use` directives, macros, and named conditions         |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     DSL Library System                            |
|  Parsed libraries providing named macros and action fragments     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Rust Stdlib (Engine)                           |
|  Performance-critical functions compiled into the engine          |
+------------------------------------------------------------------+
```

### Why This Architecture?

1. **Performance**: Core logic in Rust, no runtime interpretation overhead
2. **Usability**: DSL macros look familiar and are easy to use
3. **Extensibility**: Community can create DSL libraries without Rust
4. **GUI Integration**: DSL-level constructs map directly to visual blocks

---

## Stdlib in Rust

### Core Primitives (Compiled into Engine)

These are Rust functions that provide foundational operations:

```rust
// crates/engine/src/stdlib/mod.rs

pub mod conditions;
pub mod patterns;
pub mod timing;

// Re-export for DSL compiler
pub use conditions::*;
pub use patterns::*;
pub use timing::*;
```

### Condition Primitives

```rust
// crates/engine/src/stdlib/conditions.rs

use crate::sim::SimState;
use crate::types::{SpellIdx, AuraIdx, SimTime};

/// Check if a spell is usable (ready + resources)
#[inline(always)]
pub fn spell_usable(state: &SimState, spell: SpellIdx) -> bool {
    let now = state.now();

    // Check cooldown
    let cd_ready = state.player.cooldown(spell)
        .map(|cd| cd.is_ready(now))
        .unwrap_or(true);

    if !cd_ready {
        return false;
    }

    // Check resource cost (if applicable)
    if let Some(cost) = state.spell_cost(spell) {
        if let Some(resource) = &state.player.resources.primary {
            return resource.current >= cost;
        }
    }

    true
}

/// Check if we're in a "burst window" (major cooldowns active)
#[inline(always)]
pub fn in_burst_window(state: &SimState, cooldowns: &[AuraIdx]) -> bool {
    let now = state.now();
    cooldowns.iter().any(|aura| state.player.buffs.has(*aura, now))
}

/// Check if we should sync with a major cooldown
#[inline(always)]
pub fn should_sync_cooldown(
    state: &SimState,
    major_cd: SpellIdx,
    major_buff: AuraIdx,
    threshold_secs: f32,
) -> bool {
    let now = state.now();

    // Buff is active - sync!
    if state.player.buffs.has(major_buff, now) {
        return true;
    }

    // Major CD coming up soon
    if let Some(cd) = state.player.cooldown(major_cd) {
        if cd.remaining(now).as_secs_f32() < threshold_secs {
            return true;
        }
    }

    // Fight ending soon - use everything
    if state.fight_remaining().as_secs_f32() < threshold_secs {
        return true;
    }

    false
}

/// Calculate optimal pandemic refresh window
#[inline(always)]
pub fn pandemic_window(duration_secs: f32) -> f32 {
    duration_secs * 0.3 // 30% of duration is pandemic window
}

/// Check if an aura should be refreshed (pandemic-aware)
#[inline(always)]
pub fn should_refresh_aura(
    state: &SimState,
    aura: AuraIdx,
    base_duration: f32,
) -> bool {
    let now = state.now();
    let pandemic = pandemic_window(base_duration);

    match state.player.buffs.get(aura) {
        Some(instance) => instance.remaining(now).as_secs_f32() <= pandemic,
        None => true, // Aura not active, definitely refresh
    }
}
```

### Timing Utilities

```rust
// crates/engine/src/stdlib/timing.rs

use crate::sim::SimState;
use crate::types::{AuraIdx, SimTime};

/// Check if we're in execute phase (target below threshold)
#[inline(always)]
pub fn in_execute_phase(state: &SimState, threshold: f32) -> bool {
    state.enemies.primary()
        .map(|e| e.health_percent() < threshold)
        .unwrap_or(false)
}

/// Calculate GCD remaining (normalized for haste)
#[inline(always)]
pub fn gcd_remaining(state: &SimState) -> f32 {
    state.player.gcd_remaining(state.now()).as_secs_f32()
}

/// Check if action would complete before aura expires
#[inline(always)]
pub fn can_complete_before_expires(
    state: &SimState,
    aura: AuraIdx,
    action_duration: f32,
) -> bool {
    let now = state.now();
    let remaining = state.player.buffs.get(aura)
        .map(|a| a.remaining(now).as_secs_f32())
        .unwrap_or(0.0);

    remaining >= action_duration
}

/// TWW Season 3 4pc timing helper for Pack Leader hunters
#[inline(always)]
pub fn tww3_4pc_sync_window(
    state: &SimState,
    howl_cd_aura: AuraIdx,
    lftf_buff: AuraIdx,
    lftf_duration: f32,
) -> bool {
    let now = state.now();

    let howl_cd_remains = state.player.buffs.get(howl_cd_aura)
        .map(|a| a.remaining(now).as_secs_f32())
        .unwrap_or(0.0);

    let gcd = state.player.gcd_base().as_secs_f32();
    let threshold = (lftf_duration / gcd) * 0.5;

    (howl_cd_remains - lftf_duration) < threshold
}
```

### Pattern Library

```rust
// crates/engine/src/stdlib/patterns.rs

use crate::sim::SimState;
use crate::types::{SpellIdx, AuraIdx};

/// Standard racial/trinket sync pattern
///
/// Returns true when:
/// - Major buff is active, OR
/// - No major talent and minor buff is active, OR
/// - Fight is ending within threshold
#[inline(always)]
pub fn standard_cd_sync(
    state: &SimState,
    major_buff: Option<AuraIdx>,
    major_talent_enabled: bool,
    minor_buff: AuraIdx,
    fight_end_threshold: f32,
) -> bool {
    let now = state.now();

    // Major buff active
    if let Some(major) = major_buff {
        if state.player.buffs.has(major, now) {
            return true;
        }
    }

    // No major talent, but minor buff active
    if !major_talent_enabled && state.player.buffs.has(minor_buff, now) {
        return true;
    }

    // Fight ending soon
    state.fight_remaining().as_secs_f32() < fight_end_threshold
}

/// Dark Ranger Withering Fire sync pattern
///
/// Optimal ability usage during Withering Fire DoT
#[inline(always)]
pub fn withering_fire_sync(
    state: &SimState,
    withering_fire: AuraIdx,
    gcd_window: f32,
    max_window: f32,
) -> bool {
    let now = state.now();

    match state.player.buffs.get(withering_fire) {
        Some(aura) => {
            let tick_remains = aura.tick_remaining(now).as_secs_f32();
            tick_remains > gcd_window && tick_remains < max_window
        }
        None => true, // No Withering Fire, proceed normally
    }
}

/// Frenzy maintenance pattern for BM Hunter
#[inline(always)]
pub fn should_maintain_frenzy(
    state: &SimState,
    frenzy: AuraIdx,
    barbed_shot: SpellIdx,
    refresh_threshold: f32,
) -> bool {
    let now = state.now();

    // No charges = can't maintain
    let has_charges = state.player.charged_cooldown(barbed_shot)
        .map(|cd| cd.has_charge())
        .unwrap_or(false);

    if !has_charges {
        return false;
    }

    // Check if Frenzy needs refresh
    match state.player.buffs.get(frenzy) {
        Some(aura) => aura.remaining(now).as_secs_f32() <= refresh_threshold,
        None => true, // No Frenzy, definitely need to apply
    }
}
```

### Registration for DSL Access

```rust
// crates/engine/src/stdlib/registry.rs

use std::collections::HashMap;

/// Registry of stdlib functions available to the DSL
pub struct StdlibRegistry {
    conditions: HashMap<String, ConditionFn>,
    patterns: HashMap<String, PatternFn>,
}

pub type ConditionFn = fn(&SimState, &[Value]) -> bool;
pub type PatternFn = fn(&SimState, &[Value]) -> bool;

impl StdlibRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            conditions: HashMap::new(),
            patterns: HashMap::new(),
        };

        // Register core conditions
        registry.conditions.insert(
            "spell_usable".to_string(),
            |state, args| {
                let spell = args[0].as_spell();
                conditions::spell_usable(state, spell)
            }
        );

        registry.conditions.insert(
            "in_execute_phase".to_string(),
            |state, args| {
                let threshold = args[0].as_f32();
                timing::in_execute_phase(state, threshold)
            }
        );

        // Register patterns
        registry.patterns.insert(
            "standard_cd_sync".to_string(),
            |state, args| {
                patterns::standard_cd_sync(
                    state,
                    args[0].as_optional_aura(),
                    args[1].as_bool(),
                    args[2].as_aura(),
                    args[3].as_f32(),
                )
            }
        );

        registry
    }
}
```

---

## DSL Library System

### Import Syntax

```
# Use core stdlib (always available)
use std::patterns
use std::timing

# Use community package
use pkg::hunter-patterns@1.0

# Use local library
use ./shared/racial-cds.wowlib
```

### Library File Format (`.wowlib`)

```
# hunter-patterns.wowlib
# Community patterns for Hunter rotations

library "hunter-patterns"
version 1.0
requires std >= 1.0

# ============================================================
# MACROS
# Named condition fragments that expand inline
# ============================================================

macro cotw_sync_active:
  call_of_the_wild.active
  or (not talent.call_of_the_wild and bestial_wrath.active)

macro cotw_sync_with_fallback(fallback_time):
  @cotw_sync_active
  or fight.remains < $fallback_time

macro frenzy_needs_refresh(threshold):
  frenzy.remaining <= $threshold
  or not frenzy.active

# ============================================================
# COMPUTED VALUES
# Named calculations available as properties
# ============================================================

compute barbed_shot_charge_sync:
  barbed_shot.charges.fractional >= kill_command.charges.fractional

compute tww3_4pc_sync:
  std::patterns::tww3_4pc_sync_window(
    howl_of_the_pack_leader.cooldown,
    lead_from_the_front,
    lead_from_the_front.duration
  )

# ============================================================
# ACTION FRAGMENTS
# Reusable action list snippets
# ============================================================

fragment racial_cds:
  berserking
    on self
    when @cotw_sync_with_fallback(13)

  blood_fury
    on self
    when @cotw_sync_with_fallback(16)

  ancestral_call
    on self
    when @cotw_sync_with_fallback(16)

  fireblood
    on self
    when @cotw_sync_with_fallback(9)

fragment potion_usage:
  potion
    on self
    when @cotw_sync_with_fallback(31)
```

### Using Libraries in Rotations

```
rotation "bm_hunter"
spec beast_mastery
version 1

use std::patterns
use pkg::hunter-patterns@1.0

spells:
  # ... spell definitions ...

auras:
  # ... aura definitions ...

# Include the racial cooldown fragment
list "cds":
  include hunter-patterns::racial_cds
  include hunter-patterns::potion_usage

list "st":
  # Use macros for conditions
  bestial_wrath
    on self
    when:
      @hunter-patterns::tww3_4pc_sync
      or not set_bonus.tww3_4pc

  # Use computed values
  barbed_shot
    on enemies | min by barbed_shot.dot.remains
    when:
      recharge.full < gcd
      or @hunter-patterns::barbed_shot_charge_sync
      or @hunter-patterns::frenzy_needs_refresh(2.0)

  # ... rest of rotation ...

priority:
  call cds
  call st
```

### Macro Expansion

When the DSL is parsed, macros are expanded inline:

**Before expansion:**
```
when @cotw_sync_with_fallback(16)
```

**After expansion:**
```
when:
  call_of_the_wild.active
  or (not talent.call_of_the_wild and bestial_wrath.active)
  or fight.remains < 16
```

### Package Distribution

Packages are distributed as `.wowpkg` files (zip archives):

```
hunter-patterns-1.0.wowpkg
  manifest.toml
  lib/
    hunter-patterns.wowlib
    dark-ranger.wowlib
    pack-leader.wowlib
  docs/
    README.md
    examples/
```

**manifest.toml:**
```toml
[package]
name = "hunter-patterns"
version = "1.0.0"
description = "Optimized patterns for Hunter rotations"
authors = ["theorycrafters@example.com"]
license = "MIT"

[dependencies]
std = ">=1.0"

[features]
default = ["bm", "mm", "sv"]
bm = []
mm = []
sv = []
dark-ranger = ["bm", "sv"]
pack-leader = ["bm"]
```

---

## Visual GUI Integration

### Block-Based Visual Editor

The stdlib should integrate seamlessly with a visual rotation builder. Each stdlib construct maps to a visual block:

### Macro Blocks

```
+--------------------------------------------------+
|  [COTW Sync Active]                              |
|  ------------------------------------------------|
|  Checks if Call of the Wild is active, or        |
|  Bestial Wrath is active when CotW not talented  |
+--------------------------------------------------+
```

### Fragment Blocks

```
+--------------------------------------------------+
|  [Racial Cooldowns]                      [+] [-] |
|  ------------------------------------------------|
|  | Berserking  | when COTW sync, fallback 13s   |
|  | Blood Fury  | when COTW sync, fallback 16s   |
|  | Ancestral   | when COTW sync, fallback 16s   |
|  | Fireblood   | when COTW sync, fallback 9s    |
+--------------------------------------------------+
```

### Configurable Blocks

Macros with parameters become configurable blocks:

```
+--------------------------------------------------+
|  [Frenzy Needs Refresh]                          |
|  ------------------------------------------------|
|  Refresh threshold:  [ 2.0 ] seconds      [?]    |
|  ------------------------------------------------|
|  Returns true when Frenzy remaining < threshold  |
|  or Frenzy is not active                         |
+--------------------------------------------------+
```

### GUI Schema Export

Libraries export a GUI schema for the visual editor:

```json
{
  "library": "hunter-patterns",
  "version": "1.0",
  "blocks": [
    {
      "id": "cotw_sync_active",
      "type": "condition",
      "name": "CotW Sync Active",
      "description": "Checks if Call of the Wild is active...",
      "parameters": [],
      "output": "boolean"
    },
    {
      "id": "frenzy_needs_refresh",
      "type": "condition",
      "name": "Frenzy Needs Refresh",
      "description": "Check if Frenzy buff needs to be refreshed",
      "parameters": [
        {
          "name": "threshold",
          "type": "number",
          "default": 2.0,
          "min": 0,
          "max": 10,
          "unit": "seconds"
        }
      ],
      "output": "boolean"
    },
    {
      "id": "racial_cds",
      "type": "fragment",
      "name": "Racial Cooldowns",
      "description": "Standard racial ability usage synced with burst",
      "children": [
        { "spell": "berserking", "condition": "cotw_sync_with_fallback(13)" },
        { "spell": "blood_fury", "condition": "cotw_sync_with_fallback(16)" },
        { "spell": "ancestral_call", "condition": "cotw_sync_with_fallback(16)" },
        { "spell": "fireblood", "condition": "cotw_sync_with_fallback(9)" }
      ],
      "expandable": true
    }
  ]
}
```

### Visual-to-DSL Round-Trip

The visual editor produces standard DSL that can be:
1. Exported as `.wowrot` files
2. Shared as text
3. Version-controlled
4. Diff'd for changes

```
# Generated from visual editor
rotation "my_bm_hunter"
spec beast_mastery
version 1

use pkg::hunter-patterns@1.0

list "cds":
  include hunter-patterns::racial_cds

list "st":
  bestial_wrath
    on self
    when @hunter-patterns::tww3_4pc_sync or not set_bonus.tww3_4pc

  # ... rest generated from visual blocks ...
```

---

## Versioning Strategy

### Semantic Versioning

All packages use semantic versioning (semver):

- **MAJOR**: Breaking changes to macro signatures or behavior
- **MINOR**: New macros/fragments, non-breaking behavior changes
- **PATCH**: Bug fixes, documentation

### Compatibility Rules

```toml
# Exact version
hunter-patterns = "1.0.0"

# Compatible updates (^)
hunter-patterns = "^1.0"  # Matches 1.0.x, 1.1.x, but not 2.0

# Minor updates only (~)
hunter-patterns = "~1.0"  # Matches 1.0.x only

# Any version
hunter-patterns = "*"
```

### Breaking Change Policy

1. **Macro renames**: Old name aliased for one major version
2. **Parameter changes**: Old signature kept as deprecated
3. **Behavior changes**: Major version bump required

Example deprecation:

```
# hunter-patterns.wowlib v2.0

# New preferred name
macro cotw_sync:
  call_of_the_wild.active
  or (not talent.call_of_the_wild and bestial_wrath.active)

# Deprecated alias (removed in 3.0)
macro cotw_sync_active:
  @deprecated("Use @cotw_sync instead")
  @cotw_sync
```

### Stdlib Versioning

The core stdlib (`std`) is versioned with the engine:

| Engine Version | Stdlib Version |
|----------------|----------------|
| 0.1.x          | std@0.1        |
| 0.2.x          | std@0.2        |
| 1.0.x          | std@1.0        |

The stdlib guarantees:
- All `std@1.x` versions are backward compatible
- Breaking changes only in major versions
- Deprecated functions warn for one minor version before removal

---

## Implementation Plan

### Phase 1: Rust Stdlib Core (Week 1-2)

1. Create `crates/engine/src/stdlib/` module
2. Implement core condition primitives
3. Implement timing utilities
4. Implement pattern library
5. Add comprehensive tests
6. Benchmark performance impact

**Deliverables:**
- `conditions.rs` with 10+ core conditions
- `timing.rs` with 5+ timing utilities
- `patterns.rs` with 5+ reusable patterns
- Unit tests for all functions
- Benchmarks showing <1ns overhead

### Phase 2: DSL Library System (Week 3-4)

1. Design `.wowlib` file format
2. Implement library parser
3. Implement macro expansion
4. Implement `use` directive handling
5. Implement `include` for fragments
6. Add import resolution

**Deliverables:**
- Library file parser
- Macro expansion engine
- Fragment inclusion system
- Example `hunter-patterns.wowlib`
- Integration tests

### Phase 3: Package Distribution (Week 5)

1. Design `.wowpkg` format
2. Implement package loader
3. Create package registry interface
4. Implement dependency resolution
5. Add version compatibility checking

**Deliverables:**
- Package format specification
- Package loader implementation
- Local package registry
- Dependency resolver

### Phase 4: Visual GUI Integration (Week 6)

1. Design block schema format
2. Generate block schemas from libraries
3. Implement visual block renderer
4. Implement block-to-DSL export
5. Implement DSL-to-block import

**Deliverables:**
- Block schema JSON format
- Schema generator from `.wowlib`
- React/Vue block components
- Round-trip conversion

### Phase 5: Documentation and Polish (Week 7)

1. Write stdlib documentation
2. Create library authoring guide
3. Create visual editor user guide
4. Add inline documentation support
5. Create example packages

**Deliverables:**
- Complete documentation
- 3+ example packages
- Tutorial videos/screenshots

---

## Complete Example

### Standard Library Usage

```
# my-rotation.wowrot
rotation "optimized_bm_hunter"
spec beast_mastery
version 1

# Import standard library and community package
use std::patterns
use std::timing
use pkg::hunter-patterns@1.0 as hp

spells:
  auto_shot           75
  kill_command        34026
  kill_shot           53351
  barbed_shot         217200
  cobra_shot          193455
  multi_shot          2643
  bestial_wrath       19574
  call_of_the_wild    359844
  bloodshed           321530

auras:
  bestial_wrath       19574
  call_of_the_wild    359844
  frenzy              272790
  beast_cleave        268877

# ============================================================
# COOLDOWNS - Using library fragments
# ============================================================

list "cds":
  # Include standard racial cooldowns
  include hp::racial_cds

  # Include potion usage
  include hp::potion_usage

# ============================================================
# SINGLE TARGET - Using library macros
# ============================================================

list "st":
  # Bestial Wrath with tier set logic
  bestial_wrath
    on self
    when:
      @hp::tww3_4pc_sync
      or not set_bonus.tww3_4pc

  # Barbed Shot - prevent capping recharge
  barbed_shot
    on enemies | min by barbed_shot.dot.remains
    when recharge.full < gcd

  # Call of the Wild - simple CD usage
  call_of_the_wild
    on self
    when std::timing::spell_usable(call_of_the_wild)

  # Bloodshed
  bloodshed
    on target
    when ready

  # Kill Command with charge sync
  kill_command
    on target
    when @hp::barbed_shot_charge_sync

  # Barbed Shot - remaining charges
  barbed_shot
    on enemies | min by barbed_shot.dot.remains
    when ready

  # Cobra Shot filler
  cobra_shot
    on target
    when ready

# ============================================================
# PRIORITY
# ============================================================

priority:
  call cds

  if std::timing::in_execute_phase(0.20):
    kill_shot
      on target
      when ready

  call st
```

### Custom Library Example

```
# my-guild-patterns.wowlib
library "my-guild-patterns"
version 1.0
requires std >= 1.0
requires hunter-patterns >= 1.0

# Our guild's preferred timing for power infusion requests
macro request_pi_optimal:
  call_of_the_wild.active and call_of_the_wild.remaining > 10
  or (not talent.call_of_the_wild and bestial_wrath.active and bestial_wrath.remaining > 5)
  or fight.remains < 12

# Fragment for our specific trinket setup
fragment guild_trinkets:
  use_trinket_1
    on self
    when:
      @request_pi_optimal
      and trinket_1.cooldown.ready

  use_trinket_2
    on self
    when:
      bestial_wrath.active
      and trinket_2.cooldown.ready
```

---

## Appendix: Decision Rationale

### Why Not Pure Rust Stdlib?

While a pure Rust stdlib would have the best performance, it has significant drawbacks:

1. **Barrier to contribution**: Community members would need Rust knowledge
2. **Recompilation required**: Any change requires rebuilding the engine
3. **No GUI integration**: Can't easily generate visual blocks from Rust code

The hybrid approach keeps performance-critical code in Rust while allowing the community to build on top with the DSL.

### Why Not Pure DSL Libraries?

A pure DSL approach would be more accessible but:

1. **Performance ceiling**: Complex conditions would be slower
2. **Limited expressiveness**: Can't do things like haste calculations
3. **No compile-time validation**: Errors caught at runtime

The hybrid approach lets the DSL call into optimized Rust when needed.

### Why Not Use Existing Package Managers?

We considered using npm, cargo, or luarocks, but:

1. **Specificity**: Our needs are very specific to rotation logic
2. **Integration**: Tight integration with the visual editor is crucial
3. **Simplicity**: A simpler custom solution serves us better
4. **Control**: We control the compatibility and versioning rules

### Why This Macro Syntax?

The `@` prefix for macros:

1. **Distinctive**: Easy to spot in code
2. **Familiar**: Similar to decorators in Python/TypeScript
3. **Unambiguous**: Can't conflict with spell/aura names
4. **Grep-friendly**: Easy to find all macro usages

---

## Conclusion

This stdlib design provides:

1. **Performance**: Rust core ensures zero overhead on the hot path
2. **Usability**: DSL macros and fragments are easy to use
3. **Extensibility**: Community can create and share packages
4. **Visual Integration**: Direct mapping to GUI blocks
5. **Versioning**: Semantic versioning with compatibility guarantees

The hybrid architecture lets us have the best of both worlds: the performance of compiled Rust with the accessibility of a user-facing DSL. The visual GUI integration ensures that even users who never see the text DSL can benefit from the stdlib.

The implementation can proceed incrementally, with each phase delivering standalone value while building toward the complete vision.
