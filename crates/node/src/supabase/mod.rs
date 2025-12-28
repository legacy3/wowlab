//! Supabase client module

mod client;
pub mod realtime;

pub use client::{ApiClient, ApiError};
pub use realtime::{NodePayload, RealtimeEvent, SupabaseRealtime};
