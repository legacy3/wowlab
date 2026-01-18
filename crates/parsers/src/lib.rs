//! Parsers crate - parsing for WoW-related data formats
//!
//! This crate provides parsers for:
//! - SimC profile strings (character data, equipment, talents)
//! - DBC CSV files (WoW database client tables)
//! - Talent loadout strings (base64-encoded talent selections)

// ============================================================================
// Modules
// ============================================================================

pub mod dbc;
pub mod errors;
pub mod loadout;
pub mod simc;
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
    argb_to_hex, rgb_to_hex, AuraDataFlat, ClassDataFlat, EmpowerStage, GlobalColorFlat,
    GlobalStringFlat, ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus,
    ItemSetInfo, ItemStat, KnowledgeSource, LearnSpell, PeriodicType, PointLimits, RefreshBehavior,
    SpecDataFlat, SpellDataFlat, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection,
    TraitSubTree, TraitTreeFlat, TraitTreeWithSelections,
};

// DBC → Flat transformation
pub use transform::{
    transform_all_auras, transform_all_classes, transform_all_global_colors,
    transform_all_global_strings, transform_all_items, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, transform_aura, transform_class, transform_global_color,
    transform_global_string, transform_item, transform_spec, transform_spell, transform_trait_tree,
    SpellKnowledgeContext,
};

// Talent loadout encoding/decoding
pub use loadout::{
    apply_decoded_traits, decode_trait_loadout, encode_trait_loadout, DecodedTraitLoadout,
    DecodedTraitNode,
};

// Alias for backward compatibility
pub use wowlab_types::data::TraitTreeFlat as TalentTreeFlat;

// ============================================================================
// WASM Bindings
// ============================================================================

use wasm_bindgen::prelude::*;

/// Parse a SimC profile string and return the result as a Profile object.
#[wasm_bindgen(js_name = parseSimc)]
pub fn wasm_parse_simc(input: &str) -> Result<Profile, JsError> {
    parse_simc(input).map_err(|e| JsError::new(&e.to_string()))
}
