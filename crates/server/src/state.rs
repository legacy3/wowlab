use std::sync::Arc;

use wowlab_api::SupabaseClient;

use crate::utils::filter_refresh::FilterMap;

/// Shared state between the Discord bot and the chunk scheduler.
///
/// Both subsystems hold an `Arc<ServerState>` and read from the same
/// in-memory filter map — the scheduler checks Discord membership via
/// the Bloom filters without any network calls.
pub struct ServerState {
    pub supabase: Arc<SupabaseClient>,
    pub filters: FilterMap,
}
