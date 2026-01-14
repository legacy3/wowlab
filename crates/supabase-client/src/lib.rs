//! Supabase PostgREST client for reading flat tables
//!
//! This library provides a Rust client for reading spell, talent, item, and aura data
//! from Supabase via the PostgREST API.

pub mod cache;
pub mod client;
pub mod errors;
pub mod partial;
pub mod queries;
pub mod retry;

pub use cache::{CacheConfig, CachedClient};
pub use client::SupabaseClient;
pub use errors::SupabaseError;
pub use partial::{
    ItemSummary, SpellCost, SpellDamage, SpellRange, SpellSummary, SpellTiming, TalentNodeSummary,
};
pub use retry::{with_retry, RetryConfig};
