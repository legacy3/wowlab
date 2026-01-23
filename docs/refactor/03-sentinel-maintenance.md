# Phase 3: Move Cron Jobs to Sentinel

## Problem

Three pg_cron jobs handle maintenance tasks that sentinel can do better since it's already running a scheduler loop with database access. Moving them to sentinel means:
- Single source of truth for thresholds
- No hidden database-side logic
- Consistent with "sentinel handles node/chunk lifecycle" principle
- Easier to monitor via Prometheus metrics

## Current Cron Jobs to Move

| Job | Schedule | Threshold |
|-----|----------|-----------|
| `mark_nodes_offline()` | Every 1 min | 5 minutes since last heartbeat |
| `reap_stale_chunks()` | Every 1 min | 5 minutes since claimed |
| `cleanup_stale_data()` | Every 1 hour | Various (1h, 30d, 7d) |

## Sentinel Already Has

- `scheduler/reclaim.rs` — Stale chunk reclaim (60s threshold, runs every 30s)
- Scheduler loop with 30s timeout — natural place for periodic tasks

## Plan

### 1. Unify chunk reclaim

Remove sentinel's current 60-second threshold. Use 5-minute threshold (matching what the DB function uses).

```rust
// scheduler/reclaim.rs
const STALE_THRESHOLD_SECONDS: i64 = 300; // 5 minutes

pub async fn reclaim_stale_chunks(pool: &PgPool) -> Result<u64> {
    let result = sqlx::query!(
        r#"
        UPDATE jobs_chunks
        SET node_id = NULL, status = 'pending', claimed_at = NULL
        WHERE status = 'running'
          AND claimed_at < now() - interval '5 minutes'
        "#
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
```

No longer checking node `last_seen_at` — just use `claimed_at` age directly. If a chunk has been running for 5 minutes with no completion, reclaim it regardless of node status.

### 2. Add node offline marking

New function in sentinel, runs every 60 seconds:

```rust
// scheduler/maintenance.rs
pub async fn mark_nodes_offline(pool: &PgPool) -> Result<u64> {
    let result = sqlx::query!(
        r#"
        UPDATE nodes
        SET status = 'offline'
        WHERE status = 'online'
          AND last_seen_at IS NOT NULL
          AND last_seen_at < now() - interval '5 minutes'
        "#
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
```

### 3. Add data cleanup

New function in sentinel, runs every hour (track last run time):

```rust
// scheduler/maintenance.rs
pub async fn cleanup_stale_data(pool: &PgPool) -> Result<()> {
    // Delete unclaimed pending nodes older than 1 hour
    sqlx::query!(
        r#"
        DELETE FROM nodes
        WHERE status = 'pending'
          AND user_id IS NULL
          AND created_at < now() - interval '1 hour'
        "#
    )
    .execute(pool)
    .await?;

    // Delete offline nodes not seen in 30 days
    sqlx::query!(
        r#"
        DELETE FROM nodes
        WHERE status = 'offline'
          AND last_seen_at < now() - interval '30 days'
        "#
    )
    .execute(pool)
    .await?;

    // Delete unused configs older than 7 days
    sqlx::query!(
        r#"
        DELETE FROM jobs_configs
        WHERE last_used_at < now() - interval '7 days'
          AND hash NOT IN (SELECT DISTINCT config_hash FROM jobs)
        "#
    )
    .execute(pool)
    .await?;

    Ok(())
}
```

### 4. Integrate into scheduler loop

```rust
// scheduler/mod.rs
let mut last_maintenance = Instant::now();
let mut last_cleanup = Instant::now();

loop {
    state.touch_scheduler();

    match timeout(30s, listener.recv()).await {
        Ok(Ok(_)) => {
            sleep(50ms).await;
            process_pending(&state).await;
        }
        Err(_timeout) => {
            process_pending(&state).await;
            reclaim_stale_chunks(&state.db).await;

            // Every 60s: mark offline nodes
            if last_maintenance.elapsed() >= Duration::from_secs(60) {
                mark_nodes_offline(&state.db).await;
                last_maintenance = Instant::now();
            }

            // Every hour: cleanup stale data
            if last_cleanup.elapsed() >= Duration::from_secs(3600) {
                cleanup_stale_data(&state.db).await;
                last_cleanup = Instant::now();
            }

            record_gauges(&state).await;
        }
    }
}
```

### 5. Add metrics

```rust
// telemetry.rs
pub static NODES_MARKED_OFFLINE: LazyLock<IntCounter> = ...;
pub static STALE_DATA_CLEANUPS: LazyLock<IntCounter> = ...;
```

## Migration Steps

1. Update `scheduler/reclaim.rs` threshold to 5 minutes, simplify query
2. Add `scheduler/maintenance.rs` with `mark_nodes_offline` and `cleanup_stale_data`
3. Integrate timing into scheduler loop
4. Add Prometheus metrics for new operations
5. Deploy sentinel
6. Drop pg_cron jobs and DB functions (Phase 5)
