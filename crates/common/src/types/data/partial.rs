//! Partial types for column selection
//!
//! These types allow fetching only specific columns from the database,
//! reducing bandwidth for common query patterns.

use serde::Deserialize;

/// Minimal spell info for lists/search results
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellSummary {
    pub id: i32,
    pub name: String,
    pub file_name: String,
}

/// Spell timing info only
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellTiming {
    pub id: i32,
    pub cast_time: i32,
    pub recovery_time: i32,
    pub start_recovery_time: i32,
    pub charge_recovery_time: i32,
    pub max_charges: i32,
}

impl SpellTiming {
    /// Column names to select for this partial type
    pub const COLUMNS: &'static [&'static str] = &[
        "id",
        "castTime",
        "recoveryTime",
        "startRecoveryTime",
        "chargeRecoveryTime",
        "maxCharges",
    ];
}

/// Spell resource cost info only
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellCost {
    pub id: i32,
    pub power_type: i32,
    pub power_cost: i32,
    pub power_cost_pct: f64,
    pub mana_cost: i32,
}

impl SpellCost {
    /// Column names to select for this partial type
    pub const COLUMNS: &'static [&'static str] =
        &["id", "powerType", "powerCost", "powerCostPct", "manaCost"];
}

/// Spell damage/scaling info only
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellDamage {
    pub id: i32,
    pub school_mask: i32,
    pub bonus_coefficient_from_ap: f64,
    pub effect_bonus_coefficient: f64,
}

impl SpellDamage {
    /// Column names to select for this partial type
    pub const COLUMNS: &'static [&'static str] = &[
        "id",
        "schoolMask",
        "bonusCoefficientFromAp",
        "effectBonusCoefficient",
    ];
}

/// Spell range info only
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellRange {
    pub id: i32,
    pub range_max_0: f32,
    pub range_max_1: f32,
    pub range_min_0: f32,
    pub range_min_1: f32,
    pub radius_max: f32,
    pub radius_min: f32,
    pub cone_degrees: f32,
}

impl SpellRange {
    /// Column names to select for this partial type
    pub const COLUMNS: &'static [&'static str] = &[
        "id",
        "rangeMax0",
        "rangeMax1",
        "rangeMin0",
        "rangeMin1",
        "radiusMax",
        "radiusMin",
        "coneDegrees",
    ];
}

/// Item summary for lists
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemSummary {
    pub id: i32,
    pub name: String,
    pub item_level: i32,
    pub quality: i32,
    pub file_name: String,
}

impl ItemSummary {
    /// Column names to select for this partial type
    pub const COLUMNS: &'static [&'static str] =
        &["id", "name", "itemLevel", "quality", "fileName"];
}

/// Talent node summary for tree display
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentNodeSummary {
    pub id: i32,
    pub pos_x: i32,
    pub pos_y: i32,
    pub max_ranks: i32,
    #[serde(rename = "type")]
    pub node_type: i32,
}
