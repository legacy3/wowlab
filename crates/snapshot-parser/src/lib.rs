//! Snapshot Parser - DBC CSV parsing and transformation for WoW data
//!
//! This crate transforms raw DBC CSV files into flat data structures
//! (SpellDataFlat, TraitTreeFlat, ItemDataFlat, AuraDataFlat, SpecDataFlat) for storage in Postgres.

pub mod dbc;
pub mod errors;
pub mod flat;
pub mod traits;
pub mod transform;

pub use dbc::DbcData;
pub use errors::{DbcError, TraitError, TransformError};
pub use flat::{
    argb_to_hex, rgb_to_hex, AuraDataFlat, ClassDataFlat, GlobalColorFlat, GlobalStringFlat,
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat, KnowledgeSource, PeriodicType, PointLimits, RefreshBehavior, SpecDataFlat,
    SpellDataFlat, TraitEdge, TraitNode, TraitNodeEntry, TraitSelection, TraitSubTree,
    TraitTreeFlat, TraitTreeWithSelections,
};
pub use traits::{
    apply_decoded_traits, decode_trait_loadout, encode_trait_loadout, DecodedTraitLoadout,
    DecodedTraitNode,
};
pub use transform::{
    transform_all_auras, transform_all_classes, transform_all_global_colors,
    transform_all_global_strings, transform_all_items, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, transform_aura, transform_class, transform_global_color,
    transform_global_string, transform_item, transform_spec, transform_spell, transform_trait_tree,
    SpellKnowledgeContext,
};
