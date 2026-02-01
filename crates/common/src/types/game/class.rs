//! Class, spec, and race types.

use super::super::combat::ResourceType;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use strum::{Display, EnumCount, EnumIter, EnumString};

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum ClassId {
    Warrior = 1,
    Paladin = 2,
    Hunter = 3,
    Rogue = 4,
    Priest = 5,
    #[strum(serialize = "Death Knight", serialize = "DeathKnight")]
    DeathKnight = 6,
    Shaman = 7,
    Mage = 8,
    Warlock = 9,
    Monk = 10,
    Druid = 11,
    #[strum(serialize = "Demon Hunter", serialize = "DemonHunter")]
    DemonHunter = 12,
    Evoker = 13,
}

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum SpecId {
    // Warrior
    Arms = 1,
    Fury = 2,
    #[strum(serialize = "Protection Warrior", serialize = "ProtWarrior")]
    ProtWarrior = 3,
    // Paladin
    #[strum(serialize = "Holy Paladin", serialize = "HolyPaladin")]
    HolyPaladin = 4,
    #[strum(serialize = "Protection Paladin", serialize = "ProtPaladin")]
    ProtPaladin = 5,
    Retribution = 6,
    // Hunter
    #[strum(
        serialize = "Beast Mastery",
        serialize = "BeastMastery",
        serialize = "bm"
    )]
    BeastMastery = 7,
    #[strum(serialize = "Marksmanship", serialize = "mm")]
    Marksmanship = 8,
    Survival = 9,
    // Rogue
    Assassination = 10,
    Outlaw = 11,
    Subtlety = 12,
    // Priest
    Discipline = 13,
    #[strum(serialize = "Holy Priest", serialize = "HolyPriest")]
    HolyPriest = 14,
    Shadow = 15,
    // Death Knight
    Blood = 16,
    #[strum(serialize = "Frost DK", serialize = "FrostDK")]
    FrostDK = 17,
    Unholy = 18,
    // Shaman
    Elemental = 19,
    Enhancement = 20,
    #[strum(serialize = "Restoration Shaman", serialize = "RestoShaman")]
    RestoShaman = 21,
    // Mage
    Arcane = 22,
    Fire = 23,
    #[strum(serialize = "Frost Mage", serialize = "FrostMage")]
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
    #[strum(serialize = "Restoration Druid", serialize = "RestoDruid")]
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
    pub const COUNT: usize = <Self as strum::EnumCount>::COUNT;

    /// Returns the WoW API spec ID (used in GetSpecialization, etc).
    pub const fn wow_spec_id(self) -> u32 {
        match self {
            // Warrior
            Self::Arms => 71,
            Self::Fury => 72,
            Self::ProtWarrior => 73,
            // Paladin
            Self::HolyPaladin => 65,
            Self::ProtPaladin => 66,
            Self::Retribution => 70,
            // Hunter
            Self::BeastMastery => 253,
            Self::Marksmanship => 254,
            Self::Survival => 255,
            // Rogue
            Self::Assassination => 259,
            Self::Outlaw => 260,
            Self::Subtlety => 261,
            // Priest
            Self::Discipline => 256,
            Self::HolyPriest => 257,
            Self::Shadow => 258,
            // Death Knight
            Self::Blood => 250,
            Self::FrostDK => 251,
            Self::Unholy => 252,
            // Shaman
            Self::Elemental => 262,
            Self::Enhancement => 263,
            Self::RestoShaman => 264,
            // Mage
            Self::Arcane => 62,
            Self::Fire => 63,
            Self::FrostMage => 64,
            // Warlock
            Self::Affliction => 265,
            Self::Demonology => 266,
            Self::Destruction => 267,
            // Monk
            Self::Brewmaster => 268,
            Self::Mistweaver => 270,
            Self::Windwalker => 269,
            // Druid
            Self::Balance => 102,
            Self::Feral => 103,
            Self::Guardian => 104,
            Self::RestoDruid => 105,
            // Demon Hunter
            Self::Havoc => 577,
            Self::Vengeance => 581,
            // Evoker
            Self::Devastation => 1467,
            Self::Preservation => 1468,
            Self::Augmentation => 1473,
        }
    }

    /// Convert from WoW API spec ID to SpecId.
    pub const fn from_wow_spec_id(wow_id: u32) -> Option<Self> {
        Some(match wow_id {
            // Warrior
            71 => Self::Arms,
            72 => Self::Fury,
            73 => Self::ProtWarrior,
            // Paladin
            65 => Self::HolyPaladin,
            66 => Self::ProtPaladin,
            70 => Self::Retribution,
            // Hunter
            253 => Self::BeastMastery,
            254 => Self::Marksmanship,
            255 => Self::Survival,
            // Rogue
            259 => Self::Assassination,
            260 => Self::Outlaw,
            261 => Self::Subtlety,
            // Priest
            256 => Self::Discipline,
            257 => Self::HolyPriest,
            258 => Self::Shadow,
            // Death Knight
            250 => Self::Blood,
            251 => Self::FrostDK,
            252 => Self::Unholy,
            // Shaman
            262 => Self::Elemental,
            263 => Self::Enhancement,
            264 => Self::RestoShaman,
            // Mage
            62 => Self::Arcane,
            63 => Self::Fire,
            64 => Self::FrostMage,
            // Warlock
            265 => Self::Affliction,
            266 => Self::Demonology,
            267 => Self::Destruction,
            // Monk
            268 => Self::Brewmaster,
            270 => Self::Mistweaver,
            269 => Self::Windwalker,
            // Druid
            102 => Self::Balance,
            103 => Self::Feral,
            104 => Self::Guardian,
            105 => Self::RestoDruid,
            // Demon Hunter
            577 => Self::Havoc,
            581 => Self::Vengeance,
            // Evoker
            1467 => Self::Devastation,
            1468 => Self::Preservation,
            1473 => Self::Augmentation,
            _ => return None,
        })
    }

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

#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum RaceId {
    Human = 1,
    Orc = 2,
    Dwarf = 3,
    #[strum(serialize = "Night Elf", serialize = "NightElf")]
    NightElf = 4,
    Undead = 5,
    Tauren = 6,
    Gnome = 7,
    Troll = 8,
    Goblin = 9,
    #[strum(serialize = "Blood Elf", serialize = "BloodElf")]
    BloodElf = 10,
    Draenei = 11,
    Worgen = 12,
    #[strum(serialize = "Pandaren (Alliance)", serialize = "PandarenA")]
    PandarenA = 13,
    #[strum(serialize = "Pandaren (Horde)", serialize = "PandarenH")]
    PandarenH = 14,
    Nightborne = 15,
    #[strum(serialize = "Highmountain Tauren", serialize = "HighmountainTauren")]
    HighmountainTauren = 16,
    #[strum(serialize = "Void Elf", serialize = "VoidElf")]
    VoidElf = 17,
    #[strum(serialize = "Lightforged Draenei", serialize = "LightforgedDraenei")]
    LightforgedDraenei = 18,
    #[strum(serialize = "Zandalari Troll", serialize = "ZandalariTroll")]
    ZandalariTroll = 19,
    #[strum(serialize = "Kul Tiran", serialize = "KulTiran")]
    KulTiran = 20,
    #[strum(serialize = "Dark Iron Dwarf", serialize = "DarkIronDwarf")]
    DarkIronDwarf = 21,
    Vulpera = 22,
    #[strum(serialize = "Mag'har Orc", serialize = "MagharOrc")]
    MagharOrc = 23,
    Mechagnome = 24,
    Dracthyr = 25,
    #[strum(serialize = "Earthen (Alliance)", serialize = "EarthenA")]
    EarthenA = 26,
    #[strum(serialize = "Earthen (Horde)", serialize = "EarthenH")]
    EarthenH = 27,
}

/// Hunter pet specialization
#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum PetType {
    Ferocity = 0,
    Tenacity = 1,
    Cunning = 2,
}

/// Pet summon kind (permanent vs temporary)
#[derive(
    Copy,
    Clone,
    Debug,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    Display,
    EnumIter,
    EnumString,
    EnumCount,
    IntoPrimitive,
    TryFromPrimitive,
)]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum PetKind {
    /// Permanent pet (Hunter pet, Warlock demon)
    Permanent = 0,
    /// Guardian summon (totems, temporary guardians)
    Guardian = 1,
    /// Short-lived summon
    Summon = 2,
}
