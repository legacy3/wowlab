use super::ResourceType;
use serde::{Serialize, Deserialize};

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
