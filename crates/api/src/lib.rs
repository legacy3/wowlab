//! Supabase PostgREST client for reading flat tables
//!
//! This library provides a Rust client for reading spell, talent, item, and aura data
//! from Supabase via the PostgREST API.

pub mod client;
pub mod errors;
pub mod game_cache;
pub mod partial;
pub mod queries;
pub mod retry;

pub use client::SupabaseClient;
pub use errors::SupabaseError;
pub use game_cache::{CacheStats, DiskStats, GameDataCache, MemoryStats};
pub use partial::{
    ItemSummary, SpellCost, SpellDamage, SpellRange, SpellSummary, SpellTiming, TalentNodeSummary,
};
pub use retry::{with_retry, RetryConfig};
