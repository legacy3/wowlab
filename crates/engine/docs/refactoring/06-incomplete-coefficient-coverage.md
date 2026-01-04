# Issue 06: Incomplete Coefficient Coverage

## Category

Architecture Gap

## Severity

Critical

## Location

`src/paperdoll/coefficients.rs:145-155`

## Description

Only 3 Hunter specs have coefficient implementations. All other classes/specs fallback to Beast Mastery coefficients, causing incorrect stat scaling.

## Current Code

```rust
pub fn from_spec(spec: SpecId) -> ClassCoefficients {
    match spec {
        SpecId::BeastMastery => ClassCoefficients::beast_mastery(),
        SpecId::Marksmanship => ClassCoefficients::marksmanship(),
        SpecId::Survival => ClassCoefficients::survival(),
        _ => ClassCoefficients::default(),  // Falls back to BM!
    }
}
```

## Impact

| Class   | Specs            | Primary Stat | Current         | Actual              |
| ------- | ---------------- | ------------ | --------------- | ------------------- |
| Warrior | Arms, Fury, Prot | Strength     | Agility (wrong) | Strength            |
| Paladin | Holy, Prot, Ret  | Str/Int      | Agility (wrong) | Str/Int             |
| Rogue   | All 3            | Agility      | Agility         | Correct by accident |
| Priest  | All 3            | Intellect    | Agility (wrong) | Intellect           |
| Mage    | All 3            | Intellect    | Agility (wrong) | Intellect           |
| Warlock | All 3            | Intellect    | Agility (wrong) | Intellect           |
| ...     | ...              | ...          | ...             | ...                 |

## Proposed Fix

### Phase 1: Class Base Templates

```rust
impl ClassCoefficients {
    /// Base template for Agility classes (Hunter, Rogue, some Druids)
    fn agility_base() -> Self {
        Self {
            ap_per_agility: 1.0,
            ap_per_strength: 0.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
            can_dual_wield: true,
            crit_per_agility: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0,
        }
    }

    /// Base template for Strength classes (Warrior, DK, Paladin Ret/Prot)
    fn strength_base() -> Self {
        Self {
            ap_per_agility: 0.0,
            ap_per_strength: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            primary_stat: Attribute::Strength,
            uses_spell_power: false,
            can_parry: true,
            can_block: false,
            can_dual_wield: false,
            crit_per_agility: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 951.158596,
            mastery_coefficient: 1.0,
        }
    }

    /// Base template for Intellect casters
    fn intellect_base() -> Self {
        Self {
            ap_per_agility: 0.0,
            ap_per_strength: 0.0,
            sp_per_intellect: 1.0,
            health_per_stamina: 20.0,
            primary_stat: Attribute::Intellect,
            uses_spell_power: true,
            can_parry: false,
            can_block: false,
            can_dual_wield: false,
            crit_per_agility: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0,
        }
    }
}
```

### Phase 2: Spec-Specific Overrides

```rust
impl ClassCoefficients {
    // ========== HUNTER ==========
    pub fn beast_mastery() -> Self {
        Self::agility_base().with_mastery(1.0) // Master of Beasts
    }

    pub fn marksmanship() -> Self {
        Self::agility_base().with_mastery(0.625) // Sniper Training
    }

    pub fn survival() -> Self {
        Self::agility_base().with_mastery(0.85) // Spirit Bond
    }

    // ========== WARRIOR ==========
    pub fn arms() -> Self {
        Self::strength_base()
            .with_mastery(1.1) // Deep Wounds
            .with_dual_wield(false)
    }

    pub fn fury() -> Self {
        Self::strength_base()
            .with_mastery(1.4) // Unshackled Fury
            .with_dual_wield(true)
    }

    pub fn protection_warrior() -> Self {
        Self::strength_base()
            .with_mastery(1.5) // Critical Block
            .with_block(true)
    }

    // ========== MAGE ==========
    pub fn arcane() -> Self {
        Self::intellect_base().with_mastery(0.6) // Savant
    }

    pub fn fire() -> Self {
        Self::intellect_base().with_mastery(0.75) // Ignite
    }

    pub fn frost_mage() -> Self {
        Self::intellect_base().with_mastery(2.25) // Icicles
    }

    // ... continue for all 38 specs
}
```

### Phase 3: Builder Methods

```rust
impl ClassCoefficients {
    fn with_mastery(mut self, coeff: f32) -> Self {
        self.mastery_coefficient = coeff;
        self
    }

    fn with_block(mut self, can_block: bool) -> Self {
        self.can_block = can_block;
        self
    }

    fn with_dual_wield(mut self, can_dw: bool) -> Self {
        self.can_dual_wield = can_dw;
        self
    }

    fn with_parry_per_str(mut self, per_str: f32) -> Self {
        self.parry_per_strength = per_str;
        self
    }
}
```

### Phase 4: Comprehensive Match

```rust
pub fn from_spec(spec: SpecId) -> ClassCoefficients {
    match spec {
        // Hunter
        SpecId::BeastMastery => Self::beast_mastery(),
        SpecId::Marksmanship => Self::marksmanship(),
        SpecId::Survival => Self::survival(),

        // Warrior
        SpecId::Arms => Self::arms(),
        SpecId::Fury => Self::fury(),
        SpecId::ProtectionWarrior => Self::protection_warrior(),

        // Mage
        SpecId::Arcane => Self::arcane(),
        SpecId::Fire => Self::fire(),
        SpecId::FrostMage => Self::frost_mage(),

        // Death Knight
        SpecId::Blood => Self::blood(),
        SpecId::FrostDK => Self::frost_dk(),
        SpecId::Unholy => Self::unholy(),

        // ... all 38 specs

        // Fallback with warning
        _ => {
            #[cfg(debug_assertions)]
            eprintln!("Warning: Unknown spec {:?}, using default coefficients", spec);
            Self::default()
        }
    }
}
```

## Data Sources

Mastery coefficients can be extracted from:

- SimC source: `engine/class_modules/*.cpp`
- Wowhead spell data
- In-game tooltip inspection

## Impact

- Enables accurate simulation for all classes
- Foundation for multi-class support
- Proper mastery scaling per spec

## Effort

Medium-High (8-16 hours to implement all 38 specs)

## Tests Required

- Unit test each spec's coefficients against known values
- Compare sim output to SimC for validation
