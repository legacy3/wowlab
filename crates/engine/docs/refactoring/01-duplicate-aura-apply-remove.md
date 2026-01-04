# Issue 01: Duplicate Aura Apply/Remove Methods

## Category

DRY Violation

## Severity

High

## Location

`src/paperdoll/paperdoll.rs:705-813`

## Description

The `apply_aura_effect()` and `remove_aura_effect()` methods are nearly identical (108 lines total), differing only in `+=` vs `-=` operations.

## Current Code

```rust
// Lines 705-758
pub fn apply_aura_effect(&mut self, effect: &AuraStatEffect) {
    match effect {
        AuraStatEffect::FlatAttribute { attr, amount } => {
            match attr {
                Attribute::Strength => self.modifiers.strength_flat += amount,
                Attribute::Agility => self.modifiers.agility_flat += amount,
                Attribute::Intellect => self.modifiers.intellect_flat += amount,
                Attribute::Stamina => self.modifiers.stamina_flat += amount,
            }
            self.invalidate(CacheKey::from(*attr));
        }
        // ... 10+ similar arms
    }
}

// Lines 760-813 - Nearly identical with -= instead of +=
pub fn remove_aura_effect(&mut self, effect: &AuraStatEffect) {
    match effect {
        AuraStatEffect::FlatAttribute { attr, amount } => {
            match attr {
                Attribute::Strength => self.modifiers.strength_flat -= amount,
                // ... identical structure
            }
        }
    }
}
```

## Proposed Fix

```rust
/// Apply or remove an aura effect using a sign multiplier
#[inline]
fn modify_aura_effect(&mut self, effect: &AuraStatEffect, sign: f32) {
    match effect {
        AuraStatEffect::FlatAttribute { attr, amount } => {
            let delta = amount * sign;
            match attr {
                Attribute::Strength => self.modifiers.strength_flat += delta,
                Attribute::Agility => self.modifiers.agility_flat += delta,
                Attribute::Intellect => self.modifiers.intellect_flat += delta,
                Attribute::Stamina => self.modifiers.stamina_flat += delta,
            }
            self.invalidate(CacheKey::from(*attr));
        }
        AuraStatEffect::PercentAttribute { attr, percent } => {
            let delta = percent * sign;
            match attr {
                Attribute::Strength => self.modifiers.strength_pct += delta,
                Attribute::Agility => self.modifiers.agility_pct += delta,
                Attribute::Intellect => self.modifiers.intellect_pct += delta,
                Attribute::Stamina => self.modifiers.stamina_pct += delta,
            }
            self.invalidate(CacheKey::from(*attr));
        }
        AuraStatEffect::FlatAttackPower(amount) => {
            self.modifiers.attack_power_flat += amount * sign;
            self.invalidate(CacheKey::AttackPower);
        }
        AuraStatEffect::PercentAttackPower(percent) => {
            self.modifiers.attack_power_pct += percent * sign;
            self.invalidate(CacheKey::AttackPower);
        }
        AuraStatEffect::DamageDone(percent) => {
            self.modifiers.damage_done_pct += percent * sign;
            self.invalidate(CacheKey::DamageMultiplier);
        }
        AuraStatEffect::DamageTaken(percent) => {
            self.modifiers.damage_taken_pct += percent * sign;
            self.invalidate(CacheKey::DamageTakenMultiplier);
        }
        AuraStatEffect::CritChance(percent) => {
            self.modifiers.crit_chance_flat += percent * sign;
            self.invalidate(CacheKey::CritChance);
        }
        AuraStatEffect::HastePercent(percent) => {
            self.modifiers.haste_pct += percent * sign;
            self.invalidate(CacheKey::HastePercent);
        }
        AuraStatEffect::MasteryPercent(percent) => {
            self.modifiers.mastery_pct += percent * sign;
            self.invalidate(CacheKey::MasteryValue);
        }
        AuraStatEffect::VersatilityPercent(percent) => {
            self.modifiers.versatility_pct += percent * sign;
            self.invalidate(CacheKey::DamageMultiplier);
        }
        AuraStatEffect::PetDamage(percent) => {
            self.modifiers.pet_damage_pct += percent * sign;
            self.invalidate(CacheKey::PetAttackPower);
        }
    }
}

pub fn apply_aura_effect(&mut self, effect: &AuraStatEffect) {
    self.modify_aura_effect(effect, 1.0);
}

pub fn remove_aura_effect(&mut self, effect: &AuraStatEffect) {
    self.modify_aura_effect(effect, -1.0);
}
```

## Impact

- Saves ~50 lines of code
- Single point of maintenance for effect logic
- Reduces risk of apply/remove asymmetry bugs

## Effort

Low (1-2 hours)

## Tests Required

- Existing tests should pass unchanged
- Add test verifying apply then remove returns to baseline
