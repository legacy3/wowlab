pub const CHUNKS_ASSIGNED: &str = "sentinel_chunks_assigned_total";
pub const CHUNKS_PENDING: &str = "sentinel_chunks_pending";
pub const CHUNKS_RECLAIMED: &str = "sentinel_chunks_reclaimed_total";
pub const CHUNKS_RUNNING: &str = "sentinel_chunks_running";
pub const NODES_ONLINE: &str = "sentinel_nodes_online";
pub const UPTIME_SECONDS: &str = "sentinel_uptime_seconds";

pub fn init() {
    for name in [CHUNKS_PENDING, CHUNKS_RUNNING, NODES_ONLINE, UPTIME_SECONDS] {
        metrics::gauge!(name).set(0.0);
    }

    for name in [CHUNKS_ASSIGNED, CHUNKS_RECLAIMED] {
        metrics::counter!(name).absolute(0);
    }
}
