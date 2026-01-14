//! Query methods for Supabase PostgREST API

use crate::{SupabaseClient, SupabaseError};
use snapshot_parser::flat::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TalentTreeFlat};
use urlencoding::encode;

/// Build select clause from optional columns
fn build_select(columns: Option<&[&str]>) -> String {
    columns
        .map(|c| c.join(","))
        .unwrap_or_else(|| "*".to_string())
}

/// Extract first result or return NotFound error
fn first_or_not_found<T>(
    results: Vec<T>,
    resource: &str,
    key: &str,
    value: &str,
) -> Result<T, SupabaseError> {
    results.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
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
        let path = format!(
            "spell_data_flat?id=eq.{}&select={}",
            id,
            build_select(columns)
        );
        let spells: Vec<SpellDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(spells, "spell_data_flat", "id", &id.to_string())
    }

    /// Get spell by ID, only fetching specific columns
    pub async fn get_spell_partial<T: serde::de::DeserializeOwned>(
        &self,
        id: i32,
        columns: &[&str],
    ) -> Result<T, SupabaseError> {
        let path = format!("spell_data_flat?id=eq.{}&select={}", id, columns.join(","));
        let items: Vec<T> = self.get(&path).await?.json().await?;
        first_or_not_found(items, "spell_data_flat", "id", &id.to_string())
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

        let ids_str: String = ids.iter().map(|id| id.to_string()).collect::<Vec<_>>().join(",");
        let path = format!(
            "spell_data_flat?id=in.({})&select={}",
            ids_str,
            build_select(columns)
        );
        Ok(self.get(&path).await?.json().await?)
    }

    /// Search spells by name (URL-encoded for safety)
    pub async fn search_spells(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SpellDataFlat>, SupabaseError> {
        let path = format!(
            "spell_data_flat?name=ilike.*{}*&limit={}&select=id,name,fileName",
            encode(query),
            limit
        );
        Ok(self.get(&path).await?.json().await?)
    }

    /// Get talent tree for a spec
    pub async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, SupabaseError> {
        let path = format!("talent_tree_flat?spec_id=eq.{}", spec_id);
        let trees: Vec<TalentTreeFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(trees, "talent_tree_flat", "spec_id", &spec_id.to_string())
    }

    /// Get all talent trees for a class
    pub async fn get_class_talent_trees(
        &self,
        class_id: i32,
    ) -> Result<Vec<TalentTreeFlat>, SupabaseError> {
        let path = format!("talent_tree_flat?class_id=eq.{}", class_id);
        Ok(self.get(&path).await?.json().await?)
    }

    /// Get item by ID
    pub async fn get_item(
        &self,
        id: i32,
        columns: Option<&[&str]>,
    ) -> Result<ItemDataFlat, SupabaseError> {
        let path = format!(
            "item_data_flat?id=eq.{}&select={}",
            id,
            build_select(columns)
        );
        let items: Vec<ItemDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(items, "item_data_flat", "id", &id.to_string())
    }

    /// Get aura by spell ID
    pub async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, SupabaseError> {
        let path = format!("aura_data_flat?spell_id=eq.{}", spell_id);
        let auras: Vec<AuraDataFlat> = self.get(&path).await?.json().await?;
        first_or_not_found(auras, "aura_data_flat", "spell_id", &spell_id.to_string())
    }
}
