//! Transformation functions for DBC data
//!
//! Ports the TypeScript extraction and transformation logic to Rust.

mod aura;
mod item;
mod spell;
mod talent;

pub use aura::{transform_all_auras, transform_aura};
pub use item::{transform_all_items, transform_item};
pub use spell::{transform_spell, SpellKnowledgeContext};
pub use talent::transform_talent_tree;

use crate::dbc::DbcData;
use crate::flat::{SpellDataFlat, TalentTreeFlat};

/// Transform all spells in the database
pub fn transform_all_spells(dbc: &DbcData) -> Vec<SpellDataFlat> {
    dbc.spell_name
        .keys()
        .filter_map(|&spell_id| transform_spell(dbc, spell_id, None).ok())
        .collect()
}

/// Transform all talent trees for all specs
pub fn transform_all_talent_trees(dbc: &DbcData) -> Vec<TalentTreeFlat> {
    dbc.chr_specialization
        .keys()
        .filter_map(|&spec_id| transform_talent_tree(dbc, spec_id).ok())
        .collect()
}
