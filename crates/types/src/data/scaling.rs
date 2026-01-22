//! Flat types for item scaling DBC tables and scaling computation results.
//!
//! Contains:
//! - Flat DBC types: ItemBonusFlat, CurveFlat, CurvePointFlat, RandPropPointsFlat
//! - Scaling results: ScaledItemStats, AppliedBonus
//! - Data bundle: ItemScalingData

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Scaling Result Types
// ============================================================================

/// Result of applying item bonuses to scale an item's stats
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
pub struct ScaledItemStats {
    /// Final item level after all bonuses applied
    pub item_level: i32,
    /// Scaled stats (stat_type -> value)
    pub stats: Vec<ScaledStat>,
    /// Applied bonuses for debugging/display
    pub applied_bonuses: Vec<AppliedBonus>,
}

/// A single scaled stat value
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
pub struct ScaledStat {
    /// Stat type ID (matches WoW's stat types)
    pub stat_type: i32,
    /// Stat type name for display
    pub stat_name: String,
    /// Final computed value
    pub value: i32,
}

/// Record of an applied bonus for debugging/tooltips
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
pub struct AppliedBonus {
    /// Bonus list ID this came from
    pub bonus_list_id: i32,
    /// Bonus type (1=ILEVEL, 2=MOD, 11=SCALING, etc.)
    pub bonus_type: i32,
    /// Human-readable description of what was applied
    pub description: String,
}

/// Bundle of all scaling data needed to compute item stats.
/// Load this once and pass to scaling functions.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
pub struct ItemScalingData {
    /// Item bonuses grouped by parent_item_bonus_list_id
    pub bonuses: HashMap<i32, Vec<ItemBonusFlat>>,
    /// Curves by ID
    pub curves: HashMap<i32, CurveFlat>,
    /// Curve points grouped by curve_id, sorted by order_index
    pub curve_points: HashMap<i32, Vec<CurvePointFlat>>,
    /// Rand prop points by item level (id = item_level)
    pub rand_prop_points: HashMap<i32, RandPropPointsFlat>,
}

/// Item quality tiers for stat budget lookup
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(feature = "wasm", derive(tsify_next::Tsify))]
pub enum ItemQuality {
    Poor = 0,
    Common = 1,
    Uncommon = 2,
    Rare = 3,
    Epic = 4,
    Legendary = 5,
    Artifact = 6,
    Heirloom = 7,
}

impl From<i32> for ItemQuality {
    fn from(value: i32) -> Self {
        match value {
            0 => ItemQuality::Poor,
            1 => ItemQuality::Common,
            2 => ItemQuality::Uncommon,
            3 => ItemQuality::Rare,
            4 => ItemQuality::Epic,
            5 => ItemQuality::Legendary,
            6 => ItemQuality::Artifact,
            7 => ItemQuality::Heirloom,
            _ => ItemQuality::Common,
        }
    }
}

// ============================================================================
// Flat DBC Types
// ============================================================================

/// Flat item bonus structure for database storage
/// Maps directly to WoW's ItemBonus DBC table
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemBonusFlat {
    pub id: i32,
    pub value_0: i32,
    pub value_1: i32,
    pub value_2: i32,
    pub value_3: i32,
    pub parent_item_bonus_list_id: i32,
    #[serde(rename = "type")]
    pub bonus_type: i32,
    pub order_index: i32,
}

/// Flat curve structure for database storage
/// Maps directly to WoW's Curve DBC table
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurveFlat {
    pub id: i32,
    #[serde(rename = "type")]
    pub curve_type: i32,
    pub flags: i32,
}

/// Flat curve point structure for database storage
/// Maps directly to WoW's CurvePoint DBC table
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurvePointFlat {
    pub id: i32,
    pub curve_id: i32,
    pub order_index: i32,
    pub pos_0: f64,
    pub pos_1: f64,
    pub pos_pre_squish_0: f64,
    pub pos_pre_squish_1: f64,
}

/// Flat random property points structure for database storage
/// Maps directly to WoW's RandPropPoints DBC table
/// Contains stat budgets per item level for different quality tiers
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RandPropPointsFlat {
    pub id: i32,
    pub damage_replace_stat_f: f64,
    pub damage_secondary_f: f64,
    pub damage_replace_stat: i32,
    pub damage_secondary: i32,
    // Epic quality budgets (float)
    pub epic_f_0: f64,
    pub epic_f_1: f64,
    pub epic_f_2: f64,
    pub epic_f_3: f64,
    pub epic_f_4: f64,
    // Superior/Rare quality budgets (float)
    pub superior_f_0: f64,
    pub superior_f_1: f64,
    pub superior_f_2: f64,
    pub superior_f_3: f64,
    pub superior_f_4: f64,
    // Good/Uncommon quality budgets (float)
    pub good_f_0: f64,
    pub good_f_1: f64,
    pub good_f_2: f64,
    pub good_f_3: f64,
    pub good_f_4: f64,
    // Epic quality budgets (int)
    pub epic_0: i32,
    pub epic_1: i32,
    pub epic_2: i32,
    pub epic_3: i32,
    pub epic_4: i32,
    // Superior/Rare quality budgets (int)
    pub superior_0: i32,
    pub superior_1: i32,
    pub superior_2: i32,
    pub superior_3: i32,
    pub superior_4: i32,
    // Good/Uncommon quality budgets (int)
    pub good_0: i32,
    pub good_1: i32,
    pub good_2: i32,
    pub good_3: i32,
    pub good_4: i32,
}
