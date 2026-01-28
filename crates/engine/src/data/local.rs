//! LocalResolver: Loads data from local CSV files via snapshot-parser.
//!
//! This resolver is the default and works offline with just CSV files.
//! It uses lazy loading to avoid loading all data upfront.

use crate::data::resolver::{DataResolver, ResolverError};
use async_trait::async_trait;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::path::PathBuf;
use wowlab_common::parsers::{
    transform_all_auras, transform_all_items, transform_all_trait_trees, transform_spell, DbcData,
};
use wowlab_common::types::data::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat};

/// Resolver that loads data from local CSV files.
///
/// Uses lazy initialization to avoid loading all data upfront.
/// Data is cached in memory after first access.
pub struct LocalResolver {
    data_dir: PathBuf,
    /// Lazily loaded DBC data
    dbc: RwLock<Option<DbcData>>,
    /// Cached transformed spells (lazy loaded)
    spells: RwLock<Option<HashMap<i32, SpellDataFlat>>>,
    /// Cached transformed trait trees (lazy loaded)
    traits: RwLock<Option<HashMap<i32, TraitTreeFlat>>>,
    /// Cached transformed items (lazy loaded)
    items: RwLock<Option<HashMap<i32, ItemDataFlat>>>,
    /// Cached transformed auras (lazy loaded)
    auras: RwLock<Option<HashMap<i32, AuraDataFlat>>>,
}

impl LocalResolver {
    /// Create a new LocalResolver with the given data directory.
    ///
    /// The data directory should contain `data/tables/*.csv` files.
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            dbc: RwLock::new(None),
            spells: RwLock::new(None),
            traits: RwLock::new(None),
            items: RwLock::new(None),
            auras: RwLock::new(None),
        }
    }

    /// Preload all data (optional, for benchmarking or when you know you'll need it all).
    pub fn preload_all(&self) -> Result<(), ResolverError> {
        self.ensure_spells_loaded()?;
        self.ensure_traits_loaded()?;
        self.ensure_items_loaded()?;
        self.ensure_auras_loaded()?;
        Ok(())
    }

    /// Ensure DBC data is loaded.
    fn ensure_dbc_loaded(&self) -> Result<(), ResolverError> {
        if self.dbc.read().is_some() {
            return Ok(());
        }

        tracing::info!(data_dir = %self.data_dir.display(), "Loading DBC data from CSV files");
        let dbc_data = DbcData::load_all(&self.data_dir)?;
        *self.dbc.write() = Some(dbc_data);
        tracing::info!("DBC data loaded successfully");

        Ok(())
    }

    /// Lazy load spells on first access.
    fn ensure_spells_loaded(&self) -> Result<(), ResolverError> {
        if self.spells.read().is_some() {
            return Ok(());
        }

        self.ensure_dbc_loaded()?;

        tracing::debug!("Transforming all spells");
        let dbc_guard = self.dbc.read();
        let dbc = dbc_guard.as_ref().unwrap();

        // Transform all spells
        let mut spell_map = HashMap::new();
        for &spell_id in dbc.spell_name.keys() {
            if let Ok(spell) = transform_spell(dbc, spell_id, None) {
                spell_map.insert(spell.id, spell);
            }
        }

        let count = spell_map.len();
        *self.spells.write() = Some(spell_map);
        tracing::debug!(count, "Spells loaded");

        Ok(())
    }

    /// Lazy load trait trees on first access.
    fn ensure_traits_loaded(&self) -> Result<(), ResolverError> {
        if self.traits.read().is_some() {
            return Ok(());
        }

        self.ensure_dbc_loaded()?;

        tracing::debug!("Transforming all trait trees");
        let dbc_guard = self.dbc.read();
        let dbc = dbc_guard.as_ref().unwrap();

        let traits = transform_all_trait_trees(dbc);
        let trait_map: HashMap<i32, TraitTreeFlat> =
            traits.into_iter().map(|t| (t.spec_id, t)).collect();

        let count = trait_map.len();
        *self.traits.write() = Some(trait_map);
        tracing::debug!(count, "Trait trees loaded");

        Ok(())
    }

    /// Lazy load items on first access.
    fn ensure_items_loaded(&self) -> Result<(), ResolverError> {
        if self.items.read().is_some() {
            return Ok(());
        }

        self.ensure_dbc_loaded()?;

        tracing::debug!("Transforming all items");
        let dbc_guard = self.dbc.read();
        let dbc = dbc_guard.as_ref().unwrap();

        let items = transform_all_items(dbc);
        let item_map: HashMap<i32, ItemDataFlat> = items.into_iter().map(|i| (i.id, i)).collect();

        let count = item_map.len();
        *self.items.write() = Some(item_map);
        tracing::debug!(count, "Items loaded");

        Ok(())
    }

    /// Lazy load auras on first access.
    fn ensure_auras_loaded(&self) -> Result<(), ResolverError> {
        if self.auras.read().is_some() {
            return Ok(());
        }

        self.ensure_dbc_loaded()?;

        tracing::debug!("Transforming all auras");
        let dbc_guard = self.dbc.read();
        let dbc = dbc_guard.as_ref().unwrap();

        let auras = transform_all_auras(dbc);
        let aura_map: HashMap<i32, AuraDataFlat> =
            auras.into_iter().map(|a| (a.spell_id, a)).collect();

        let count = aura_map.len();
        *self.auras.write() = Some(aura_map);
        tracing::debug!(count, "Auras loaded");

        Ok(())
    }
}

#[async_trait]
impl DataResolver for LocalResolver {
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError> {
        self.ensure_spells_loaded()?;
        self.spells
            .read()
            .as_ref()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or(ResolverError::SpellNotFound(id))
    }

    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError> {
        self.ensure_spells_loaded()?;
        let spells = self.spells.read();
        let spell_map = spells.as_ref().unwrap();
        Ok(ids
            .iter()
            .filter_map(|id| spell_map.get(id).cloned())
            .collect())
    }

    async fn get_trait_tree(&self, spec_id: i32) -> Result<TraitTreeFlat, ResolverError> {
        self.ensure_traits_loaded()?;
        self.traits
            .read()
            .as_ref()
            .unwrap()
            .get(&spec_id)
            .cloned()
            .ok_or(ResolverError::TraitTreeNotFound(spec_id))
    }

    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError> {
        self.ensure_items_loaded()?;
        self.items
            .read()
            .as_ref()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or(ResolverError::ItemNotFound(id))
    }

    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError> {
        self.ensure_auras_loaded()?;
        self.auras
            .read()
            .as_ref()
            .unwrap()
            .get(&spell_id)
            .cloned()
            .ok_or(ResolverError::AuraNotFound(spell_id))
    }

    async fn search_spells(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SpellDataFlat>, ResolverError> {
        self.ensure_spells_loaded()?;
        let query_lower = query.to_lowercase();
        let spells = self.spells.read();
        Ok(spells
            .as_ref()
            .unwrap()
            .values()
            .filter(|s| s.name.to_lowercase().contains(&query_lower))
            .take(limit)
            .cloned()
            .collect())
    }
}
