# Phase 01: Types

## Goal

Create all foundational type definitions. Every other module imports from `types/`.

## Prerequisites

```bash
cd /Users/user/Source/wowlab
mkdir -p crates/engine_new/src/types
cd crates/engine_new
cargo init --lib --name engine_new
```

## Files to Create

```
crates/engine_new/
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── prelude.rs
    └── types/
        ├── mod.rs
        ├── idx.rs
        ├── time.rs
        ├── resource.rs
        ├── class.rs
        ├── attribute.rs
        ├── damage.rs
        └── snapshot.rs
```

## Specifications

### `Cargo.toml`

```toml
[package]
name = "engine_new"
version = "0.1.0"
edition = "2021"

[dependencies]
bitflags = "2"

[dev-dependencies]
```

### `src/lib.rs`

```rust
pub mod prelude;
pub mod types;
```

### `src/prelude.rs`

```rust
//! Common imports for internal use and specs

pub use crate::types::*;
```

### `src/types/mod.rs`

```rust
mod idx;
mod time;
mod resource;
mod class;
mod attribute;
mod damage;
mod snapshot;

pub use idx::*;
pub use time::*;
pub use resource::*;
pub use class::*;
pub use attribute::*;
pub use damage::*;
pub use snapshot::*;

#[cfg(test)]
mod tests;
```

### `src/types/idx.rs`

```rust
/// Index into spell registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct SpellIdx(pub u16);

/// Index into aura registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct AuraIdx(pub u16);

/// Index into proc registry
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct ProcIdx(pub u16);

/// Index into unit list (player=0, pets=1+, enemies after)
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct UnitIdx(pub u8);

/// Index into target list
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
pub struct TargetIdx(pub u8);

impl UnitIdx {
    pub const PLAYER: UnitIdx = UnitIdx(0);
}

impl TargetIdx {
    pub const PRIMARY: TargetIdx = TargetIdx(0);
}
```

### `src/types/time.rs`

```rust
/// Simulation time in milliseconds
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct SimTime(pub u32);

impl SimTime {
    pub const ZERO: SimTime = SimTime(0);
    pub const MAX: SimTime = SimTime(u32::MAX);

    #[inline]
    pub const fn from_millis(ms: u32) -> Self {
        SimTime(ms)
    }

    #[inline]
    pub const fn from_secs(secs: u32) -> Self {
        SimTime(secs * 1000)
    }

    #[inline]
    pub fn from_secs_f32(secs: f32) -> Self {
        SimTime((secs * 1000.0) as u32)
    }

    #[inline]
    pub const fn as_millis(self) -> u32 {
        self.0
    }

    #[inline]
    pub fn as_secs_f32(self) -> f32 {
        self.0 as f32 / 1000.0
    }

    #[inline]
    pub const fn saturating_sub(self, other: SimTime) -> SimTime {
        SimTime(self.0.saturating_sub(other.0))
    }

    #[inline]
    pub const fn saturating_add(self, other: SimTime) -> SimTime {
        SimTime(self.0.saturating_add(other.0))
    }
}

impl std::ops::Add for SimTime {
    type Output = SimTime;
    #[inline]
    fn add(self, rhs: SimTime) -> SimTime {
        SimTime(self.0 + rhs.0)
    }
}

impl std::ops::Sub for SimTime {
    type Output = SimTime;
    #[inline]
    fn sub(self, rhs: SimTime) -> SimTime {
        SimTime(self.0 - rhs.0)
    }
}

impl std::ops::AddAssign for SimTime {
    #[inline]
    fn add_assign(&mut self, rhs: SimTime) {
        self.0 += rhs.0;
    }
}

impl std::ops::SubAssign for SimTime {
    #[inline]
    fn sub_assign(&mut self, rhs: SimTime) {
        self.0 -= rhs.0;
    }
}
```

### `src/types/resource.rs`

```rust
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ResourceType {
    Mana = 0,
    Rage = 1,
    Focus = 2,
    Energy = 3,
    ComboPoints = 4,
    Runes = 5,
    RunicPower = 6,
    SoulShards = 7,
    LunarPower = 8,
    HolyPower = 9,
    Maelstrom = 10,
    Chi = 11,
    Insanity = 12,
    ArcaneCharges = 13,
    Fury = 14,
    Pain = 15,
    Essence = 16,
}

impl ResourceType {
    pub const COUNT: usize = 17;

    /// Maximum value for this resource (before gear/talents)
    pub const fn base_max(self) -> u32 {
        match self {
            Self::Mana => 50000,
            Self::Rage | Self::Focus | Self::Energy => 100,
            Self::ComboPoints | Self::SoulShards | Self::HolyPower | Self::Chi | Self::Essence => 5,
            Self::Runes => 6,
            Self::RunicPower | Self::LunarPower | Self::Maelstrom | Self::Insanity | Self::Fury | Self::Pain => 100,
            Self::ArcaneCharges => 4,
        }
    }

    /// Does this resource regenerate passively?
    pub const fn has_passive_regen(self) -> bool {
        matches!(self, Self::Mana | Self::Focus | Self::Energy)
    }

    /// Base regen per second (before haste)
    pub const fn base_regen_per_sec(self) -> f32 {
        match self {
            Self::Energy => 10.0,
            Self::Focus => 5.0,
            Self::Mana => 0.01, // 1% per sec, multiplied by max
            _ => 0.0,
        }
    }
}
```

### `src/types/class.rs`

```rust
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ClassId {
    Warrior = 1,
    Paladin = 2,
    Hunter = 3,
    Rogue = 4,
    Priest = 5,
    DeathKnight = 6,
    Shaman = 7,
    Mage = 8,
    Warlock = 9,
    Monk = 10,
    Druid = 11,
    DemonHunter = 12,
    Evoker = 13,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum SpecId {
    // Warrior
    Arms = 1,
    Fury = 2,
    ProtWarrior = 3,
    // Paladin
    HolyPaladin = 4,
    ProtPaladin = 5,
    Retribution = 6,
    // Hunter
    BeastMastery = 7,
    Marksmanship = 8,
    Survival = 9,
    // Rogue
    Assassination = 10,
    Outlaw = 11,
    Subtlety = 12,
    // Priest
    Discipline = 13,
    HolyPriest = 14,
    Shadow = 15,
    // Death Knight
    Blood = 16,
    FrostDK = 17,
    Unholy = 18,
    // Shaman
    Elemental = 19,
    Enhancement = 20,
    RestoShaman = 21,
    // Mage
    Arcane = 22,
    Fire = 23,
    FrostMage = 24,
    // Warlock
    Affliction = 25,
    Demonology = 26,
    Destruction = 27,
    // Monk
    Brewmaster = 28,
    Mistweaver = 29,
    Windwalker = 30,
    // Druid
    Balance = 31,
    Feral = 32,
    Guardian = 33,
    RestoDruid = 34,
    // Demon Hunter
    Havoc = 35,
    Vengeance = 36,
    // Evoker
    Devastation = 37,
    Preservation = 38,
    Augmentation = 39,
}

impl SpecId {
    pub const COUNT: usize = 39;

    pub const fn class(self) -> ClassId {
        match self {
            Self::Arms | Self::Fury | Self::ProtWarrior => ClassId::Warrior,
            Self::HolyPaladin | Self::ProtPaladin | Self::Retribution => ClassId::Paladin,
            Self::BeastMastery | Self::Marksmanship | Self::Survival => ClassId::Hunter,
            Self::Assassination | Self::Outlaw | Self::Subtlety => ClassId::Rogue,
            Self::Discipline | Self::HolyPriest | Self::Shadow => ClassId::Priest,
            Self::Blood | Self::FrostDK | Self::Unholy => ClassId::DeathKnight,
            Self::Elemental | Self::Enhancement | Self::RestoShaman => ClassId::Shaman,
            Self::Arcane | Self::Fire | Self::FrostMage => ClassId::Mage,
            Self::Affliction | Self::Demonology | Self::Destruction => ClassId::Warlock,
            Self::Brewmaster | Self::Mistweaver | Self::Windwalker => ClassId::Monk,
            Self::Balance | Self::Feral | Self::Guardian | Self::RestoDruid => ClassId::Druid,
            Self::Havoc | Self::Vengeance => ClassId::DemonHunter,
            Self::Devastation | Self::Preservation | Self::Augmentation => ClassId::Evoker,
        }
    }

    pub const fn primary_resource(self) -> ResourceType {
        match self {
            Self::Arms | Self::Fury | Self::ProtWarrior => ResourceType::Rage,
            Self::HolyPaladin | Self::ProtPaladin | Self::Retribution => ResourceType::HolyPower,
            Self::BeastMastery | Self::Marksmanship | Self::Survival => ResourceType::Focus,
            Self::Assassination | Self::Outlaw | Self::Subtlety => ResourceType::Energy,
            Self::Discipline | Self::HolyPriest | Self::Shadow => ResourceType::Mana,
            Self::Blood | Self::FrostDK | Self::Unholy => ResourceType::RunicPower,
            Self::Elemental | Self::Enhancement | Self::RestoShaman => ResourceType::Maelstrom,
            Self::Arcane | Self::Fire | Self::FrostMage => ResourceType::Mana,
            Self::Affliction | Self::Demonology | Self::Destruction => ResourceType::SoulShards,
            Self::Brewmaster | Self::Mistweaver | Self::Windwalker => ResourceType::Chi,
            Self::Balance => ResourceType::LunarPower,
            Self::Feral | Self::Guardian => ResourceType::Energy,
            Self::RestoDruid => ResourceType::Mana,
            Self::Havoc | Self::Vengeance => ResourceType::Fury,
            Self::Devastation | Self::Preservation | Self::Augmentation => ResourceType::Essence,
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum RaceId {
    Human = 1,
    Orc = 2,
    Dwarf = 3,
    NightElf = 4,
    Undead = 5,
    Tauren = 6,
    Gnome = 7,
    Troll = 8,
    Goblin = 9,
    BloodElf = 10,
    Draenei = 11,
    Worgen = 12,
    PandarenA = 13,
    PandarenH = 14,
    Nightborne = 15,
    HighmountainTauren = 16,
    VoidElf = 17,
    LightforgedDraenei = 18,
    ZandalariTroll = 19,
    KulTiran = 20,
    DarkIronDwarf = 21,
    Vulpera = 22,
    MagharOrc = 23,
    Mechagnome = 24,
    Dracthyr = 25,
    EarthenA = 26,
    EarthenH = 27,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum PetType {
    Ferocity = 0,
    Tenacity = 1,
    Cunning = 2,
}
```

### `src/types/attribute.rs`

```rust
use super::DamageSchool;

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum Attribute {
    Strength = 0,
    Agility = 1,
    Intellect = 2,
    Stamina = 3,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum RatingType {
    Crit = 0,
    Haste = 1,
    Mastery = 2,
    Versatility = 3,
    Leech = 4,
    Avoidance = 5,
    Speed = 6,
}

impl RatingType {
    pub const COMBAT_COUNT: usize = 4; // crit, haste, mastery, vers
}

/// How mastery affects damage for a spec
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum MasteryEffect {
    /// Flat damage multiplier to all damage
    AllDamage,
    /// Physical damage only
    PhysicalDamage,
    /// Magic damage only (non-physical)
    MagicDamage,
    /// Pet damage multiplier (BM Hunter)
    PetDamage,
    /// Pet + owner damage (BM Hunter actual)
    PetAndOwnerDamage { owner_pct: f32 },
    /// DoT damage multiplier
    DotDamage,
    /// Execute damage below health threshold
    ExecuteDamage { threshold: f32 },
    /// Specific school multiplier
    SchoolDamage(DamageSchool),
    /// Bonus to specific buff/effect (spec handles)
    Custom,
}
```

### `src/types/damage.rs`

```rust
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Default)]
#[repr(u8)]
pub enum DamageSchool {
    #[default]
    Physical = 0,
    Holy = 1,
    Fire = 2,
    Nature = 3,
    Frost = 4,
    Shadow = 5,
    Arcane = 6,
}

impl DamageSchool {
    pub const fn is_physical(self) -> bool {
        matches!(self, Self::Physical)
    }

    pub const fn is_magic(self) -> bool {
        !self.is_physical()
    }
}

bitflags::bitflags! {
    #[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
    pub struct DamageFlags: u8 {
        const CRIT = 1 << 0;
        const PERIODIC = 1 << 1;
        const PET = 1 << 2;
        const AOE = 1 << 3;
        const PROC = 1 << 4;
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Default)]
pub enum HitResult {
    #[default]
    Hit,
    Crit,
    Miss,
    Dodge,
    Parry,
}

impl HitResult {
    pub const fn is_hit(self) -> bool {
        matches!(self, Self::Hit | Self::Crit)
    }

    pub const fn is_crit(self) -> bool {
        matches!(self, Self::Crit)
    }
}
```

### `src/types/snapshot.rs`

```rust
bitflags::bitflags! {
    #[derive(Copy, Clone, Debug, Default, PartialEq, Eq, Hash)]
    pub struct SnapshotFlags: u32 {
        const ATTACK_POWER = 1 << 0;
        const SPELL_POWER = 1 << 1;
        const CRIT = 1 << 2;
        const HASTE = 1 << 3;
        const VERSATILITY = 1 << 4;
        const MASTERY = 1 << 5;
        const DA_MULTIPLIER = 1 << 6;
        const TA_MULTIPLIER = 1 << 7;
        const PERSISTENT_MULT = 1 << 8;
        const PLAYER_MULT = 1 << 9;

        /// Standard physical DoT: AP + persistent
        const DOT_PHYSICAL = Self::ATTACK_POWER.bits() | Self::PERSISTENT_MULT.bits();
        /// Standard magic DoT: SP + persistent
        const DOT_MAGIC = Self::SPELL_POWER.bits() | Self::PERSISTENT_MULT.bits();
        /// Full snapshot (everything)
        const ALL = Self::ATTACK_POWER.bits()
            | Self::SPELL_POWER.bits()
            | Self::CRIT.bits()
            | Self::HASTE.bits()
            | Self::VERSATILITY.bits()
            | Self::MASTERY.bits()
            | Self::DA_MULTIPLIER.bits()
            | Self::TA_MULTIPLIER.bits()
            | Self::PERSISTENT_MULT.bits()
            | Self::PLAYER_MULT.bits();
    }
}
```

### `src/types/tests.rs`

```rust
use super::*;

#[test]
fn sim_time_arithmetic() {
    let a = SimTime::from_secs(5);
    let b = SimTime::from_millis(2500);
    assert_eq!((a + b).as_millis(), 7500);
    assert_eq!((a - b).as_millis(), 2500);
    assert_eq!(a.as_secs_f32(), 5.0);
}

#[test]
fn sim_time_saturating() {
    let a = SimTime::from_secs(1);
    let b = SimTime::from_secs(5);
    assert_eq!(a.saturating_sub(b), SimTime::ZERO);
}

#[test]
fn spec_class_mapping() {
    assert_eq!(SpecId::BeastMastery.class(), ClassId::Hunter);
    assert_eq!(SpecId::Fury.class(), ClassId::Warrior);
    assert_eq!(SpecId::Shadow.class(), ClassId::Priest);
    assert_eq!(SpecId::Havoc.class(), ClassId::DemonHunter);
}

#[test]
fn spec_primary_resource() {
    assert_eq!(SpecId::BeastMastery.primary_resource(), ResourceType::Focus);
    assert_eq!(SpecId::Fury.primary_resource(), ResourceType::Rage);
    assert_eq!(SpecId::Assassination.primary_resource(), ResourceType::Energy);
    assert_eq!(SpecId::Shadow.primary_resource(), ResourceType::Mana);
}

#[test]
fn resource_properties() {
    assert_eq!(ResourceType::Focus.base_max(), 100);
    assert_eq!(ResourceType::ComboPoints.base_max(), 5);
    assert!(ResourceType::Energy.has_passive_regen());
    assert!(!ResourceType::Rage.has_passive_regen());
}

#[test]
fn damage_school_types() {
    assert!(DamageSchool::Physical.is_physical());
    assert!(!DamageSchool::Physical.is_magic());
    assert!(DamageSchool::Fire.is_magic());
    assert!(!DamageSchool::Fire.is_physical());
}

#[test]
fn hit_result_checks() {
    assert!(HitResult::Hit.is_hit());
    assert!(HitResult::Crit.is_hit());
    assert!(HitResult::Crit.is_crit());
    assert!(!HitResult::Miss.is_hit());
}

#[test]
fn snapshot_flags_combinations() {
    let flags = SnapshotFlags::DOT_PHYSICAL;
    assert!(flags.contains(SnapshotFlags::ATTACK_POWER));
    assert!(flags.contains(SnapshotFlags::PERSISTENT_MULT));
    assert!(!flags.contains(SnapshotFlags::SPELL_POWER));
    assert!(!flags.contains(SnapshotFlags::HASTE));
}

#[test]
fn idx_defaults() {
    assert_eq!(UnitIdx::PLAYER.0, 0);
    assert_eq!(TargetIdx::PRIMARY.0, 0);
    assert_eq!(SpellIdx::default().0, 0);
}

#[test]
fn damage_flags() {
    let flags = DamageFlags::CRIT | DamageFlags::PERIODIC;
    assert!(flags.contains(DamageFlags::CRIT));
    assert!(flags.contains(DamageFlags::PERIODIC));
    assert!(!flags.contains(DamageFlags::PET));
}
```

## Success Criteria

```bash
cd /Users/user/Source/wowlab/crates/engine_new
cargo build
cargo test
```

Expected output:

- Build succeeds with no errors
- All 11 tests pass
- No warnings (or only minor ones)

## Todo Checklist

- [ ] Create `crates/engine_new/` directory
- [ ] Run `cargo init --lib --name engine_new`
- [ ] Set up `Cargo.toml` with `bitflags = "2"`
- [ ] Create `src/lib.rs`
- [ ] Create `src/prelude.rs`
- [ ] Create `src/types/mod.rs`
- [ ] Create `src/types/idx.rs`
- [ ] Create `src/types/time.rs`
- [ ] Create `src/types/resource.rs`
- [ ] Create `src/types/class.rs`
- [ ] Create `src/types/attribute.rs`
- [ ] Create `src/types/damage.rs`
- [ ] Create `src/types/snapshot.rs`
- [ ] Create `src/types/tests.rs`
- [ ] Run `cargo build` — success
- [ ] Run `cargo test` — 11 tests pass
