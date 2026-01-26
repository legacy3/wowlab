//! Transformation functions for DBC data
//!
//! Ports the TypeScript extraction and transformation logic to Rust.

#[cfg(feature = "dbc")]
mod aura;
#[cfg(feature = "dbc")]
mod global;
#[cfg(feature = "dbc")]
mod item;
#[cfg(feature = "dbc")]
mod scaling;
#[cfg(feature = "dbc")]
mod spec;
mod spell;
#[cfg(feature = "dbc")]
mod r#trait;

#[cfg(feature = "dbc")]
pub use aura::{transform_all_auras, transform_aura};
#[cfg(feature = "dbc")]
pub use global::{
    transform_all_classes, transform_all_global_colors, transform_all_global_strings,
    transform_class, transform_global_color, transform_global_string,
};
#[cfg(feature = "dbc")]
pub use item::{transform_all_items, transform_item};
#[cfg(feature = "dbc")]
pub use r#trait::transform_trait_tree;
#[cfg(feature = "dbc")]
pub use scaling::{
    transform_all_curve_points, transform_all_curves, transform_all_item_bonuses,
    transform_all_rand_prop_points,
};
#[cfg(feature = "dbc")]
pub use spec::{transform_all_specs, transform_spec};
#[cfg(feature = "dbc")]
pub use spell::transform_spell;

// Always export SpellKnowledgeContext (doesn't need dbc)
pub use spell::SpellKnowledgeContext;

#[cfg(feature = "dbc")]
use super::dbc::DbcData;
#[allow(unused_imports)]
use crate::types::data::{SpellDataFlat, TraitTreeFlat};

/// Transform all spells in the database
#[cfg(feature = "dbc")]
pub fn transform_all_spells(dbc: &DbcData) -> Vec<SpellDataFlat> {
    dbc.spell_name
        .keys()
        .filter_map(|&spell_id| {
            transform_spell(dbc, spell_id, None)
                .inspect_err(|e| tracing::warn!(spell_id, error = %e, "Failed to transform spell"))
                .ok()
        })
        .collect()
}

/// Transform all talent trees for all specs
#[cfg(feature = "dbc")]
pub fn transform_all_trait_trees(dbc: &DbcData) -> Vec<TraitTreeFlat> {
    dbc.chr_specialization
        .keys()
        .filter_map(|&spec_id| {
            transform_trait_tree(dbc, spec_id)
                .inspect_err(
                    |e| tracing::warn!(spec_id, error = %e, "Failed to transform trait tree"),
                )
                .ok()
        })
        .collect()
}
