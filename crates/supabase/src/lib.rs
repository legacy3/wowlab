//! Generic Supabase client (PostgREST + Realtime)

pub mod client;
pub mod errors;
pub mod realtime;
pub mod retry;

pub use client::SupabaseClient;
pub use errors::SupabaseError;
pub use realtime::RealtimeManager;
pub use retry::{with_retry, RetryConfig};

// Re-export realtime types consumers need for their session functions.
pub use supabase_realtime_rs::{
    ChannelEvent, EventPayload, PostgresChangeEvent, PostgresChangesFilter,
    PostgresChangesPayload, RealtimeChannelOptions, RealtimeClient, RealtimeError,
};
