# Paperdoll & Stats System Implementation Plan

## Executive Summary

This document outlines the implementation plan for a proper paperdoll (character stats) system that supports:

1. Rating-to-percentage conversion with diminishing returns
2. Stat caching for performance
3. Pet stat inheritance from owner
4. Dynamic stat modification from auras/buffs

---

## Current State Analysis

### What We Have

```rust
// Current Stats struct (config/stats.rs)
pub struct Stats {
    // Primary stats (flat values)
    pub intellect: f32,
    pub agility: f32,
    pub strength: f32,
    pub stamina: f32,

    // Secondary stats (ratings - UNUSED)
    pub crit_rating: f32,
    pub haste_rating: f32,
    pub mastery_rating: f32,
    pub versatility_rating: f32,

    // Percentages (loaded directly from config)
    pub crit_pct: f32,
    pub haste_pct: f32,
    pub mastery_pct: f32,
    pub versatility_pct: f32,

    // Precomputed (in finalize())
    pub attack_power: f32,      // agility + strength
    pub ap_normalized: f32,     // attack_power / 14.0
    pub crit_chance: f32,       // crit_pct * 0.01
    pub vers_mult: f32,         // 1.0 + versatility_pct * 0.01
    pub haste_mult: f32,        // 1.0 + haste_pct * 0.01
}
```

### What's Missing

| Feature                     | SimC                    | wowlab                |
| --------------------------- | ----------------------- | --------------------- |
| Rating → % conversion       | ✅ Per-level DBC tables | ❌ Direct percentages |
| Diminishing returns         | ✅ Curve-based DR       | ❌ None               |
| Stat caching                | ✅ Invalidation chains  | ❌ None               |
| Base/initial/current layers | ✅ Three layers         | ❌ Single struct      |
| Aura stat modifiers         | ✅ Full support         | ❌ Defined but unused |
| Pet inheritance             | ✅ owner_coeff system   | ❌ None               |
| Spell power scaling         | ✅ intellect → SP       | ❌ Unused             |
| Mastery effects             | ✅ Spec-specific        | ❌ Unused             |
| Weapon damage               | ✅ Full model           | ❌ Basic              |

---

## Reference: SimC Stat Architecture

### Three-Layer Stat Model

```
base     → Base values from database/defaults
initial  → base + passive + gear + enchants
current  → initial (reset each iteration) + combat buffs
```

### Rating Conversion Flow

```
rating_value
  → / combat_rating(type, level)
  → apply_combat_rating_dr(curve)
  → percentage
```

### Pet Inheritance Model

```cpp
struct owner_coefficients_t {
  double armor = 1.0;
  double health = 1.0;
  double ap_from_ap = 0.0;   // Pet AP from owner AP
  double ap_from_sp = 0.0;   // Pet AP from owner SP
  double sp_from_ap = 0.0;   // Pet SP from owner AP
  double sp_from_sp = 0.0;   // Pet SP from owner SP
};

// Direct inheritance (100%):
// - Crit chance
// - Haste multiplier
// - Versatility
// - Dodge/Parry

// Scaled inheritance:
// - Stamina: 75% (stamina_per_owner)
// - Intellect: 30% (intellect_per_owner)
```

### Hunter Pet Scaling Examples

| Pet Type         | ap_from_ap | Notes               |
| ---------------- | ---------- | ------------------- |
| Main Pet         | 0.60       | Standard stable pet |
| Animal Companion | 0.60       | Talent second pet   |
| Dire Beast       | 1.00       | Full AP scaling     |
| Dark Hound (BM)  | 5.00       | Guardian pet        |
| Fenryr/Hati      | 2.00       | Hero talent summons |

---

## Proposed Architecture

### 1. Core Stat Types

```rust
/// Primary attributes
#[derive(Clone, Copy, Debug)]
pub enum Attribute {
    Strength,
    Agility,
    Intellect,
    Stamina,
}

/// Combat rating types (maps to WoW CR_* constants)
#[derive(Clone, Copy, Debug)]
pub enum RatingType {
    Dodge,
    Parry,
    Block,
    CritMelee,
    CritRanged,
    CritSpell,
    HasteMelee,
    HasteRanged,
    HasteSpell,
    Mastery,
    VersatilityDamage,
    VersatilityHealing,
    VersatilityMitigation,
    Leech,
    Speed,
    Avoidance,
}

/// Derived/computed stat types
#[derive(Clone, Copy, Debug)]
pub enum DerivedStat {
    AttackPower,
    SpellPower,
    MaxHealth,
    Armor,
    CritChance,
    HastePercent,
    MasteryPercent,
    VersatilityPercent,
}
```

### 2. Paperdoll Structure

```rust
/// Combat rating conversion table (per level)
pub struct RatingTable {
    pub level: u8,
    pub dodge: f32,
    pub parry: f32,
    pub block: f32,
    pub crit: f32,
    pub haste: f32,
    pub mastery: f32,
    pub versatility: f32,
    pub leech: f32,
    pub speed: f32,
    pub avoidance: f32,
}

/// Base stats layer (from race/class/level)
#[derive(Clone, Default)]
pub struct BaseStats {
    pub attributes: [f32; 4],  // STR, AGI, INT, STA
    pub health: f32,
    pub base_crit: f32,        // 5% baseline
    pub base_mana: f32,
}

/// Gear/passive stats layer
#[derive(Clone, Default)]
pub struct GearStats {
    pub attributes: [f32; 4],
    pub ratings: [f32; 16],    // All rating types
    pub flat_bonuses: FlatBonuses,
}

#[derive(Clone, Default)]
pub struct FlatBonuses {
    pub attack_power: f32,
    pub spell_power: f32,
    pub armor: f32,
    pub leech_percent: f32,
    pub speed_percent: f32,
}

/// The main paperdoll - owns all stat computation
pub struct Paperdoll {
    // Configuration
    pub level: u8,
    pub class: ClassId,
    pub spec: SpecId,
    pub race: RaceId,

    // Stat layers
    pub base: BaseStats,
    pub gear: GearStats,

    // Rating conversion table (for current level)
    rating_table: RatingTable,

    // Computed stats (cached)
    cache: StatCache,

    // Spec-specific
    pub mastery_coefficient: f32,
    pub primary_stat: Attribute,

    // Conversion coefficients
    pub attack_power_per_strength: f32,
    pub attack_power_per_agility: f32,
    pub spell_power_per_intellect: f32,
    pub health_per_stamina: f32,
    pub crit_per_agility: f32,
    pub crit_per_intellect: f32,
}

/// Cached computed values with invalidation
pub struct StatCache {
    valid: u32,  // Bitflags for which stats are valid

    // Cached values
    strength: f32,
    agility: f32,
    intellect: f32,
    stamina: f32,
    attack_power: f32,
    spell_power: f32,
    crit_chance: f32,
    haste_mult: f32,
    mastery_value: f32,
    versatility_damage: f32,
    versatility_mitigation: f32,
    max_health: f32,
    armor: f32,
}
```

### 3. Pet Stats Structure

```rust
/// Pet stat inheritance coefficients
#[derive(Clone, Copy)]
pub struct PetCoefficients {
    pub armor: f32,
    pub health: f32,
    pub ap_from_ap: f32,
    pub ap_from_sp: f32,
    pub sp_from_ap: f32,
    pub sp_from_sp: f32,
    pub stamina_inherit: f32,    // Default 0.75
    pub intellect_inherit: f32,  // Default 0.30
}

impl Default for PetCoefficients {
    fn default() -> Self {
        Self {
            armor: 1.0,
            health: 1.0,
            ap_from_ap: 0.0,
            ap_from_sp: 0.0,
            sp_from_ap: 0.0,
            sp_from_sp: 0.0,
            stamina_inherit: 0.75,
            intellect_inherit: 0.30,
        }
    }
}

/// Pet type definitions for BM Hunter
pub enum HunterPetType {
    MainPet,           // ap_from_ap = 0.60
    AnimalCompanion,   // ap_from_ap = 0.60
    DireBeast,         // ap_from_ap = 1.00
    CallOfTheWild,     // ap_from_ap = 0.60
    DarkHound,         // ap_from_ap = 5.00 (BM) or 6.05 (other)
}

impl HunterPetType {
    pub fn coefficients(&self) -> PetCoefficients {
        match self {
            Self::MainPet | Self::AnimalCompanion | Self::CallOfTheWild => {
                PetCoefficients {
                    ap_from_ap: 0.60,
                    stamina_inherit: 0.70,
                    ..Default::default()
                }
            }
            Self::DireBeast => PetCoefficients {
                ap_from_ap: 1.00,
                ..Default::default()
            },
            Self::DarkHound => PetCoefficients {
                ap_from_ap: 5.00,
                ..Default::default()
            },
        }
    }
}

/// Pet stats derived from owner
pub struct PetStats {
    pub pet_type: HunterPetType,
    pub coefficients: PetCoefficients,

    // Derived stats (updated from owner)
    pub attack_power: f32,
    pub spell_power: f32,
    pub crit_chance: f32,
    pub haste_mult: f32,
    pub versatility: f32,
    pub max_health: f32,
    pub armor: f32,
}

impl PetStats {
    /// Update pet stats from owner's paperdoll
    pub fn update_from_owner(&mut self, owner: &Paperdoll) {
        let coeff = &self.coefficients;

        // Attack power: from owner AP and/or SP
        self.attack_power =
            owner.cache.attack_power * coeff.ap_from_ap +
            owner.cache.spell_power * coeff.ap_from_sp;

        // Spell power: from owner AP and/or SP
        self.spell_power =
            owner.cache.attack_power * coeff.sp_from_ap +
            owner.cache.spell_power * coeff.sp_from_sp;

        // Direct inheritance (100%)
        self.crit_chance = owner.cache.crit_chance;
        self.haste_mult = owner.cache.haste_mult;
        self.versatility = owner.cache.versatility_damage;

        // Scaled inheritance
        self.max_health = owner.cache.max_health * coeff.health;
        self.armor = owner.cache.armor * coeff.armor;
    }
}
```

### 4. Rating Conversion & DR

```rust
impl Paperdoll {
    /// Convert rating to percentage with diminishing returns
    pub fn rating_to_percent(&self, rating_type: RatingType, rating: f32) -> f32 {
        let base_conversion = rating / self.rating_table.get(rating_type);
        self.apply_diminishing_returns(rating_type, base_conversion)
    }

    /// Apply diminishing returns curve
    fn apply_diminishing_returns(&self, rating_type: RatingType, value: f32) -> f32 {
        // Simplified DR formula (approximates WoW's curve)
        // Real implementation would use DBC curve data
        match rating_type {
            // Secondary stats (crit, haste, mastery, vers)
            RatingType::CritMelee | RatingType::CritSpell |
            RatingType::HasteMelee | RatingType::HasteSpell |
            RatingType::Mastery | RatingType::VersatilityDamage => {
                // DR curve: diminishes heavily above ~30%
                let x = value * 100.0;
                if x <= 0.0 { return 0.0; }
                // Approximation: y = x / (1 + x/k) where k ~= 66
                (x / (1.0 + x / 66.0)) / 100.0
            }

            // Tertiary stats (leech, speed, avoidance)
            RatingType::Leech | RatingType::Speed | RatingType::Avoidance => {
                // Heavier DR, capped around 10-15%
                let x = value * 100.0;
                if x <= 0.0 { return 0.0; }
                (x / (1.0 + x / 20.0)) / 100.0
            }

            // Versatility mitigation (half of damage vers)
            RatingType::VersatilityMitigation => {
                self.apply_diminishing_returns(RatingType::VersatilityDamage, value) / 2.0
            }

            _ => value,
        }
    }

    /// Recompute all cached stats
    pub fn recompute(&mut self) {
        // Attributes (base + gear)
        let str = self.base.attributes[0] + self.gear.attributes[0];
        let agi = self.base.attributes[1] + self.gear.attributes[1];
        let int = self.base.attributes[2] + self.gear.attributes[2];
        let sta = self.base.attributes[3] + self.gear.attributes[3];

        self.cache.strength = str;
        self.cache.agility = agi;
        self.cache.intellect = int;
        self.cache.stamina = sta;

        // Attack Power
        self.cache.attack_power =
            str * self.attack_power_per_strength +
            agi * self.attack_power_per_agility +
            self.gear.flat_bonuses.attack_power;

        // Spell Power
        self.cache.spell_power =
            int * self.spell_power_per_intellect +
            self.gear.flat_bonuses.spell_power;

        // Crit (base + rating + per-stat bonus)
        let crit_from_rating = self.rating_to_percent(
            RatingType::CritMelee,
            self.gear.ratings[RatingType::CritMelee as usize]
        );
        let crit_from_agi = agi * self.crit_per_agility / 100.0;
        self.cache.crit_chance = self.base.base_crit + crit_from_rating + crit_from_agi;

        // Haste
        let haste_pct = self.rating_to_percent(
            RatingType::HasteMelee,
            self.gear.ratings[RatingType::HasteMelee as usize]
        );
        self.cache.haste_mult = 1.0 / (1.0 - haste_pct);

        // Mastery
        let mastery_pct = self.rating_to_percent(
            RatingType::Mastery,
            self.gear.ratings[RatingType::Mastery as usize]
        );
        self.cache.mastery_value = mastery_pct * self.mastery_coefficient;

        // Versatility
        let vers_pct = self.rating_to_percent(
            RatingType::VersatilityDamage,
            self.gear.ratings[RatingType::VersatilityDamage as usize]
        );
        self.cache.versatility_damage = vers_pct;
        self.cache.versatility_mitigation = vers_pct / 2.0;

        // Health
        self.cache.max_health = self.base.health + sta * self.health_per_stamina;

        // Armor
        self.cache.armor = self.gear.flat_bonuses.armor;

        self.cache.valid = u32::MAX; // All valid
    }
}
```

### 5. Integration with Simulation

```rust
/// Updated UnitState to use Paperdoll
pub struct UnitState {
    pub paperdoll: Paperdoll,
    pub resources: Resources,
    pub auras: AuraTracker,
    // ... rest unchanged
}

/// Pet state with owner reference
pub struct PetState {
    pub pet_stats: PetStats,
    pub resources: Resources,  // Pet focus
    pub auras: AuraTracker,
    pub next_attack_time: u32,
}

impl PetState {
    pub fn update_from_owner(&mut self, owner: &Paperdoll) {
        self.pet_stats.update_from_owner(owner);
    }
}
```

---

## Implementation Phases

### Phase 1: Core Paperdoll Structure

- [ ] Create `paperdoll.rs` module with types
- [ ] Implement `Paperdoll` struct with base/gear layers
- [ ] Implement `StatCache` with recompute logic
- [ ] Add rating conversion (without DR initially)
- [ ] Unit tests for stat calculations

### Phase 2: Rating Tables & DR

- [ ] Create rating table data for levels 70-80
- [ ] Implement diminishing returns curves
- [ ] Add level-based scaling
- [ ] Verify against SimC reference values

### Phase 3: Pet Inheritance

- [ ] Create `PetStats` and `PetCoefficients`
- [ ] Implement `update_from_owner()`
- [ ] Add hunter pet type definitions
- [ ] Integrate with simulation loop

### Phase 4: Aura Stat Modifiers

- [ ] Implement `FlatStat` aura effect
- [ ] Implement `PercentStat` aura effect
- [ ] Add stat invalidation on aura apply/remove
- [ ] Test with Bestial Wrath (+25% damage)

### Phase 5: Config & Migration

- [ ] Update TOML schema for new stat system
- [ ] Support both rating and percentage input
- [ ] Migrate beast-mastery.toml to new format
- [ ] Update CLI argument handling

---

## File Structure

```
crates/engine/src/
├── config/
│   ├── stats.rs          # DEPRECATED - migrate to paperdoll
│   └── sim_config.rs     # Update to use Paperdoll
├── paperdoll/
│   ├── mod.rs            # Module exports
│   ├── types.rs          # Enums and basic types
│   ├── paperdoll.rs      # Main Paperdoll struct
│   ├── cache.rs          # StatCache implementation
│   ├── rating.rs         # Rating tables and conversion
│   ├── dr.rs             # Diminishing returns
│   └── pet.rs            # Pet stat inheritance
├── sim/
│   ├── state.rs          # Update UnitState
│   └── engine.rs         # Update damage calcs
```

---

## Key Formulas Reference

### Attack Power

```
AP = (STR * ap_per_str) + (AGI * ap_per_agi) + flat_ap
```

### Spell Power

```
SP = (INT * sp_per_int) + flat_sp
```

### Crit Chance

```
crit = base_crit + rating_to_pct(crit_rating) + (AGI / crit_per_agi)
```

### Haste Multiplier

```
haste_pct = rating_to_pct(haste_rating)
haste_mult = 1 / (1 - haste_pct)  // For cast time reduction
```

### Pet Attack Power

```
pet_ap = owner_ap * coeff.ap_from_ap + owner_sp * coeff.ap_from_sp
```

### Rating to Percentage (Level 80)

```
crit_pct = crit_rating / 700
haste_pct = haste_rating / 502.1
mastery_pct = mastery_rating / 700
vers_pct = vers_rating / 700
```

---

## Testing Strategy

1. **Unit Tests**: Verify individual stat calculations
2. **Snapshot Tests**: Compare output against SimC for same input
3. **Integration Tests**: Full simulation with paperdoll
4. **Pet Tests**: Verify inheritance coefficients

---

## Open Questions

1. **Item Level Scaling**: Do we need ilvl → stat conversion or just accept final stats?
2. **Aura Snapshots**: When should stat buffs snapshot for DoTs?
3. **Stat Caps**: Are there any hard caps we need to enforce?
4. **Racial Bonuses**: Include race-specific stat bonuses?
