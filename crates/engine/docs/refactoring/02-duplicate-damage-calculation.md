# Issue 02: Duplicate Damage Calculations

## Category

DRY Violation

## Severity

High

## Locations

1. `src/sim/engine.rs:597-605` - Spell damage
2. `src/sim/engine.rs:406-408` - DoT tick damage
3. `src/sim/engine.rs:430-435` - Auto-attack damage
4. `src/sim/engine.rs:447-450` - Pet auto-attack damage

## Description

The damage calculation formula `(base + ap_scaling) * crit_mult * damage_mult` is implemented 4 times with slight variations.

## Current Code

```rust
// Site 1: Spell damage (engine.rs:597-605)
let base = (spell_rt.damage_min + spell_rt.damage_max) * 0.5;
let ap_damage = spell_rt.ap_coefficient * cache.attack_power;
let total = (base + ap_damage) * cache.crit_mult * cache.damage_multiplier;

// Site 2: DoT tick (engine.rs:406-408)
let tick_damage = (tick_amount + tick_coefficient * cache.attack_power)
    * cache.crit_mult
    * cache.damage_multiplier;

// Site 3: Auto-attack (engine.rs:430-435)
let weapon_damage = (config.player.weapon.damage.0 + config.player.weapon.damage.1) * 0.5;
let ap_bonus = cache.attack_power / 3.5 * config.player.weapon.speed;
let damage = (weapon_damage + ap_bonus) * cache.crit_mult * cache.damage_multiplier;

// Site 4: Pet attack (engine.rs:447-450)
let (min, max) = config.pet.attack_damage;
let pet_damage = pet_stats.calculate_auto_attack(min, max);
// Uses pet_stats.crit_mult and pet_stats.damage_multiplier internally
```

## Proposed Fix

```rust
/// Core damage calculation with AP scaling and multipliers
#[inline(always)]
fn calculate_scaled_damage(
    base_damage: f32,
    ap_coefficient: f32,
    cache: &StatCache,
) -> f32 {
    let ap_damage = ap_coefficient * cache.attack_power;
    (base_damage + ap_damage) * cache.crit_mult * cache.damage_multiplier
}

/// Auto-attack damage calculation (normalized weapon speed)
#[inline(always)]
fn calculate_auto_attack_damage(
    weapon_min: f32,
    weapon_max: f32,
    weapon_speed: f32,
    cache: &StatCache,
) -> f32 {
    let weapon_damage = (weapon_min + weapon_max) * 0.5;
    let ap_bonus = cache.attack_power / 3.5 * weapon_speed;
    (weapon_damage + ap_bonus) * cache.crit_mult * cache.damage_multiplier
}

/// Apply only the multiplier portion (for pre-scaled base damage)
#[inline(always)]
fn apply_damage_multipliers(base_damage: f32, cache: &StatCache) -> f32 {
    base_damage * cache.crit_mult * cache.damage_multiplier
}
```

## Usage After Refactor

```rust
// Spell damage
let base = (spell_rt.damage_min + spell_rt.damage_max) * 0.5;
let total = calculate_scaled_damage(base, spell_rt.ap_coefficient, &cache);

// DoT tick
let tick_damage = calculate_scaled_damage(tick_amount, tick_coefficient, &cache);

// Auto-attack
let damage = calculate_auto_attack_damage(
    config.player.weapon.damage.0,
    config.player.weapon.damage.1,
    config.player.weapon.speed,
    &cache,
);

// Pet attack (in PetStats)
pub fn calculate_auto_attack(&self, min: f32, max: f32) -> f32 {
    let base = (min + max) * 0.5 + self.cache.attack_power / 3.5 * self.attack_speed;
    base * self.cache.crit_mult * self.cache.damage_multiplier
}
```

## Impact

- Single source of truth for damage formula
- Easier to add new damage types (spell power, armor pen)
- Reduces bug risk when formula changes

## Effort

Low (2-3 hours)

## Tests Required

- Unit test each helper function
- Integration test comparing before/after damage values
- Verify no regression in benchmark performance
