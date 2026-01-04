# Issue 03: Duplicate Rating Stat Computation

## Category

DRY Violation

## Severity

Medium

## Location

`src/paperdoll/paperdoll.rs:588-666`

## Description

The `recompute()` method repeats the same pattern for computing rating-based stats (crit, dodge, parry, etc.):

1. Get rating value
2. Add attribute contribution (if coefficient > 0)
3. Add base value
4. Apply modifiers

## Current Code

```rust
// Crit (lines 589-600)
let crit_from_rating = self.rating_to_percent(RatingType::CritMelee, gear.ratings[RatingType::CritMelee as usize], level);
let crit_from_agi = if coeff.crit_per_agility > 0.0 {
    self.cache.agility / coeff.crit_per_agility / 100.0
} else {
    0.0
};
self.cache.crit_chance = base.base_crit + crit_from_rating + crit_from_agi + self.modifiers.crit_chance_flat;

// Dodge (lines 641-650) - Same pattern
let dodge_from_rating = self.rating_to_percent(RatingType::Dodge, gear.ratings[RatingType::Dodge as usize], level);
let dodge_from_agi = if coeff.dodge_per_agility > 0.0 {
    self.cache.agility / coeff.dodge_per_agility / 100.0
} else {
    0.0
};
self.cache.dodge_chance = base.base_dodge + dodge_from_rating + dodge_from_agi;

// Parry (lines 653-666) - Same pattern with strength
let parry_from_rating = self.rating_to_percent(RatingType::Parry, gear.ratings[RatingType::Parry as usize], level);
let parry_from_str = if coeff.parry_per_strength > 0.0 {
    self.cache.strength / coeff.parry_per_strength / 100.0
} else {
    0.0
};
self.cache.parry_chance = if coeff.can_parry {
    base.base_parry + parry_from_rating + parry_from_str
} else {
    0.0
};
```

## Proposed Fix

```rust
/// Compute a rating-based stat with optional attribute scaling
#[inline]
fn compute_rating_stat(
    &self,
    rating_type: RatingType,
    rating_value: f32,
    level: u8,
    base_value: f32,
    attribute_value: f32,
    per_attribute: f32,
    flat_modifier: f32,
) -> f32 {
    let from_rating = self.rating_to_percent(rating_type, rating_value, level);
    let from_attribute = if per_attribute > 0.0 {
        attribute_value / per_attribute / 100.0
    } else {
        0.0
    };
    base_value + from_rating + from_attribute + flat_modifier
}
```

## Usage After Refactor

```rust
// Crit
self.cache.crit_chance = self.compute_rating_stat(
    RatingType::CritMelee,
    gear.ratings[RatingType::CritMelee as usize],
    level,
    base.base_crit,
    self.cache.agility,
    coeff.crit_per_agility,
    self.modifiers.crit_chance_flat,
);

// Dodge
self.cache.dodge_chance = self.compute_rating_stat(
    RatingType::Dodge,
    gear.ratings[RatingType::Dodge as usize],
    level,
    base.base_dodge,
    self.cache.agility,
    coeff.dodge_per_agility,
    0.0,
);

// Parry (with conditional)
self.cache.parry_chance = if coeff.can_parry {
    self.compute_rating_stat(
        RatingType::Parry,
        gear.ratings[RatingType::Parry as usize],
        level,
        base.base_parry,
        self.cache.strength,
        coeff.parry_per_strength,
        0.0,
    )
} else {
    0.0
};
```

## Impact

- Reduces code by ~40 lines
- Makes rating computation pattern explicit
- Easier to add new rating types

## Effort

Low (1-2 hours)

## Tests Required

- Verify stat values unchanged after refactor
- Add property test: rating + attribute → expected stat
