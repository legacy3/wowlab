//! ItemDataFlat - Flat representation of item data

use serde::{Deserialize, Serialize};

/// A stat on an item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemStat {
    #[serde(rename = "type")]
    pub stat_type: i32,
    pub value: i32,
}

/// An effect (proc/use) on an item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemEffect {
    pub spell_id: i32,
    pub trigger_type: i32,
    pub charges: i32,
    pub cooldown: i32,
    pub category_cooldown: i32,
}

/// Item classification info
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemClassification {
    pub class_id: i32,
    pub class_name: String,
    pub subclass_id: i32,
    pub subclass_name: String,
    pub inventory_type: i32,
    pub inventory_type_name: String,
    pub expansion_id: i32,
    pub expansion_name: String,
}

/// Item set info
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemSetInfo {
    pub set_id: i32,
    pub set_name: String,
    pub item_ids: Vec<i32>,
    pub bonuses: Vec<ItemSetBonus>,
}

/// A set bonus
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemSetBonus {
    pub threshold: i32,
    pub spell_id: i32,
    pub spec_id: i32,
}

/// A drop source for an item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ItemDropSource {
    pub instance_id: i32,
    pub instance_name: String,
    pub encounter_id: i32,
    pub encounter_name: String,
    pub difficulty_mask: i32,
}

/// Flat item data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemDataFlat {
    // Basic
    pub id: i32,
    pub name: String,
    pub description: String,
    pub file_name: String,
    pub item_level: i32,
    pub quality: i32,
    pub required_level: i32,
    pub binding: i32,
    pub buy_price: i32,
    pub sell_price: i32,
    pub max_count: i32,
    pub stackable: i32,
    pub speed: i32,

    // Classification
    pub class_id: i32,
    pub subclass_id: i32,
    pub inventory_type: i32,
    pub classification: Option<ItemClassification>,

    // Stats & Effects
    pub stats: Vec<ItemStat>,
    pub effects: Vec<ItemEffect>,

    // Sockets
    pub sockets: Vec<i32>,
    pub socket_bonus_enchant_id: i32,

    // Flags
    pub flags: Vec<i32>,

    // Restrictions
    pub allowable_class: i32,
    pub allowable_race: i64,

    // Expansion & Set
    pub expansion_id: i32,
    pub item_set_id: i32,
    pub set_info: Option<ItemSetInfo>,

    // Drop sources
    pub drop_sources: Vec<ItemDropSource>,

    // Crafting
    pub dmg_variance: f32,
    pub gem_properties: i32,
    pub modified_crafting_reagent_item_id: i32,
}

impl Default for ItemDataFlat {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            description: String::new(),
            file_name: "inv_misc_questionmark".to_string(),
            item_level: 0,
            quality: 0,
            required_level: 0,
            binding: 0,
            buy_price: 0,
            sell_price: 0,
            max_count: 0,
            stackable: 1,
            speed: 0,
            class_id: 0,
            subclass_id: 0,
            inventory_type: 0,
            classification: None,
            stats: Vec::new(),
            effects: Vec::new(),
            sockets: Vec::new(),
            socket_bonus_enchant_id: 0,
            flags: Vec::new(),
            allowable_class: -1,
            allowable_race: -1,
            expansion_id: 0,
            item_set_id: 0,
            set_info: None,
            drop_sources: Vec::new(),
            dmg_variance: 0.0,
            gem_properties: 0,
            modified_crafting_reagent_item_id: 0,
        }
    }
}
