//! Query methods for Supabase PostgREST API

use crate::{SupabaseClient, SupabaseError};
use parsers::flat::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat};

/// Build select clause string from columns slice
fn columns_to_select(columns: &[&str]) -> String {
    columns.join(",")
}

/// Build comma-separated list of i32 IDs
fn ids_to_list(ids: &[i32]) -> String {
    ids.iter()
        .map(|id| id.to_string())
        .collect::<Vec<_>>()
        .join(",")
}

/// Extract first result or return NotFound error
fn first_or_not_found<T>(
    results: Vec<T>,
    resource: &str,
    key: &str,
    value: i32,
) -> Result<T, SupabaseError> {
    results.into_iter().next().ok_or(SupabaseError::NotFound {
        resource: resource.to_string(),
        key: key.to_string(),
        value: value.to_string(),
    })
}

impl SupabaseClient {
    /// Get spell by ID with optional column selection
    pub async fn get_spell(
        &self,
        id: i32,
        columns: Option<&[&str]>,
    ) -> Result<SpellDataFlat, SupabaseError> {
        let select = columns.map(columns_to_select).unwrap_or_else(|| "*".to_string());
        let path = format!("spell_data_flat?id=eq.{}&select={}", id, select);
        let spells: Vec<SpellDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(spells, "spell_data_flat", "id", id)
    }

    /// Get spell by ID, only fetching specific columns
    pub async fn get_spell_partial<T: serde::de::DeserializeOwned>(
        &self,
        id: i32,
        columns: &[&str],
    ) -> Result<T, SupabaseError> {
        let path = format!("spell_data_flat?id=eq.{}&select={}", id, columns_to_select(columns));
        let items: Vec<T> = self.get(&path).await?.json().await?;
        first_or_not_found(items, "spell_data_flat", "id", id)
    }

    /// Get multiple spells by IDs
    pub async fn get_spells(
        &self,
        ids: &[i32],
        columns: Option<&[&str]>,
    ) -> Result<Vec<SpellDataFlat>, SupabaseError> {
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let select = columns.map(columns_to_select).unwrap_or_else(|| "*".to_string());
        let path = format!("spell_data_flat?id=in.({})&select={}", ids_to_list(ids), select);
        Ok(self.get(&path).await?.json().await?)
    }

    /// Search spells by name
    pub async fn search_spells(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SpellDataFlat>, SupabaseError> {
        // Note: PostgREST uses Postgres column names (snake_case), not JSON field names
        let path = format!(
            "spell_data_flat?name=ilike.*{}*&limit={}&select=id,name,file_name",
            urlencoding::encode(query),
            limit
        );
        Ok(self.get(&path).await?.json().await?)
    }

    /// Get trait tree for a spec
    pub async fn get_trait_tree(&self, spec_id: i32) -> Result<TraitTreeFlat, SupabaseError> {
        let path = format!("specs_traits?spec_id=eq.{}", spec_id);
        let trees: Vec<TraitTreeFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(trees, "specs_traits", "spec_id", spec_id)
    }

    /// Get all trait trees for a class
    pub async fn get_class_trait_trees(
        &self,
        class_id: i32,
    ) -> Result<Vec<TraitTreeFlat>, SupabaseError> {
        let path = format!("specs_traits?class_id=eq.{}", class_id);
        Ok(self.get(&path).await?.json().await?)
    }

    /// Get item by ID
    pub async fn get_item(
        &self,
        id: i32,
        columns: Option<&[&str]>,
    ) -> Result<ItemDataFlat, SupabaseError> {
        let select = columns.map(columns_to_select).unwrap_or_else(|| "*".to_string());
        let path = format!("item_data_flat?id=eq.{}&select={}", id, select);
        let items: Vec<ItemDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(items, "item_data_flat", "id", id)
    }

    /// Get aura by spell ID
    pub async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, SupabaseError> {
        let path = format!("aura_data_flat?spell_id=eq.{}", spell_id);
        let auras: Vec<AuraDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(auras, "aura_data_flat", "spell_id", spell_id)
    }
}
