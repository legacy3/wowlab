# Phase 4: Engine Integration

## Context

You are integrating data loading into `crates/engine` with a **resolver trait** that supports multiple backends:

1. **Supabase resolver** - Fetches from PostgREST API (production, online)
2. **Local resolver** - Uses snapshot-parser to read from local CSV files (development, offline, portable)

This design ensures the engine is **portable** and doesn't depend on any specific server. If Supabase goes away, the engine still works with local CSV files.

**Why this matters:**

- Development: No network required, fast iteration
- Portability: Engine works standalone with just CSV files
- Resilience: Not dependent on external services

## Prerequisites

- Phase 1-2 completed: snapshot-parser can transform CSV to flat types
- Phase 3 completed (optional): supabase-client for online mode
- Engine exists at `crates/engine/`

## Project Structure

```
wowlab/
├── crates/
│   ├── snapshot-parser/     # CSV parsing + transformation + flat types
│   ├── supabase-client/     # FROM PHASE 3 (optional, for online mode)
│   └── engine/              # MODIFYING THIS
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── data/        # NEW: Resolver trait + implementations
│           │   ├── mod.rs
│           │   ├── resolver.rs   # DataResolver trait
│           │   ├── local.rs      # LocalResolver (CSV files)
│           │   ├── supabase.rs   # SupabaseResolver (PostgREST)
│           │   └── talent.rs     # Talent string decoding
│           └── ...
~/Source/wowlab-data/        # Local CSV files for LocalResolver
```

## Objectives

1. Define `DataResolver` trait for data loading
2. Implement `LocalResolver` using snapshot-parser (CSV files)
3. Implement `SupabaseResolver` using supabase-client (PostgREST)
4. Add talent string decoding (WoW loadout strings)
5. Engine selects resolver at runtime via config/feature flags
6. Remove hardcoded spell/talent data

## Engine Cargo.toml Changes

```toml
# crates/engine/Cargo.toml
[features]
default = ["local"]
local = []  # Use local CSV files (no network)
supabase = ["dep:supabase-client"]  # Use Supabase (network required)

[dependencies]
snapshot-parser = { path = "../snapshot-parser" }
supabase-client = { path = "../supabase-client", optional = true }
tokio = { version = "1", features = ["rt-multi-thread"] }
async-trait = "0.1"
base64 = "0.22"  # For talent string decoding
# ... existing dependencies
```

## DataResolver Trait

```rust
// crates/engine/src/data/resolver.rs
use async_trait::async_trait;
use snapshot_parser::flat::{SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat};

#[derive(Debug, thiserror::Error)]
pub enum ResolverError {
    #[error("Spell not found: {0}")]
    SpellNotFound(i32),

    #[error("Talent tree not found for spec: {0}")]
    TalentTreeNotFound(i32),

    #[error("Item not found: {0}")]
    ItemNotFound(i32),

    #[error("Aura not found for spell: {0}")]
    AuraNotFound(i32),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("Talent string decode error: {0}")]
    TalentDecode(String),

    #[cfg(feature = "supabase")]
    #[error("Supabase error: {0}")]
    Supabase(#[from] supabase_client::SupabaseError),
}

#[async_trait]
pub trait DataResolver: Send + Sync {
    /// Get spell by ID
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError>;

    /// Get multiple spells by IDs
    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError>;

    /// Get talent tree for spec
    async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, ResolverError>;

    /// Get item by ID
    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError>;

    /// Get aura by spell ID
    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError>;

    /// Search spells by name (optional, may not be supported by all resolvers)
    async fn search_spells(&self, query: &str, limit: usize) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Default: not supported
        Ok(vec![])
    }
}
```

## Talent String Decoding

Reference implementation from `old/packages/wowlab-parsers/src/internal/simc/talents.ts`:

```rust
// crates/engine/src/data/talent.rs
use crate::data::ResolverError;
use snapshot_parser::flat::{TalentTreeFlat, TalentNodeFlat};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};

/// Decoded talent loadout from WoW export string
#[derive(Debug, Clone)]
pub struct DecodedTalentLoadout {
    pub spec_id: i32,
    pub class_id: i32,
    pub node_entries: Vec<TalentNodeEntry>,
}

#[derive(Debug, Clone)]
pub struct TalentNodeEntry {
    pub node_id: i32,
    pub rank_chosen: i32,
    pub choice_index: Option<i32>,  // For choice nodes
}

/// Decode a WoW talent loadout string (base64 encoded)
///
/// Format: The string is a base64-encoded binary blob containing:
/// - Version byte
/// - Spec ID (2 bytes, little endian)
/// - Tree ID (2 bytes, little endian)
/// - Node count (variable length)
/// - For each node: node_id, rank, optional choice_index
pub fn decode_talent_string(loadout_string: &str) -> Result<DecodedTalentLoadout, ResolverError> {
    // Remove any whitespace
    let cleaned = loadout_string.trim();

    // Decode base64
    let bytes = URL_SAFE_NO_PAD
        .decode(cleaned)
        .map_err(|e| ResolverError::TalentDecode(format!("Invalid base64: {}", e)))?;

    if bytes.len() < 5 {
        return Err(ResolverError::TalentDecode("Loadout too short".to_string()));
    }

    // Parse header
    let version = bytes[0];
    if version != 1 {
        return Err(ResolverError::TalentDecode(
            format!("Unknown version: {}", version)
        ));
    }

    let spec_id = i16::from_le_bytes([bytes[1], bytes[2]]) as i32;
    let _tree_id = i16::from_le_bytes([bytes[3], bytes[4]]) as i32;

    // Parse nodes (simplified - actual format is more complex with bit packing)
    let mut node_entries = Vec::new();
    let mut offset = 5;

    while offset + 2 < bytes.len() {
        let node_id = i16::from_le_bytes([bytes[offset], bytes[offset + 1]]) as i32;
        offset += 2;

        if offset >= bytes.len() {
            break;
        }

        let rank_chosen = bytes[offset] as i32;
        offset += 1;

        // Check for choice index (if high bit set)
        let choice_index = if rank_chosen & 0x80 != 0 {
            if offset >= bytes.len() {
                None
            } else {
                let choice = bytes[offset] as i32;
                offset += 1;
                Some(choice)
            }
        } else {
            None
        };

        let actual_rank = rank_chosen & 0x7F;

        if node_id > 0 && actual_rank > 0 {
            node_entries.push(TalentNodeEntry {
                node_id,
                rank_chosen: actual_rank,
                choice_index,
            });
        }
    }

    // Map spec_id to class_id (simplified lookup)
    let class_id = spec_id_to_class_id(spec_id);

    Ok(DecodedTalentLoadout {
        spec_id,
        class_id,
        node_entries,
    })
}

/// Encode talents back to WoW loadout string
pub fn encode_talent_string(loadout: &DecodedTalentLoadout, tree_id: i32) -> String {
    let mut bytes = Vec::new();

    // Header
    bytes.push(1); // Version
    bytes.extend_from_slice(&(loadout.spec_id as i16).to_le_bytes());
    bytes.extend_from_slice(&(tree_id as i16).to_le_bytes());

    // Nodes
    for entry in &loadout.node_entries {
        bytes.extend_from_slice(&(entry.node_id as i16).to_le_bytes());

        let mut rank_byte = entry.rank_chosen as u8;
        if entry.choice_index.is_some() {
            rank_byte |= 0x80;
        }
        bytes.push(rank_byte);

        if let Some(choice) = entry.choice_index {
            bytes.push(choice as u8);
        }
    }

    URL_SAFE_NO_PAD.encode(&bytes)
}

/// Resolve decoded talents to spell IDs using the tree structure
pub fn resolve_talents_to_spells(
    tree: &TalentTreeFlat,
    decoded: &DecodedTalentLoadout,
) -> Vec<i32> {
    let mut spell_ids = Vec::new();

    for entry in &decoded.node_entries {
        // Find the node in the tree
        if let Some(node) = tree.nodes.iter().find(|n| n.node_id == entry.node_id) {
            // For choice nodes, use choice_index to pick the right spell
            // For regular nodes, use the node's spell_id
            if let Some(choice_idx) = entry.choice_index {
                // Choice node: spell_id might be in choice_entries (not modeled yet)
                // For now, use the base spell_id
                spell_ids.push(node.spell_id);
            } else if entry.rank_chosen > 0 {
                spell_ids.push(node.spell_id);
            }
        }
    }

    spell_ids
}

/// Map spec ID to class ID
fn spec_id_to_class_id(spec_id: i32) -> i32 {
    match spec_id {
        // Death Knight
        250 | 251 | 252 => 6,
        // Demon Hunter
        577 | 581 => 12,
        // Druid
        102 | 103 | 104 | 105 => 11,
        // Evoker
        1467 | 1468 | 1473 => 13,
        // Hunter
        253 | 254 | 255 => 3,
        // Mage
        62 | 63 | 64 => 8,
        // Monk
        268 | 270 | 269 => 10,
        // Paladin
        65 | 66 | 70 => 2,
        // Priest
        256 | 257 | 258 => 5,
        // Rogue
        259 | 260 | 261 => 4,
        // Shaman
        262 | 263 | 264 => 7,
        // Warlock
        265 | 266 | 267 => 9,
        // Warrior
        71 | 72 | 73 => 1,
        _ => 0,
    }
}
```

## LocalResolver (CSV Files)

```rust
// crates/engine/src/data/local.rs
use crate::data::resolver::{DataResolver, ResolverError};
use snapshot_parser::{dbc, transform, flat::*};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::RwLock;

/// Resolver that loads data from local CSV files
///
/// Uses lazy initialization to avoid loading all data upfront.
pub struct LocalResolver {
    data_dir: PathBuf,
    // Cached transformed data (lazy loaded)
    spells: RwLock<Option<HashMap<i32, SpellDataFlat>>>,
    talents: RwLock<Option<HashMap<i32, TalentTreeFlat>>>,
    items: RwLock<Option<HashMap<i32, ItemDataFlat>>>,
    auras: RwLock<Option<HashMap<i32, AuraDataFlat>>>,
}

impl LocalResolver {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            spells: RwLock::new(None),
            talents: RwLock::new(None),
            items: RwLock::new(None),
            auras: RwLock::new(None),
        }
    }

    /// Preload all data (optional, for benchmarking or when you know you'll need it all)
    pub fn preload_all(&self) -> Result<(), ResolverError> {
        self.ensure_spells_loaded()?;
        self.ensure_talents_loaded()?;
        self.ensure_items_loaded()?;
        self.ensure_auras_loaded()?;
        Ok(())
    }

    /// Lazy load spells on first access
    fn ensure_spells_loaded(&self) -> Result<(), ResolverError> {
        if self.spells.read().unwrap().is_some() {
            return Ok(());
        }

        let dbc_data = dbc::load_all(&self.data_dir)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let spells = transform::all_spells(&dbc_data)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let spell_map: HashMap<i32, SpellDataFlat> = spells
            .into_iter()
            .map(|s| (s.id, s))
            .collect();

        *self.spells.write().unwrap() = Some(spell_map);
        Ok(())
    }

    /// Lazy load talent trees on first access
    fn ensure_talents_loaded(&self) -> Result<(), ResolverError> {
        if self.talents.read().unwrap().is_some() {
            return Ok(());
        }

        let dbc_data = dbc::load_all(&self.data_dir)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let talents = transform::all_talent_trees(&dbc_data)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let talent_map: HashMap<i32, TalentTreeFlat> = talents
            .into_iter()
            .map(|t| (t.spec_id, t))
            .collect();

        *self.talents.write().unwrap() = Some(talent_map);
        Ok(())
    }

    /// Lazy load items on first access
    fn ensure_items_loaded(&self) -> Result<(), ResolverError> {
        if self.items.read().unwrap().is_some() {
            return Ok(());
        }

        let dbc_data = dbc::load_all(&self.data_dir)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let items = transform::all_items(&dbc_data)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let item_map: HashMap<i32, ItemDataFlat> = items
            .into_iter()
            .map(|i| (i.id, i))
            .collect();

        *self.items.write().unwrap() = Some(item_map);
        Ok(())
    }

    /// Lazy load auras on first access
    fn ensure_auras_loaded(&self) -> Result<(), ResolverError> {
        if self.auras.read().unwrap().is_some() {
            return Ok(());
        }

        let dbc_data = dbc::load_all(&self.data_dir)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let auras = transform::all_auras(&dbc_data)
            .map_err(|e| ResolverError::Parse(e.to_string()))?;

        let aura_map: HashMap<i32, AuraDataFlat> = auras
            .into_iter()
            .map(|a| (a.spell_id, a))
            .collect();

        *self.auras.write().unwrap() = Some(aura_map);
        Ok(())
    }
}

#[async_trait::async_trait]
impl DataResolver for LocalResolver {
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError> {
        self.ensure_spells_loaded()?;
        self.spells.read().unwrap()
            .as_ref()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or(ResolverError::SpellNotFound(id))
    }

    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError> {
        self.ensure_spells_loaded()?;
        let spells = self.spells.read().unwrap();
        let spell_map = spells.as_ref().unwrap();
        Ok(ids.iter()
            .filter_map(|id| spell_map.get(id).cloned())
            .collect())
    }

    async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, ResolverError> {
        self.ensure_talents_loaded()?;
        self.talents.read().unwrap()
            .as_ref()
            .unwrap()
            .get(&spec_id)
            .cloned()
            .ok_or(ResolverError::TalentTreeNotFound(spec_id))
    }

    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError> {
        self.ensure_items_loaded()?;
        self.items.read().unwrap()
            .as_ref()
            .unwrap()
            .get(&id)
            .cloned()
            .ok_or(ResolverError::ItemNotFound(id))  // FIXED: Was SpellNotFound
    }

    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError> {
        self.ensure_auras_loaded()?;
        self.auras.read().unwrap()
            .as_ref()
            .unwrap()
            .get(&spell_id)
            .cloned()
            .ok_or(ResolverError::AuraNotFound(spell_id))
    }

    async fn search_spells(&self, query: &str, limit: usize) -> Result<Vec<SpellDataFlat>, ResolverError> {
        self.ensure_spells_loaded()?;
        let query_lower = query.to_lowercase();
        let spells = self.spells.read().unwrap();
        Ok(spells.as_ref().unwrap()
            .values()
            .filter(|s| s.name.to_lowercase().contains(&query_lower))
            .take(limit)
            .cloned()
            .collect())
    }
}
```

## SupabaseResolver (PostgREST)

```rust
// crates/engine/src/data/supabase.rs
#[cfg(feature = "supabase")]
use crate::data::resolver::{DataResolver, ResolverError};
#[cfg(feature = "supabase")]
use supabase_client::{SupabaseClient, CachedClient, CacheConfig};
use snapshot_parser::flat::*;

#[cfg(feature = "supabase")]
pub struct SupabaseResolver {
    client: CachedClient,
}

#[cfg(feature = "supabase")]
impl SupabaseResolver {
    pub fn new(supabase_client: SupabaseClient) -> Self {
        Self {
            client: CachedClient::new(supabase_client, CacheConfig::default()),
        }
    }

    pub fn from_env() -> Result<Self, std::env::VarError> {
        Ok(Self::new(SupabaseClient::from_env()?))
    }

    /// Invalidate cache (call after data sync)
    pub fn invalidate_cache(&self) {
        self.client.invalidate_all();
    }
}

#[cfg(feature = "supabase")]
#[async_trait::async_trait]
impl DataResolver for SupabaseResolver {
    async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, ResolverError> {
        self.client.get_spell(id).await.map_err(Into::into)
    }

    async fn get_spells(&self, ids: &[i32]) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Use underlying client for batch (cache doesn't batch)
        // Could optimize with parallel requests through cache
        let mut results = Vec::with_capacity(ids.len());
        for id in ids {
            match self.client.get_spell(*id).await {
                Ok(spell) => results.push(spell),
                Err(_) => continue, // Skip not found
            }
        }
        Ok(results)
    }

    async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, ResolverError> {
        self.client.get_talent_tree(spec_id).await.map_err(Into::into)
    }

    async fn get_item(&self, id: i32) -> Result<ItemDataFlat, ResolverError> {
        self.client.get_item(id).await.map_err(Into::into)
    }

    async fn get_aura(&self, spell_id: i32) -> Result<AuraDataFlat, ResolverError> {
        // Note: CachedClient doesn't cache auras yet
        todo!("Add aura caching to CachedClient")
    }

    async fn search_spells(&self, query: &str, limit: usize) -> Result<Vec<SpellDataFlat>, ResolverError> {
        // Search doesn't go through cache (results vary)
        todo!("Search via underlying client")
    }
}
```

## Resolver Factory

```rust
// crates/engine/src/data/mod.rs
pub mod resolver;
pub mod local;
pub mod talent;
#[cfg(feature = "supabase")]
pub mod supabase;

pub use resolver::{DataResolver, ResolverError};
pub use local::LocalResolver;
pub use talent::{decode_talent_string, encode_talent_string, resolve_talents_to_spells, DecodedTalentLoadout};
#[cfg(feature = "supabase")]
pub use supabase::SupabaseResolver;

use std::path::PathBuf;
use std::sync::Arc;

pub enum ResolverConfig {
    Local { data_dir: PathBuf },
    #[cfg(feature = "supabase")]
    Supabase,
}

pub fn create_resolver(config: ResolverConfig) -> Result<Arc<dyn DataResolver>, ResolverError> {
    match config {
        ResolverConfig::Local { data_dir } => {
            Ok(Arc::new(LocalResolver::new(data_dir)))
        }
        #[cfg(feature = "supabase")]
        ResolverConfig::Supabase => {
            let resolver = SupabaseResolver::from_env()
                .map_err(|e| ResolverError::Parse(e.to_string()))?;
            Ok(Arc::new(resolver))
        }
    }
}
```

## Simulation Setup

```rust
// crates/engine/src/simulation.rs
use crate::data::{
    DataResolver, ResolverConfig, create_resolver,
    decode_talent_string, resolve_talents_to_spells,
};
use std::sync::Arc;
use std::collections::HashMap;

pub struct SimConfig {
    pub spec_id: i32,
    pub talent_string: String,
    pub duration_seconds: f64,
    pub iterations: u32,
    pub resolver: ResolverConfig,
}

pub async fn create_simulation(config: SimConfig) -> Result<Simulation, EngineError> {
    // Create resolver based on config
    let resolver = create_resolver(config.resolver)?;

    // Get talent tree
    let talent_tree = resolver.get_talent_tree(config.spec_id).await?;

    // Decode talent string to get active talents
    let decoded = decode_talent_string(&config.talent_string)?;

    // Validate spec matches
    if decoded.spec_id != config.spec_id {
        return Err(EngineError::SpecMismatch {
            expected: config.spec_id,
            got: decoded.spec_id,
        });
    }

    // Resolve talents to spell IDs
    let active_spell_ids = resolve_talents_to_spells(&talent_tree, &decoded);

    // Fetch all needed spells
    let spell_data = resolver.get_spells(&active_spell_ids).await?;

    // Convert to engine types
    let spells: HashMap<u32, Spell> = spell_data
        .into_iter()
        .map(|flat| (flat.id as u32, Spell::from(flat)))
        .collect();

    Ok(Simulation::new(spells, config))
}
```

## Converting Flat Types to Engine Types

```rust
// crates/engine/src/spell.rs
use snapshot_parser::flat::SpellDataFlat;
use std::time::Duration;

impl From<SpellDataFlat> for Spell {
    fn from(flat: SpellDataFlat) -> Self {
        Self {
            id: flat.id as u32,
            name: flat.name,
            cast_time: Duration::from_millis(flat.cast_time_ms as u64),
            cooldown: Duration::from_millis(flat.cooldown_ms as u64),
            gcd: Duration::from_millis(flat.gcd_ms as u64),
            charges: flat.charges as u8,
            charge_cooldown: Duration::from_millis(flat.charge_cooldown_ms as u64),
            power_cost: flat.power_cost,
            power_type: PowerType::from(flat.power_type),
            school: SpellSchool::from(flat.spell_school_mask),
            min_range: flat.min_range,
            max_range: flat.max_range,
            // Effects
            effects: flat.effects.into_iter().map(Into::into).collect(),
            // Damage
            base_damage: flat.base_damage,
            ap_coefficient: flat.ap_coefficient,
            sp_coefficient: flat.sp_coefficient,
            // ... map other fields
        }
    }
}
```

## CLI Changes

```rust
// crates/engine/src/cli/mod.rs
use clap::{Parser, ValueEnum};
use crate::data::ResolverConfig;
use std::path::PathBuf;

#[derive(Clone, ValueEnum)]
pub enum DataSource {
    /// Load from local CSV files (offline, portable)
    Local,
    /// Load from Supabase (online, requires env vars)
    #[cfg(feature = "supabase")]
    Supabase,
}

#[derive(Parser)]
pub struct SimArgs {
    /// Spec ID (e.g., 253 for BM Hunter)
    #[arg(short, long)]
    pub spec: i32,

    /// Talent string from WoW (base64 encoded)
    #[arg(short, long)]
    pub talents: String,

    /// Duration in seconds
    #[arg(short, long, default_value = "300")]
    pub duration: f64,

    /// Number of iterations
    #[arg(short, long, default_value = "1000")]
    pub iterations: u32,

    /// Data source (local or supabase)
    #[arg(long, default_value = "local")]
    pub data_source: DataSource,

    /// Path to CSV data directory (for local mode)
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = SimArgs::parse();

    let resolver = match args.data_source {
        DataSource::Local => ResolverConfig::Local { data_dir: args.data_dir },
        #[cfg(feature = "supabase")]
        DataSource::Supabase => ResolverConfig::Supabase,
    };

    let config = SimConfig {
        spec_id: args.spec,
        talent_string: args.talents,
        duration_seconds: args.duration,
        iterations: args.iterations,
        resolver,
    };

    let sim = create_simulation(config).await?;
    let results = sim.run();
    println!("{}", results);

    Ok(())
}
```

## Usage

```bash
# Local mode (default) - no network required
cargo run -p engine -- sim \
    --spec 253 \
    --talents "BYGAAAAAAAAAAAAAAAAAAAAAAIRSSLJJRSSSCAAAAAAgSAAAAAAA" \
    --data-source local \
    --data-dir ~/Source/wowlab-data

# Supabase mode (requires feature + env vars)
cargo run -p engine --features supabase -- sim \
    --spec 253 \
    --talents "BYGAAAAAAAAAAAAAAAAAAAAAAIRSSLJJRSSSCAAAAAAgSAAAAAAA" \
    --data-source supabase
```

## Checklist

- [ ] Add `snapshot-parser` to engine Cargo.toml
- [ ] Add `supabase-client` as optional dependency
- [ ] Add `base64` dependency for talent decoding
- [ ] Add feature flags (`local`, `supabase`)
- [ ] Create `src/data/mod.rs`
- [ ] Create `src/data/resolver.rs` with DataResolver trait
- [ ] Create `src/data/talent.rs` with decode/encode functions
- [ ] Create `src/data/local.rs` with LocalResolver (lazy loading)
- [ ] Create `src/data/supabase.rs` with SupabaseResolver
- [ ] Add `ResolverError::ItemNotFound` (not SpellNotFound)
- [ ] Add `ResolverError::AuraNotFound`
- [ ] Add `ResolverError::TalentDecode`
- [ ] Implement `From<SpellDataFlat> for Spell`
- [ ] Implement `From<TalentTreeFlat>` conversions
- [ ] Update simulation setup to use resolver
- [ ] Add talent string decoding with spec_id validation
- [ ] Update CLI with `--data-source` flag
- [ ] Remove hardcoded spell definitions
- [ ] Remove hardcoded talent definitions
- [ ] Test local mode with CSV files
- [ ] Test talent string round-trip (decode → encode)
- [ ] Test supabase mode (if feature enabled)

## Success Criteria

1. **Compiles (local)**: `cargo build -p engine` succeeds
2. **Compiles (supabase)**: `cargo build -p engine --features supabase` succeeds
3. **Local Mode Works**: Engine loads data from CSV files
4. **Supabase Mode Works**: Engine loads data from PostgREST
5. **Portable**: Engine runs standalone with just CSV files (no network)
6. **Talent Strings Work**: Can decode WoW talent string and get correct spells
7. **Lazy Loading**: Only loads data types that are actually used

## Verification

```bash
# Build engine (local mode only - default)
cargo build -p engine

# Test local mode
cargo run -p engine -- sim \
    --spec 253 \
    --talents "BYGAAAAAAAAAAAAAAAAAAAAAAIRSSLJJRSSSCAAAAAAgSAAAAAAA" \
    --data-source local \
    --data-dir ~/Source/wowlab-data

# Build with supabase support
cargo build -p engine --features supabase

# Test supabase mode
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
cargo run -p engine --features supabase -- sim \
    --spec 253 \
    --talents "BYGAAAAAAAAAAAAAAAAAAAAAAIRSSLJJRSSSCAAAAAAgSAAAAAAA" \
    --data-source supabase
```

## Notes

- **Local mode is the default** - no network required
- **Supabase is optional** - only if you need online updates
- **Lazy loading** prevents memory issues with large datasets
- Engine uses async for data loading (tokio runtime)
- Talent string decoding follows WoW's base64 format (URL_SAFE_NO_PAD)
- The spec_id in talent string is validated against config
- The engine binary with local mode is fully portable - just ship with CSV files
- Consider bundling a known-good CSV snapshot with releases
