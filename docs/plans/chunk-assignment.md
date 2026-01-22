# Chunk Assignment: Rust Scheduler

## Problem

The current system uses a thundering herd pattern:
1. `job-create` broadcasts "work-available" to ALL nodes via Supabase Realtime
2. ALL online nodes wake up and race to call `chunk-claim`
3. Only a few get work, the rest waste edge function calls
4. With 10k nodes, that's 9,999 wasted calls per job

## Solution

A single Rust service (`crates/server`) that combines:
1. **Discord bot** (already built in `crates/discord/`)
2. **Chunk scheduler** (assigns work to nodes, replaces `chunk-claim`)

Both share the same process, same Supabase client, same Bloom filter code. The service is already running 24/7 for the bot — adding the scheduler is zero extra infra.

## Architecture

```
crates/server/
  src/
    main.rs          - Single entrypoint, spawns bot + scheduler
    bot/             - Discord bot (moved from crates/discord/)
      mod.rs
      commands/
    scheduler/       - Chunk assignment
      mod.rs
      assign.rs      - Core assignment logic
    bloom.rs         - Bloom filter (shared between bot and scheduler)
    discord.rs       - Discord API helpers (fetch members etc)
    filter_refresh.rs - Bloom filter maintenance
    meta.rs          - App metadata
    colors.rs        - Embed colors
```

## Scheduler Flow

### On New Job

1. Scheduler subscribes to Realtime postgres_changes on `jobs_chunks` (INSERT where status = 'pending')
2. New chunks appear → scheduler runs assignment logic
3. Assignment: find online nodes, check permissions, distribute by backlog
4. UPDATE chunks with node_id, status = 'running'
5. Nodes already subscribe to their own chunk changes via Realtime → they pick up work

### On Orphan Recovery

1. `reap_stale_chunks` (pg_cron, every 1 min) resets dead-node chunks to pending
2. Scheduler sees these via the same Realtime subscription (UPDATE where status = 'pending', node_id = NULL)
3. Runs assignment again

### No More Broadcasting

- `job-create` just creates chunks. No broadcast needed.
- Scheduler picks up new chunks via Realtime subscription.
- Nodes pick up their assignments via Realtime subscription.
- Zero thundering herd.

## Assignment Logic

```rust
async fn assign_pending_chunks(&self) {
    // 1. Query unassigned pending chunks
    // 2. Get job owners for those chunks
    // 3. Get online nodes (last_seen_at > now - 30s)
    // 4. Get permissions per node
    // 5. For discord perms: check Bloom filter (already in memory from bot!)
    // 6. Distribute chunks to eligible nodes by least backlog
    // 7. Batch UPDATE jobs_chunks with assignments
}
```

### Permission Types

| access_type | Check | Source |
|-------------|-------|--------|
| `public` | Always allowed | - |
| (none) | Owner only | node.user_id = job.user_id |
| `user` | Specific user | target_id = job.user_id |
| `discord` | Server membership | Bloom filter (in-memory!) |

### Discord Permission (Zero Network Cost)

The scheduler shares the same process as the Discord bot. The bot maintains `FilterMap` (in-memory Bloom filters per guild). The scheduler just reads from the same `Arc<RwLock<HashMap<GuildId, GuildFilter>>>`. No DB query needed for the Bloom filter check — it's already in RAM.

### Backlog-Aware Distribution

```rust
// Count currently assigned chunks per node
let backlog: HashMap<NodeId, usize> = query_backlogs(&supabase).await;

// Sort candidates by backlog ascending
candidates.sort_by_key(|n| backlog.get(&n.id).unwrap_or(&0));

// Assign each chunk to the least-loaded eligible node
for chunk in pending_chunks {
    let target = candidates.iter()
        .filter(|n| is_eligible(n, chunk.job_owner))
        .min_by_key(|n| n.current_backlog)?;
    assignments.push((chunk.id, target.id));
    target.current_backlog += 1;
}
```

## Edge Functions: Final Structure

| Function | Status | Notes |
|----------|--------|-------|
| `config-upsert` | Keep | Portal stores configs |
| `config-fetch` | Keep | Nodes fetch config by hash |
| `rotation-fetch` | Keep | Nodes fetch rotation scripts |
| `job-create` | Simplify | Create job + chunks only (no broadcast) |
| `chunk-complete` | Keep | Nodes submit results |
| `node-heartbeat` | Keep | Node heartbeats |
| `node-register` | Keep | Node registration |
| `chunk-claim` | **Delete** | Replaced by scheduler |
| `token-issue` | **Delete** | Wrong architecture |

## Node-Side Changes

Current:
- Subscribe to `pending-chunks` broadcast → call `chunk-claim` → race

New:
- Subscribe to postgres_changes on `jobs_chunks` where `node_id = my_id`
- Already does this (line 170-177 of realtime.rs)!
- When chunk status changes to `running` with their node_id → fetch config and run
- Remove `claim_work()` and the broadcast subscription

## Crate Structure

### Dependencies

```toml
[dependencies]
# Framework
poise = "0.6"
tokio = { version = "1", features = ["rt-multi-thread", "signal"] }

# Wowlab crates
wowlab-parsers = { path = "../parsers", default-features = false }
wowlab-api = { path = "../api" }

# Supabase Realtime (for scheduler)
supabase-realtime-rs = "..."  # or whatever the node crate uses

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Bloom filter
sha2 = "0.10"
base64 = "0.22"

# Utilities
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
thiserror = "2"
dotenvy = "0.15"
```

### Shared State

```rust
pub struct ServerState {
    pub supabase: Arc<SupabaseClient>,
    pub filters: FilterMap,  // Shared between bot and scheduler
}
```

## What Gets Deleted

- `crates/discord/` → moved into `crates/server/`
- `supabase/functions/chunk-claim/` → deleted
- `supabase/functions/token-issue/` → deleted (if not already)
- `supabase/functions/_shared/capability-token.ts` → deleted (if not already)
- Node's `claim_work()` method and `pending-chunks` subscription → deleted

## What Stays

- `discord_server_filters` table (bot writes, scheduler reads from memory)
- `nodes_permissions` table (scheduler reads)
- Bloom filter code in Rust (shared between bot filter_refresh and scheduler)
- All other edge functions
- Node's existing postgres_changes subscription on its own chunks
