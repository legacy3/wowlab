# Phase 13: Beast Mastery Hunter

## Goal

Implement the first complete spec: Beast Mastery Hunter.

## Prerequisites

Phase 12 complete. `cargo test -p engine_new` passes (146 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod specs;
└── specs/
    ├── mod.rs
    └── hunter/
        ├── mod.rs
        ├── constants.rs
        ├── spells.rs
        ├── auras.rs
        ├── procs.rs
        ├── pet.rs
        └── handler.rs
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
pub mod sim;
pub mod rotation;
pub mod results;
pub mod specs;
```

### `src/specs/mod.rs`

```rust
pub mod hunter;

pub use hunter::bm::BeastMasteryHandler;
```

### `src/specs/hunter/mod.rs`

```rust
pub mod bm;
```

### `src/specs/hunter/bm/mod.rs`

```rust
mod constants;
mod spells;
mod auras;
mod procs;
mod pet;
mod handler;

pub use constants::*;
pub use spells::*;
pub use auras::*;
pub use procs::*;
pub use pet::*;
pub use handler::*;

#[cfg(test)]
mod tests;
```

### `src/specs/hunter/bm/constants.rs`

```rust
use crate::types::{SpellIdx, AuraIdx, ProcIdx};

// ============================================================================
// Spell IDs
// ============================================================================

/// Kill Command
pub const KILL_COMMAND: SpellIdx = SpellIdx(34026);
/// Cobra Shot
pub const COBRA_SHOT: SpellIdx = SpellIdx(193455);
/// Barbed Shot
pub const BARBED_SHOT: SpellIdx = SpellIdx(217200);
/// Bestial Wrath
pub const BESTIAL_WRATH: SpellIdx = SpellIdx(19574);
/// Multi-Shot
pub const MULTI_SHOT: SpellIdx = SpellIdx(2643);
/// Beast Cleave
pub const BEAST_CLEAVE_SPELL: SpellIdx = SpellIdx(115939);
/// Kill Shot
pub const KILL_SHOT: SpellIdx = SpellIdx(53351);
/// A Murder of Crows
pub const MURDER_OF_CROWS: SpellIdx = SpellIdx(131894);
/// Bloodshed
pub const BLOODSHED: SpellIdx = SpellIdx(321530);
/// Call of the Wild
pub const CALL_OF_THE_WILD: SpellIdx = SpellIdx(359844);

// Pet abilities
/// Pet auto-attack
pub const PET_MELEE: SpellIdx = SpellIdx(100001);
/// Pet Kill Command damage
pub const PET_KILL_COMMAND: SpellIdx = SpellIdx(100002);
/// Pet Stomp
pub const PET_STOMP: SpellIdx = SpellIdx(201754);

// ============================================================================
// Aura IDs
// ============================================================================

/// Bestial Wrath buff
pub const BESTIAL_WRATH_BUFF: AuraIdx = AuraIdx(19574);
/// Frenzy (pet attack speed stacks)
pub const FRENZY: AuraIdx = AuraIdx(272790);
/// Barbed Shot DoT
pub const BARBED_SHOT_DOT: AuraIdx = AuraIdx(217200);
/// Beast Cleave buff
pub const BEAST_CLEAVE: AuraIdx = AuraIdx(118455);
/// Thrill of the Hunt (crit stacks)
pub const THRILL_OF_THE_HUNT: AuraIdx = AuraIdx(257946);
/// Aspect of the Wild buff
pub const ASPECT_OF_THE_WILD: AuraIdx = AuraIdx(193530);
/// Call of the Wild buff
pub const CALL_OF_THE_WILD_BUFF: AuraIdx = AuraIdx(359844);
/// Bloodshed debuff
pub const BLOODSHED_DEBUFF: AuraIdx = AuraIdx(321538);

// ============================================================================
// Proc IDs
// ============================================================================

/// Wild Call (Barbed Shot reset)
pub const WILD_CALL: ProcIdx = ProcIdx(1);
/// Barbed Wrath CDR
pub const BARBED_WRATH: ProcIdx = ProcIdx(2);

// ============================================================================
// Tuning Constants
// ============================================================================

/// Focus regeneration per second (base)
pub const FOCUS_REGEN_BASE: f32 = 5.0;
/// Kill Command Focus cost
pub const KILL_COMMAND_COST: f32 = 30.0;
/// Cobra Shot Focus cost
pub const COBRA_SHOT_COST: f32 = 35.0;
/// Barbed Shot charges
pub const BARBED_SHOT_CHARGES: u8 = 2;
/// Barbed Shot recharge time (seconds)
pub const BARBED_SHOT_RECHARGE: f32 = 12.0;
/// Frenzy max stacks
pub const FRENZY_MAX_STACKS: u8 = 3;
/// Frenzy duration (seconds)
pub const FRENZY_DURATION: f32 = 8.0;
/// Bestial Wrath duration (seconds)
pub const BESTIAL_WRATH_DURATION: f32 = 15.0;
/// Bestial Wrath cooldown (seconds)
pub const BESTIAL_WRATH_COOLDOWN: f32 = 90.0;
/// Beast Cleave duration (seconds)
pub const BEAST_CLEAVE_DURATION: f32 = 4.0;
/// Wild Call proc chance
pub const WILD_CALL_CHANCE: f32 = 0.20;
/// Cobra Shot CDR for Kill Command
pub const COBRA_SHOT_CDR: f32 = 1.0;
```

### `src/specs/hunter/bm/spells.rs`

```rust
use crate::spec::{SpellBuilder, SpellDef, SpellSchool, SpellTarget, DamageEffect, GcdType};
use crate::types::{ResourceType, SimTime};
use super::constants::*;

/// Get all BM Hunter spell definitions
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
        .school(SpellSchool::Physical)
        .instant()
        .cooldown(7.5)
        .cost(ResourceType::Focus, KILL_COMMAND_COST)
        .physical_damage(2.0) // AP coefficient
        .pet_ability()
        .build()
}

fn cobra_shot() -> SpellDef {
    SpellBuilder::new(COBRA_SHOT, "Cobra Shot")
        .school(SpellSchool::Nature)
        .instant()
        .cost(ResourceType::Focus, COBRA_SHOT_COST)
        .spell_damage(SpellSchool::Nature, 0.4)
        .build()
}

fn barbed_shot() -> SpellDef {
    SpellBuilder::new(BARBED_SHOT, "Barbed Shot")
        .school(SpellSchool::Physical)
        .instant()
        .charges(BARBED_SHOT_CHARGES, BARBED_SHOT_RECHARGE)
        .gain(ResourceType::Focus, 5.0) // Focus regen from Frenzy
        .physical_damage(0.3)
        .apply_aura(BARBED_SHOT_DOT)
        .apply_aura(FRENZY)
        .build()
}

fn bestial_wrath() -> SpellDef {
    SpellBuilder::new(BESTIAL_WRATH, "Bestial Wrath")
        .instant()
        .no_gcd()
        .cooldown(BESTIAL_WRATH_COOLDOWN)
        .apply_aura(BESTIAL_WRATH_BUFF)
        .build()
}

fn multi_shot() -> SpellDef {
    SpellBuilder::new(MULTI_SHOT, "Multi-Shot")
        .school(SpellSchool::Physical)
        .instant()
        .cost(ResourceType::Focus, 40.0)
        .target(SpellTarget::AllEnemies)
        .physical_damage(0.5)
        .apply_aura(BEAST_CLEAVE)
        .build()
}

fn kill_shot() -> SpellDef {
    SpellBuilder::new(KILL_SHOT, "Kill Shot")
        .school(SpellSchool::Physical)
        .instant()
        .cooldown(10.0)
        .cost(ResourceType::Focus, 10.0)
        .physical_damage(4.0)
        // Note: Only usable when target < 20% health
        // This would be checked in the handler
        .build()
}
```

### `src/specs/hunter/bm/auras.rs`

```rust
use crate::spec::{AuraBuilder, AuraDef, SpellSchool, AuraEffect};
use crate::aura::PeriodicEffect;
use crate::stats::Stat;
use crate::types::SimTime;
use super::constants::*;

/// Get all BM Hunter aura definitions
pub fn aura_definitions() -> Vec<AuraDef> {
    vec![
        bestial_wrath_buff(),
        frenzy_buff(),
        barbed_shot_dot(),
        beast_cleave_buff(),
    ]
}

fn bestial_wrath_buff() -> AuraDef {
    AuraBuilder::buff(BESTIAL_WRATH_BUFF, "Bestial Wrath", BESTIAL_WRATH_DURATION)
        .damage_multiplier(1.25) // 25% increased damage
        .build()
}

fn frenzy_buff() -> AuraDef {
    AuraBuilder::buff(FRENZY, "Frenzy", FRENZY_DURATION)
        .stacks(FRENZY_MAX_STACKS)
        .refreshable()
        // Each stack gives 10% pet attack speed
        .haste(0.10)
        .build()
}

fn barbed_shot_dot() -> AuraDef {
    AuraBuilder::dot(BARBED_SHOT_DOT, "Barbed Shot", 8.0, 2.0)
        .periodic_damage(2.0, 0.15) // 2s ticks, 15% AP per tick
        .pandemic()
        .snapshots()
        .build()
}

fn beast_cleave_buff() -> AuraDef {
    AuraBuilder::buff(BEAST_CLEAVE, "Beast Cleave", BEAST_CLEAVE_DURATION)
        // Pet attacks cleave for 35% damage while active
        .build()
}
```

### `src/specs/hunter/bm/procs.rs`

```rust
use crate::proc::{ProcHandler, ProcFlags, ProcEffect, RppmState, FixedProc, ProcRegistry};
use crate::types::SimTime;
use super::constants::*;

/// Setup BM Hunter procs
pub fn setup_procs(registry: &mut ProcRegistry) {
    // Wild Call: Barbed Shot has 20% chance to reset on auto-attack crits
    registry.register_fixed(
        FixedProc::new(WILD_CALL, WILD_CALL_CHANCE),
        ProcHandler::new(
            WILD_CALL,
            "Wild Call",
            ProcFlags::ON_AUTO_ATTACK | ProcFlags::ON_CRIT,
            ProcEffect::ReduceCooldown {
                spell: BARBED_SHOT,
                amount: SimTime::from_secs(12), // Full reset
            },
        ),
    );

    // Barbed Wrath: Barbed Shot reduces Bestial Wrath CD
    registry.register_fixed(
        FixedProc::new(BARBED_WRATH, 1.0), // Always triggers
        ProcHandler::new(
            BARBED_WRATH,
            "Barbed Wrath",
            ProcFlags::ON_SPELL_CAST,
            ProcEffect::ReduceCooldown {
                spell: BESTIAL_WRATH,
                amount: SimTime::from_secs(12),
            },
        ).with_spell_filter(vec![BARBED_SHOT]),
    );
}
```

### `src/specs/hunter/bm/pet.rs`

```rust
use crate::actor::{Pet, PetType};
use crate::combat::Cooldown;
use crate::types::{UnitIdx, SimTime, SpellIdx};
use super::constants::*;

/// Create a BM Hunter pet
pub fn create_pet(owner: UnitIdx) -> Pet {
    let mut pet = Pet::new(
        UnitIdx(1),
        owner,
        PetType::Permanent,
        "Pet",
    );

    // Pet has Stomp on a 10s cooldown
    pet.add_cooldown(Cooldown::new(PET_STOMP, SimTime::from_secs(10)));

    pet
}

/// Pet damage coefficients
pub struct PetDamage;

impl PetDamage {
    /// Base auto-attack damage (as % of owner AP)
    pub const AUTO_ATTACK_COEF: f32 = 0.5;

    /// Kill Command damage (as % of owner AP)
    pub const KILL_COMMAND_COEF: f32 = 2.0;

    /// Stomp damage (as % of owner AP)
    pub const STOMP_COEF: f32 = 0.25;

    /// Pet base attack speed
    pub const ATTACK_SPEED: SimTime = SimTime::from_millis(2000);

    /// Pet stat inheritance from owner
    pub const STAT_INHERITANCE: f32 = 0.6; // 60% of owner stats
}
```

### `src/specs/hunter/bm/handler.rs`

```rust
use crate::types::{SpecId, SpellIdx, AuraIdx, TargetIdx, SimTime};
use crate::sim::SimState;
use crate::core::SimEvent;
use crate::combat::ActionState;
use crate::aura::{AuraInstance, AuraFlags};
use crate::resource::ResourceRegen;
use crate::actor::Player;
use crate::stats::SpecCoefficients;
use super::constants::*;
use super::spells::spell_definitions;
use super::auras::aura_definitions;
use super::procs::setup_procs;
use super::pet::{create_pet, PetDamage};

/// BM Hunter spec handler
pub struct BeastMasteryHandler {
    spells: Vec<crate::spec::SpellDef>,
    auras: Vec<crate::spec::AuraDef>,
}

impl BeastMasteryHandler {
    pub fn new() -> Self {
        Self {
            spells: spell_definitions(),
            auras: aura_definitions(),
        }
    }

    /// Get spec coefficients
    pub fn coefficients() -> SpecCoefficients {
        SpecCoefficients {
            stamina: 1.0,
            agility: 1.0,
            intellect: 0.0,
            strength: 0.0,
            attack_power_per_agi: 1.0,
            spell_power_per_int: 0.0,
            crit_per_agi: 0.0,
        }
    }

    /// Initialize player for BM Hunter
    pub fn init_player(player: &mut Player) {
        player.spec = SpecId::BeastMastery;

        // Setup resources
        player.resources = crate::resource::UnitResources::new()
            .with_primary(crate::types::ResourceType::Focus);

        // Setup cooldowns
        player.add_cooldown(crate::combat::Cooldown::new(KILL_COMMAND, SimTime::from_secs_f32(7.5)));
        player.add_cooldown(crate::combat::Cooldown::new(BESTIAL_WRATH, SimTime::from_secs_f32(BESTIAL_WRATH_COOLDOWN)));
        player.add_cooldown(crate::combat::Cooldown::new(KILL_SHOT, SimTime::from_secs_f32(10.0)));

        // Setup charged cooldowns
        player.add_charged_cooldown(crate::combat::ChargedCooldown::new(
            BARBED_SHOT,
            BARBED_SHOT_CHARGES,
            SimTime::from_secs_f32(BARBED_SHOT_RECHARGE),
        ));

        // Setup procs
        setup_procs(&mut player.procs);
    }

    /// Initialize simulation state for BM Hunter
    pub fn init_sim(state: &mut SimState) {
        Self::init_player(&mut state.player);

        // Add pet
        let pet = create_pet(state.player.id);
        state.pets.summon(state.player.id, crate::actor::PetType::Permanent, "Pet");

        // Schedule first auto-attack
        state.events.schedule(SimTime::ZERO, SimEvent::AutoAttack { unit: state.player.id });

        // Schedule pet auto-attack
        state.events.schedule(SimTime::ZERO, SimEvent::PetAttack { pet: crate::types::UnitIdx(1) });
    }

    /// Get spell definition by ID
    pub fn spell(&self, id: SpellIdx) -> Option<&crate::spec::SpellDef> {
        self.spells.iter().find(|s| s.id == id)
    }

    /// Get aura definition by ID
    pub fn aura(&self, id: AuraIdx) -> Option<&crate::spec::AuraDef> {
        self.auras.iter().find(|a| a.id == id)
    }

    /// Check if Kill Shot is usable (target < 20%)
    pub fn can_kill_shot(state: &SimState) -> bool {
        state.enemies.primary()
            .map(|e| e.health_percent() < 0.20)
            .unwrap_or(false)
    }

    /// Calculate Kill Command damage
    pub fn calc_kill_command(state: &SimState) -> f32 {
        let ap = state.player.stats.get_attack_power();
        let coef = PetDamage::KILL_COMMAND_COEF;

        let mut damage = ap * coef;

        // Apply Bestial Wrath
        if state.player.buffs.has(BESTIAL_WRATH_BUFF, state.now()) {
            damage *= 1.25;
        }

        damage
    }

    /// Calculate Cobra Shot damage
    pub fn calc_cobra_shot(state: &SimState) -> f32 {
        let ap = state.player.stats.get_attack_power();
        let coef = 0.4;

        ap * coef
    }

    /// Apply Barbed Shot effects
    pub fn apply_barbed_shot(state: &mut SimState, target: TargetIdx) {
        let now = state.now();

        // Apply/refresh Barbed Shot DoT
        if let Some(target_auras) = state.auras.target_mut(target) {
            let dot = AuraInstance::new(
                BARBED_SHOT_DOT,
                target,
                SimTime::from_secs(8),
                now,
                AuraFlags {
                    is_debuff: true,
                    is_periodic: true,
                    can_pandemic: true,
                    snapshots: true,
                    refreshable: true,
                    ..Default::default()
                },
            ).with_periodic(SimTime::from_secs(2), now)
             .with_snapshot(ActionState::from_player(&state.player));

            target_auras.apply(dot, now);
        }

        // Apply/refresh Frenzy stacks
        let frenzy = AuraInstance::new(
            FRENZY,
            TargetIdx(0), // Player buff
            SimTime::from_secs_f32(FRENZY_DURATION),
            now,
            AuraFlags {
                refreshable: true,
                ..Default::default()
            },
        ).with_stacks(FRENZY_MAX_STACKS);

        state.player.buffs.apply(frenzy, now);
    }

    /// Apply Bestial Wrath
    pub fn apply_bestial_wrath(state: &mut SimState) {
        let now = state.now();

        let buff = AuraInstance::new(
            BESTIAL_WRATH_BUFF,
            TargetIdx(0),
            SimTime::from_secs_f32(BESTIAL_WRATH_DURATION),
            now,
            AuraFlags::default(),
        );

        state.player.buffs.apply(buff, now);
    }
}

impl Default for BeastMasteryHandler {
    fn default() -> Self {
        Self::new()
    }
}
```

### `src/specs/hunter/bm/tests.rs`

```rust
use super::*;
use crate::types::*;
use crate::sim::{SimState, SimConfig};
use crate::actor::Player;

#[test]
fn constants_defined() {
    assert_eq!(KILL_COMMAND.0, 34026);
    assert_eq!(COBRA_SHOT.0, 193455);
    assert_eq!(BARBED_SHOT.0, 217200);
}

#[test]
fn spell_definitions_count() {
    let spells = spell_definitions();
    assert!(spells.len() >= 5); // At least the core abilities
}

#[test]
fn aura_definitions_count() {
    let auras = aura_definitions();
    assert!(auras.len() >= 3);
}

#[test]
fn handler_creation() {
    let handler = BeastMasteryHandler::new();

    assert!(handler.spell(KILL_COMMAND).is_some());
    assert!(handler.spell(COBRA_SHOT).is_some());
    assert!(handler.spell(BARBED_SHOT).is_some());
}

#[test]
fn player_init() {
    let mut player = Player::new(SpecId::BeastMastery);
    BeastMasteryHandler::init_player(&mut player);

    assert_eq!(player.spec, SpecId::BeastMastery);
    assert!(player.resources.primary.is_some());
    assert!(player.cooldown(KILL_COMMAND).is_some());
    assert!(player.charged_cooldown(BARBED_SHOT).is_some());
}

#[test]
fn sim_init() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    BeastMasteryHandler::init_sim(&mut state);

    assert_eq!(state.player.spec, SpecId::BeastMastery);
}

#[test]
fn kill_shot_usable() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);

    // Target at full health - can't kill shot
    assert!(!BeastMasteryHandler::can_kill_shot(&state));

    // Drop target below 20%
    if let Some(enemy) = state.enemies.primary_mut() {
        enemy.current_health = enemy.max_health * 0.15;
    }

    assert!(BeastMasteryHandler::can_kill_shot(&state));
}

#[test]
fn kill_command_damage() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.set_attack_power(10000.0);

    let state = SimState::new(config, player);
    let damage = BeastMasteryHandler::calc_kill_command(&state);

    // 10000 AP * 2.0 coef = 20000 base damage
    assert!((damage - 20000.0).abs() < 100.0);
}

#[test]
fn cobra_shot_damage() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.set_attack_power(10000.0);

    let state = SimState::new(config, player);
    let damage = BeastMasteryHandler::calc_cobra_shot(&state);

    // 10000 AP * 0.4 coef = 4000 base damage
    assert!((damage - 4000.0).abs() < 100.0);
}

#[test]
fn frenzy_stacks() {
    let config = SimConfig::default();
    let player = Player::new(SpecId::BeastMastery);
    let mut state = SimState::new(config, player);
    BeastMasteryHandler::init_sim(&mut state);

    // Apply Barbed Shot 3 times
    for _ in 0..3 {
        BeastMasteryHandler::apply_barbed_shot(&mut state, TargetIdx(0));
    }

    let stacks = state.player.buffs.stacks(FRENZY, state.now());
    assert_eq!(stacks, FRENZY_MAX_STACKS);
}

#[test]
fn bestial_wrath_damage_bonus() {
    let config = SimConfig::default();
    let mut player = Player::new(SpecId::BeastMastery);
    player.stats.set_attack_power(10000.0);

    let mut state = SimState::new(config, player);
    BeastMasteryHandler::init_sim(&mut state);

    let damage_before = BeastMasteryHandler::calc_kill_command(&state);

    BeastMasteryHandler::apply_bestial_wrath(&mut state);

    let damage_after = BeastMasteryHandler::calc_kill_command(&state);

    // Should be 25% more damage
    assert!((damage_after / damage_before - 1.25).abs() < 0.01);
}

#[test]
fn pet_damage_constants() {
    assert!((PetDamage::KILL_COMMAND_COEF - 2.0).abs() < 0.01);
    assert!((PetDamage::STAT_INHERITANCE - 0.6).abs() < 0.01);
}

#[test]
fn spec_coefficients() {
    let coefs = BeastMasteryHandler::coefficients();

    assert!((coefs.agility - 1.0).abs() < 0.01);
    assert!((coefs.attack_power_per_agi - 1.0).abs() < 0.01);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (146 + 12 = 158 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod specs;`
- [ ] Create `src/specs/mod.rs`
- [ ] Create `src/specs/hunter/mod.rs`
- [ ] Create `src/specs/hunter/bm/mod.rs`
- [ ] Create `src/specs/hunter/bm/constants.rs`
- [ ] Create `src/specs/hunter/bm/spells.rs`
- [ ] Create `src/specs/hunter/bm/auras.rs`
- [ ] Create `src/specs/hunter/bm/procs.rs`
- [ ] Create `src/specs/hunter/bm/pet.rs`
- [ ] Create `src/specs/hunter/bm/handler.rs`
- [ ] Create `src/specs/hunter/bm/tests.rs`
- [ ] Run `cargo test` — 158 tests pass
