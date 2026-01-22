//! Parsers crate - parsing for WoW-related data formats
//!
//! This crate provides parsers for:
//! - SimC profile strings (character data, equipment, talents)
//! - DBC CSV files (WoW database client tables)
//! - Talent loadout strings (base64-encoded talent selections)
//! - Spell description strings (tooltip template language)

// ============================================================================
// Modules
// ============================================================================

pub mod dbc;
pub mod errors;
pub mod loadout;
pub mod scaling;
pub mod simc;
pub mod spell_desc;
pub mod transform;

// ============================================================================
// Re-exports
// ============================================================================

// SimC parsing
pub use simc::{
    parse as parse_simc, Character, Item, Loadout, ParseError, Profession, Profile, Slot, Talents,
    WowClass,
};

// DBC data loading
pub use dbc::DbcData;

// Error types
pub use errors::{DbcError, TraitError, TransformError};

// Flat structures (for database/API) - re-exported from wowlab-types
pub use wowlab_types::data::{
    argb_to_hex, rgb_to_hex, AppliedBonus, AuraDataFlat, ClassDataFlat, CurveFlat, CurvePointFlat,
    EmpowerStage, GlobalColorFlat, GlobalStringFlat, ItemBonusFlat, ItemClassification,
    ItemDataFlat, ItemDropSource, ItemEffect, ItemQuality, ItemScalingData, ItemSetBonus,
    ItemSetInfo, ItemStat, KnowledgeSource, LearnSpell, PeriodicType, PointLimits,
    RandPropPointsFlat, RefreshBehavior, ScaledItemStats, ScaledStat, SpecDataFlat, SpellDataFlat,
    SpellEffect, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree, TraitTreeFlat,
    TraitTreeWithSelections,
};

// DBC → Flat transformation
pub use transform::{
    transform_all_auras, transform_all_classes, transform_all_curve_points, transform_all_curves,
    transform_all_global_colors, transform_all_global_strings, transform_all_item_bonuses,
    transform_all_items, transform_all_rand_prop_points, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, transform_aura, transform_class, transform_global_color,
    transform_global_string, transform_item, transform_spec, transform_spell, transform_trait_tree,
    SpellKnowledgeContext,
};

// Talent loadout encoding/decoding
pub use loadout::{
    apply_decoded_traits, decode_trait_loadout, encode_minimal_loadout, encode_trait_loadout,
    DecodedTraitLoadout, DecodedTraitNode,
};

// Spell description parsing
pub use spell_desc::{
    analyze_dependencies as analyze_spell_desc_dependencies, parse as parse_spell_desc,
    render_with_resolver as render_spell_desc, NullResolver, ParsedSpellDescription,
    ParseResult as SpellDescParseResult, SpellDescResolver, SpellDescriptionNode, TestResolver,
    VariableNode,
};

// Item scaling functions
pub use scaling::{
    apply_item_bonuses, get_bonus_description, get_stat_budget, get_stat_name, interpolate_curve,
};

// Re-export spell desc types from wowlab-types
pub use wowlab_types::{
    EffectDependency, SpellDescDependencies, SpellDescRenderResult, SpellValueDependency,
};

// ============================================================================
// WASM Bindings
// ============================================================================

use wasm_bindgen::prelude::*;

/// Parse a SimC profile string and return the result as a Profile object.
#[wasm_bindgen(js_name = parseSimc)]
pub fn wasm_parse_simc(input: &str) -> Result<Profile, JsError> {
    parse_simc(input).map_err(|e| JsError::new(&e.to_string()))
}

/// Parse a spell description string and return the AST.
#[wasm_bindgen(js_name = parseSpellDesc)]
pub fn wasm_parse_spell_desc(input: &str) -> Result<ParsedSpellDescription, JsError> {
    let result = parse_spell_desc(input);
    if result.errors.is_empty() {
        Ok(result.ast)
    } else {
        Err(JsError::new(
            &result
                .errors
                .iter()
                .map(|e| e.to_string())
                .collect::<Vec<_>>()
                .join(", "),
        ))
    }
}

/// Encode a minimal loadout string for a spec with no talent selections.
#[wasm_bindgen(js_name = encodeMinimalLoadout)]
pub fn wasm_encode_minimal_loadout(spec_id: u16) -> String {
    encode_minimal_loadout(spec_id)
}

// Re-export spell description WASM functions
pub use spell_desc::{wasm_analyze_spell_desc, wasm_render_spell_desc, AnalyzeResult};

/// Apply item bonuses to compute scaled stats.
///
/// Takes base item info and bonus IDs, returns computed stats.
#[wasm_bindgen(js_name = applyItemBonuses)]
pub fn wasm_apply_item_bonuses(
    base_item_level: i32,
    base_stats: JsValue,
    quality: i32,
    bonus_ids: JsValue,
    scaling_data: JsValue,
    player_level: Option<i32>,
) -> JsValue {
    let base_stats: Vec<ItemStat> = match serde_wasm_bindgen::from_value(base_stats) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    let bonus_ids: Vec<i32> = match serde_wasm_bindgen::from_value(bonus_ids) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };

    let result = apply_item_bonuses(
        base_item_level,
        &base_stats,
        quality,
        &bonus_ids,
        &scaling_data,
        player_level,
    );

    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

/// Interpolate a curve at a given x value.
#[wasm_bindgen(js_name = interpolateCurve)]
pub fn wasm_interpolate_curve(scaling_data: JsValue, curve_id: i32, x: f64) -> JsValue {
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    match interpolate_curve(&scaling_data, curve_id, x) {
        Some(v) => JsValue::from_f64(v),
        None => JsValue::NULL,
    }
}

/// Get the stat budget for an item level and quality.
#[wasm_bindgen(js_name = getStatBudget)]
pub fn wasm_get_stat_budget(
    scaling_data: JsValue,
    item_level: i32,
    quality: i32,
    slot_index: usize,
) -> JsValue {
    let scaling_data: ItemScalingData = match serde_wasm_bindgen::from_value(scaling_data) {
        Ok(v) => v,
        Err(_) => return JsValue::NULL,
    };
    match get_stat_budget(&scaling_data, item_level, ItemQuality::from(quality), slot_index) {
        Some(v) => JsValue::from_f64(v),
        None => JsValue::NULL,
    }
}

/// Get a human-readable name for a stat type ID.
#[wasm_bindgen(js_name = getStatName)]
pub fn wasm_get_stat_name(stat_type: i32) -> String {
    get_stat_name(stat_type).to_string()
}
