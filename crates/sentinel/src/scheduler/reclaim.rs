use crate::state::ServerState;

/// Reclaim chunks assigned to nodes that have gone offline.
/// Resets them to pending so they can be reassigned.
pub async fn reclaim_stale_chunks(state: &ServerState) {
    match do_reclaim(state).await {
        Ok(count) if count > 0 => {
            tracing::info!(count, "Reclaimed stale chunks from offline nodes");
            metrics::counter!(crate::telemetry::CHUNKS_RECLAIMED).increment(count);
        }
        Ok(_) => {}
        Err(e) => {
            tracing::error!(error = %e, "Failed to reclaim stale chunks");
        }
    }
}

async fn do_reclaim(state: &ServerState) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE public.jobs_chunks
         SET node_id = NULL, status = 'pending', claimed_at = NULL
         WHERE status = 'running'
           AND node_id IS NOT NULL
           AND node_id IN (
               SELECT id FROM public.nodes
               WHERE last_seen_at < now() - interval '60 seconds'
           )"
    )
    .execute(&state.db)
    .await?;

    Ok(result.rows_affected())
}
