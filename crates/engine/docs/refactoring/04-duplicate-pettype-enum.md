# Issue 04: Duplicate PetType Enum Definitions

## Category

DRY Violation

## Severity

High

## Locations

1. `src/paperdoll/types.rs:569-646` - 51 variants, detailed
2. `src/paperdoll/pet.rs:17-44` - 16 variants, simplified

## Description

Two separate `PetType` enum definitions exist with overlapping but different variants. This creates maintenance burden and potential sync issues.

## Current Code

```rust
// types.rs - 51 variants
pub enum PetType {
    // Hunter pets
    HunterMainPet,
    HunterAnimalCompanion,
    HunterDireBeast,
    HunterDireBeastBasilisk,
    HunterDireBeastFalcon,
    // ... 20+ more hunter variants

    // Warlock pets
    WarlockImp,
    WarlockVoidwalker,
    WarlockSuccubus,
    WarlockFelhunter,
    WarlockFelguard,
    // ... more warlock

    // DK pets
    DKGhoul,
    DKArmyGhoul,
    DKMagus,
    DKAbomination,
    // ... more DK

    // Other
    MageMirrorImage,
    ShamanFireElemental,
    // ...
}

// pet.rs - 16 variants (subset)
pub enum PetType {
    HunterPet,
    AnimalCompanion,
    DireBeast,
    DireBeastHawk,
    DireBeastBasilisk,
    CallOfTheWild,
    // ...
}
```

## Proposed Fix

Keep single comprehensive enum in `types.rs`, remove duplicate from `pet.rs`:

```rust
// types.rs - Single source of truth
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum PetType {
    // Hunter - Main
    HunterMainPet = 0,
    HunterAnimalCompanion = 1,

    // Hunter - Summoned
    HunterDireBeast = 10,
    HunterDireBeastBasilisk = 11,
    HunterDireBeastFalcon = 12,
    HunterCallOfTheWild = 20,

    // Warlock - Permanent
    WarlockImp = 30,
    WarlockVoidwalker = 31,
    WarlockSuccubus = 32,
    WarlockFelhunter = 33,
    WarlockFelguard = 34,

    // Warlock - Summoned
    WarlockDarkglare = 40,
    WarlockDemonicTyrant = 41,
    WarlockInfernal = 42,

    // Death Knight
    DKGhoul = 50,
    DKArmyGhoul = 51,
    DKMagus = 52,
    DKAbomination = 53,
    DKGargoyle = 54,

    // Other Classes
    MageMirrorImage = 60,
    ShamanFireElemental = 70,
    ShamanStormElemental = 71,
    ShamanEarthElemental = 72,
    MonkXuenTheWhiteTiger = 80,
    PriestShadowfiend = 90,
}

impl PetType {
    /// Returns true if this is a Hunter class pet
    pub const fn is_hunter_pet(&self) -> bool {
        (*self as u8) < 30
    }

    /// Returns true if this is a Warlock class pet
    pub const fn is_warlock_pet(&self) -> bool {
        let v = *self as u8;
        v >= 30 && v < 50
    }

    /// Returns true if this is a Death Knight pet
    pub const fn is_dk_pet(&self) -> bool {
        let v = *self as u8;
        v >= 50 && v < 60
    }

    /// Returns the class that owns this pet type
    pub const fn owner_class(&self) -> ClassId {
        match *self as u8 {
            0..=29 => ClassId::Hunter,
            30..=49 => ClassId::Warlock,
            50..=59 => ClassId::DeathKnight,
            60..=69 => ClassId::Mage,
            70..=79 => ClassId::Shaman,
            80..=89 => ClassId::Monk,
            90..=99 => ClassId::Priest,
            _ => ClassId::Hunter, // fallback
        }
    }

    /// Returns true if this is a permanent pet (vs summoned)
    pub const fn is_permanent(&self) -> bool {
        matches!(
            self,
            PetType::HunterMainPet
                | PetType::WarlockImp
                | PetType::WarlockVoidwalker
                | PetType::WarlockSuccubus
                | PetType::WarlockFelhunter
                | PetType::WarlockFelguard
                | PetType::DKGhoul
        )
    }
}
```

## Migration

1. Delete `PetType` enum from `pet.rs`
2. Update imports in `pet.rs`: `use super::types::PetType;`
3. Map old variant names to new:
   - `HunterPet` → `HunterMainPet`
   - `AnimalCompanion` → `HunterAnimalCompanion`
   - `DireBeast` → `HunterDireBeast`
   - etc.

## Impact

- Single source of truth for pet types
- Range-based class checks (efficient)
- No sync issues between modules

## Effort

Low (2-3 hours)

## Tests Required

- Verify all pet type references compile
- Test `is_*_pet()` methods
- Test `owner_class()` method
