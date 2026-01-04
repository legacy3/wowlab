# Phase 03: Stats

## Goal

Create the stat system: primary/secondary attributes, rating conversions, stat cache, class coefficients.

## Prerequisites

Phase 02 complete. `cargo test -p engine_new` passes (18 tests).

## Files to Create

```
src/
├── lib.rs              # Add: pub mod stats;
└── stats/
    ├── mod.rs
    ├── attributes.rs
    ├── ratings.rs
    ├── combat.rs
    ├── cache.rs
    ├── modifiers.rs
    ├── coefficients.rs
    └── scaling.rs
```

## Specifications

### Update `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
pub mod core;
pub mod stats;
```

### `src/stats/mod.rs`

```rust
mod attributes;
mod ratings;
mod combat;
mod cache;
mod modifiers;
mod coefficients;
mod scaling;

pub use attributes::*;
pub use ratings::*;
pub use combat::*;
pub use cache::*;
pub use modifiers::*;
pub use coefficients::*;
pub use scaling::*;

#[cfg(test)]
mod tests;
```

### `src/stats/attributes.rs`

```rust
use crate::types::{Attribute, SpecId};

/// Primary stat values
#[derive(Clone, Debug, Default)]
pub struct PrimaryStats {
    pub strength: f32,
    pub agility: f32,
    pub intellect: f32,
    pub stamina: f32,
}

impl PrimaryStats {
    pub fn get(&self, attr: Attribute) -> f32 {
        match attr {
            Attribute::Strength => self.strength,
            Attribute::Agility => self.agility,
            Attribute::Intellect => self.intellect,
            Attribute::Stamina => self.stamina,
        }
    }

    pub fn set(&mut self, attr: Attribute, value: f32) {
        match attr {
            Attribute::Strength => self.strength = value,
            Attribute::Agility => self.agility = value,
            Attribute::Intellect => self.intellect = value,
            Attribute::Stamina => self.stamina = value,
        }
    }

    pub fn add(&mut self, attr: Attribute, value: f32) {
        match attr {
            Attribute::Strength => self.strength += value,
            Attribute::Agility => self.agility += value,
            Attribute::Intellect => self.intellect += value,
            Attribute::Stamina => self.stamina += value,
        }
    }
}

/// Get the primary stat for a spec
pub fn primary_stat_for_spec(spec: SpecId) -> Attribute {
    use SpecId::*;
    match spec {
        // Agility specs
        BeastMastery | Marksmanship | Survival |
        Assassination | Outlaw | Subtlety |
        Feral | Guardian |
        Brewmaster | Windwalker |
        Havoc | Vengeance => Attribute::Agility,

        // Strength specs
        Arms | Fury | ProtWarrior |
        HolyPaladin | ProtPaladin | Retribution |
        Blood | FrostDK | Unholy => Attribute::Strength,

        // Intellect specs
        Discipline | HolyPriest | Shadow |
        Elemental | Enhancement | RestoShaman |
        Arcane | Fire | FrostMage |
        Affliction | Demonology | Destruction |
        Mistweaver |
        Balance | RestoDruid |
        Devastation | Preservation | Augmentation => Attribute::Intellect,
    }
}
```

### `src/stats/ratings.rs`

```rust
use crate::types::RatingType;

/// Rating values (raw numbers from gear)
#[derive(Clone, Debug, Default)]
pub struct Ratings {
    pub crit: f32,
    pub haste: f32,
    pub mastery: f32,
    pub versatility: f32,
    pub leech: f32,
    pub avoidance: f32,
    pub speed: f32,
}

impl Ratings {
    pub fn get(&self, rating: RatingType) -> f32 {
        match rating {
            RatingType::Crit => self.crit,
            RatingType::Haste => self.haste,
            RatingType::Mastery => self.mastery,
            RatingType::Versatility => self.versatility,
            RatingType::Leech => self.leech,
            RatingType::Avoidance => self.avoidance,
            RatingType::Speed => self.speed,
        }
    }

    pub fn set(&mut self, rating: RatingType, value: f32) {
        match rating {
            RatingType::Crit => self.crit = value,
            RatingType::Haste => self.haste = value,
            RatingType::Mastery => self.mastery = value,
            RatingType::Versatility => self.versatility = value,
            RatingType::Leech => self.leech = value,
            RatingType::Avoidance => self.avoidance = value,
            RatingType::Speed => self.speed = value,
        }
    }

    pub fn add(&mut self, rating: RatingType, value: f32) {
        match rating {
            RatingType::Crit => self.crit += value,
            RatingType::Haste => self.haste += value,
            RatingType::Mastery => self.mastery += value,
            RatingType::Versatility => self.versatility += value,
            RatingType::Leech => self.leech += value,
            RatingType::Avoidance => self.avoidance += value,
            RatingType::Speed => self.speed += value,
        }
    }
}

/// Rating to percentage conversion at level 80
/// Uses diminishing returns formula: pct = base_pct * (1 - (1 - C) ^ (rating / base_rating))
const BASE_RATING_80: f32 = 180.0;

/// Convert rating to percentage (with DR)
pub fn rating_to_percent(rating: f32, rating_type: RatingType) -> f32 {
    let base_pct = base_percent_per_point(rating_type);
    let raw = rating * base_pct / BASE_RATING_80;

    // Apply diminishing returns
    apply_diminishing_returns(raw, rating_type)
}

fn base_percent_per_point(rating_type: RatingType) -> f32 {
    match rating_type {
        RatingType::Crit => 1.0,
        RatingType::Haste => 1.0,
        RatingType::Mastery => 1.0, // Multiplied by spec coefficient
        RatingType::Versatility => 1.0, // Damage/healing, half for DR
        RatingType::Leech => 1.0,
        RatingType::Avoidance => 1.0,
        RatingType::Speed => 1.0,
    }
}

/// Diminishing returns formula
fn apply_diminishing_returns(raw_pct: f32, rating_type: RatingType) -> f32 {
    // DR thresholds and coefficients
    let (threshold, coeff) = match rating_type {
        RatingType::Crit | RatingType::Haste | RatingType::Versatility => (30.0, 0.4),
        RatingType::Mastery => (30.0, 0.4),
        _ => return raw_pct, // No DR for tertiary
    };

    if raw_pct <= threshold {
        raw_pct
    } else {
        let over = raw_pct - threshold;
        threshold + over * coeff / (1.0 + over * coeff / 100.0)
    }
}
```

### `src/stats/combat.rs`

```rust
/// Combat stats (percentages, ready to use)
#[derive(Clone, Debug, Default)]
pub struct CombatStats {
    /// Crit chance (0.0 to 1.0+)
    pub crit_chance: f32,
    /// Haste multiplier (1.0 = no haste, 1.3 = 30% haste)
    pub haste: f32,
    /// Mastery percentage (spec-specific interpretation)
    pub mastery: f32,
    /// Versatility damage/healing bonus (0.0 to 0.x)
    pub versatility_damage: f32,
    /// Versatility damage reduction (half of damage bonus)
    pub versatility_dr: f32,
    /// Attack power
    pub attack_power: f32,
    /// Spell power
    pub spell_power: f32,
    /// Weapon DPS (for melee calculations)
    pub weapon_dps: f32,
}

impl CombatStats {
    /// Base crit chance (5% for all specs)
    pub const BASE_CRIT: f32 = 0.05;
    /// Base haste (1.0 = no haste)
    pub const BASE_HASTE: f32 = 1.0;
}
```

### `src/stats/cache.rs`

```rust
use super::{PrimaryStats, Ratings, CombatStats};
use crate::types::SpecId;

/// Cached stat calculations to avoid recomputation
#[derive(Clone, Debug)]
pub struct StatCache {
    /// Primary stats (str/agi/int/stam)
    pub primary: PrimaryStats,
    /// Rating values
    pub ratings: Ratings,
    /// Computed combat stats
    pub combat: CombatStats,
    /// Spec (for mastery interpretation)
    pub spec: SpecId,
    /// Is cache valid?
    dirty: bool,
}

impl StatCache {
    pub fn new(spec: SpecId) -> Self {
        Self {
            primary: PrimaryStats::default(),
            ratings: Ratings::default(),
            combat: CombatStats::default(),
            spec,
            dirty: true,
        }
    }

    /// Mark cache as needing recalculation
    pub fn invalidate(&mut self) {
        self.dirty = true;
    }

    /// Recalculate if dirty
    pub fn update(&mut self, mastery_coeff: f32) {
        if !self.dirty {
            return;
        }

        self.compute_combat_stats(mastery_coeff);
        self.dirty = false;
    }

    fn compute_combat_stats(&mut self, mastery_coeff: f32) {
        use super::ratings::rating_to_percent;
        use super::attributes::primary_stat_for_spec;
        use crate::types::RatingType;

        // Get primary stat for this spec
        let primary = self.primary.get(primary_stat_for_spec(self.spec));

        // Attack power / spell power from primary stat
        // Most specs: 1 primary = 1 AP/SP
        self.combat.attack_power = primary;
        self.combat.spell_power = primary;

        // Crit: base + rating
        let crit_from_rating = rating_to_percent(self.ratings.crit, RatingType::Crit);
        self.combat.crit_chance = CombatStats::BASE_CRIT + crit_from_rating / 100.0;

        // Haste: multiplicative
        let haste_pct = rating_to_percent(self.ratings.haste, RatingType::Haste);
        self.combat.haste = 1.0 + haste_pct / 100.0;

        // Mastery: spec coefficient matters
        let mastery_from_rating = rating_to_percent(self.ratings.mastery, RatingType::Mastery);
        self.combat.mastery = mastery_from_rating * mastery_coeff;

        // Versatility
        let vers_pct = rating_to_percent(self.ratings.versatility, RatingType::Versatility);
        self.combat.versatility_damage = vers_pct / 100.0;
        self.combat.versatility_dr = vers_pct / 200.0; // Half for DR
    }

    // Convenience getters that ensure cache is fresh
    #[inline]
    pub fn crit_chance(&self) -> f32 {
        self.combat.crit_chance
    }

    #[inline]
    pub fn haste(&self) -> f32 {
        self.combat.haste
    }

    #[inline]
    pub fn mastery(&self) -> f32 {
        self.combat.mastery
    }

    #[inline]
    pub fn attack_power(&self) -> f32 {
        self.combat.attack_power
    }

    #[inline]
    pub fn spell_power(&self) -> f32 {
        self.combat.spell_power
    }

    #[inline]
    pub fn versatility(&self) -> f32 {
        self.combat.versatility_damage
    }
}
```

### `src/stats/modifiers.rs`

```rust
use crate::types::{Attribute, RatingType, DamageSchool};

/// A stat modifier from a buff/aura
#[derive(Clone, Debug)]
pub enum StatModifier {
    /// Flat addition to primary stat
    PrimaryFlat { attr: Attribute, amount: f32 },
    /// Percentage increase to primary stat
    PrimaryMult { attr: Attribute, pct: f32 },
    /// Flat addition to rating
    RatingFlat { rating: RatingType, amount: f32 },
    /// Percentage increase to rating
    RatingMult { rating: RatingType, pct: f32 },
    /// Flat attack power
    AttackPowerFlat(f32),
    /// Percentage attack power
    AttackPowerMult(f32),
    /// Flat spell power
    SpellPowerFlat(f32),
    /// Percentage spell power
    SpellPowerMult(f32),
    /// Damage multiplier (all)
    DamageMult(f32),
    /// Damage multiplier (school-specific)
    SchoolDamageMult { school: DamageSchool, pct: f32 },
    /// Haste multiplier (stacks multiplicatively)
    HasteMult(f32),
    /// Crit damage multiplier
    CritDamageMult(f32),
}

/// Collection of active stat modifiers
#[derive(Clone, Debug, Default)]
pub struct ModifierStack {
    pub modifiers: Vec<StatModifier>,
}

impl ModifierStack {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add(&mut self, modifier: StatModifier) {
        self.modifiers.push(modifier);
    }

    pub fn clear(&mut self) {
        self.modifiers.clear();
    }

    /// Get total damage multiplier
    pub fn damage_mult(&self, school: DamageSchool) -> f32 {
        let mut mult = 1.0;
        for m in &self.modifiers {
            match m {
                StatModifier::DamageMult(pct) => mult *= 1.0 + pct,
                StatModifier::SchoolDamageMult { school: s, pct } if *s == school => {
                    mult *= 1.0 + pct;
                }
                _ => {}
            }
        }
        mult
    }

    /// Get total haste multiplier
    pub fn haste_mult(&self) -> f32 {
        let mut mult = 1.0;
        for m in &self.modifiers {
            if let StatModifier::HasteMult(pct) = m {
                mult *= 1.0 + pct;
            }
        }
        mult
    }
}
```

### `src/stats/coefficients.rs`

```rust
use crate::types::{SpecId, MasteryEffect};

/// Class/spec coefficients for stat calculations
#[derive(Clone, Debug)]
pub struct SpecCoefficients {
    /// Mastery base value (before any rating)
    pub mastery_base: f32,
    /// Mastery coefficient (how much % per point)
    pub mastery_coeff: f32,
    /// How mastery affects damage
    pub mastery_effect: MasteryEffect,
    /// Haste affects DoT tick rate
    pub haste_affects_dots: bool,
    /// Haste affects cooldowns
    pub haste_affects_cooldowns: bool,
}

impl SpecCoefficients {
    pub fn for_spec(spec: SpecId) -> Self {
        use SpecId::*;
        use MasteryEffect::*;

        match spec {
            BeastMastery => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: PetAndOwnerDamage { owner_pct: 0.0 },
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Marksmanship => Self {
                mastery_base: 10.0,
                mastery_coeff: 1.25,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Survival => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            Fury => Self {
                mastery_base: 16.0,
                mastery_coeff: 2.0,
                mastery_effect: AllDamage,
                haste_affects_dots: false,
                haste_affects_cooldowns: false,
            },
            Arms => Self {
                mastery_base: 20.0,
                mastery_coeff: 2.5,
                mastery_effect: DotDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
            // Add more specs as needed...
            _ => Self {
                mastery_base: 8.0,
                mastery_coeff: 1.0,
                mastery_effect: AllDamage,
                haste_affects_dots: true,
                haste_affects_cooldowns: false,
            },
        }
    }
}
```

### `src/stats/scaling.rs`

```rust
/// Item level to stat scaling
pub struct ItemLevelScaling;

impl ItemLevelScaling {
    /// Base item level for current tier
    pub const BASE_ILVL: u32 = 623;

    /// Primary stat per item level
    pub fn primary_per_ilvl(ilvl: u32) -> f32 {
        // Approximate scaling, adjust based on actual values
        let base = 2000.0;
        let per_level = 40.0;
        base + (ilvl.saturating_sub(Self::BASE_ILVL) as f32) * per_level
    }

    /// Weapon DPS per item level
    pub fn weapon_dps(ilvl: u32, weapon_speed: f32) -> f32 {
        let base_dps = 100.0 + (ilvl.saturating_sub(Self::BASE_ILVL) as f32) * 5.0;
        base_dps * weapon_speed / 2.6 // Normalize to 2.6 speed
    }
}
```

### `src/stats/tests.rs`

```rust
use super::*;
use crate::types::*;

#[test]
fn primary_stats_access() {
    let mut stats = PrimaryStats::default();
    stats.set(Attribute::Agility, 5000.0);
    assert_eq!(stats.get(Attribute::Agility), 5000.0);

    stats.add(Attribute::Agility, 500.0);
    assert_eq!(stats.get(Attribute::Agility), 5500.0);
}

#[test]
fn ratings_access() {
    let mut ratings = Ratings::default();
    ratings.set(RatingType::Crit, 1000.0);
    assert_eq!(ratings.get(RatingType::Crit), 1000.0);
}

#[test]
fn rating_conversion() {
    let pct = rating_to_percent(180.0, RatingType::Crit);
    // At base rating, should be ~1%
    assert!(pct > 0.9 && pct < 1.1);
}

#[test]
fn rating_dr() {
    // High rating should have diminishing returns
    let low = rating_to_percent(1000.0, RatingType::Crit);
    let high = rating_to_percent(5000.0, RatingType::Crit);

    // High shouldn't be 5x the low due to DR
    assert!(high < low * 4.0);
}

#[test]
fn stat_cache_computation() {
    let mut cache = StatCache::new(SpecId::BeastMastery);
    cache.primary.agility = 5000.0;
    cache.ratings.crit = 500.0;
    cache.ratings.haste = 300.0;
    cache.invalidate();
    cache.update(2.0); // BM mastery coefficient

    assert!(cache.attack_power() > 0.0);
    assert!(cache.crit_chance() > 0.05); // More than base
    assert!(cache.haste() > 1.0); // More than base
}

#[test]
fn modifier_stack() {
    let mut stack = ModifierStack::new();
    stack.add(StatModifier::DamageMult(0.10)); // +10%
    stack.add(StatModifier::DamageMult(0.05)); // +5%

    let mult = stack.damage_mult(DamageSchool::Physical);
    // 1.10 * 1.05 = 1.155
    assert!((mult - 1.155).abs() < 0.001);
}

#[test]
fn spec_coefficients() {
    let coeff = SpecCoefficients::for_spec(SpecId::BeastMastery);
    assert_eq!(coeff.mastery_coeff, 2.0);
    assert!(matches!(coeff.mastery_effect, MasteryEffect::PetAndOwnerDamage { .. }));
}

#[test]
fn primary_stat_for_spec_check() {
    assert_eq!(primary_stat_for_spec(SpecId::BeastMastery), Attribute::Agility);
    assert_eq!(primary_stat_for_spec(SpecId::Fury), Attribute::Strength);
    assert_eq!(primary_stat_for_spec(SpecId::Fire), Attribute::Intellect);
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo test
```

Expected: All tests pass (18 + 8 = 26 tests).

## Todo Checklist

- [ ] Update `src/lib.rs` to add `pub mod stats;`
- [ ] Create `src/stats/mod.rs`
- [ ] Create `src/stats/attributes.rs`
- [ ] Create `src/stats/ratings.rs`
- [ ] Create `src/stats/combat.rs`
- [ ] Create `src/stats/cache.rs`
- [ ] Create `src/stats/modifiers.rs`
- [ ] Create `src/stats/coefficients.rs`
- [ ] Create `src/stats/scaling.rs`
- [ ] Create `src/stats/tests.rs`
- [ ] Run `cargo test` — 26 tests pass
- [ ] Run `cargo build --release` — success
