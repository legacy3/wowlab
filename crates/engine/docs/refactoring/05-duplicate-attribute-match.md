# Issue 05: Duplicate Attribute Match Statements

## Category

DRY Violation

## Severity

Medium

## Location

`src/paperdoll/paperdoll.rs:709-724, 764-779`

## Description

The `apply_aura_effect()` and `remove_aura_effect()` methods contain nested match statements for attributes that repeat the same field access pattern.

## Current Code

```rust
// In apply_aura_effect (lines 709-724)
match attr {
    Attribute::Strength => self.modifiers.strength_flat += amount,
    Attribute::Agility => self.modifiers.agility_flat += amount,
    Attribute::Intellect => self.modifiers.intellect_flat += amount,
    Attribute::Stamina => self.modifiers.stamina_flat += amount,
}

// In remove_aura_effect (lines 764-779) - identical structure
match attr {
    Attribute::Strength => self.modifiers.strength_flat -= amount,
    Attribute::Agility => self.modifiers.agility_flat -= amount,
    Attribute::Intellect => self.modifiers.intellect_flat -= amount,
    Attribute::Stamina => self.modifiers.stamina_flat -= amount,
}

// Also for percent modifiers (lines 718-724, 773-779)
match attr {
    Attribute::Strength => self.modifiers.strength_pct += percent,
    // ...
}
```

## Proposed Fix

Use array-based modifiers instead of individual fields:

```rust
// In ActiveModifiers
pub struct ActiveModifiers {
    /// Flat attribute modifiers indexed by Attribute
    pub attribute_flat: [f32; Attribute::COUNT],
    /// Percent attribute modifiers indexed by Attribute
    pub attribute_pct: [f32; Attribute::COUNT],

    // Other modifiers remain as fields
    pub attack_power_flat: f32,
    pub attack_power_pct: f32,
    pub damage_done_pct: f32,
    // ...
}

impl Default for ActiveModifiers {
    fn default() -> Self {
        Self {
            attribute_flat: [0.0; Attribute::COUNT],
            attribute_pct: [0.0; Attribute::COUNT],
            attack_power_flat: 0.0,
            // ...
        }
    }
}
```

## Usage After Refactor

```rust
// In modify_aura_effect()
AuraStatEffect::FlatAttribute { attr, amount } => {
    self.modifiers.attribute_flat[*attr as usize] += amount * sign;
    self.invalidate(CacheKey::from(*attr));
}
AuraStatEffect::PercentAttribute { attr, percent } => {
    self.modifiers.attribute_pct[*attr as usize] += percent * sign;
    self.invalidate(CacheKey::from(*attr));
}

// In recompute() - also simplifies
let strength = (base.attributes[Attribute::Strength as usize]
    + gear.attributes[Attribute::Strength as usize]
    + self.modifiers.attribute_flat[Attribute::Strength as usize])
    * (1.0 + self.modifiers.attribute_pct[Attribute::Strength as usize] / 100.0);
```

## Alternative: Accessor Methods

If keeping individual fields is preferred:

```rust
impl ActiveModifiers {
    #[inline]
    pub fn flat_mut(&mut self, attr: Attribute) -> &mut f32 {
        match attr {
            Attribute::Strength => &mut self.strength_flat,
            Attribute::Agility => &mut self.agility_flat,
            Attribute::Intellect => &mut self.intellect_flat,
            Attribute::Stamina => &mut self.stamina_flat,
        }
    }

    #[inline]
    pub fn pct_mut(&mut self, attr: Attribute) -> &mut f32 {
        match attr {
            Attribute::Strength => &mut self.strength_pct,
            Attribute::Agility => &mut self.agility_pct,
            Attribute::Intellect => &mut self.intellect_pct,
            Attribute::Stamina => &mut self.stamina_pct,
        }
    }
}

// Usage
*self.modifiers.flat_mut(*attr) += amount * sign;
```

## Impact

- Eliminates 4 repeated match blocks
- Consistent with BaseStats/GearStats array approach
- Enables iteration over all attributes

## Effort

Low (1-2 hours)

## Tests Required

- Verify modifier application unchanged
- Test array bounds (Attribute::COUNT matches array size)
