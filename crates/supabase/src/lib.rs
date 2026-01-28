//! Generic Supabase client (PostgREST)

pub mod client;
pub mod errors;
pub mod retry;

pub use client::SupabaseClient;
pub use errors::SupabaseError;
pub use retry::{with_retry, RetryConfig};
