//! Type definitions for SimC profile data

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tsify_next::Tsify;

// ============================================================================
// Enums
// ============================================================================

/// World of Warcraft class identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum WowClass {
    DeathKnight,
    DemonHunter,
    Druid,
    Evoker,
    Hunter,
    Mage,
    Monk,
    Paladin,
    Priest,
    Rogue,
    Shaman,
    Warlock,
    Warrior,
}

impl WowClass {
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "death_knight" | "deathknight" => Some(Self::DeathKnight),
            "demon_hunter" | "demonhunter" => Some(Self::DemonHunter),
            "druid" => Some(Self::Druid),
            "evoker" => Some(Self::Evoker),
            "hunter" => Some(Self::Hunter),
            "mage" => Some(Self::Mage),
            "monk" => Some(Self::Monk),
            "paladin" => Some(Self::Paladin),
            "priest" => Some(Self::Priest),
            "rogue" => Some(Self::Rogue),
            "shaman" => Some(Self::Shaman),
            "warlock" => Some(Self::Warlock),
            "warrior" => Some(Self::Warrior),
            _ => None,
        }
    }

    pub fn as_simc_str(&self) -> &'static str {
        match self {
            Self::DeathKnight => "death_knight",
            Self::DemonHunter => "demon_hunter",
            Self::Druid => "druid",
            Self::Evoker => "evoker",
            Self::Hunter => "hunter",
            Self::Mage => "mage",
            Self::Monk => "monk",
            Self::Paladin => "paladin",
            Self::Priest => "priest",
            Self::Rogue => "rogue",
            Self::Shaman => "shaman",
            Self::Warlock => "warlock",
            Self::Warrior => "warrior",
        }
    }
}

/// Equipment slot identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "snake_case")]
pub enum Slot {
    Head,
    Neck,
    Shoulder,
    Back,
    Chest,
    Wrist,
    Hands,
    Waist,
    Legs,
    Feet,
    Finger1,
    Finger2,
    Trinket1,
    Trinket2,
    MainHand,
    OffHand,
}

impl Slot {
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "head" => Some(Self::Head),
            "neck" => Some(Self::Neck),
            "shoulder" | "shoulders" => Some(Self::Shoulder),
            "back" | "cloak" => Some(Self::Back),
            "chest" => Some(Self::Chest),
            "wrist" | "wrists" => Some(Self::Wrist),
            "hands" => Some(Self::Hands),
            "waist" => Some(Self::Waist),
            "legs" => Some(Self::Legs),
            "feet" => Some(Self::Feet),
            "finger1" => Some(Self::Finger1),
            "finger2" => Some(Self::Finger2),
            "trinket1" => Some(Self::Trinket1),
            "trinket2" => Some(Self::Trinket2),
            "main_hand" => Some(Self::MainHand),
            "off_hand" => Some(Self::OffHand),
            _ => None,
        }
    }
}

// ============================================================================
// Item
// ============================================================================

/// A parsed equipment item
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub slot: Slot,
    pub id: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bonus_ids: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enchant_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gem_ids: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crafted_stats: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crafting_quality: Option<u8>,
}

// ============================================================================
// Character
// ============================================================================

/// A profession with skill rank
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Profession {
    pub name: String,
    pub rank: u32,
}

/// Character information from the profile
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub name: String,
    pub level: u32,
    pub race: String,
    pub class: WowClass,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spec: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub professions: Vec<Profession>,
}

// ============================================================================
// Talents
// ============================================================================

/// A saved talent loadout from profile comments
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Loadout {
    pub name: String,
    pub encoded: String,
}

/// Talent information
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub struct Talents {
    pub encoded: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub loadouts: Vec<Loadout>,
}

// ============================================================================
// Profile
// ============================================================================

/// A fully parsed SimC profile
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub character: Character,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub equipment: Vec<Item>,
    pub talents: Talents,
    #[serde(skip_serializing_if = "HashMap::is_empty", default)]
    pub extra: HashMap<String, String>,
}
