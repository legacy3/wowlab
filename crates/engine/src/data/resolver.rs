//! DataResolver trait (local CSV or Supabase API).

use async_trait::async_trait;
use std::path::PathBuf;
use wowlab_common::types::data::{
    AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat, TraitTreeWithSelections,
};

/// Errors that can occur during data resolution.
#[derive(Debug, thiserror::Error)]
pub enum ResolverError {
    #[error("Spell not found: {0}")]
    SpellNotFound(i32),

    #[error("Trait tree not found for spec: {0}")]
    TraitTreeNotFound(i32),

    #[error("Item not found: {0}")]
    ItemNotFound(i32),

    #[error("Aura not found for spell: {0}")]
    AuraNotFound(i32),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("DBC parse error: {0}")]
    DbcParse(String),

    #[error("Transform error: {0}")]
    Transform(String),

    #[error("Trait decode error: {0}")]
    TraitDecode(String),

    #[cfg(feature = "supabase")]
    #[error("Supabase error: {0}")]
    Supabase(#[from] wowlab_supabase::SupabaseError),

    #[error("Environment variable error: {0}")]
    EnvVar(String),
}

impl From<wowlab_common::parsers::DbcError> for ResolverError {
    fn from(e: wowlab_common::parsers::DbcError) -> Self {
        ResolverError::DbcParse(e.to_string())
    }
}

impl From<wowlab_common::parsers::TransformError> for ResolverError {
    fn from(e: wowlab_common::parsers::TransformError) -> Self {
        ResolverError::Transform(e.to_string())
    }
}

impl From<wowlab_common::parsers::errors::TraitError> for ResolverError {
    fn from(e: wowlab_common::parsers::errors::TraitError) -> Self {
        ResolverError::TraitDecode(e.to_string())
    }
}

/// Trait for resolving game data from various sources.
///
/// Implementations include:
/// - `LocalResolver`: Loads from local CSV files (default, offline)
/// - `SupabaseResolver`: Loads from Supabase API (optional, online)
#[async_trait]
pub trait DataResolver: Send + Sync {
    /// Get spell by ID.
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError>;

    /// Get multiple spells by IDs.
    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError>;

    /// Get trait tree for a spec.
    async fn get_trait_tree(&self, spec_id: i32) -> Result<TraitTreeFlat, ResolverError>;

    /// Get item by ID.
    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError>;

    /// Get aura by spell ID.
    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError>;

    /// Search spells by name (optional, may not be supported by all resolvers).
    async fn search_spells(
        &self,
        _query: &str,
        _limit: usize,
    ) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Default: not supported, returns empty
        Ok(vec![])
    }

    /// Decode a trait string and apply it to the trait tree.
    ///
    /// Uses snapshot-parser's decode_trait_loadout and apply_decoded_traits.
    async fn decode_traits(
        &self,
        spec_id: i32,
        trait_string: &str,
    ) -> Result<TraitTreeWithSelections, ResolverError> {
        let tree = self.get_trait_tree(spec_id).await?;
        let decoded = wowlab_common::parsers::decode_trait_loadout(trait_string)?;
        Ok(wowlab_common::parsers::apply_decoded_traits(tree, &decoded))
    }

    /// Get all spell IDs from decoded traits.
    async fn get_trait_spell_ids(
        &self,
        spec_id: i32,
        trait_string: &str,
    ) -> Result<Vec<i32>, ResolverError> {
        let tree_with_selections = self.decode_traits(spec_id, trait_string).await?;

        let mut spell_ids = Vec::new();
        for selection in &tree_with_selections.selections {
            if selection.ranks_purchased > 0 {
                // Find the node in the tree
                if let Some(node) = tree_with_selections
                    .tree
                    .nodes
                    .iter()
                    .find(|n| n.id == selection.node_id)
                {
                    // For choice nodes, use the choice_index to pick the right entry
                    let entry_index = selection.choice_index.unwrap_or(0) as usize;
                    if let Some(entry) = node.entries.get(entry_index) {
                        spell_ids.push(entry.spell_id);
                    }
                }
            }
        }

        Ok(spell_ids)
    }
}

/// Configuration for creating a resolver.
pub enum ResolverConfig {
    /// Use local CSV files (default, offline, portable).
    Local {
        /// Path to the data directory containing CSV files.
        /// Expected structure: `{data_dir}/data/tables/*.csv`
        data_dir: PathBuf,
    },
    /// Use Supabase PostgREST API (requires `supabase` feature).
    #[cfg(feature = "supabase")]
    Supabase {
        /// Patch version for cache invalidation.
        patch: String,
    },
}
