//! Supabase client module

mod client;
pub mod realtime;

pub use client::{NodeData, SupabaseClient, SupabaseError};
