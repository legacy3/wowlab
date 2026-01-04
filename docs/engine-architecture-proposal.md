# Engine Architecture Proposal

## SimC Subsystems Reference

Based on analysis of `~/Source/simc/engine/` (~362K lines, 374 files):

### 1. SIM (Core Simulation)

Event-driven simulation infrastructure.

- **Event Manager**: Event queue, scheduling, time management
- **Cooldown System**: Multi-charge cooldowns, haste adjustments, resets
- **Proc System**: RPPM calculations, proc statistics, trigger handling
- **Gain System**: Resource gain tracking and statistics
- **Uptime System**: Buff uptime tracking, benefit calculations
- **Expression Engine**: Lexer/tokenizer, expression trees, dynamic evaluation
- **Analysis**: Scale factors, stat plotting, profilesets

### 2. ACTION (Combat Actions)

All ability/spell mechanics.

- **Action Core**: Base action, state snapshots, callbacks
- **Action Types**: Spells, attacks, heals, absorbs, DoTs
- **Effect Parsing**: Spell effect calculations from DBC
- **Proc Callbacks**: DBC-driven proc triggers
- **Sequences**: Action sequences, variables
- **Statistics**: Per-action damage/healing tracking

### 3. BUFF (Auras/Buffs)

Buff and debuff management.

- **Buff Core**: Creation, stack management, duration/refresh
- **Tick Callbacks**: Periodic effects, expiration handlers
- **Cooldown Integration**: Buff-triggered cooldown reductions
- **RPPM Triggers**: Real PPM buff triggers
- **Uptime Tracking**: Statistical tracking

### 4. PLAYER (Actor/Character)

Complete character system.

- **Player Core**: Initialization, stat calculations, scaling
- **Resource Management**: All resource types with regeneration
- **Talents**: Talent tree system, point allocation
- **Gear Stats**: Attribute allocations, stat caching
- **Pets**: Pet spawning, AI, stat inheritance
- **Targeting**: Target data, actor relationships
- **APL**: Action priority list parsing and execution
- **Consumables**: Potions, flasks, food buffs
- **Set Bonuses**: Tier set detection and effects

### 5. ITEM (Equipment)

Item and trinket system.

- **Item Core**: Properties, parsing, initialization
- **Special Effects**: Trinket procs, item effects, PPM config
- **Enchants**: Permanent/temporary enchantments
- **Gems**: Gem socket handling
- **Set Bonuses**: Set bonus tracking

### 6. DBC (Game Data)

Data storage and access layer.

- **Spell Data**: Spell properties, effects, text
- **Item Data**: Base items, armor, weapons, scaling, bonuses
- **Talent Data**: Talent definitions, rank spells
- **Enchant Data**: Spell enchantment bindings
- **Statistical Data**: PPM coefficients, random properties
- **Generated Data**: Auto-generated spell/item/talent files

### 7. CLASS_MODULES (Specializations)

Class-specific implementations (~118K lines across 13 classes).

- **Class Files**: 10K-17K lines per class (e.g., `sc_hunter.cpp` = 10K lines)
- **Split Classes**: 4 classes split into multiple files (Monk, Paladin, Priest, Warlock)
- **Nested Structures**: Spells, buffs, cooldowns per spec
- **APL Files**: Default action priority lists per spec (37 files in `/apl/`)
- **Hotfixes**: Class-specific hotfix registration

### 8. REPORT (Output)

Result reporting and visualization.

- **HTML Reports**: Player stats, timeline, charts
- **Text Reports**: Console output
- **JSON Reports**: Structured data export
- **Charts**: Highcharts visualization

### 9. UTIL (Utilities)

Infrastructure utilities.

- **Time**: Timespan, high-res timing, timelines
- **RNG**: Seeded random number generation
- **Data Structures**: Sample data, static maps, allocators
- **String/Format**: Parsing, formatting
- **Concurrency**: Thread management

### 10. INTERFACES (External) — NOT NEEDED

SimC has HTTP/API integrations for importing character data. **We don't need this.**

Our architecture:

```
Portal (web) → rust-config-builder.ts → SimConfig → Supabase → Nodes → Engine
```

- Portal fetches all game data via MCP
- Portal builds SimConfig in TypeScript
- Engine receives complete SimConfig — no fetching needed
- Engine is pure: `SimConfig in → SimResult out`

---

## Current wowlab/crates/engine Structure

```
src/
├── lib.rs              # Entry point
├── bin/main.rs         # CLI
├── cli/                # Config loading
├── config/             # SimConfig, SpellDef, AuraDef
├── paperdoll/          # Stats, coefficients, rating, pets
├── resources/          # ResourcePool, UnitResources, Runes
├── rotation/           # Rhai scripting, conditions
├── sim/                # Engine, events, state, results
├── traits/             # Trait parsing, procs
└── util/               # RNG, CPU detection
```

**~11,500 lines total**

---

## Gap Analysis

| SimC Subsystem   | wowlab Status | Notes                                         |
| ---------------- | ------------- | --------------------------------------------- |
| Event Queue      | **Done**      | Timing wheel with bitmap                      |
| Cooldowns        | **Partial**   | Basic cooldown in SpellState, no charges      |
| Procs            | **Partial**   | ProcTracker exists, no RPPM/BLP               |
| Gains/Uptimes    | **Missing**   | No statistical tracking                       |
| Expressions      | **Missing**   | Rhai fills this role differently              |
| Actions          | **Partial**   | SpellDef exists, no action state snapshotting |
| Buffs/Auras      | **Partial**   | AuraTracker exists, basic stacking            |
| DoTs             | **Partial**   | Periodic damage, no per-target tracking       |
| Player Core      | **Partial**   | Paperdoll + UnitState                         |
| Resources        | **Done**      | All resource types                            |
| Traits (Talents) | **Partial**   | TraitParser + ProcTracker exist               |
| Pets             | **Partial**   | PetStats exists, no spawning/AI               |
| Targeting        | **Missing**   | Single target only                            |
| APL              | **Different** | Rhai scripts instead                          |
| Items            | **Missing**   | No item system                                |
| Enchants         | **Missing**   | No enchant system                             |
| Set Bonuses      | **Missing**   | No set bonus detection                        |
| DBC              | **External**  | Using MCP server, not embedded                |
| Class Modules    | **Partial**   | Basic spec exists, migrating to Rust modules  |
| Reports          | **Partial**   | SimResult, no detailed reports                |
| HTML/Charts      | **Missing**   | No visualization                              |

### Critical Missing Systems

These are **required** for accurate simulation:

| System                            | Why Critical                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Multiplier Layering**           | SimC stacks 7+ multiplier types multiplicatively (action, player, persistent, target, versatility, pet, mitigation). We have one formula. |
| **ActionState Snapshotting**      | DoTs must capture stats at cast time. SimC snapshots 20+ fields. We have none.                                                            |
| **RPPM with Bad Luck Protection** | Proc chance increases the longer you go without one. Without BLP, proc rates are inaccurate.                                              |
| **Per-Target Aura Tracking**      | Each target needs separate DoT instances. We only track one set of auras.                                                                 |
| **Proc Flags**                    | SimC uses extensive bitflags to determine what triggers procs (damage, heal, crit, periodic, etc.).                                       |

---

## Spec Modules (Pure Rust)

All spells, auras, and procs are defined in Rust modules. No TOML, no DSL, no runtime interpretation.

**Why Rust modules:**

- Full expressiveness — any logic possible
- Type-safe, compile-time checked
- IDE support (autocomplete, go-to-definition, refactoring)
- Easy debugging (breakpoints, stack traces)
- No runtime interpretation overhead
- One place to look for spell definitions
- Consistent patterns across all spells

**Trade-off accepted:** Recompilation required for spell changes. This is fine — we're already compiling the engine, and correctness + debuggability > hot-reload.

### Structure

```
crates/engine/
├── src/
│   ├── spec/
│   │   ├── mod.rs          # Spell/Aura traits, SpecModule
│   │   ├── context.rs      # CastContext, SpellResult
│   │   ├── builder.rs      # Fluent builders for damage/auras
│   │   └── registry.rs     # Spell/Aura lookup by ID/name
│   └── ...
│
└── specs/                   # All spec definitions (Rust modules)
    ├── lib.rs               # Re-export all specs
    ├── hunter/
    │   ├── mod.rs           # Hunter class module
    │   ├── beast_mastery/
    │   │   ├── mod.rs       # Register all BM spells/auras
    │   │   ├── spells/
    │   │   │   ├── mod.rs
    │   │   │   ├── kill_command.rs
    │   │   │   ├── barbed_shot.rs
    │   │   │   ├── cobra_shot.rs
    │   │   │   └── bestial_wrath.rs
    │   │   └── auras/
    │   │       ├── mod.rs
    │   │       ├── frenzy.rs
    │   │       └── beast_cleave.rs
    │   ├── marksmanship/
    │   │   └── ...
    │   └── survival/
    │       └── ...
    ├── warrior/
    │   └── ...
    └── ...
```

### Spell Trait

```rust
pub trait Spell: Send + Sync {
    const ID: u32;
    const NAME: &'static str;

    // Static properties (used for UI, validation)
    fn cooldown(&self) -> f32 { 0.0 }
    fn charges(&self) -> u8 { 1 }
    fn gcd(&self) -> f32 { 1.5 }
    fn cost(&self) -> Option<(ResourceType, u32)> { None }

    // Called once when spec is loaded (cache talent-derived values)
    fn init(&mut self, _ctx: &SpecContext) {}

    // Main execution
    fn execute(&self, ctx: &mut CastContext) -> SpellResult;
}
```

### Example: Simple Spell

```rust
// specs/hunter/beast_mastery/spells/cobra_shot.rs

use crate::prelude::*;

pub struct CobraShot;

impl Spell for CobraShot {
    const ID: u32 = 193455;
    const NAME: &'static str = "Cobra Shot";

    fn gcd(&self) -> f32 { 1.5 }
    fn cost(&self) -> Option<(ResourceType, u32)> { Some((ResourceType::Focus, 35)) }

    fn execute(&self, ctx: &mut CastContext) -> SpellResult {
        ctx.deal_damage(|d| d.ap_coeff(0.55).school(Physical));
        ctx.reduce_cooldown("kill_command", 1.0);
        SpellResult::Success
    }
}
```

### Example: Complex Spell

```rust
// specs/hunter/beast_mastery/spells/barbed_shot.rs

use crate::prelude::*;

pub struct BarbedShot {
    bw_reduction: Duration,
    war_orders_chance: f32,
    brutal_companion_threshold: u8,
}

impl BarbedShot {
    pub fn new() -> Self {
        Self {
            bw_reduction: Duration::ZERO,
            war_orders_chance: 0.0,
            brutal_companion_threshold: 0,
        }
    }
}

impl Spell for BarbedShot {
    const ID: u32 = 217200;
    const NAME: &'static str = "Barbed Shot";

    fn cooldown(&self) -> f32 { 12.0 }
    fn charges(&self) -> u8 { 2 }
    fn gcd(&self) -> f32 { 1.5 }

    fn init(&mut self, ctx: &SpecContext) {
        // Cache talent-derived values once at load time
        self.bw_reduction = ctx.talent("barbed_wrath").effect(1).duration();
        self.war_orders_chance = ctx.talent("war_orders").effect(3).percent();
        self.brutal_companion_threshold = ctx.talent("brutal_companion").effect(1).value() as u8;
    }

    fn execute(&self, ctx: &mut CastContext) -> SpellResult {
        // Find first inactive Barbed Shot buff slot (max 8)
        if let Some(slot) = ctx.find_inactive_buff_slot("barbed_shot", 8) {
            ctx.trigger_buff_slot(slot);
        }

        // Reduce Bestial Wrath cooldown
        ctx.reduce_cooldown("bestial_wrath", self.bw_reduction);

        // War Orders: chance to reset Kill Command
        if ctx.roll(self.war_orders_chance) {
            ctx.reset_cooldown("kill_command");
        }

        // Apply effects to all pets
        for pet in ctx.pets(PetFilter::MainAndCompanion) {
            if ctx.talent("stomp").active() {
                pet.cast("stomp");
            }
            pet.trigger_buff("frenzy");
            pet.trigger_buff("thrill_of_the_hunt");

            // Brutal Companion: trigger at exact stack count
            if self.brutal_companion_threshold > 0
                && pet.buff_stacks("frenzy") == self.brutal_companion_threshold
            {
                pet.cast("brutal_companion_ba");
            }
        }

        // Apply DoT to target
        ctx.apply_dot("barbed_shot_dot", |dot| {
            dot.duration(8.0)
               .tick_interval(2.0)
               .ap_coeff(0.12)
        });

        SpellResult::Success
    }
}
```

### Example: Aura

```rust
// specs/hunter/beast_mastery/auras/frenzy.rs

use crate::prelude::*;

pub struct Frenzy;

impl Aura for Frenzy {
    const ID: u32 = 272790;
    const NAME: &'static str = "Frenzy";

    fn duration(&self) -> f32 { 8.0 }
    fn max_stacks(&self) -> u8 { 3 }
    fn refresh_behavior(&self) -> RefreshBehavior { RefreshBehavior::Pandemic }

    fn effects(&self, stacks: u8) -> Vec<AuraEffect> {
        vec![
            AuraEffect::AttackSpeedMod(0.10 * stacks as f32),
        ]
    }
}
```

### Registration

```rust
// specs/hunter/beast_mastery/mod.rs

mod spells;
mod auras;

use crate::spec::SpecModule;

pub fn register(spec: &mut SpecModule) {
    // Spells
    spec.spell(spells::KillCommand::new());
    spec.spell(spells::BarbedShot::new());
    spec.spell(spells::CobraShot);
    spec.spell(spells::BestialWrath::new());
    // ... all BM spells

    // Auras
    spec.aura(auras::Frenzy);
    spec.aura(auras::BeastCleave);
    spec.aura(auras::BestialWrathBuff);
    // ... all BM auras
}
```

### Why Not TOML

TOML works for ~50% of spells but fails for:

- Multi-pet execution with filters
- Conditional talent interactions
- Buff slot management (find first inactive)
- Undocumented game behaviors (Sic 'Em doubles Deathblow chance)
- Complex proc chains

Rather than maintain two systems (TOML + Rust escape hatches), we use one system that handles 100% of cases.

### Comparison to SimC

| Aspect            | SimC                             | wowlab                                     |
| ----------------- | -------------------------------- | ------------------------------------------ |
| Lines per class   | 10K-17K (one massive file)       | ~2K-4K (split into spell files)            |
| File organization | One file per class               | One file per spell/aura                    |
| Discoverability   | Grep through 15K lines           | Go to `specs/hunter/beast_mastery/spells/` |
| Adding a spell    | Find the right spot in 15K lines | Create new file, add to mod.rs             |
| Debugging         | printf, rebuild                  | Breakpoints, IDE                           |

---

## Proposed Architecture

### Directory Structure

```
crates/engine/src/
├── lib.rs                      # Public API, Simulator
│
├── types/                      # Central type definitions
│   ├── mod.rs                  # Re-exports all types
│   ├── idx.rs                  # SpellIdx, AuraIdx, ProcIdx, UnitIdx, TargetIdx
│   ├── time.rs                 # SimTime (milliseconds)
│   ├── resource.rs             # ResourceType enum
│   ├── class.rs                # ClassId, SpecId, RaceId, PetType
│   ├── attribute.rs            # Attribute, RatingType, MasteryEffect
│   ├── damage.rs               # DamageSchool, DamageFlags
│   └── snapshot.rs             # SnapshotFlags bitflags
│
├── core/                       # Core simulation infrastructure
│   ├── mod.rs
│   ├── event.rs                # SimEvent enum, EventData
│   ├── queue.rs                # EventQueue (timing wheel)
│   └── rng.rs                  # FastRng, seeding
│
├── combat/                     # Combat mechanics
│   ├── mod.rs
│   ├── action/                 # Action system
│   │   ├── mod.rs
│   │   ├── state.rs            # ActionState (snapshotted stats/multipliers)
│   │   ├── snapshot.rs         # Snapshot timing and flags
│   │   ├── spell.rs            # SpellAction
│   │   ├── attack.rs           # MeleeAction, AutoAttack
│   │   ├── periodic.rs         # DoT/HoT ticks
│   │   └── sequence.rs         # ActionSequence
│   ├── damage/                 # Damage calculation
│   │   ├── mod.rs
│   │   ├── pipeline.rs         # Full damage calculation flow
│   │   ├── multipliers.rs      # Layered multiplier system (7+ types)
│   │   ├── formula.rs          # DamageFormula, scaling
│   │   ├── school.rs           # DamageSchool, mitigation
│   │   └── result.rs           # DamageResult, crit/miss
│   ├── cooldown/               # Cooldown system
│   │   ├── mod.rs
│   │   ├── cooldown.rs         # Cooldown struct
│   │   ├── charges.rs          # ChargeInfo, recharge events
│   │   ├── dynamic.rs          # Mid-cooldown adjustments
│   │   ├── hasted.rs           # Haste-scaled cooldowns
│   │   └── reduction.rs        # CDR effects
│   └── targeting/              # Target system
│       ├── mod.rs
│       ├── target.rs           # Target struct
│       ├── selector.rs         # TargetSelector (ST/cleave/AoE/expression)
│       ├── distance.rs         # Range validation
│       └── target_data.rs      # Per-target state tracking
│
├── aura/                       # Aura/buff system
│   ├── mod.rs
│   ├── aura.rs                 # Aura trait, AuraInstance
│   ├── buff.rs                 # Buff (beneficial aura)
│   ├── debuff.rs               # Debuff (harmful aura)
│   ├── stack.rs                # StackBehavior, refresh logic
│   ├── refresh.rs              # Pandemic, rolling, extend, clip behaviors
│   ├── periodic.rs             # PeriodicEffect, hasted ticks
│   ├── snapshot.rs             # Aura stat snapshotting
│   └── tracker.rs              # AuraTracker with per-target support
│
├── proc/                       # Proc system
│   ├── mod.rs
│   ├── proc.rs                 # ProcEffect, ProcTrigger
│   ├── flags.rs                # ProcFlags bitflags (ON_DAMAGE, ON_CRIT, etc.)
│   ├── rppm.rs                 # RealPPM with Bad Luck Protection
│   ├── rng_types.rs            # Shuffled, accumulated, threshold RNG
│   ├── icd.rs                  # Internal cooldowns
│   └── callback.rs             # ProcCallback registration
│
├── actor/                      # Actor/unit system
│   ├── mod.rs
│   ├── unit.rs                 # Unit trait (player/pet/enemy)
│   ├── player/
│   │   ├── mod.rs
│   │   ├── player.rs           # Player struct
│   │   ├── class.rs            # ClassId, SpecId enums
│   │   ├── race.rs             # RaceId, racial bonuses
│   │   └── consumable.rs       # Potions, flasks, food
│   ├── pet/
│   │   ├── mod.rs
│   │   ├── pet.rs              # Pet struct
│   │   ├── spawner.rs          # PetSpawner, spawn events
│   │   └── ai.rs               # Pet AI, targeting
│   └── enemy/
│       ├── mod.rs
│       └── enemy.rs            # Enemy struct, armor
│
├── stats/                      # Stat system
│   ├── mod.rs
│   ├── attributes.rs           # Primary stats
│   ├── ratings.rs              # Secondary ratings → %
│   ├── combat_stats.rs         # Haste, crit, mastery, vers
│   ├── cache.rs                # StatCache for perf
│   ├── modifiers.rs            # StatModifier, layered application
│   ├── coefficients.rs         # ClassCoefficients
│   └── scaling.rs              # Item level scaling
│
├── resource/                   # Resource system
│   ├── mod.rs
│   ├── pool.rs                 # ResourcePool (generic)
│   ├── regen.rs                # Regeneration logic
│   └── runes.rs                # DK runes
│
├── traits/                     # Trait system (WoW talents)
│   ├── mod.rs
│   ├── tree.rs                 # TraitTree structure
│   ├── node.rs                 # TraitNode, ranks
│   ├── loadout.rs              # TraitLoadout
│   ├── parser.rs               # Base64 import parser
│   └── effect.rs               # TraitEffect application
│
├── item/                       # Item system
│   ├── mod.rs
│   ├── item.rs                 # Item struct
│   ├── slot.rs                 # EquipmentSlot enum
│   ├── stats.rs                # ItemStats calculation
│   ├── effect/
│   │   ├── mod.rs
│   │   ├── trinket.rs          # TrinketEffect
│   │   ├── enchant.rs          # Enchant effects
│   │   └── gem.rs              # Gem effects
│   ├── set_bonus.rs            # SetBonus detection
│   └── equipment.rs            # Equipment container
│
├── rotation/                   # Rotation system
│   ├── mod.rs
│   ├── compiler.rs             # Rhai → compiled rotation
│   ├── condition.rs            # Condition evaluation
│   ├── engine.rs               # RotationEngine
│   └── builtin.rs              # Built-in functions
│
├── sim/                        # Simulation orchestration
│   ├── mod.rs
│   ├── simulator.rs            # Main Simulator API
│   ├── state.rs                # SimState container
│   ├── loop.rs                 # Main simulation loop
│   ├── batch.rs                # Batch simulation runner
│   └── parallel.rs             # Parallel execution (rayon)
│
├── result/                     # Results and statistics
│   ├── mod.rs
│   ├── damage.rs               # DamageBreakdown
│   ├── statistics.rs           # Mean, variance, confidence
│   ├── uptime.rs               # Aura uptime tracking
│   └── summary.rs              # SimSummary output
│
├── trace/                      # Action logging (runtime-optional)
│   ├── mod.rs
│   ├── event.rs                # TraceEvent enum
│   ├── buffer.rs               # TraceBuffer
│   └── format.rs               # Event formatting
│
├── spec/                       # Spec definition framework
│   ├── mod.rs                  # Spell/Aura traits, SpecModule
│   ├── context.rs              # CastContext, SpecContext, SpellResult
│   ├── builder.rs              # Fluent builders for damage/dots/auras
│   └── registry.rs             # Spell/Aura lookup by ID/name
│
├── runtime/                    # Runtime config
│   ├── mod.rs
│   ├── sim_config.rs           # SimConfig
│   ├── player_config.rs        # PlayerConfig
│   ├── target_config.rs        # TargetConfig
│   └── trait_loadout.rs        # Selected traits
│
└── cli/
    └── main.rs
```

---

## Critical Systems Design

### ActionState (Snapshotting)

Stats captured at cast time for DoTs:

```rust
pub struct ActionState {
    // Snapshotted at cast (based on SnapshotFlags)
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste: f32,
    pub versatility: f32,

    // Multipliers (snapshot timing varies by type)
    pub da_multiplier: f32,       // Direct damage
    pub ta_multiplier: f32,       // Tick damage (DoTs)
    pub persistent_multiplier: f32, // Snapshot at cast
    pub player_multiplier: f32,   // School-based, dynamic
    pub target_multiplier: f32,   // Debuffs on target
    pub pet_multiplier: f32,      // Owner → pet scaling

    // Result tracking
    pub result_raw: f32,
    pub result_total: f32,
    pub result_mitigated: f32,
    pub result_amount: f32,
}

bitflags! {
    pub struct SnapshotFlags: u32 {
        const ATTACK_POWER = 1 << 0;
        const SPELL_POWER  = 1 << 1;
        const CRIT         = 1 << 2;
        const HASTE        = 1 << 3;
        const VERSATILITY  = 1 << 4;
        const MULTIPLIERS  = 1 << 5;
    }
}
```

### Multiplier Pipeline

Seven distinct multiplier types, applied multiplicatively:

```rust
pub fn calculate_damage(&self, base: f32, state: &ActionState) -> f32 {
    let mut amount = base;

    // 1. Action-specific multiplier
    amount *= state.da_multiplier;

    // 2. Player-wide school multiplier
    amount *= state.player_multiplier;

    // 3. Persistent (snapshotted at cast)
    amount *= state.persistent_multiplier;

    // 4. Target debuffs
    amount *= state.target_multiplier;

    // 5. Versatility
    amount *= 1.0 + state.versatility;

    // 6. Pet multiplier (if pet damage)
    amount *= state.pet_multiplier;

    // 7. Mitigation (armor, resistances)
    amount *= self.calculate_mitigation(state);

    amount
}
```

### RPPM with Bad Luck Protection

```rust
pub struct RealPPM {
    pub base_frequency: f32,      // Base procs per minute
    pub modifier: f32,            // Item level modifier from DBC
    pub scales_with: RPPMScaling, // Haste | Crit | AttackSpeed
    pub blp_enabled: bool,        // Bad Luck Protection

    // Runtime state
    last_trigger_attempt: SimTime,
    last_successful_proc: SimTime,
    accumulated_blp: Duration,
}

impl RealPPM {
    const MAX_INTERVAL: Duration = Duration::from_secs_f32(3.5);
    const MAX_BLP_ACCUMULATION: Duration = Duration::from_secs(1000);

    pub fn check(&mut self, ctx: &ProcContext) -> bool {
        let now = ctx.time;
        let elapsed = now - self.last_trigger_attempt;
        self.last_trigger_attempt = now;

        // Base chance: rppm * (seconds / 60)
        let rppm = self.base_frequency * self.modifier * self.scaling_coeff(ctx);
        let mut chance = rppm * (elapsed.as_secs_f32() / 60.0);

        // Bad Luck Protection
        if self.blp_enabled {
            let since_success = now - self.last_successful_proc;
            let expected_interval = 60.0 / rppm;

            // Increase chance after 1.5x expected interval
            if since_success.as_secs_f32() > expected_interval * 1.5 {
                let blp_mult = 1.0 + ((since_success.as_secs_f32() / expected_interval - 1.5) * 3.0);
                chance *= blp_mult.max(1.0);
            }
        }

        if ctx.rng.roll(chance) {
            self.last_successful_proc = now;
            true
        } else {
            false
        }
    }
}
```

### Per-Target Aura Tracking

```rust
pub struct AuraTracker {
    // Player's own buffs
    pub buffs: HashMap<AuraIdx, AuraInstance>,

    // Debuffs per target (for DoT tracking)
    pub target_debuffs: HashMap<TargetIdx, HashMap<AuraIdx, AuraInstance>>,
}

impl AuraTracker {
    pub fn apply_debuff(&mut self, target: TargetIdx, aura: AuraIdx, instance: AuraInstance) {
        self.target_debuffs
            .entry(target)
            .or_default()
            .insert(aura, instance);
    }

    pub fn get_debuff(&self, target: TargetIdx, aura: AuraIdx) -> Option<&AuraInstance> {
        self.target_debuffs.get(&target)?.get(&aura)
    }
}
```

### Proc Flags

```rust
bitflags! {
    pub struct ProcFlags: u64 {
        const ON_DAMAGE           = 1 << 0;
        const ON_HEAL             = 1 << 1;
        const ON_CRIT             = 1 << 2;
        const ON_PERIODIC         = 1 << 3;
        const ON_CAST             = 1 << 4;
        const ON_ABILITY_HIT      = 1 << 5;
        const ON_SPELL_HIT        = 1 << 6;
        const ON_MELEE_HIT        = 1 << 7;
        const ON_RANGED_HIT       = 1 << 8;
        const ON_KILL             = 1 << 9;
        const ON_DAMAGE_TAKEN     = 1 << 10;
        // ... extensive list from DBC
    }
}

pub struct ProcCallback {
    pub flags: ProcFlags,
    pub effect: ProcEffect,
    pub rppm: Option<RealPPM>,
    pub icd: Option<Duration>,
    pub conditions: ProcConditions,
}

pub struct ProcConditions {
    pub only_class_abilities: bool,
    pub allow_procs_from_procs: bool,
    pub only_direct_damage: bool,
    // ...
}
```

---

## Features to Preserve

These exist in current engine and must not be lost:

| Feature             | Location                           | Notes                             |
| ------------------- | ---------------------------------- | --------------------------------- |
| Travel time         | `SpellDamage` event                | Projectile spells delay damage    |
| Pandemic            | `AuraDef.pandemic`                 | 30% duration extension on refresh |
| Auto-attacks        | `AutoAttack`/`PetAttack` events    | Scheduled melee swings            |
| Cast time           | `CastComplete` event               | GCD + cast time handling          |
| Weapon coefficients | `DamageFormula.weapon_coefficient` | Melee damage scaling              |

## Features to Add (Priority Order)

| Feature                               | Priority     | Status                      |
| ------------------------------------- | ------------ | --------------------------- |
| ActionState snapshotting              | **Critical** | Needed for accurate DoTs    |
| Multiplier layering (7+ types)        | **Critical** | Needed for accurate damage  |
| RPPM with Bad Luck Protection         | **Critical** | Needed for accurate procs   |
| Per-target aura tracking              | **Critical** | Needed for multi-target     |
| Proc flags system                     | **Critical** | Needed for proc triggers    |
| Charge-based cooldowns                | High         | Many abilities have charges |
| Dynamic/hasted cooldowns              | High         | CD adjustments mid-fight    |
| Refresh behaviors (pandemic, rolling) | High         | DoT refresh mechanics       |
| Absorb shields                        | Medium       | Separate damage pool        |
| Scale factors                         | Low          | Stat weight calculations    |

---

## Parallel Execution

For batch simulations with rayon:

```rust
fn run_batch(config: &SimConfig, iterations: u32) -> BatchResult {
    (0..iterations)
        .into_par_iter()
        .map(|seed| {
            let mut state = SimState::new(config, seed, None);
            run_single(&mut state);
            state.result
        })
        .reduce(BatchResult::default, BatchResult::merge)
}
```

---

## Portal Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  Portal (apps/portal)                                           │
│  1. User configures sim (gear, talents, target)                 │
│  2. rust-config-builder.ts builds RuntimeConfig                 │
│  3. RuntimeConfig stored in Supabase                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Supabase                                                       │
│  - sim_configs, sim_jobs, rotations tables                      │
│  - Realtime: broadcasts work_available                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Nodes (crates/node-headless)                                   │
│  1. Connect to Supabase realtime                                │
│  2. Claim work chunks                                           │
│  3. Fetch RuntimeConfig + rotation                              │
│  4. Run engine → Results                                        │
│  5. Upload results                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Engine (crates/engine + specs/)                                │
│  Inputs:                                                        │
│  - Spec modules (compiled Rust)                                 │
│  - RuntimeConfig (player stats, talents)                        │
│  - Rotation (Rhai script)                                       │
│  Output: SimResult                                              │
└─────────────────────────────────────────────────────────────────┘
```
