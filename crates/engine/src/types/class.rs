use super::ResourceType;
use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
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

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
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

#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
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

/// Hunter pet specialization
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[repr(u8)]
pub enum PetType {
    Ferocity = 0,
    Tenacity = 1,
    Cunning = 2,
}

/// Pet summon kind (permanent vs temporary)
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
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
