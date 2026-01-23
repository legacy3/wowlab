# Sentinel ↔ Portal Simulation System Analysis

## Architecture Overview

```
Portal (User)                    Supabase                         Sentinel              Nodes
─────────────                    ────────                         ────────              ─────
1. Submit sim config ──────────→ config-upsert (hash)
2. Create job ─────────────────→ job-create (chunks)
                                   ↓ INSERT jobs_chunks
                                   ↓ trigger: notify_pending_chunk
                                                                  3. PG LISTEN ←────────┘
                                                                  4. assign_pending_chunks()
                                   ↓ UPDATE node_id, status='running'
                                                                                        5. Realtime WS ←─┘
                                                                                        6. Process chunk
                                   ↓ chunk-complete                                     ←─────────────────┘
                                   ↓ When all done: job status='completed'
7. Poll useJob(id) ←──────────── jobs.status + jobs.result
```

---

## Database Schema

### `jobs`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Job owner (FK → auth.users) |
| config_hash | text | FK → jobs_configs.hash |
| status | text | `pending` → `running` → `completed` |
| total_iterations | int | Total iterations requested |
| completed_iterations | int | Progress counter (default 0) |
| result | jsonb | Aggregated SimulationResult (nullable) |
| access_type | text | `private` / `public` / `user` / `discord` |
| discord_server_id | text | For discord access control (nullable) |
| created_at | timestamptz | |
| completed_at | timestamptz | |

### `jobs_chunks`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| job_id | uuid | FK → jobs.id |
| node_id | uuid | FK → nodes.id (assigned node, nullable) |
| config_hash | text | FK → jobs_configs.hash |
| iterations | int | Iterations for this chunk |
| seed_offset | int | RNG seed offset |
| status | text | `pending` → `running` → `completed` |
| result | jsonb | ChunkResult from node (nullable) |
| claimed_at | timestamptz | When assigned to node |
| completed_at | timestamptz | |
| created_at | timestamptz | |

### `jobs_configs`

| Column | Type | Purpose |
|--------|------|---------|
| hash | text | SHA-256 of config JSON (PK) |
| config | jsonb | SimConfig object |
| created_at | timestamptz | |
| last_used_at | timestamptz | For cleanup |

### `nodes`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| public_key | text | Ed25519 public key (unique) |
| user_id | uuid | Claimed by user (nullable) |
| name | text | Display name |
| status | text | `pending` / `online` / `offline` |
| total_cores | int | CPU cores |
| max_parallel | int | Max concurrent chunks |
| platform | text | `windows` / `linux` / `macos` |
| version | text | Node software version |
| last_seen_at | timestamptz | Heartbeat timestamp |
| created_at | timestamptz | |

### `nodes_permissions`

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| node_id | uuid | FK → nodes.id |
| access_type | text | `public` / `user` / `guild` / `owner` |
| target_id | text | user_id or guild_id (nullable) |
| created_at | timestamptz | |

---

## Database Triggers & Functions

### Trigger: `trg_pending_chunk`

```sql
CREATE TRIGGER trg_pending_chunk
AFTER INSERT OR UPDATE ON public.jobs_chunks
FOR EACH ROW EXECUTE FUNCTION notify_pending_chunk()
```

Function body:
```sql
BEGIN
  IF NEW.status = 'pending' AND NEW.node_id IS NULL THEN
    PERFORM pg_notify('pending_chunk', NEW.id::text);
  END IF;
  RETURN NEW;
END;
```

### Cron Jobs (pg_cron)

| Schedule | Function | Purpose |
|----------|----------|---------|
| `* * * * *` | `mark_nodes_offline()` | Set nodes offline if `last_seen_at < now() - 5min` |
| `* * * * *` | `reap_stale_chunks()` | Reset chunks to pending if `claimed_at < now() - 5min` |
| `0 * * * *` | `cleanup_stale_data()` | Delete unclaimed pending nodes (1h), offline nodes (30d), unused configs (7d) |
| `0 * * * *` | Refresh `spec_rankings_hourly` | Materialized view |
| `0 1 * * *` | Refresh `top_sims_daily` | Materialized view |

### Function: `reap_stale_chunks()`

```sql
UPDATE public.jobs_chunks
SET node_id = NULL, status = 'pending', claimed_at = NULL
WHERE status = 'running'
  AND claimed_at < NOW() - INTERVAL '5 minutes';
```

### Function: `mark_nodes_offline()`

```sql
UPDATE public.nodes
SET status = 'offline'
WHERE status = 'online'
  AND last_seen_at IS NOT NULL
  AND last_seen_at < NOW() - INTERVAL '5 minutes';
```

### Function: `cleanup_stale_data()`

- Deletes unclaimed pending nodes older than 1 hour
- Deletes offline nodes not seen in 30 days
- Deletes unused configs older than 7 days (not referenced by any job)

---

## Edge Functions

### `config-upsert` (POST, User Auth)

1. Validates user JWT
2. SHA-256 hashes the config JSON
3. Validates rotation exists if `config.rotationId` provided
4. Upserts into `jobs_configs` (dedup by hash)
5. Returns `{ success: true, hash }`

### `job-create` (POST, User Auth)

1. Validates user JWT
2. Validates config exists by hash
3. Creates `jobs` row: `status='pending'`, `total_iterations=N`
4. Splits into chunks of 1000 iterations each
5. Creates `jobs_chunks` rows: `status='pending'`, `node_id=NULL`
6. Returns `{ jobId, chunks, queued: true }`

**Note:** No explicit NOTIFY — the trigger on `jobs_chunks` INSERT handles it.

### `node-register` (POST, Ed25519 Auth)

1. Verifies node signature
2. Checks if public_key already registered
3. If new: creates node with `status='pending'`, derives 6-char claim code from key
4. Returns `{ id, claimCode, claimed }`

### `node-heartbeat` (POST, Ed25519 Auth)

1. Verifies node signature
2. Updates `status='online'`, `last_seen_at=now()`
3. Only works for claimed nodes (`user_id IS NOT NULL`)
4. Returns `{ id, name, maxParallel, status }`

### `chunk-complete` (POST, Ed25519 Auth)

1. Verifies node signature
2. Looks up node by public_key
3. Updates chunk: `status='completed'`, stores result, sets `completed_at`
4. Checks remaining non-completed chunks for the job
5. If all done: sets `jobs.status='completed'`
6. If first completion: sets `jobs.status='running'`
7. Returns `{ success: true, jobComplete: bool }`

---

## Sentinel Architecture

### Structure

```
crates/sentinel/src/
├── main.rs              # Runs bot + scheduler + http concurrently
├── state.rs             # Shared ServerState (db pool, filters, metrics)
├── telemetry.rs         # Prometheus metrics
├── bot/
│   ├── mod.rs           # Discord bot (Poise framework)
│   ├── events.rs        # Guild member events → Bloom filter updates
│   └── commands/wlab/   # /wlab slash commands
├── scheduler/
│   ├── mod.rs           # PG LISTEN loop (30s timeout)
│   ├── assign.rs        # Chunk-to-node matching
│   └── reclaim.rs       # Stale chunk recovery (60s threshold)
├── http/
│   └── routes/          # /status, /metrics endpoints
└── utils/
    ├── bloom.rs         # SHA-256 Bloom filter (0.1% FP rate)
    └── filter_refresh.rs # Per-guild Discord member filter lifecycle
```

### Scheduler Loop (`scheduler/mod.rs`)

```rust
loop {
    state.touch_scheduler();
    match timeout(30s, listener.recv()).await {
        Ok(Ok(_notification)) => {
            sleep(50ms); // debounce
            process_pending().await;
        }
        Err(_timeout) => {
            process_pending().await;
            reclaim_stale_chunks().await;
            record_gauges().await;
        }
    }
}
```

### Chunk Assignment Algorithm (`scheduler/assign.rs`)

1. Fetch pending chunks (`status='pending' AND node_id IS NULL`, limit 100)
2. Get online nodes (`last_seen_at > now() - 30s`), join with `auth.identities` for Discord IDs
3. Get node permissions from `nodes_permissions`
4. Calculate backlogs (running chunks per node)
5. For each pending chunk:
   - Get job's `access_type` and `user_id`
   - Filter eligible nodes via `is_eligible()`:
     - **Owner**: `node.user_id == job.user_id` → always eligible
     - **Public**: any node eligible
     - **User**: node has permission entry with `target_id = job.user_id`
     - **Discord**: node owner's Discord ID in job's guild Bloom filter
   - Among eligible nodes with capacity: pick node with most available slots
6. Batch UPDATE: set `node_id`, `status='running'`, `claimed_at=now()`

### Stale Chunk Reclaim (`scheduler/reclaim.rs`)

```sql
UPDATE jobs_chunks
SET node_id = NULL, status = 'pending', claimed_at = NULL
WHERE status = 'running'
  AND node_id IS NOT NULL
  AND node_id IN (
      SELECT id FROM nodes
      WHERE last_seen_at < now() - interval '60 seconds'
  )
```

### Bloom Filter System

- **Purpose:** Fast Discord guild membership checks for `access_type='discord'`
- **Built on:** Guild join events (paginated member fetch at startup)
- **Updated:** Member add → insert into filter; Member remove → rebuild entire filter
- **Shared format:** Identical bit layout to TypeScript implementation for cross-platform use
- **Parameters:** Sized per guild at 0.1% false positive rate

---

## Node Architecture

### Structure

```
crates/
├── node/                 # Shared library
│   └── src/
│       ├── core.rs       # Event loop & state machine
│       ├── supabase/
│       │   ├── client.rs # REST calls (register, heartbeat, chunk-complete)
│       │   └── realtime.rs # WebSocket subscription (chunk assignments)
│       ├── worker/
│       │   ├── pool.rs   # Thread pool for parallel sims
│       │   └── runner.rs # Simulation execution
│       └── cache.rs      # Local config/rotation cache
├── node-gui/             # GUI binary
└── node-headless/        # CLI binary
```

### Work Reception

Nodes subscribe to Supabase Realtime on `jobs_chunks` filtered by their `node_id`:
- When sentinel assigns a chunk (UPDATE sets `node_id`), the subscription fires
- Node receives `ChunkPayload` with chunk ID, iterations, config hash, seed offset
- Node fetches config (cached), runs simulation, calls `chunk-complete`

---

## Portal Architecture

### Simulation Wizard Flow

```
/[locale]/simulate → SimulateWizard
├── ImportStep: Paste SimC export → WASM parseSimc() locally
├── ConfigureStep: Duration, iterations, targets, buffs
└── ResultsStep: Poll useJob(id) every 2s → display results
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/state/jobs.ts` | `useJob()`, `useSubmitJob()`, `useUserJobs()` |
| `src/lib/state/computing.ts` | Local job/worker store (Zustand) |
| `src/lib/state/nodes/queries.ts` | Node fetching hooks |
| `src/components/simulate/simulate-wizard.tsx` | 3-step wizard |
| `src/components/simulate/steps/results-step.tsx` | Polling + display |

### Job Submission (`useSubmitJob`)

```ts
1. POST config-upsert → { hash }
2. POST job-create → { jobId, chunks }
3. setJobId(jobId) → advance to results step
```

### Job Polling (`useJob`)

```ts
useQuery({
  queryKey: ["jobs", jobId],
  queryFn: () => supabase.from("jobs").select("*").eq("id", jobId).single(),
  refetchInterval: (query) => {
    if (query.state.data?.status === "completed") return false;
    return pollInterval ?? 2000;
  },
});
```

Reads `jobs.result` as `SimulationResult | null` for display.

---

## Critical Bugs

### 1. `jobs.result` is never populated

**Location:** `supabase/functions/chunk-complete/index.ts:85-89`

When all chunks complete, the function only sets:
```ts
.update({ status: "completed", completed_at: new Date().toISOString() })
```

It never aggregates chunk results into `jobs.result`. The portal reads `row.result as SimulationResult | null` which will always be `null`.

**Impact:** Users see completed jobs with no DPS results.

**Fix:** Aggregate all chunk results (weighted mean DPS, global min/max, total iterations) and write to `jobs.result`.

### 2. `completed_iterations` never incremented

**Location:** `jobs.completed_iterations` default 0, never updated anywhere.

Neither `chunk-complete` nor sentinel ever increments this counter. The portal could show real-time progress but the column is dead.

**Impact:** Progress bar always shows 0%.

**Fix:** `chunk-complete` should atomically increment `completed_iterations` by the chunk's iteration count.

### 3. Two competing stale chunk reapers

| System | Threshold | Schedule |
|--------|-----------|----------|
| DB cron `reap_stale_chunks()` | 5 minutes | Every 1 minute |
| Sentinel `scheduler/reclaim.rs` | 60 seconds | Every 30 seconds |

Both reset running chunks to `pending`. The 60-second sentinel threshold is too aggressive — a chunk mid-computation gets reclaimed. Having both is redundant.

**Fix:** Remove sentinel's `reclaim.rs`. Keep the DB cron with 5-minute threshold. Or remove the DB cron and change sentinel's threshold to 5 minutes.

### 4. Node "online" detection mismatch

| System | Threshold | Effect |
|--------|-----------|--------|
| Sentinel (assign.rs) | `last_seen_at > now() - 30s` | Won't assign chunks |
| DB cron `mark_nodes_offline()` | `last_seen_at < now() - 5min` | Sets status='offline' |

A node that heartbeated 45 seconds ago is invisible to sentinel but still `status='online'` in the portal UI.

**Fix:** Align thresholds. Either sentinel uses 5 minutes (matching DB) or the DB cron uses a shorter interval.

---

## Dead / Stale Code

### 1. `/old/` directory

The entire `/old/apps/portal/` contains the abandoned Jotai-based local simulation system. Per project rules this should be deleted.

### 2. `apps/portal/src/lib/state/computing.ts`

Zustand store with a phantom job model:
- Phases: `"preparing-spells" | "booting-engine" | "running"`
- ETA strings, progress percentages
- Worker management (`addJob`, `cancelJob`, `pauseJob`)

None of this connects to the distributed system. The real lifecycle is `pending → running → completed` via `useJob()` polling. This is leftover from a planned local-worker system.

### 3. Computing dashboard cards

Cards in `src/components/computing/` reference phantom stores:
- `workers-card.tsx` — Shows `navigator.hardwareConcurrency` as "workers"
- `simulations-card.tsx` — Reads from `useWorkerSystem` (not real data)
- `iterations-card.tsx` — Static/fake iteration metrics

These don't reflect the actual distributed system state.

### 4. Redundant reaper (pick one to remove)

Either `reap_stale_chunks()` DB cron OR sentinel's `scheduler/reclaim.rs`.

---

## Recommended Fixes (Priority Order)

1. **Fix `chunk-complete` result aggregation** — Without this, the entire system is broken end-to-end. Aggregate chunk results into `jobs.result` when job completes.

2. **Add `completed_iterations` incrementing** — Enable progress tracking in the portal.

3. **Remove redundant reaper** — Pick sentinel OR DB cron, align to 5-minute threshold.

4. **Align online thresholds** — Sentinel and DB cron should agree on what "offline" means.

5. **Delete `/old/` directory** — Dead legacy code.

6. **Clean up `computing.ts` and phantom dashboard** — Either remove entirely or rewire to query real distributed system state (online nodes, running chunks, completed jobs from Supabase).
