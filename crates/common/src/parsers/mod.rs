//! Parsers crate - parsing for WoW-related data formats
//!
//! This module provides parsers for:
//! - SimC profile strings (character data, equipment, talents)
//! - DBC CSV files (WoW database client tables)
//! - Talent loadout strings (base64-encoded talent selections)
//! - Spell description strings (tooltip template language)

#[cfg(feature = "crypto")]
pub mod crypto;
#[cfg(feature = "dbc")]
pub mod dbc;
pub mod errors;
pub mod loadout;
pub mod scaling;
pub mod simc;
pub mod spell_desc;
pub mod transform;

// SimC parsing
pub use simc::{
    parse as parse_simc, Character, Item, Loadout, ParseError, Profession, Profile, Slot, Talents,
    WowClass,
};

// DBC data loading
#[cfg(feature = "dbc")]
pub use dbc::DbcData;

// Error types
#[cfg(feature = "dbc")]
pub use errors::DbcError;
pub use errors::TraitError;
pub use errors::TransformError;

// DBC → Flat transformation (requires dbc feature for DbcData)
#[cfg(feature = "dbc")]
pub use transform::{
    transform_all_auras, transform_all_classes, transform_all_curve_points, transform_all_curves,
    transform_all_global_colors, transform_all_global_strings, transform_all_item_bonuses,
    transform_all_items, transform_all_rand_prop_points, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, transform_aura, transform_class, transform_global_color,
    transform_global_string, transform_item, transform_spec, transform_spell, transform_trait_tree,
};

// Always export SpellKnowledgeContext (doesn't need dbc)
pub use transform::SpellKnowledgeContext;

// Talent loadout encoding/decoding
pub use loadout::{
    apply_decoded_traits, decode_trait_loadout, encode_minimal_loadout, encode_trait_loadout,
    DecodedTraitLoadout, DecodedTraitNode,
};

// Spell description parsing
pub use spell_desc::{
    analyze_dependencies as analyze_spell_desc_dependencies, parse as parse_spell_desc,
    render_with_resolver as render_spell_desc, NullResolver, ParseResult as SpellDescParseResult,
    ParsedSpellDescription, SpellDescResolver, SpellDescriptionNode, TestResolver, VariableNode,
};

// Item scaling functions
pub use scaling::{
    apply_item_bonuses, get_bonus_description, get_stat_budget, get_stat_name, interpolate_curve,
};

// Crypto (node authentication)
#[cfg(feature = "crypto")]
pub use crypto::{
    build_sign_message, derive_claim_code, derive_claim_code_from_base64, keypair_from_base64,
    sha256_hex, verify_signature, verify_signature_base64, CryptoError, NodeKeypair,
};
