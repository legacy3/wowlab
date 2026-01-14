//! Snapshot Parser - DBC CSV parsing and transformation for WoW data
//!
//! This crate transforms raw DBC CSV files into flat data structures
//! (SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat) for storage in Postgres.

pub mod dbc;
pub mod errors;
pub mod flat;
pub mod talents;
pub mod transform;

pub use dbc::DbcData;
pub use errors::{DbcError, TransformError};
pub use flat::{
    AuraDataFlat, ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus,
    ItemSetInfo, ItemStat, KnowledgeSource, PeriodicType, PointLimits, RefreshBehavior,
    SpellDataFlat, TalentEdge, TalentNode, TalentNodeEntry, TalentSelection, TalentSubTree,
    TalentTreeFlat, TalentTreeWithSelections,
};
pub use talents::{
    apply_decoded_talents, decode_talent_loadout, encode_talent_loadout, DecodedTalentLoadout,
    DecodedTalentNode,
};
pub use transform::{
    transform_all_auras, transform_all_items, transform_all_spells, transform_all_talent_trees,
    transform_aura, transform_item, transform_spell, transform_talent_tree, SpellKnowledgeContext,
};
