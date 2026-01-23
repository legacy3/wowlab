use std::time::Instant;

use sqlx::PgPool;

use crate::utils::filter_refresh::FilterMap;

/// Shared state between the Discord bot and the chunk scheduler.
///
/// Both subsystems hold an `Arc<ServerState>` and read from the same
/// in-memory filter map — the scheduler checks Discord membership via
/// the Bloom filters without any network calls.
pub struct ServerState {
    pub db: PgPool,
    pub filters: FilterMap,
    pub started_at: Instant,
}
