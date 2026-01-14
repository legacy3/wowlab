# Phase 3: Rust PostgREST Client

## Context

You are creating a Rust library for reading flat tables via Supabase's PostgREST API. This library will be used by both the Engine (at build time or runtime) and the MCP server. It uses the public anon key with RLS - no direct Postgres connection.

**Security model:** All reads go through PostgREST API with anon key + RLS. No service keys for reading.

## Prerequisites

- Phase 1-2 completed: Flat tables exist and have data
- RLS policies in place (public read access)
- Supabase project URL and anon key

## Project Structure

```
wowlab/
├── crates/
│   ├── snapshot-parser/     # FROM PHASE 1 (flat types)
│   ├── cli/                 # FROM PHASE 2 (writes)
│   └── supabase-client/     # YOU ARE CREATING THIS (reads)
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── client.rs
│           ├── queries.rs
│           ├── cache.rs
│           ├── retry.rs
│           └── partial.rs
```

## Objectives

1. Create `crates/supabase-client` for reading flat tables
2. Use `reqwest` to call PostgREST API
3. Support column selection (only fetch needed fields)
4. Add caching layer with TTL and invalidation
5. Add retry logic for transient network failures

## Cargo.toml

```toml
[package]
name = "supabase-client"
version = "0.1.0"
edition = "2021"

[dependencies]
snapshot-parser = { path = "../snapshot-parser" }  # For flat types
reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
urlencoding = "2"  # For URL-safe query encoding
parking_lot = "0.12"  # For efficient RwLock

[dev-dependencies]
tokio-test = "0.4"
wiremock = "0.6"  # For testing without real Supabase
```

## Client Implementation

```rust
// crates/supabase-client/src/lib.rs
pub mod client;
pub mod queries;
pub mod cache;
pub mod retry;
pub mod partial;

pub use client::{SupabaseClient, SupabaseError};
pub use cache::{CachedClient, CacheConfig};
pub use partial::*;
pub use queries::*;
```

```rust
// crates/supabase-client/src/client.rs
use reqwest::Client;
use thiserror::Error;
use std::time::Duration;

#[derive(Error, Debug)]
pub enum SupabaseError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Not found: {resource} with {key}={value}")]
    NotFound {
        resource: String,
        key: String,
        value: String,
    },

    #[error("Parse error: {0}")]
    Parse(#[from] serde_json::Error),

    #[error("Rate limited, retry after {retry_after_ms}ms")]
    RateLimited { retry_after_ms: u64 },

    #[error("Server error ({status}): {message}")]
    Server { status: u16, message: String },
}

pub struct SupabaseClient {
    http: Client,
    base_url: String,
    anon_key: String,
}

impl SupabaseClient {
    pub fn new(project_url: &str, anon_key: &str) -> Self {
        let http = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            http,
            base_url: format!("{}/rest/v1", project_url),
            anon_key: anon_key.to_string(),
        }
    }

    pub fn from_env() -> Result<Self, std::env::VarError> {
        Ok(Self::new(
            &std::env::var("SUPABASE_URL")?,
            &std::env::var("SUPABASE_ANON_KEY")?,
        ))
    }

    /// GET request to PostgREST with error handling
    pub async fn get(&self, path: &str) -> Result<reqwest::Response, SupabaseError> {
        let url = format!("{}/{}", self.base_url, path);
        tracing::debug!("GET {}", url);

        let response = self
            .http
            .get(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", self.anon_key))
            .send()
            .await?;

        let status = response.status();

        // Handle specific error codes
        if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(1000);
            return Err(SupabaseError::RateLimited {
                retry_after_ms: retry_after,
            });
        }

        if status.is_server_error() {
            let message = response.text().await.unwrap_or_default();
            return Err(SupabaseError::Server {
                status: status.as_u16(),
                message,
            });
        }

        Ok(response)
    }
}
```

## Retry Logic

```rust
// crates/supabase-client/src/retry.rs
use crate::SupabaseError;
use std::future::Future;
use std::time::Duration;
use tokio::time::sleep;

/// Retry configuration
pub struct RetryConfig {
    pub max_attempts: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_factor: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay_ms: 100,
            max_delay_ms: 5000,
            backoff_factor: 2.0,
        }
    }
}

/// Retry a fallible async operation with exponential backoff
pub async fn with_retry<T, F, Fut>(
    config: &RetryConfig,
    mut operation: F,
) -> Result<T, SupabaseError>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = Result<T, SupabaseError>>,
{
    let mut attempts = 0;
    let mut delay_ms = config.initial_delay_ms;

    loop {
        attempts += 1;
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                // Check if error is retryable
                let is_retryable = matches!(
                    &e,
                    SupabaseError::Http(_)
                        | SupabaseError::RateLimited { .. }
                        | SupabaseError::Server { status, .. } if *status >= 500
                );

                if !is_retryable || attempts >= config.max_attempts {
                    return Err(e);
                }

                // Use retry-after header for rate limiting
                if let SupabaseError::RateLimited { retry_after_ms } = &e {
                    delay_ms = *retry_after_ms;
                }

                tracing::warn!(
                    "Request failed (attempt {}/{}), retrying in {}ms: {}",
                    attempts,
                    config.max_attempts,
                    delay_ms,
                    e
                );

                sleep(Duration::from_millis(delay_ms)).await;

                // Exponential backoff for next attempt
                delay_ms = ((delay_ms as f64) * config.backoff_factor) as u64;
                delay_ms = delay_ms.min(config.max_delay_ms);
            }
        }
    }
}
```

## Caching Layer

```rust
// crates/supabase-client/src/cache.rs
use crate::{SupabaseClient, SupabaseError};
use parking_lot::RwLock;
use snapshot_parser::flat::{SpellDataFlat, TalentTreeFlat, ItemDataFlat};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

/// Cache configuration
pub struct CacheConfig {
    /// Time-to-live for cached entries
    pub ttl: Duration,
    /// Maximum number of entries per cache type
    pub max_entries: usize,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            ttl: Duration::from_secs(300), // 5 minutes
            max_entries: 10_000,
        }
    }
}

struct CacheEntry<T> {
    value: T,
    inserted_at: Instant,
}

impl<T> CacheEntry<T> {
    fn is_expired(&self, ttl: Duration) -> bool {
        self.inserted_at.elapsed() > ttl
    }
}

/// Cached client wrapper with TTL-based expiration
pub struct CachedClient {
    client: SupabaseClient,
    config: CacheConfig,
    spell_cache: RwLock<HashMap<i32, CacheEntry<SpellDataFlat>>>,
    talent_cache: RwLock<HashMap<i32, CacheEntry<TalentTreeFlat>>>,
    item_cache: RwLock<HashMap<i32, CacheEntry<ItemDataFlat>>>,
}

impl CachedClient {
    pub fn new(client: SupabaseClient, config: CacheConfig) -> Self {
        Self {
            client,
            config,
            spell_cache: RwLock::new(HashMap::new()),
            talent_cache: RwLock::new(HashMap::new()),
            item_cache: RwLock::new(HashMap::new()),
        }
    }

    /// Invalidate all cached data (call after sync)
    pub fn invalidate_all(&self) {
        self.spell_cache.write().clear();
        self.talent_cache.write().clear();
        self.item_cache.write().clear();
        tracing::info!("Cache invalidated");
    }

    /// Invalidate specific spell from cache
    pub fn invalidate_spell(&self, id: i32) {
        self.spell_cache.write().remove(&id);
    }

    /// Invalidate specific talent tree from cache
    pub fn invalidate_talent_tree(&self, spec_id: i32) {
        self.talent_cache.write().remove(&spec_id);
    }

    /// Evict expired entries (call periodically)
    pub fn evict_expired(&self) {
        let ttl = self.config.ttl;

        self.spell_cache.write().retain(|_, e| !e.is_expired(ttl));
        self.talent_cache.write().retain(|_, e| !e.is_expired(ttl));
        self.item_cache.write().retain(|_, e| !e.is_expired(ttl));
    }

    pub async fn get_spell(&self, id: i32) -> Result<SpellDataFlat, SupabaseError> {
        // Check cache first
        {
            let cache = self.spell_cache.read();
            if let Some(entry) = cache.get(&id) {
                if !entry.is_expired(self.config.ttl) {
                    return Ok(entry.value.clone());
                }
            }
        }

        // Fetch from API
        let spell = self.client.get_spell(id, None).await?;

        // Cache it (with LRU eviction if needed)
        {
            let mut cache = self.spell_cache.write();
            if cache.len() >= self.config.max_entries {
                // Simple eviction: remove oldest entry
                if let Some(oldest_key) = cache
                    .iter()
                    .min_by_key(|(_, e)| e.inserted_at)
                    .map(|(k, _)| *k)
                {
                    cache.remove(&oldest_key);
                }
            }
            cache.insert(
                id,
                CacheEntry {
                    value: spell.clone(),
                    inserted_at: Instant::now(),
                },
            );
        }

        Ok(spell)
    }

    pub async fn get_talent_tree(&self, spec_id: i32) -> Result<TalentTreeFlat, SupabaseError> {
        // Check cache first
        {
            let cache = self.talent_cache.read();
            if let Some(entry) = cache.get(&spec_id) {
                if !entry.is_expired(self.config.ttl) {
                    return Ok(entry.value.clone());
                }
            }
        }

        // Fetch from API
        let tree = self.client.get_talent_tree(spec_id).await?;

        // Cache it
        {
            let mut cache = self.talent_cache.write();
            cache.insert(
                spec_id,
                CacheEntry {
                    value: tree.clone(),
                    inserted_at: Instant::now(),
                },
            );
        }

        Ok(tree)
    }

    pub async fn get_item(&self, id: i32) -> Result<ItemDataFlat, SupabaseError> {
        // Check cache first
        {
            let cache = self.item_cache.read();
            if let Some(entry) = cache.get(&id) {
                if !entry.is_expired(self.config.ttl) {
                    return Ok(entry.value.clone());
                }
            }
        }

        // Fetch from API
        let item = self.client.get_item(id, None).await?;

        // Cache it
        {
            let mut cache = self.item_cache.write();
            cache.insert(
                id,
                CacheEntry {
                    value: item.clone(),
                    inserted_at: Instant::now(),
                },
            );
        }

        Ok(item)
    }
}
```

## Query Helpers

```rust
// crates/supabase-client/src/queries.rs
use crate::{SupabaseClient, SupabaseError};
use snapshot_parser::flat::{SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat};
use urlencoding::encode;

impl SupabaseClient {
    /// Get spell by ID with optional column selection
    pub async fn get_spell(
        &self,
        id: i32,
        columns: Option<&[&str]>,
    ) -> Result<SpellDataFlat, SupabaseError> {
        let select = columns
            .map(|c| c.join(","))
            .unwrap_or_else(|| "*".to_string());

        let path = format!("spell_data_flat?id=eq.{}&select={}", id, select);
        let response = self.get(&path).await?;

        let spells: Vec<SpellDataFlat> = response.json().await?;
        spells.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
            resource: "spell_data_flat".to_string(),
            key: "id".to_string(),
            value: id.to_string(),
        })
    }

    /// Get spell by ID, only fetching specific columns
    /// Returns a partial struct (fields not selected will be default)
    pub async fn get_spell_partial<T: serde::de::DeserializeOwned>(
        &self,
        id: i32,
        columns: &[&str],
    ) -> Result<T, SupabaseError> {
        let select = columns.join(",");
        let path = format!("spell_data_flat?id=eq.{}&select={}", id, select);
        let response = self.get(&path).await?;

        let items: Vec<T> = response.json().await?;
        items.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
            resource: "spell_data_flat".to_string(),
            key: "id".to_string(),
            value: id.to_string(),
        })
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

        let select = columns
            .map(|c| c.join(","))
            .unwrap_or_else(|| "*".to_string());

        let ids_str = ids
            .iter()
            .map(|id| id.to_string())
            .collect::<Vec<_>>()
            .join(",");

        // FIXED: Include select parameter in query string
        let path = format!("spell_data_flat?id=in.({}),&select={}", ids_str, select);
        let response = self.get(&path).await?;
        Ok(response.json().await?)
    }

    /// Search spells by name (URL-encoded for safety)
    pub async fn search_spells(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SpellDataFlat>, SupabaseError> {
        // URL-encode the query to handle special characters
        let encoded_query = encode(query);
        let path = format!(
            "spell_data_flat?name=ilike.*{}*&limit={}&select=id,name,icon_file_data_id",
            encoded_query, limit
        );
        let response = self.get(&path).await?;
        Ok(response.json().await?)
    }

    /// Get talent tree for a spec
    pub async fn get_talent_tree(
        &self,
        spec_id: i32,
    ) -> Result<TalentTreeFlat, SupabaseError> {
        let path = format!("talent_tree_flat?spec_id=eq.{}", spec_id);
        let response = self.get(&path).await?;

        let trees: Vec<TalentTreeFlat> = response.json().await?;
        trees.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
            resource: "talent_tree_flat".to_string(),
            key: "spec_id".to_string(),
            value: spec_id.to_string(),
        })
    }

    /// Get all talent trees for a class
    pub async fn get_class_talent_trees(
        &self,
        class_id: i32,
    ) -> Result<Vec<TalentTreeFlat>, SupabaseError> {
        let path = format!("talent_tree_flat?class_id=eq.{}", class_id);
        let response = self.get(&path).await?;
        Ok(response.json().await?)
    }

    /// Get item by ID
    pub async fn get_item(
        &self,
        id: i32,
        columns: Option<&[&str]>,
    ) -> Result<ItemDataFlat, SupabaseError> {
        let select = columns
            .map(|c| c.join(","))
            .unwrap_or_else(|| "*".to_string());

        let path = format!("item_data_flat?id=eq.{}&select={}", id, select);
        let response = self.get(&path).await?;

        let items: Vec<ItemDataFlat> = response.json().await?;
        items.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
            resource: "item_data_flat".to_string(),
            key: "id".to_string(),
            value: id.to_string(),
        })
    }

    /// Get aura by spell ID
    pub async fn get_aura(
        &self,
        spell_id: i32,
    ) -> Result<AuraDataFlat, SupabaseError> {
        let path = format!("aura_data_flat?spell_id=eq.{}", spell_id);
        let response = self.get(&path).await?;

        let auras: Vec<AuraDataFlat> = response.json().await?;
        auras.into_iter().next().ok_or_else(|| SupabaseError::NotFound {
            resource: "aura_data_flat".to_string(),
            key: "spell_id".to_string(),
            value: spell_id.to_string(),
        })
    }
}
```

## Partial Types for Column Selection

```rust
// crates/supabase-client/src/partial.rs
use serde::Deserialize;

/// Minimal spell info for lists/search results
#[derive(Debug, Clone, Deserialize)]
pub struct SpellSummary {
    pub id: i32,
    pub name: String,
    pub icon_file_data_id: i32,
}

/// Spell timing info only
#[derive(Debug, Clone, Deserialize)]
pub struct SpellTiming {
    pub id: i32,
    pub cast_time_ms: i32,
    pub gcd_ms: i32,
    pub cooldown_ms: i32,
    pub charges: i32,
    pub charge_cooldown_ms: i32,
}

/// Spell cost info only
#[derive(Debug, Clone, Deserialize)]
pub struct SpellCost {
    pub id: i32,
    pub power_type: i32,
    pub power_cost: i32,
    pub power_cost_per_second: i32,
    pub power_cost_pct: f64,
}

/// Spell damage info only
#[derive(Debug, Clone, Deserialize)]
pub struct SpellDamage {
    pub id: i32,
    pub spell_school_mask: i32,
    pub base_damage: f64,
    pub ap_coefficient: f64,
    pub sp_coefficient: f64,
}

/// Talent node summary
#[derive(Debug, Clone, Deserialize)]
pub struct TalentNodeSummary {
    pub node_id: i32,
    pub spell_id: i32,
    pub spell_name: String,
    pub row: i32,
    pub col: i32,
    pub max_ranks: i32,
}

/// Item summary for lists
#[derive(Debug, Clone, Deserialize)]
pub struct ItemSummary {
    pub id: i32,
    pub name: String,
    pub item_level: i32,
    pub quality: i32,
    pub icon_file_data_id: i32,
}
```

## Usage Examples

```rust
use supabase_client::{SupabaseClient, CachedClient, CacheConfig, SpellTiming};
use supabase_client::retry::{RetryConfig, with_retry};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Basic client
    let client = SupabaseClient::from_env()?;

    // Get full spell
    let spell = client.get_spell(53351, None).await?;
    println!("Spell: {} ({}ms cast)", spell.name, spell.cast_time_ms);

    // Get only timing info (reduces bandwidth)
    let timing: SpellTiming = client
        .get_spell_partial(53351, &["id", "cast_time_ms", "gcd_ms", "cooldown_ms", "charges", "charge_cooldown_ms"])
        .await?;
    println!("Cooldown: {}ms", timing.cooldown_ms);

    // Search spells (URL-safe)
    let results = client.search_spells("Kill Shot", 10).await?;
    for spell in results {
        println!("  {} (ID: {})", spell.name, spell.id);
    }

    // With retry logic
    let retry_config = RetryConfig::default();
    let spell = with_retry(&retry_config, || client.get_spell(53351, None)).await?;

    // With caching
    let cached = CachedClient::new(client, CacheConfig::default());
    let spell = cached.get_spell(53351).await?;  // Hits API
    let spell = cached.get_spell(53351).await?;  // Hits cache

    // Invalidate after sync
    cached.invalidate_all();

    // Get talent tree
    let tree = cached.get_talent_tree(253).await?; // BM Hunter
    println!("Tree: {} - {} nodes", tree.spec_name, tree.nodes.len());

    Ok(())
}
```

## Checklist

- [ ] Create `crates/supabase-client/Cargo.toml`
- [ ] Create `src/lib.rs` with module exports
- [ ] Create `src/client.rs` with SupabaseClient struct
- [ ] Create `src/queries.rs` with query methods
- [ ] Create `src/retry.rs` with exponential backoff
- [ ] Create `src/cache.rs` with TTL-based caching
- [ ] Create `src/partial.rs` with partial types
- [ ] Add `get_spell` method with column selection
- [ ] Add `get_spells` batch method (fixed format string)
- [ ] Add `search_spells` method with URL encoding
- [ ] Add `get_talent_tree` method
- [ ] Add `get_item` method
- [ ] Add `get_aura` method
- [ ] Add error types with thiserror
- [ ] Add rate limiting error handling
- [ ] Write tests using wiremock (mock Supabase responses)
- [ ] Update workspace Cargo.toml
- [ ] Document environment variables

## Success Criteria

1. **Compiles**: `cargo build -p supabase-client` succeeds
2. **Queries Work**: Can fetch spell by ID from PostgREST
3. **Column Selection**: Can request only specific columns
4. **Search Works**: Search handles special characters safely
5. **Retry Works**: Transient errors are retried with backoff
6. **Cache Works**: Repeated queries hit cache, invalidation clears it
7. **RLS Enforced**: Works with anon key (no service key needed)

## Verification

```bash
# Set environment
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."

# Run tests
cargo test -p supabase-client

# Test query
cargo run -p supabase-client --example get_spell 53351

# Test search with special chars
cargo run -p supabase-client --example search "Death's Advance"
```

## Environment Variables

```bash
# Public credentials (safe to use in client code)
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=eyJ...  # Public anon key
```

## Notes

- Uses PostgREST query syntax (`eq.`, `in.()`, `ilike.*`)
- **URL encoding** is required for search queries with special characters
- Column selection reduces bandwidth significantly for large tables
- **Retry logic** handles transient network failures with exponential backoff
- **Caching** with TTL prevents redundant API calls
- Cache should be invalidated after CLI sync updates tables
- Anon key is safe to embed in client code (RLS protects data)
- This replaces direct Postgres connection for all reads
