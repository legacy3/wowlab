//! Paperdoll type definitions
//!
//! Core enums for the paperdoll stat system including attributes,
//! rating types, cache keys, and identity types (class, spec, race, pet).

// ============================================================================
// Primary Attributes
// ============================================================================

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
    /// Total number of primary attributes
    pub const COUNT: usize = 4;

    /// Get all attribute variants
    pub const fn all() -> [Attribute; Self::COUNT] {
        [
            Attribute::Strength,
            Attribute::Agility,
            Attribute::Intellect,
            Attribute::Stamina,
        ]
    }
}

// ============================================================================
// Combat Rating Types
// ============================================================================

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
    /// Total number of rating types
    pub const COUNT: usize = 15;

    /// Get all rating type variants
    pub const fn all() -> [RatingType; Self::COUNT] {
        [
            RatingType::Dodge,
            RatingType::Parry,
            RatingType::Block,
            RatingType::CritMelee,
            RatingType::HasteMelee,
            RatingType::CritRanged,
            RatingType::HasteRanged,
            RatingType::CritSpell,
            RatingType::HasteSpell,
            RatingType::Mastery,
            RatingType::VersatilityDamage,
            RatingType::VersatilityHealing,
            RatingType::Leech,
            RatingType::Speed,
            RatingType::Avoidance,
        ]
    }

    /// Check if this is a defense rating
    pub const fn is_defense(&self) -> bool {
        matches!(self, RatingType::Dodge | RatingType::Parry | RatingType::Block)
    }

    /// Check if this is a tertiary rating
    pub const fn is_tertiary(&self) -> bool {
        matches!(self, RatingType::Leech | RatingType::Speed | RatingType::Avoidance)
    }
}

// ============================================================================
// Cache Keys
// ============================================================================

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
    /// Total number of cache keys
    pub const COUNT: usize = 20;

    /// Get the bitmask for this cache key
    #[inline]
    pub const fn mask(&self) -> u32 {
        1 << (*self as u32)
    }
}

impl From<Attribute> for CacheKey {
    fn from(attr: Attribute) -> Self {
        match attr {
            Attribute::Strength => CacheKey::Strength,
            Attribute::Agility => CacheKey::Agility,
            Attribute::Intellect => CacheKey::Intellect,
            Attribute::Stamina => CacheKey::Stamina,
        }
    }
}

// ============================================================================
// Class Identifiers
// ============================================================================

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

impl ClassId {
    /// Total number of classes
    pub const COUNT: usize = 13;

    /// Get the display name for this class
    pub const fn name(&self) -> &'static str {
        match self {
            ClassId::Warrior => "Warrior",
            ClassId::Paladin => "Paladin",
            ClassId::Hunter => "Hunter",
            ClassId::Rogue => "Rogue",
            ClassId::Priest => "Priest",
            ClassId::DeathKnight => "Death Knight",
            ClassId::Shaman => "Shaman",
            ClassId::Mage => "Mage",
            ClassId::Warlock => "Warlock",
            ClassId::Monk => "Monk",
            ClassId::Druid => "Druid",
            ClassId::DemonHunter => "Demon Hunter",
            ClassId::Evoker => "Evoker",
        }
    }
}

// ============================================================================
// Specialization Identifiers
// ============================================================================

/// Specialization identifiers
///
/// Uses the official WoW spec IDs. Currently focused on Hunter specs
/// with placeholders for other classes.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u16)]
pub enum SpecId {
    // -------------------------------------------------------------------------
    // Warrior (Class 1)
    // -------------------------------------------------------------------------
    Arms = 71,
    Fury = 72,
    ProtectionWarrior = 73,

    // -------------------------------------------------------------------------
    // Paladin (Class 2)
    // -------------------------------------------------------------------------
    Holy = 65,
    ProtectionPaladin = 66,
    Retribution = 70,

    // -------------------------------------------------------------------------
    // Hunter (Class 3)
    // -------------------------------------------------------------------------
    BeastMastery = 253,
    Marksmanship = 254,
    Survival = 255,

    // -------------------------------------------------------------------------
    // Rogue (Class 4)
    // -------------------------------------------------------------------------
    Assassination = 259,
    Outlaw = 260,
    Subtlety = 261,

    // -------------------------------------------------------------------------
    // Priest (Class 5)
    // -------------------------------------------------------------------------
    Discipline = 256,
    HolyPriest = 257,
    Shadow = 258,

    // -------------------------------------------------------------------------
    // Death Knight (Class 6)
    // -------------------------------------------------------------------------
    Blood = 250,
    Frost = 251,
    Unholy = 252,

    // -------------------------------------------------------------------------
    // Shaman (Class 7)
    // -------------------------------------------------------------------------
    Elemental = 262,
    Enhancement = 263,
    Restoration = 264,

    // -------------------------------------------------------------------------
    // Mage (Class 8)
    // -------------------------------------------------------------------------
    Arcane = 62,
    Fire = 63,
    FrostMage = 64,

    // -------------------------------------------------------------------------
    // Warlock (Class 9)
    // -------------------------------------------------------------------------
    Affliction = 265,
    Demonology = 266,
    Destruction = 267,

    // -------------------------------------------------------------------------
    // Monk (Class 10)
    // -------------------------------------------------------------------------
    Brewmaster = 268,
    Mistweaver = 270,
    Windwalker = 269,

    // -------------------------------------------------------------------------
    // Druid (Class 11)
    // -------------------------------------------------------------------------
    Balance = 102,
    Feral = 103,
    Guardian = 104,
    RestorationDruid = 105,

    // -------------------------------------------------------------------------
    // Demon Hunter (Class 12)
    // -------------------------------------------------------------------------
    Havoc = 577,
    Vengeance = 581,

    // -------------------------------------------------------------------------
    // Evoker (Class 13)
    // -------------------------------------------------------------------------
    Devastation = 1467,
    Preservation = 1468,
    Augmentation = 1473,
}

impl SpecId {
    /// Get the class this spec belongs to
    pub const fn class(&self) -> ClassId {
        match self {
            SpecId::Arms | SpecId::Fury | SpecId::ProtectionWarrior => ClassId::Warrior,
            SpecId::Holy | SpecId::ProtectionPaladin | SpecId::Retribution => ClassId::Paladin,
            SpecId::BeastMastery | SpecId::Marksmanship | SpecId::Survival => ClassId::Hunter,
            SpecId::Assassination | SpecId::Outlaw | SpecId::Subtlety => ClassId::Rogue,
            SpecId::Discipline | SpecId::HolyPriest | SpecId::Shadow => ClassId::Priest,
            SpecId::Blood | SpecId::Frost | SpecId::Unholy => ClassId::DeathKnight,
            SpecId::Elemental | SpecId::Enhancement | SpecId::Restoration => ClassId::Shaman,
            SpecId::Arcane | SpecId::Fire | SpecId::FrostMage => ClassId::Mage,
            SpecId::Affliction | SpecId::Demonology | SpecId::Destruction => ClassId::Warlock,
            SpecId::Brewmaster | SpecId::Mistweaver | SpecId::Windwalker => ClassId::Monk,
            SpecId::Balance | SpecId::Feral | SpecId::Guardian | SpecId::RestorationDruid => {
                ClassId::Druid
            }
            SpecId::Havoc | SpecId::Vengeance => ClassId::DemonHunter,
            SpecId::Devastation | SpecId::Preservation | SpecId::Augmentation => ClassId::Evoker,
        }
    }

    /// Get the display name for this spec
    pub const fn name(&self) -> &'static str {
        match self {
            // Warrior
            SpecId::Arms => "Arms",
            SpecId::Fury => "Fury",
            SpecId::ProtectionWarrior => "Protection",
            // Paladin
            SpecId::Holy => "Holy",
            SpecId::ProtectionPaladin => "Protection",
            SpecId::Retribution => "Retribution",
            // Hunter
            SpecId::BeastMastery => "Beast Mastery",
            SpecId::Marksmanship => "Marksmanship",
            SpecId::Survival => "Survival",
            // Rogue
            SpecId::Assassination => "Assassination",
            SpecId::Outlaw => "Outlaw",
            SpecId::Subtlety => "Subtlety",
            // Priest
            SpecId::Discipline => "Discipline",
            SpecId::HolyPriest => "Holy",
            SpecId::Shadow => "Shadow",
            // Death Knight
            SpecId::Blood => "Blood",
            SpecId::Frost => "Frost",
            SpecId::Unholy => "Unholy",
            // Shaman
            SpecId::Elemental => "Elemental",
            SpecId::Enhancement => "Enhancement",
            SpecId::Restoration => "Restoration",
            // Mage
            SpecId::Arcane => "Arcane",
            SpecId::Fire => "Fire",
            SpecId::FrostMage => "Frost",
            // Warlock
            SpecId::Affliction => "Affliction",
            SpecId::Demonology => "Demonology",
            SpecId::Destruction => "Destruction",
            // Monk
            SpecId::Brewmaster => "Brewmaster",
            SpecId::Mistweaver => "Mistweaver",
            SpecId::Windwalker => "Windwalker",
            // Druid
            SpecId::Balance => "Balance",
            SpecId::Feral => "Feral",
            SpecId::Guardian => "Guardian",
            SpecId::RestorationDruid => "Restoration",
            // Demon Hunter
            SpecId::Havoc => "Havoc",
            SpecId::Vengeance => "Vengeance",
            // Evoker
            SpecId::Devastation => "Devastation",
            SpecId::Preservation => "Preservation",
            SpecId::Augmentation => "Augmentation",
        }
    }

    /// Get the primary stat for this spec
    pub const fn primary_stat(&self) -> Attribute {
        match self {
            // Agility specs
            SpecId::BeastMastery
            | SpecId::Marksmanship
            | SpecId::Survival
            | SpecId::Assassination
            | SpecId::Outlaw
            | SpecId::Subtlety
            | SpecId::Enhancement
            | SpecId::Feral
            | SpecId::Guardian
            | SpecId::Brewmaster
            | SpecId::Windwalker
            | SpecId::Havoc
            | SpecId::Vengeance => Attribute::Agility,

            // Intellect specs
            SpecId::Holy
            | SpecId::Discipline
            | SpecId::HolyPriest
            | SpecId::Shadow
            | SpecId::Elemental
            | SpecId::Restoration
            | SpecId::Arcane
            | SpecId::Fire
            | SpecId::FrostMage
            | SpecId::Affliction
            | SpecId::Demonology
            | SpecId::Destruction
            | SpecId::Mistweaver
            | SpecId::Balance
            | SpecId::RestorationDruid
            | SpecId::Devastation
            | SpecId::Preservation
            | SpecId::Augmentation => Attribute::Intellect,

            // Strength specs
            SpecId::Arms
            | SpecId::Fury
            | SpecId::ProtectionWarrior
            | SpecId::ProtectionPaladin
            | SpecId::Retribution
            | SpecId::Blood
            | SpecId::Frost
            | SpecId::Unholy => Attribute::Strength,
        }
    }
}

// ============================================================================
// Race Identifiers
// ============================================================================

/// Race identifiers
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum RaceId {
    // Alliance
    Human = 1,
    Dwarf = 3,
    NightElf = 4,
    Gnome = 7,
    Draenei = 11,
    Worgen = 22,
    VoidElf = 29,
    LightforgedDraenei = 30,
    DarkIronDwarf = 34,
    KulTiran = 32,
    Mechagnome = 37,

    // Horde
    Orc = 2,
    Undead = 5,
    Tauren = 6,
    Troll = 8,
    BloodElf = 10,
    Goblin = 9,
    Nightborne = 27,
    HighmountainTauren = 28,
    MagharOrc = 36,
    ZandalariTroll = 31,
    Vulpera = 35,

    // Neutral
    Pandaren = 24,
    Dracthyr = 52,
    Earthen = 85,
}

impl RaceId {
    /// Check if this race is Alliance
    pub const fn is_alliance(&self) -> bool {
        matches!(
            self,
            RaceId::Human
                | RaceId::Dwarf
                | RaceId::NightElf
                | RaceId::Gnome
                | RaceId::Draenei
                | RaceId::Worgen
                | RaceId::VoidElf
                | RaceId::LightforgedDraenei
                | RaceId::DarkIronDwarf
                | RaceId::KulTiran
                | RaceId::Mechagnome
        )
    }

    /// Check if this race is Horde
    pub const fn is_horde(&self) -> bool {
        matches!(
            self,
            RaceId::Orc
                | RaceId::Undead
                | RaceId::Tauren
                | RaceId::Troll
                | RaceId::BloodElf
                | RaceId::Goblin
                | RaceId::Nightborne
                | RaceId::HighmountainTauren
                | RaceId::MagharOrc
                | RaceId::ZandalariTroll
                | RaceId::Vulpera
        )
    }

    /// Check if this race is neutral (can be either faction)
    pub const fn is_neutral(&self) -> bool {
        matches!(self, RaceId::Pandaren | RaceId::Dracthyr | RaceId::Earthen)
    }

    /// Get the display name for this race
    pub const fn name(&self) -> &'static str {
        match self {
            RaceId::Human => "Human",
            RaceId::Dwarf => "Dwarf",
            RaceId::NightElf => "Night Elf",
            RaceId::Gnome => "Gnome",
            RaceId::Draenei => "Draenei",
            RaceId::Worgen => "Worgen",
            RaceId::VoidElf => "Void Elf",
            RaceId::LightforgedDraenei => "Lightforged Draenei",
            RaceId::DarkIronDwarf => "Dark Iron Dwarf",
            RaceId::KulTiran => "Kul Tiran",
            RaceId::Mechagnome => "Mechagnome",
            RaceId::Orc => "Orc",
            RaceId::Undead => "Undead",
            RaceId::Tauren => "Tauren",
            RaceId::Troll => "Troll",
            RaceId::BloodElf => "Blood Elf",
            RaceId::Goblin => "Goblin",
            RaceId::Nightborne => "Nightborne",
            RaceId::HighmountainTauren => "Highmountain Tauren",
            RaceId::MagharOrc => "Mag'har Orc",
            RaceId::ZandalariTroll => "Zandalari Troll",
            RaceId::Vulpera => "Vulpera",
            RaceId::Pandaren => "Pandaren",
            RaceId::Dracthyr => "Dracthyr",
            RaceId::Earthen => "Earthen",
        }
    }
}

// ============================================================================
// Pet Types
// ============================================================================

/// Pet type for inheritance coefficient lookup
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum PetType {
    // -------------------------------------------------------------------------
    // Hunter pets
    // -------------------------------------------------------------------------
    /// Hunter main pet (basic 60% AP scaling)
    HunterMainPet = 0,
    /// Animal Companion talent second pet
    HunterAnimalCompanion = 1,
    /// Dire Beast summon (100% AP scaling)
    HunterDireBeast = 2,
    /// Call of the Wild beasts
    HunterCallOfTheWild = 3,
    /// Dark Hound hero talent pet - Beast Mastery (500% AP scaling)
    HunterDarkHoundBm = 4,
    /// Dark Hound hero talent pet - other specs (605% AP scaling)
    HunterDarkHound = 5,
    /// Generic hero pet (200% AP scaling) - covers Fenryr/Hati style pets
    HunterHeroPet = 6,
    /// Fenryr hero pet (200% AP scaling)
    HunterFenryr = 7,
    /// Hati hero pet (200% AP scaling)
    HunterHati = 8,

    // -------------------------------------------------------------------------
    // Warlock pets
    // -------------------------------------------------------------------------
    /// Imp demon
    WarlockImp = 10,
    /// Voidwalker demon
    WarlockVoidwalker = 11,
    /// Felhunter demon
    WarlockFelhunter = 12,
    /// Succubus/Incubus demon
    WarlockSuccubus = 13,
    /// Felguard demon (Demonology)
    WarlockFelguard = 14,
    /// Dreadstalker summons
    WarlockDreadstalker = 15,
    /// Wild Imp summons
    WarlockWildImp = 16,
    /// Demonic Tyrant
    WarlockDemonicTyrant = 17,

    // -------------------------------------------------------------------------
    // Death Knight pets
    // -------------------------------------------------------------------------
    /// Permanent ghoul (Unholy)
    DKGhoul = 20,
    /// Army of the Dead ghouls
    DKArmyGhoul = 21,
    /// Apocalypse ghouls
    DKApocalypseGhoul = 22,
    /// Gargoyle summon
    DKGargoyle = 23,
    /// Abomination summon
    DKAbomination = 24,
    /// Magus of the Dead
    DKMagus = 25,

    // -------------------------------------------------------------------------
    // Other class pets
    // -------------------------------------------------------------------------
    /// Mage Water Elemental
    MageWaterElemental = 30,
    /// Shaman Spirit Wolves
    ShamanSpiritWolves = 31,
    /// Shaman Fire/Earth Elemental
    ShamanElemental = 32,
    /// Monk Xuen/Niuzao/etc
    MonkCelestial = 33,
    /// Priest Shadowfiend/Mindbender
    PriestShadowfiend = 34,

    // -------------------------------------------------------------------------
    // Generic types
    // -------------------------------------------------------------------------
    /// Generic guardian pet (temporary summons)
    Guardian = 50,
}

impl PetType {
    /// Check if this is a Hunter pet
    pub const fn is_hunter_pet(&self) -> bool {
        matches!(
            self,
            PetType::HunterMainPet
                | PetType::HunterAnimalCompanion
                | PetType::HunterDireBeast
                | PetType::HunterCallOfTheWild
                | PetType::HunterDarkHoundBm
                | PetType::HunterDarkHound
                | PetType::HunterHeroPet
                | PetType::HunterFenryr
                | PetType::HunterHati
        )
    }

    /// Check if this is a Warlock pet
    pub const fn is_warlock_pet(&self) -> bool {
        matches!(
            self,
            PetType::WarlockImp
                | PetType::WarlockVoidwalker
                | PetType::WarlockFelhunter
                | PetType::WarlockSuccubus
                | PetType::WarlockFelguard
                | PetType::WarlockDreadstalker
                | PetType::WarlockWildImp
                | PetType::WarlockDemonicTyrant
        )
    }

    /// Check if this is a Death Knight pet
    pub const fn is_dk_pet(&self) -> bool {
        matches!(
            self,
            PetType::DKGhoul
                | PetType::DKArmyGhoul
                | PetType::DKApocalypseGhoul
                | PetType::DKGargoyle
                | PetType::DKAbomination
                | PetType::DKMagus
        )
    }

    /// Check if this is a permanent pet (persists between combat)
    pub const fn is_permanent(&self) -> bool {
        matches!(
            self,
            PetType::HunterMainPet
                | PetType::HunterAnimalCompanion
                | PetType::WarlockImp
                | PetType::WarlockVoidwalker
                | PetType::WarlockFelhunter
                | PetType::WarlockSuccubus
                | PetType::WarlockFelguard
                | PetType::DKGhoul
                | PetType::MageWaterElemental
        )
    }

    /// Get the display name for this pet type
    pub const fn name(&self) -> &'static str {
        match self {
            PetType::HunterMainPet => "Hunter Pet",
            PetType::HunterAnimalCompanion => "Animal Companion",
            PetType::HunterDireBeast => "Dire Beast",
            PetType::HunterCallOfTheWild => "Call of the Wild Beast",
            PetType::HunterDarkHoundBm => "Dark Hound (BM)",
            PetType::HunterDarkHound => "Dark Hound",
            PetType::HunterHeroPet => "Hero Pet",
            PetType::HunterFenryr => "Fenryr",
            PetType::HunterHati => "Hati",
            PetType::WarlockImp => "Imp",
            PetType::WarlockVoidwalker => "Voidwalker",
            PetType::WarlockFelhunter => "Felhunter",
            PetType::WarlockSuccubus => "Succubus",
            PetType::WarlockFelguard => "Felguard",
            PetType::WarlockDreadstalker => "Dreadstalker",
            PetType::WarlockWildImp => "Wild Imp",
            PetType::WarlockDemonicTyrant => "Demonic Tyrant",
            PetType::DKGhoul => "Ghoul",
            PetType::DKArmyGhoul => "Army Ghoul",
            PetType::DKApocalypseGhoul => "Apocalypse Ghoul",
            PetType::DKGargoyle => "Gargoyle",
            PetType::DKAbomination => "Abomination",
            PetType::DKMagus => "Magus of the Dead",
            PetType::MageWaterElemental => "Water Elemental",
            PetType::ShamanSpiritWolves => "Spirit Wolves",
            PetType::ShamanElemental => "Elemental",
            PetType::MonkCelestial => "Celestial",
            PetType::PriestShadowfiend => "Shadowfiend",
            PetType::Guardian => "Guardian",
        }
    }
}

impl Default for PetType {
    fn default() -> Self {
        PetType::Guardian
    }
}

// ============================================================================
// Mastery Effect Types
// ============================================================================

/// How a spec's mastery affects gameplay.
///
/// Different specs have fundamentally different mastery mechanics:
/// some apply a flat damage multiplier, others increase proc chances,
/// affect pet damage, or scale DoT effects.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MasteryEffect {
    /// Simple percentage multiplier to damage done (most common).
    /// Used by: Arms Warrior, Marksmanship Hunter, etc.
    DamageMultiplier {
        /// Base percentage at 0 mastery rating (e.g., 5.0 = 5%).
        base_percent: f32,
        /// Additional percentage per point of mastery (e.g., 1.2 = 1.2% per point).
        per_mastery: f32,
    },

    /// Multiplier to pet damage specifically.
    /// Used by: BM Hunter (Master of Beasts), Demonology Warlock.
    PetDamageMultiplier {
        /// Base percentage at 0 mastery rating.
        base_percent: f32,
        /// Additional percentage per point of mastery.
        per_mastery: f32,
    },

    /// Multiplier to DoT/bleed damage.
    /// Used by: Assassination Rogue, Feral Druid, Affliction Warlock.
    DotMultiplier {
        /// Base percentage at 0 mastery rating.
        base_percent: f32,
        /// Additional percentage per point of mastery.
        per_mastery: f32,
    },

    /// Proc chance scaling (like Icicles, Elemental Overload).
    /// Used by: Frost Mage, Elemental Shaman.
    ProcChance {
        /// Base proc chance at 0 mastery rating.
        base_chance: f32,
        /// Additional proc chance per point of mastery.
        per_mastery: f32,
    },

    /// Generic multiplier with coefficient (legacy behavior).
    /// Fallback for unimplemented specs or simple percentage scaling.
    Generic {
        /// Multiplier applied to mastery percentage.
        coefficient: f32,
    },
}

impl MasteryEffect {
    /// Calculate the mastery bonus value given the mastery percentage from rating.
    ///
    /// # Arguments
    ///
    /// * `mastery_pct` - The mastery percentage from rating conversion (0.0 to ~0.50).
    ///
    /// # Returns
    ///
    /// The effective mastery bonus value. For multiplier types, this is the
    /// percentage bonus (e.g., 0.25 = 25% bonus). For proc chances, this is
    /// the proc chance as a decimal.
    pub fn calculate_bonus(&self, mastery_pct: f32) -> f32 {
        match self {
            MasteryEffect::DamageMultiplier {
                base_percent,
                per_mastery,
            }
            | MasteryEffect::PetDamageMultiplier {
                base_percent,
                per_mastery,
            }
            | MasteryEffect::DotMultiplier {
                base_percent,
                per_mastery,
            } => {
                // Convert from percentage to decimal and add scaling
                // mastery_pct is already a decimal (e.g., 0.30 for 30%)
                // We treat mastery_pct * 100 as "mastery points" for scaling
                (base_percent + mastery_pct * 100.0 * per_mastery) / 100.0
            }
            MasteryEffect::ProcChance {
                base_chance,
                per_mastery,
            } => {
                // Proc chance: base + (mastery_pct * 100) * per_mastery, as decimal
                (base_chance + mastery_pct * 100.0 * per_mastery) / 100.0
            }
            MasteryEffect::Generic { coefficient } => {
                // Legacy behavior: simple multiplication
                mastery_pct * coefficient
            }
        }
    }

    /// Get the mastery effect type as a descriptive string.
    pub const fn effect_type(&self) -> &'static str {
        match self {
            MasteryEffect::DamageMultiplier { .. } => "Damage Multiplier",
            MasteryEffect::PetDamageMultiplier { .. } => "Pet Damage Multiplier",
            MasteryEffect::DotMultiplier { .. } => "DoT Multiplier",
            MasteryEffect::ProcChance { .. } => "Proc Chance",
            MasteryEffect::Generic { .. } => "Generic",
        }
    }
}

impl Default for MasteryEffect {
    fn default() -> Self {
        MasteryEffect::Generic { coefficient: 1.0 }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn attribute_count() {
        assert_eq!(Attribute::COUNT, 4);
        assert_eq!(Attribute::all().len(), Attribute::COUNT);
    }

    #[test]
    fn rating_type_count() {
        assert_eq!(RatingType::COUNT, 15);
        assert_eq!(RatingType::all().len(), RatingType::COUNT);
    }

    #[test]
    fn cache_key_count() {
        assert_eq!(CacheKey::COUNT, 20);
    }

    #[test]
    fn cache_key_masks() {
        assert_eq!(CacheKey::Strength.mask(), 1);
        assert_eq!(CacheKey::Agility.mask(), 2);
        assert_eq!(CacheKey::AttackPower.mask(), 16);
        assert_eq!(CacheKey::PetAttackPower.mask(), 1 << 19);
    }

    #[test]
    fn attribute_to_cache_key() {
        assert_eq!(CacheKey::from(Attribute::Strength), CacheKey::Strength);
        assert_eq!(CacheKey::from(Attribute::Agility), CacheKey::Agility);
        assert_eq!(CacheKey::from(Attribute::Intellect), CacheKey::Intellect);
        assert_eq!(CacheKey::from(Attribute::Stamina), CacheKey::Stamina);
    }

    #[test]
    fn spec_class_mapping() {
        assert_eq!(SpecId::BeastMastery.class(), ClassId::Hunter);
        assert_eq!(SpecId::Marksmanship.class(), ClassId::Hunter);
        assert_eq!(SpecId::Survival.class(), ClassId::Hunter);
        assert_eq!(SpecId::Fury.class(), ClassId::Warrior);
        assert_eq!(SpecId::Affliction.class(), ClassId::Warlock);
    }

    #[test]
    fn spec_primary_stats() {
        assert_eq!(SpecId::BeastMastery.primary_stat(), Attribute::Agility);
        assert_eq!(SpecId::Fury.primary_stat(), Attribute::Strength);
        assert_eq!(SpecId::Fire.primary_stat(), Attribute::Intellect);
    }

    #[test]
    fn race_factions() {
        assert!(RaceId::Human.is_alliance());
        assert!(!RaceId::Human.is_horde());
        assert!(RaceId::Orc.is_horde());
        assert!(!RaceId::Orc.is_alliance());
        assert!(RaceId::Pandaren.is_neutral());
    }

    #[test]
    fn pet_type_categories() {
        assert!(PetType::HunterMainPet.is_hunter_pet());
        assert!(PetType::HunterMainPet.is_permanent());
        assert!(PetType::WarlockImp.is_warlock_pet());
        assert!(PetType::DKGhoul.is_dk_pet());
        assert!(!PetType::HunterDireBeast.is_permanent());
    }

    #[test]
    fn repr_sizes() {
        // Verify repr sizes are as expected
        assert_eq!(std::mem::size_of::<Attribute>(), 1);
        assert_eq!(std::mem::size_of::<RatingType>(), 1);
        assert_eq!(std::mem::size_of::<CacheKey>(), 1);
        assert_eq!(std::mem::size_of::<ClassId>(), 1);
        assert_eq!(std::mem::size_of::<SpecId>(), 2);
        assert_eq!(std::mem::size_of::<RaceId>(), 1);
        assert_eq!(std::mem::size_of::<PetType>(), 1);
    }

    #[test]
    fn mastery_effect_default() {
        let effect = MasteryEffect::default();
        assert_eq!(effect, MasteryEffect::Generic { coefficient: 1.0 });
    }

    #[test]
    fn mastery_effect_damage_multiplier() {
        // BM Hunter: 18% base + 1.7% per mastery point
        let effect = MasteryEffect::PetDamageMultiplier {
            base_percent: 18.0,
            per_mastery: 1.7,
        };

        // At 0% mastery rating, should be 18% (0.18)
        let bonus = effect.calculate_bonus(0.0);
        assert!((bonus - 0.18).abs() < 0.001);

        // At 10% mastery rating (10 "points"), should be 18% + 17% = 35% (0.35)
        let bonus = effect.calculate_bonus(0.10);
        assert!((bonus - 0.35).abs() < 0.001);

        // At 30% mastery rating (30 "points"), should be 18% + 51% = 69% (0.69)
        let bonus = effect.calculate_bonus(0.30);
        assert!((bonus - 0.69).abs() < 0.001);
    }

    #[test]
    fn mastery_effect_proc_chance() {
        // Frost Mage Icicles: 12% base + 1.5% per mastery
        let effect = MasteryEffect::ProcChance {
            base_chance: 12.0,
            per_mastery: 1.5,
        };

        // At 0% mastery, 12% proc chance
        let bonus = effect.calculate_bonus(0.0);
        assert!((bonus - 0.12).abs() < 0.001);

        // At 20% mastery, 12% + 30% = 42% proc chance
        let bonus = effect.calculate_bonus(0.20);
        assert!((bonus - 0.42).abs() < 0.001);
    }

    #[test]
    fn mastery_effect_generic() {
        // Generic with 1.7 coefficient (old BM behavior)
        let effect = MasteryEffect::Generic { coefficient: 1.7 };

        // At 10% mastery, should be 0.10 * 1.7 = 0.17
        let bonus = effect.calculate_bonus(0.10);
        assert!((bonus - 0.17).abs() < 0.001);

        // At 30% mastery, should be 0.30 * 1.7 = 0.51
        let bonus = effect.calculate_bonus(0.30);
        assert!((bonus - 0.51).abs() < 0.001);
    }

    #[test]
    fn mastery_effect_type_names() {
        assert_eq!(
            MasteryEffect::DamageMultiplier {
                base_percent: 0.0,
                per_mastery: 0.0
            }
            .effect_type(),
            "Damage Multiplier"
        );
        assert_eq!(
            MasteryEffect::PetDamageMultiplier {
                base_percent: 0.0,
                per_mastery: 0.0
            }
            .effect_type(),
            "Pet Damage Multiplier"
        );
        assert_eq!(
            MasteryEffect::DotMultiplier {
                base_percent: 0.0,
                per_mastery: 0.0
            }
            .effect_type(),
            "DoT Multiplier"
        );
        assert_eq!(
            MasteryEffect::ProcChance {
                base_chance: 0.0,
                per_mastery: 0.0
            }
            .effect_type(),
            "Proc Chance"
        );
        assert_eq!(
            MasteryEffect::Generic { coefficient: 1.0 }.effect_type(),
            "Generic"
        );
    }
}
