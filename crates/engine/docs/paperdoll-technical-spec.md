# Paperdoll System - Technical Specification

## Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONFIG LOADING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TOML Config                    Race/Class Data                            │
│   ───────────                    ───────────────                            │
│   [player.stats]                 RaceData {                                 │
│   agility = 10000       +        base_str, base_agi,                        │
│   crit_rating = 2500             base_int, base_sta                         │
│   haste_rating = 1800          }                                            │
│   ...                            ClassData {                                │
│         │                          ap_per_str, ap_per_agi,                  │
│         │                          sp_per_int, health_per_sta               │
│         ▼                        }                                          │
│   ┌─────────────┐                      │                                    │
│   │  GearStats  │◄─────────────────────┘                                    │
│   └──────┬──────┘                                                           │
│          │                                                                  │
└──────────┼──────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAPERDOLL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │  BaseStats   │ +  │  GearStats   │ =  │  StatCache   │                  │
│   │  (race/lvl)  │    │  (gear/buf)  │    │  (computed)  │                  │
│   └──────────────┘    └──────────────┘    └──────┬───────┘                  │
│                                                  │                          │
│   ┌──────────────────────────────────────────────┼─────────────────────┐    │
│   │                    RATING CONVERSION          │                     │    │
│   │                                              ▼                     │    │
│   │   crit_rating ────► / RatingTable[level] ────► apply_dr() ──► %   │    │
│   │   haste_rating ───► / RatingTable[level] ────► apply_dr() ──► %   │    │
│   │   mastery_rating ─► / RatingTable[level] ────► apply_dr() ──► %   │    │
│   │   vers_rating ────► / RatingTable[level] ────► apply_dr() ──► %   │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ recompute()
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STAT CACHE (Hot Path)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  StatCache                                                          │   │
│   │  ──────────                                                         │   │
│   │  strength: 1500        attack_power: 15000    crit_chance: 0.28     │   │
│   │  agility: 10000        spell_power: 0         haste_mult: 1.25      │   │
│   │  intellect: 500        max_health: 450000     mastery_value: 0.18   │   │
│   │  stamina: 8000         armor: 5000            vers_damage: 0.05     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ update_from_owner()
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PET STAT INHERITANCE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Owner Paperdoll                    PetCoefficients                        │
│   ───────────────                    ───────────────                        │
│   attack_power: 15000    ──────►     ap_from_ap: 0.60   ──►  pet_ap: 9000   │
│   spell_power: 0         ──────►     ap_from_sp: 0.00                       │
│   crit_chance: 0.28      ──────►     (direct 100%)      ──►  pet_crit: 0.28 │
│   haste_mult: 1.25       ──────►     (direct 100%)      ──►  pet_haste: 1.25│
│   versatility: 0.05      ──────►     (direct 100%)      ──►  pet_vers: 0.05 │
│   max_health: 450000     ──────►     health: 1.0        ──►  pet_hp: 450000 │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  PetStats                                                           │   │
│   │  ────────                                                           │   │
│   │  attack_power: 9000      crit_chance: 0.28      max_health: 450000  │   │
│   │  spell_power: 0          haste_mult: 1.25       armor: 5000         │   │
│   │                          versatility: 0.05                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DAMAGE CALCULATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Player Damage:                                                            │
│   ──────────────                                                            │
│   base_damage = (spell.min + spell.max) / 2                                 │
│   ap_damage = spell.ap_coefficient * cache.attack_power                     │
│   sp_damage = spell.sp_coefficient * cache.spell_power                      │
│   total = (base + ap_damage + sp_damage)                                    │
│         * (1 + cache.crit_chance)                                           │
│         * (1 + cache.vers_damage)                                           │
│         * (1 + cache.mastery_value * mastery_effect)                        │
│                                                                             │
│   Pet Damage:                                                               │
│   ───────────                                                               │
│   base_damage = (ability.min + ability.max) / 2                             │
│   ap_damage = ability.ap_coefficient * pet_stats.attack_power               │
│   total = (base + ap_damage)                                                │
│         * (1 + pet_stats.crit_chance)                                       │
│         * (1 + pet_stats.versatility)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Aura Stat Modifier Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AURA STAT MODIFICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Aura Applied (e.g., Bestial Wrath)                                        │
│   ─────────────────────────────────────                                     │
│                                                                             │
│   AuraEffect::PercentStat {                                                 │
│       stat: DerivedStat::DamageDone,                                        │
│       percent: 25.0                                                         │
│   }                                                                         │
│         │                                                                   │
│         ▼                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ActiveModifiers (per-stat stacking)                                │   │
│   │  ─────────────────────────────────                                  │   │
│   │  damage_done_flat: 0.0                                              │   │
│   │  damage_done_pct: 25.0  ◄── Bestial Wrath                           │   │
│   │  crit_flat: 0.0                                                     │   │
│   │  haste_pct: 0.0                                                     │   │
│   │  ...                                                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ invalidate_cache(DAMAGE_MULTIPLIER)                               │
│         ▼                                                                   │
│   StatCache recalculates affected values                                    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Final Damage Multiplier                                            │   │
│   │  ───────────────────────                                            │   │
│   │  base_mult = 1.0                                                    │   │
│   │  + vers_damage (0.05)                                               │   │
│   │  + aura_damage_pct (0.25)   ◄── from ActiveModifiers                │   │
│   │  ────────────────────────                                           │   │
│   │  = 1.30 total multiplier                                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Type Definitions

### Enums

```rust
/// Primary character attributes
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum Attribute {
    Strength = 0,
    Agility = 1,
    Intellect = 2,
    Stamina = 3,
}

impl Attribute {
    pub const COUNT: usize = 4;
}

/// Combat rating types (indexes into rating arrays)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum RatingType {
    // Defense ratings
    Dodge = 0,
    Parry = 1,
    Block = 2,

    // Melee ratings
    CritMelee = 3,
    HasteMelee = 4,

    // Ranged ratings
    CritRanged = 5,
    HasteRanged = 6,

    // Spell ratings
    CritSpell = 7,
    HasteSpell = 8,

    // Universal secondary
    Mastery = 9,
    VersatilityDamage = 10,
    VersatilityHealing = 11,

    // Tertiary
    Leech = 12,
    Speed = 13,
    Avoidance = 14,
}

impl RatingType {
    pub const COUNT: usize = 15;
}

/// Derived/computed stats for cache keys
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum CacheKey {
    // Attributes
    Strength = 0,
    Agility = 1,
    Intellect = 2,
    Stamina = 3,

    // Power
    AttackPower = 4,
    SpellPower = 5,

    // Secondary percentages
    CritChance = 6,
    HastePercent = 7,
    MasteryValue = 8,
    VersatilityDamage = 9,
    VersatilityMitigation = 10,

    // Defense
    MaxHealth = 11,
    Armor = 12,
    DodgeChance = 13,
    ParryChance = 14,
    BlockChance = 15,

    // Multipliers
    DamageMultiplier = 16,
    HealingMultiplier = 17,
    DamageTakenMultiplier = 18,

    // Pet
    PetAttackPower = 19,
}

impl CacheKey {
    pub const COUNT: usize = 20;
}

/// Player class identifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
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

/// Specialization identifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u16)]
pub enum SpecId {
    // Hunter
    BeastMastery = 253,
    Marksmanship = 254,
    Survival = 255,

    // ... other specs
}

/// Race identifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
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
    // ... etc
}

/// Pet type for inheritance coefficient lookup
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PetType {
    // Hunter pets
    HunterMainPet,
    HunterAnimalCompanion,
    HunterDireBeast,
    HunterCallOfTheWild,
    HunterDarkHound,

    // Warlock pets
    WarlockImp,
    WarlockVoidwalker,
    WarlockFelhunter,
    WarlockSuccubus,
    WarlockFelguard,

    // Death Knight
    DKGhoul,
    DKArmyGhoul,
    DKApocalypseGhoul,

    // Generic
    Guardian,
}
```

---

### Core Structs

```rust
/// Base stats from race and class at a given level
/// These are immutable after character creation
#[derive(Clone, Debug, Default)]
pub struct BaseStats {
    /// Base attributes from race + class + level
    /// Index by Attribute enum
    pub attributes: [f32; Attribute::COUNT],

    /// Base health before stamina
    pub base_health: f32,

    /// Base mana (casters only)
    pub base_mana: f32,

    /// Base crit chance (typically 5%)
    pub base_crit: f32,

    /// Base dodge chance (class-dependent)
    pub base_dodge: f32,

    /// Base parry chance (melee only)
    pub base_parry: f32,

    /// Base block chance (shield users)
    pub base_block: f32,
}

/// Stats from gear, enchants, gems, and passive effects
/// Updated when equipment changes
#[derive(Clone, Debug, Default)]
pub struct GearStats {
    /// Flat attribute bonuses from gear
    /// Index by Attribute enum
    pub attributes: [f32; Attribute::COUNT],

    /// Combat rating values from gear
    /// Index by RatingType enum
    pub ratings: [f32; RatingType::COUNT],

    /// Flat power bonuses (from effects, not attributes)
    pub flat_attack_power: f32,
    pub flat_spell_power: f32,

    /// Flat defensive stats
    pub armor: f32,
    pub bonus_armor: f32,

    /// Weapon stats
    pub weapon_dps_main: f32,
    pub weapon_dps_off: f32,
    pub weapon_speed_main: f32,
    pub weapon_speed_off: f32,
}

/// Active stat modifiers from auras/buffs
/// These stack additively within category, multiplicatively between
#[derive(Clone, Debug, Default)]
pub struct ActiveModifiers {
    // Attribute modifiers
    pub strength_flat: f32,
    pub strength_pct: f32,
    pub agility_flat: f32,
    pub agility_pct: f32,
    pub intellect_flat: f32,
    pub intellect_pct: f32,
    pub stamina_flat: f32,
    pub stamina_pct: f32,

    // Power modifiers
    pub attack_power_flat: f32,
    pub attack_power_pct: f32,
    pub spell_power_flat: f32,
    pub spell_power_pct: f32,

    // Secondary stat modifiers (flat rating or pct bonus)
    pub crit_rating_flat: f32,
    pub crit_pct: f32,
    pub haste_rating_flat: f32,
    pub haste_pct: f32,
    pub mastery_rating_flat: f32,
    pub mastery_pct: f32,
    pub versatility_rating_flat: f32,
    pub versatility_pct: f32,

    // Damage/healing multipliers
    pub damage_done_pct: f32,
    pub healing_done_pct: f32,
    pub damage_taken_pct: f32,

    // Pet modifiers
    pub pet_damage_pct: f32,
}

/// Cached computed stat values
/// Recomputed when invalidated by stat changes
#[derive(Clone, Debug)]
pub struct StatCache {
    /// Bitmask of valid cache entries
    /// Bit N = CacheKey::N is valid
    valid: u32,

    // === Final Attributes ===
    pub strength: f32,
    pub agility: f32,
    pub intellect: f32,
    pub stamina: f32,

    // === Power Stats ===
    pub attack_power: f32,
    pub spell_power: f32,

    // === Secondary Stats (percentages/multipliers) ===
    /// Crit chance as decimal (0.25 = 25%)
    pub crit_chance: f32,

    /// Haste as multiplier (1.25 = 25% haste)
    pub haste_mult: f32,

    /// Mastery value (spec-specific effect amount)
    pub mastery_value: f32,

    /// Versatility damage bonus as decimal
    pub vers_damage: f32,

    /// Versatility damage reduction as decimal (half of damage)
    pub vers_mitigation: f32,

    // === Tertiary Stats ===
    pub leech_pct: f32,
    pub speed_pct: f32,
    pub avoidance_pct: f32,

    // === Defensive Stats ===
    pub max_health: f32,
    pub armor: f32,
    pub dodge_chance: f32,
    pub parry_chance: f32,
    pub block_chance: f32,

    // === Final Multipliers (includes aura effects) ===
    pub damage_multiplier: f32,
    pub healing_multiplier: f32,
    pub damage_taken_multiplier: f32,

    // === Pre-computed for hot path ===
    /// 1.0 + crit_chance (for expected crit damage)
    pub crit_mult: f32,

    /// Combined damage multiplier: (1+vers) * (1+aura_dmg) * (1+mastery_effect)
    pub total_damage_mult: f32,

    /// GCD in milliseconds at current haste
    pub gcd_ms: u32,

    /// Auto-attack speed in milliseconds
    pub auto_attack_ms: u32,
}

impl Default for StatCache {
    fn default() -> Self {
        Self {
            valid: 0,
            strength: 0.0,
            agility: 0.0,
            intellect: 0.0,
            stamina: 0.0,
            attack_power: 0.0,
            spell_power: 0.0,
            crit_chance: 0.05, // 5% base
            haste_mult: 1.0,
            mastery_value: 0.0,
            vers_damage: 0.0,
            vers_mitigation: 0.0,
            leech_pct: 0.0,
            speed_pct: 0.0,
            avoidance_pct: 0.0,
            max_health: 1.0,
            armor: 0.0,
            dodge_chance: 0.0,
            parry_chance: 0.0,
            block_chance: 0.0,
            damage_multiplier: 1.0,
            healing_multiplier: 1.0,
            damage_taken_multiplier: 1.0,
            crit_mult: 1.05,
            total_damage_mult: 1.0,
            gcd_ms: 1500,
            auto_attack_ms: 2000,
        }
    }
}

/// Combat rating conversion table for a specific level
#[derive(Clone, Debug)]
pub struct RatingTable {
    pub level: u8,

    // Rating required for 1% of each stat
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

impl RatingTable {
    /// Get rating divisor for a given rating type
    pub fn get(&self, rating: RatingType) -> f32 {
        match rating {
            RatingType::Dodge => self.dodge,
            RatingType::Parry => self.parry,
            RatingType::Block => self.block,
            RatingType::CritMelee | RatingType::CritRanged | RatingType::CritSpell => self.crit,
            RatingType::HasteMelee | RatingType::HasteRanged | RatingType::HasteSpell => self.haste,
            RatingType::Mastery => self.mastery,
            RatingType::VersatilityDamage | RatingType::VersatilityHealing => self.versatility,
            RatingType::Leech => self.leech,
            RatingType::Speed => self.speed,
            RatingType::Avoidance => self.avoidance,
        }
    }

    /// Create rating table for level 80 (The War Within)
    pub fn level_80() -> Self {
        Self {
            level: 80,
            dodge: 750.0,
            parry: 750.0,
            block: 340.0,
            crit: 700.0,
            haste: 502.1,
            mastery: 700.0,
            versatility: 700.0,
            leech: 200.0,
            speed: 100.0,
            avoidance: 200.0,
        }
    }

    /// Create rating table for level 70 (Dragonflight)
    pub fn level_70() -> Self {
        Self {
            level: 70,
            dodge: 198.5,
            parry: 198.5,
            block: 90.0,
            crit: 185.3,
            haste: 157.2,
            mastery: 185.3,
            versatility: 185.3,
            leech: 53.0,
            speed: 26.5,
            avoidance: 53.0,
        }
    }
}

/// Class-specific stat conversion coefficients
#[derive(Clone, Debug)]
pub struct ClassCoefficients {
    /// Attack power per point of strength
    pub ap_per_strength: f32,

    /// Attack power per point of agility
    pub ap_per_agility: f32,

    /// Spell power per point of intellect
    pub sp_per_intellect: f32,

    /// Health per point of stamina
    pub health_per_stamina: f32,

    /// Crit chance per X agility (0 = no scaling)
    pub crit_per_agility: f32,

    /// Crit chance per X intellect (0 = no scaling)
    pub crit_per_intellect: f32,

    /// Dodge per X agility (0 = no scaling, tanks only)
    pub dodge_per_agility: f32,

    /// Parry per X strength (0 = no scaling, tanks only)
    pub parry_per_strength: f32,

    /// Mastery effect coefficient (spec-specific multiplier)
    pub mastery_coefficient: f32,

    /// Primary stat for this spec
    pub primary_stat: Attribute,

    /// Whether this spec uses spell power
    pub uses_spell_power: bool,

    /// Whether this spec can parry
    pub can_parry: bool,

    /// Whether this spec can block
    pub can_block: bool,
}

impl ClassCoefficients {
    /// Beast Mastery Hunter coefficients
    pub fn beast_mastery() -> Self {
        Self {
            ap_per_strength: 0.0,
            ap_per_agility: 1.0,
            sp_per_intellect: 0.0,
            health_per_stamina: 20.0,
            crit_per_agility: 0.0, // No passive crit from agi in modern WoW
            crit_per_intellect: 0.0,
            dodge_per_agility: 0.0,
            parry_per_strength: 0.0,
            mastery_coefficient: 1.0, // Master of Beasts: 1% pet damage per mastery
            primary_stat: Attribute::Agility,
            uses_spell_power: false,
            can_parry: false,
            can_block: false,
        }
    }
}
```

---

### The Main Paperdoll Struct

```rust
/// The complete character stat sheet
/// Owns all stat computation and caching
pub struct Paperdoll {
    // === Identity ===
    pub level: u8,
    pub class: ClassId,
    pub spec: SpecId,
    pub race: RaceId,

    // === Stat Layers ===
    /// Base stats from race/class/level (immutable after init)
    pub base: BaseStats,

    /// Stats from gear and passive effects
    pub gear: GearStats,

    /// Active modifiers from buffs/debuffs
    pub modifiers: ActiveModifiers,

    // === Conversion Data ===
    /// Rating conversion table for current level
    pub rating_table: RatingTable,

    /// Class/spec conversion coefficients
    pub coefficients: ClassCoefficients,

    // === Cache ===
    /// Cached computed values
    pub cache: StatCache,
}

impl Paperdoll {
    /// Create a new paperdoll for a character
    pub fn new(
        level: u8,
        class: ClassId,
        spec: SpecId,
        race: RaceId,
    ) -> Self {
        let rating_table = match level {
            70 => RatingTable::level_70(),
            80 => RatingTable::level_80(),
            _ => RatingTable::level_80(), // Default to current
        };

        let coefficients = match spec {
            SpecId::BeastMastery => ClassCoefficients::beast_mastery(),
            // ... other specs
            _ => ClassCoefficients::beast_mastery(),
        };

        Self {
            level,
            class,
            spec,
            race,
            base: BaseStats::default(),
            gear: GearStats::default(),
            modifiers: ActiveModifiers::default(),
            rating_table,
            coefficients,
            cache: StatCache::default(),
        }
    }

    /// Invalidate a cached stat (triggers recomputation on next access)
    pub fn invalidate(&mut self, key: CacheKey) {
        self.cache.valid &= !(1 << key as u32);

        // Invalidation chains
        match key {
            CacheKey::Strength => {
                if self.coefficients.ap_per_strength > 0.0 {
                    self.invalidate(CacheKey::AttackPower);
                }
                if self.coefficients.parry_per_strength > 0.0 {
                    self.invalidate(CacheKey::ParryChance);
                }
            }
            CacheKey::Agility => {
                if self.coefficients.ap_per_agility > 0.0 {
                    self.invalidate(CacheKey::AttackPower);
                }
                if self.coefficients.crit_per_agility > 0.0 {
                    self.invalidate(CacheKey::CritChance);
                }
                if self.coefficients.dodge_per_agility > 0.0 {
                    self.invalidate(CacheKey::DodgeChance);
                }
            }
            CacheKey::Intellect => {
                if self.coefficients.sp_per_intellect > 0.0 {
                    self.invalidate(CacheKey::SpellPower);
                }
                if self.coefficients.crit_per_intellect > 0.0 {
                    self.invalidate(CacheKey::CritChance);
                }
            }
            CacheKey::Stamina => {
                self.invalidate(CacheKey::MaxHealth);
            }
            CacheKey::AttackPower | CacheKey::SpellPower => {
                self.invalidate(CacheKey::PetAttackPower);
            }
            CacheKey::VersatilityDamage => {
                self.invalidate(CacheKey::VersatilityMitigation);
                self.invalidate(CacheKey::DamageMultiplier);
            }
            CacheKey::MasteryValue => {
                self.invalidate(CacheKey::DamageMultiplier);
            }
            _ => {}
        }
    }

    /// Invalidate all cached stats
    pub fn invalidate_all(&mut self) {
        self.cache.valid = 0;
    }

    /// Convert a rating value to percentage with diminishing returns
    pub fn rating_to_percent(&self, rating_type: RatingType, rating: f32) -> f32 {
        if rating <= 0.0 {
            return 0.0;
        }

        let base = rating / self.rating_table.get(rating_type);
        self.apply_dr(rating_type, base)
    }

    /// Apply diminishing returns curve
    fn apply_dr(&self, rating_type: RatingType, value: f32) -> f32 {
        // Diminishing returns formula:
        // effective = value / (1 + value / soft_cap)
        //
        // This gives:
        // - Linear scaling up to ~15%
        // - Soft cap around 30%
        // - Hard cap approaches 2x soft_cap asymptotically

        let soft_cap = match rating_type {
            // Secondary stats: ~30% soft cap
            RatingType::CritMelee | RatingType::CritRanged | RatingType::CritSpell |
            RatingType::HasteMelee | RatingType::HasteRanged | RatingType::HasteSpell |
            RatingType::Mastery | RatingType::VersatilityDamage | RatingType::VersatilityHealing => {
                0.30
            }

            // Tertiary stats: ~10% soft cap
            RatingType::Leech | RatingType::Speed | RatingType::Avoidance => {
                0.10
            }

            // Defense: ~20% soft cap
            RatingType::Dodge | RatingType::Parry | RatingType::Block => {
                0.20
            }
        };

        // DR formula
        value / (1.0 + value / soft_cap)
    }

    /// Recompute all cached stats from scratch
    pub fn recompute(&mut self) {
        let base = &self.base;
        let gear = &self.gear;
        let mods = &self.modifiers;
        let coeff = &self.coefficients;

        // === Attributes ===
        let str_base = base.attributes[Attribute::Strength as usize]
            + gear.attributes[Attribute::Strength as usize]
            + mods.strength_flat;
        self.cache.strength = str_base * (1.0 + mods.strength_pct / 100.0);

        let agi_base = base.attributes[Attribute::Agility as usize]
            + gear.attributes[Attribute::Agility as usize]
            + mods.agility_flat;
        self.cache.agility = agi_base * (1.0 + mods.agility_pct / 100.0);

        let int_base = base.attributes[Attribute::Intellect as usize]
            + gear.attributes[Attribute::Intellect as usize]
            + mods.intellect_flat;
        self.cache.intellect = int_base * (1.0 + mods.intellect_pct / 100.0);

        let sta_base = base.attributes[Attribute::Stamina as usize]
            + gear.attributes[Attribute::Stamina as usize]
            + mods.stamina_flat;
        self.cache.stamina = sta_base * (1.0 + mods.stamina_pct / 100.0);

        // === Attack Power ===
        let ap_base = self.cache.strength * coeff.ap_per_strength
            + self.cache.agility * coeff.ap_per_agility
            + gear.flat_attack_power
            + mods.attack_power_flat;
        self.cache.attack_power = ap_base * (1.0 + mods.attack_power_pct / 100.0);

        // === Spell Power ===
        let sp_base = self.cache.intellect * coeff.sp_per_intellect
            + gear.flat_spell_power
            + mods.spell_power_flat;
        self.cache.spell_power = sp_base * (1.0 + mods.spell_power_pct / 100.0);

        // === Crit Chance ===
        let crit_from_rating = self.rating_to_percent(
            RatingType::CritMelee,
            gear.ratings[RatingType::CritMelee as usize] + mods.crit_rating_flat,
        );
        let crit_from_agi = if coeff.crit_per_agility > 0.0 {
            self.cache.agility / coeff.crit_per_agility / 100.0
        } else {
            0.0
        };
        self.cache.crit_chance = base.base_crit + crit_from_rating + crit_from_agi
            + mods.crit_pct / 100.0;
        self.cache.crit_mult = 1.0 + self.cache.crit_chance;

        // === Haste ===
        let haste_from_rating = self.rating_to_percent(
            RatingType::HasteMelee,
            gear.ratings[RatingType::HasteMelee as usize] + mods.haste_rating_flat,
        );
        let haste_pct = haste_from_rating + mods.haste_pct / 100.0;
        self.cache.haste_mult = 1.0 + haste_pct;

        // === Mastery ===
        let mastery_from_rating = self.rating_to_percent(
            RatingType::Mastery,
            gear.ratings[RatingType::Mastery as usize] + mods.mastery_rating_flat,
        );
        let mastery_pct = mastery_from_rating + mods.mastery_pct / 100.0;
        self.cache.mastery_value = mastery_pct * coeff.mastery_coefficient;

        // === Versatility ===
        let vers_from_rating = self.rating_to_percent(
            RatingType::VersatilityDamage,
            gear.ratings[RatingType::VersatilityDamage as usize] + mods.versatility_rating_flat,
        );
        self.cache.vers_damage = vers_from_rating + mods.versatility_pct / 100.0;
        self.cache.vers_mitigation = self.cache.vers_damage / 2.0;

        // === Health ===
        self.cache.max_health = base.base_health + self.cache.stamina * coeff.health_per_stamina;

        // === Armor ===
        self.cache.armor = gear.armor + gear.bonus_armor;

        // === Final Multipliers ===
        self.cache.damage_multiplier = (1.0 + self.cache.vers_damage)
            * (1.0 + mods.damage_done_pct / 100.0);
        self.cache.healing_multiplier = (1.0 + self.cache.vers_damage)
            * (1.0 + mods.healing_done_pct / 100.0);
        self.cache.damage_taken_multiplier = (1.0 - self.cache.vers_mitigation)
            * (1.0 + mods.damage_taken_pct / 100.0);

        // === Combined damage mult for hot path ===
        // Includes: versatility, aura bonuses, mastery effect
        self.cache.total_damage_mult = self.cache.damage_multiplier
            * (1.0 + self.cache.mastery_value);

        // === Pre-computed timing ===
        let base_gcd_ms = 1500.0;
        self.cache.gcd_ms = ((base_gcd_ms / self.cache.haste_mult).max(750.0)) as u32;

        let base_auto_ms = gear.weapon_speed_main * 1000.0;
        if base_auto_ms > 0.0 {
            self.cache.auto_attack_ms = (base_auto_ms / self.cache.haste_mult) as u32;
        }

        // Mark all as valid
        self.cache.valid = u32::MAX;
    }

    /// Apply an aura's stat effect
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
            AuraStatEffect::PercentAttribute { attr, percent } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_pct += percent,
                    Attribute::Agility => self.modifiers.agility_pct += percent,
                    Attribute::Intellect => self.modifiers.intellect_pct += percent,
                    Attribute::Stamina => self.modifiers.stamina_pct += percent,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            AuraStatEffect::FlatAttackPower(amount) => {
                self.modifiers.attack_power_flat += amount;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::PercentAttackPower(percent) => {
                self.modifiers.attack_power_pct += percent;
                self.invalidate(CacheKey::AttackPower);
            }
            AuraStatEffect::DamageDone(percent) => {
                self.modifiers.damage_done_pct += percent;
                self.invalidate(CacheKey::DamageMultiplier);
            }
            AuraStatEffect::DamageTaken(percent) => {
                self.modifiers.damage_taken_pct += percent;
                self.invalidate(CacheKey::DamageTakenMultiplier);
            }
            AuraStatEffect::CritChance(percent) => {
                self.modifiers.crit_pct += percent;
                self.invalidate(CacheKey::CritChance);
            }
            AuraStatEffect::HastePercent(percent) => {
                self.modifiers.haste_pct += percent;
                self.invalidate(CacheKey::HastePercent);
            }
            AuraStatEffect::MasteryPercent(percent) => {
                self.modifiers.mastery_pct += percent;
                self.invalidate(CacheKey::MasteryValue);
            }
            AuraStatEffect::PetDamage(percent) => {
                self.modifiers.pet_damage_pct += percent;
            }
        }
    }

    /// Remove an aura's stat effect
    pub fn remove_aura_effect(&mut self, effect: &AuraStatEffect) {
        // Same as apply but subtract
        match effect {
            AuraStatEffect::FlatAttribute { attr, amount } => {
                match attr {
                    Attribute::Strength => self.modifiers.strength_flat -= amount,
                    Attribute::Agility => self.modifiers.agility_flat -= amount,
                    Attribute::Intellect => self.modifiers.intellect_flat -= amount,
                    Attribute::Stamina => self.modifiers.stamina_flat -= amount,
                }
                self.invalidate(CacheKey::from(*attr));
            }
            // ... etc
            _ => {}
        }
    }
}

/// Aura stat effect types
#[derive(Clone, Debug)]
pub enum AuraStatEffect {
    FlatAttribute { attr: Attribute, amount: f32 },
    PercentAttribute { attr: Attribute, percent: f32 },
    FlatAttackPower(f32),
    PercentAttackPower(f32),
    DamageDone(f32),
    DamageTaken(f32),
    CritChance(f32),
    HastePercent(f32),
    MasteryPercent(f32),
    PetDamage(f32),
}
```

---

### Pet Stats Structs

```rust
/// Pet stat inheritance coefficients
#[derive(Clone, Copy, Debug)]
pub struct PetCoefficients {
    /// Pet armor = owner armor * this
    pub armor: f32,

    /// Pet health = owner health * this
    pub health: f32,

    /// Pet AP = owner AP * this
    pub ap_from_ap: f32,

    /// Pet AP = owner SP * this (caster pets)
    pub ap_from_sp: f32,

    /// Pet SP = owner AP * this
    pub sp_from_ap: f32,

    /// Pet SP = owner SP * this (caster pets)
    pub sp_from_sp: f32,

    /// Pet stamina = owner stamina * this
    pub stamina_inherit: f32,

    /// Pet intellect = owner intellect * this
    pub intellect_inherit: f32,
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

impl PetCoefficients {
    /// Hunter main pet (60% AP scaling)
    pub fn hunter_main_pet() -> Self {
        Self {
            ap_from_ap: 0.60,
            stamina_inherit: 0.70,
            ..Default::default()
        }
    }

    /// Hunter Dire Beast (100% AP scaling)
    pub fn hunter_dire_beast() -> Self {
        Self {
            ap_from_ap: 1.00,
            ..Default::default()
        }
    }

    /// Hunter Dark Hound - BM spec (500% AP scaling!)
    pub fn hunter_dark_hound_bm() -> Self {
        Self {
            ap_from_ap: 5.00,
            ..Default::default()
        }
    }

    /// Hunter Dark Hound - other specs (605% AP scaling)
    pub fn hunter_dark_hound() -> Self {
        Self {
            ap_from_ap: 6.05,
            ..Default::default()
        }
    }

    /// Hunter Fenryr/Hati hero pets (200% AP scaling)
    pub fn hunter_hero_pet() -> Self {
        Self {
            ap_from_ap: 2.00,
            ..Default::default()
        }
    }

    /// Warlock pet (SP scaling)
    pub fn warlock_pet() -> Self {
        Self {
            ap_from_sp: 0.50,
            sp_from_sp: 1.00,
            health: 0.50,
            ..Default::default()
        }
    }

    /// DK Ghoul
    pub fn dk_ghoul() -> Self {
        Self {
            ap_from_ap: 0.6318,
            ..Default::default()
        }
    }
}

/// Pet computed stats (derived from owner)
#[derive(Clone, Debug, Default)]
pub struct PetStats {
    /// Pet type determines base coefficients
    pub pet_type: PetType,

    /// Inheritance coefficients
    pub coefficients: PetCoefficients,

    // === Derived Power Stats ===
    pub attack_power: f32,
    pub spell_power: f32,

    // === Inherited Secondary Stats (100% from owner) ===
    pub crit_chance: f32,
    pub haste_mult: f32,
    pub versatility: f32,

    // === Scaled Stats ===
    pub max_health: f32,
    pub armor: f32,
    pub stamina: f32,
    pub intellect: f32,

    // === Pet-specific modifiers ===
    pub damage_multiplier: f32,

    // === Pre-computed ===
    pub crit_mult: f32,
    pub attack_speed_ms: u32,
}

impl PetStats {
    /// Create pet stats with given coefficients
    pub fn new(pet_type: PetType, coefficients: PetCoefficients) -> Self {
        Self {
            pet_type,
            coefficients,
            damage_multiplier: 1.0,
            crit_mult: 1.0,
            attack_speed_ms: 2000,
            ..Default::default()
        }
    }

    /// Update all pet stats from owner's paperdoll
    pub fn update_from_owner(&mut self, owner: &Paperdoll, pet_damage_mod: f32) {
        let coeff = &self.coefficients;
        let cache = &owner.cache;

        // === Power Stats ===
        // Pet AP from owner AP and/or SP
        self.attack_power = cache.attack_power * coeff.ap_from_ap
            + cache.spell_power * coeff.ap_from_sp;

        // Pet SP from owner AP and/or SP
        self.spell_power = cache.attack_power * coeff.sp_from_ap
            + cache.spell_power * coeff.sp_from_sp;

        // === Direct Inheritance (100%) ===
        self.crit_chance = cache.crit_chance;
        self.haste_mult = cache.haste_mult;
        self.versatility = cache.vers_damage;

        // === Scaled Inheritance ===
        self.max_health = cache.max_health * coeff.health;
        self.armor = cache.armor * coeff.armor;
        self.stamina = cache.stamina * coeff.stamina_inherit;
        self.intellect = cache.intellect * coeff.intellect_inherit;

        // === Damage Multiplier ===
        // Base versatility + owner's pet damage modifier + aura modifiers
        self.damage_multiplier = (1.0 + self.versatility)
            * (1.0 + pet_damage_mod / 100.0)
            * (1.0 + owner.modifiers.pet_damage_pct / 100.0);

        // === Pre-computed ===
        self.crit_mult = 1.0 + self.crit_chance;
        self.attack_speed_ms = (2000.0 / self.haste_mult) as u32;
    }

    /// Calculate pet ability damage
    pub fn calculate_damage(&self, base_min: f32, base_max: f32, ap_coeff: f32) -> f32 {
        let base = (base_min + base_max) * 0.5;
        let ap_damage = ap_coeff * self.attack_power;

        (base + ap_damage) * self.crit_mult * self.damage_multiplier
    }

    /// Calculate pet auto-attack damage
    pub fn calculate_auto_attack(&self, weapon_min: f32, weapon_max: f32) -> f32 {
        let base = (weapon_min + weapon_max) * 0.5;
        // Pet auto-attacks scale with AP
        let ap_bonus = self.attack_power / 14.0 * (self.attack_speed_ms as f32 / 1000.0);

        (base + ap_bonus) * self.crit_mult * self.damage_multiplier
    }
}
```

---

## Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHE INVALIDATION CHAINS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Strength Changed                                                          │
│        │                                                                    │
│        ├──► AttackPower (if ap_per_str > 0)                                 │
│        │         │                                                          │
│        │         └──► PetAttackPower                                        │
│        │                                                                    │
│        └──► ParryChance (if parry_per_str > 0)                              │
│                                                                             │
│   Agility Changed                                                           │
│        │                                                                    │
│        ├──► AttackPower (if ap_per_agi > 0)                                 │
│        │         │                                                          │
│        │         └──► PetAttackPower                                        │
│        │                                                                    │
│        ├──► CritChance (if crit_per_agi > 0)                                │
│        │                                                                    │
│        └──► DodgeChance (if dodge_per_agi > 0)                              │
│                                                                             │
│   Intellect Changed                                                         │
│        │                                                                    │
│        ├──► SpellPower (if sp_per_int > 0)                                  │
│        │         │                                                          │
│        │         └──► PetAttackPower (if ap_from_sp > 0)                    │
│        │                                                                    │
│        └──► CritChance (if crit_per_int > 0)                                │
│                                                                             │
│   Stamina Changed                                                           │
│        │                                                                    │
│        └──► MaxHealth                                                       │
│                                                                             │
│   VersatilityDamage Changed                                                 │
│        │                                                                    │
│        ├──► VersatilityMitigation                                           │
│        │                                                                    │
│        └──► DamageMultiplier                                                │
│                                                                             │
│   MasteryValue Changed                                                      │
│        │                                                                    │
│        └──► DamageMultiplier                                                │
│                                                                             │
│   HastePercent Changed                                                      │
│        │                                                                    │
│        ├──► GCD timing                                                      │
│        │                                                                    │
│        └──► AutoAttack timing                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Organization

```
crates/engine/src/
├── paperdoll/
│   ├── mod.rs              # Module exports
│   │   pub use types::*;
│   │   pub use paperdoll::Paperdoll;
│   │   pub use pet::PetStats;
│   │   pub use rating::RatingTable;
│   │
│   ├── types.rs            # Enums: Attribute, RatingType, CacheKey, ClassId, etc.
│   │   (320 lines)
│   │
│   ├── paperdoll.rs        # Main Paperdoll struct and methods
│   │   (450 lines)
│   │   - BaseStats, GearStats, ActiveModifiers
│   │   - StatCache
│   │   - Paperdoll::new(), recompute(), invalidate()
│   │   - apply_aura_effect(), remove_aura_effect()
│   │
│   ├── rating.rs           # Rating conversion tables and DR
│   │   (150 lines)
│   │   - RatingTable for level 70, 80
│   │   - rating_to_percent()
│   │   - apply_dr()
│   │
│   ├── coefficients.rs     # Class/spec coefficients
│   │   (200 lines)
│   │   - ClassCoefficients
│   │   - Per-spec coefficient definitions
│   │
│   └── pet.rs              # Pet stat inheritance
│       (280 lines)
│       - PetCoefficients
│       - PetStats
│       - update_from_owner()
│       - calculate_damage()
│
├── sim/
│   ├── state.rs            # Updated to use Paperdoll
│   │   - UnitState.paperdoll: Paperdoll
│   │   - PetState.pet_stats: PetStats
│   │
│   └── engine.rs           # Updated damage calculations
│       - Use cache.attack_power, cache.crit_mult, etc.
│       - Pet damage via pet_stats.calculate_damage()
│
└── config/
    ├── stats.rs            # DEPRECATED (keep for migration)
    └── sim_config.rs       # Updated to build Paperdoll from TOML
```

---

## Migration Path

### Phase 1: Add Paperdoll Module (Non-Breaking)

1. Create `paperdoll/` module with all types
2. Keep existing `Stats` struct working
3. Add conversion: `Stats -> Paperdoll`

### Phase 2: Update Engine to Use Paperdoll

1. Replace `state.player.stats` with `state.player.paperdoll`
2. Update damage calculations to use `cache.*`
3. Update GCD/timing to use `cache.gcd_ms`

### Phase 3: Add Pet Stats

1. Add `PetStats` to `PetState`
2. Implement `update_from_owner()`
3. Update pet damage calculations

### Phase 4: Add Aura Stat Effects

1. Implement `apply_aura_effect()` in aura application
2. Implement `remove_aura_effect()` on aura expire
3. Test with Bestial Wrath (+25% damage)

### Phase 5: Deprecate Old Stats

1. Update TOML schema to use new format
2. Remove old `Stats` struct
3. Update documentation
