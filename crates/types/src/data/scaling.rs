//! Flat types for item scaling DBC tables (item_bonus, curve, curve_point, rand_prop_points)

use serde::{Deserialize, Serialize};

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
