# Simulation Data Flow: Portal → Supabase → Node

## Quick Reference Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER (Portal)                            │
│                                                                                 │
│  ┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐   │
│  │ Rotation Editor  │───▶│  useDistributed     │───▶│  Computing Drawer    │   │
│  │ Test Button      │    │  Simulation Hook    │    │  (Progress + Results)│   │
│  └──────────────────┘    └─────────────────────┘    └──────────────────────┘   │
│           │                        │                          ▲                 │
│           │                        │                          │                 │
│           ▼                        ▼                          │                 │
│   extractSpellIds()         POST /job-create            Poll sim_jobs          │
│                                    │                     (every 5s)             │
└────────────────────────────────────┼──────────────────────────┼─────────────────┘
                                     │                          │
════════════════════════════════════════════════════════════════════════════════════
                                 SUPABASE
════════════════════════════════════════════════════════════════════════════════════
                                     │                          │
                                     ▼                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EDGE FUNCTIONS                                        │
│                                                                                 │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌──────────────┐  │
│  │  job-create   │   │  chunk-claim  │   │chunk-complete │   │ chunk-reaper │  │
│  │  (JWT req.)   │   │  (no auth)    │   │  (no auth)    │   │   (cron)     │  │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └──────┬───────┘  │
│          │                   │                   │                  │          │
│          └───────────────────┴───────────────────┴──────────────────┘          │
│                                      │                                          │
│                                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATABASE (Postgres)                             │  │
│  │                                                                           │  │
│  │  sim_configs ◀────── sim_jobs ◀────── sim_chunks ──────▶ user_nodes      │  │
│  │  (hash→config)       (job queue)      (work units)       (workers)       │  │
│  │                                                                           │  │
│  │  Realtime Broadcast Channel: "pending-chunks" ───────────────────────────│  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                          │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │
════════════════════════════════════════════════════════════════════════════════════
                                     │ WebSocket (Realtime)
                                     │ + REST API calls
════════════════════════════════════════════════════════════════════════════════════
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          USER'S PC (Node Worker)                                │
│                                                                                 │
│  ┌────────────────┐    ┌─────────────────┐    ┌───────────────────────────┐    │
│  │  Supabase      │───▶│   NodeCore      │───▶│     Worker Pool           │    │
│  │  Realtime WS   │    │   (Rust)        │    │  (tokio tasks + engine)   │    │
│  └────────────────┘    └─────────────────┘    └───────────────────────────┘    │
│         │                      │                          │                     │
│         │                      │                          │                     │
│   "work-available"       chunk-claim              run_batch(iterations)         │
│    broadcast             chunk-complete           → BatchResult                 │
│         │                      │                          │                     │
│         └──────────────────────┴──────────────────────────┘                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Test Button Click Flow

### Step 1: User Clicks "Test" in Rotation Editor

**Location:** `apps/portal/src/components/rotations/editor/editor-view.tsx:291-303`

```tsx
<Button onClick={onTest} disabled={isDisabled}>
  {isTesting ? <FlaskInlineLoader /> : <Play />}
  Test
</Button>
```

### Step 2: handleTest Callback

**Location:** `apps/portal/src/components/rotations/editor/rotation-editor.tsx:137-158`

```tsx
const handleTest = useCallback(async () => {
  const spellIds = extractSpellIds(script);  // Parse Rhai script for spell IDs

  await runDistributedSim({
    config: {
      rotation: script,      // Full Rhai source
      duration: 300,         // 5 minutes
      spellIds,              // [spell_id, spell_id, ...]
    },
    iterations: 10000,       // Fixed for now
    name: rotationName,
  });

  toast.success("Simulation job submitted");
}, [script, runDistributedSim]);
```

### Step 3: useDistributedSimulation Hook

**Location:** `apps/portal/src/hooks/rotations/use-distributed-simulation.ts`

```tsx
// 1. Create local job record (Jotai atom)
const localJobId = createJob({
  name: params.name,
  type: "simulation",
  status: "pending",
});

// 2. Open computing drawer to show progress
setComputingDrawerOpen(true);

// 3. POST to Supabase edge function
const response = await fetch(
  `${env.SUPABASE_URL}/functions/v1/job-create`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,  // JWT required
    },
    body: JSON.stringify({
      config: params.config,
      iterations: params.iterations,
    }),
  }
);

// 4. Start polling for results
const { jobId, chunks, queued } = await response.json();
```

---

## 2. Supabase Edge Function: job-create

**Endpoint:** `POST /functions/v1/job-create`
**Auth:** JWT required (user must be logged in)
**Version:** v4

### Input
```json
{
  "config": {
    "rotation": "// Rhai script...",
    "duration": 300,
    "spellIds": [12345, 67890]
  },
  "iterations": 10000
}
```

### Processing
```typescript
// 1. Hash config for deduplication
const configHash = await sha256(JSON.stringify(config));

// 2. Upsert config (content-addressed storage)
await supabase.from("sim_configs").upsert({
  hash: configHash,
  config: config,
  lastUsedAt: new Date().toISOString(),
});

// 3. Create job record
const { data: job } = await supabase.from("sim_jobs").insert({
  userId: user.id,
  configHash,
  totalIterations: iterations,
  completedIterations: 0,
  status: "pending",
}).select().single();

// 4. Create work chunks (1000 iterations each)
const numChunks = Math.ceil(iterations / CHUNK_SIZE);
const chunks = Array.from({ length: numChunks }, (_, i) => ({
  jobId: job.id,
  configHash,
  iterations: i === numChunks - 1
    ? iterations - (i * CHUNK_SIZE)  // Last chunk gets remainder
    : CHUNK_SIZE,
  seedOffset: i * CHUNK_SIZE,        // Deterministic RNG seeds
  status: "pending",
}));
await supabase.from("sim_chunks").insert(chunks);

// 5. Broadcast to wake idle nodes
await supabase.channel("pending-chunks").send({
  type: "broadcast",
  event: "work-available",
  payload: { jobId: job.id, chunks: numChunks },
});
```

### Output
```json
{
  "jobId": "uuid-of-job",
  "chunks": 10,
  "queued": true
}
```

---

## 3. Node Worker Startup & Registration

### Entry Point

**GUI:** `crates/node/src/main.rs` (eframe + egui)
**Headless:** `crates/node-headless/src/main.rs` (CLI)
**Core Logic:** `crates/node-core/src/lib.rs`

### Registration Flow

```rust
// POST /functions/v1/node-register
let response = client.post(format!("{}/functions/v1/node-register", api_url))
    .json(&json!({
        "hostname": hostname::get()?,
        "totalCores": num_cpus::get(),
        "enabledCores": config.max_workers,
        "platform": std::env::consts::OS,
        "version": env!("CARGO_PKG_VERSION"),
    }))
    .send().await?;

// Response: { id: "node-uuid", claimCode: "ABC123" }
```

### User Claims Node in Portal

User enters 6-character `claimCode` at `wowlab.gg/nodes`:

```sql
UPDATE user_nodes
SET userId = auth.uid(),
    status = 'online',
    claimCode = null
WHERE claimCode = 'ABC123';
```

---

## 4. Node Connects to Realtime

**Location:** `crates/node-core/src/supabase/realtime.rs`

### WebSocket Connection

```rust
// Transform URL: https://api.wowlab.gg → wss://api.wowlab.gg/realtime/v1
let ws_url = format!("{}/realtime/v1/websocket", base_url.replace("https://", "wss://"));

// Subscribe to channels
let channels = vec![
    format!("node:{}", node_id),           // Node-specific updates
    format!("chunks:{}", node_id),         // Direct chunk assignments
    "pending-chunks".to_string(),          // Broadcast: work available
];
```

### On "work-available" Broadcast

```rust
match event {
    RealtimeEvent::Broadcast { event: "work-available", .. } => {
        // Trigger work claim
        self.claim_work().await?;
    }
}
```

---

## 5. Node Claims Work Chunks

**Location:** `crates/node-core/src/claim.rs`

### Request

```rust
// POST /functions/v1/chunk-claim
let response = client.post(format!("{}/functions/v1/chunk-claim", api_url))
    .json(&json!({
        "nodeId": node_id,
        "batchSize": available_capacity,  // max_workers - busy_workers
    }))
    .send().await?;
```

### Edge Function: chunk-claim (v7)

```typescript
// 1. Get node and permissions
const node = await getNodeWithPermissions(nodeId);

// 2. Find pending chunks
let query = supabase
    .from("sim_chunks")
    .select("*")
    .is("nodeId", null)
    .eq("status", "pending")
    .order("createdAt", { ascending: true })
    .limit(50);

// 3. Filter by permissions
if (node.permissions.accessType !== "public") {
    // Only chunks from jobs owned by allowed users
    query = query.in("jobId", allowedJobIds);
}

// 4. Claim with optimistic lock
const claimedIds = chunks.slice(0, batchSize).map(c => c.id);
await supabase
    .from("sim_chunks")
    .update({
        nodeId: nodeId,
        status: "running",
        claimedAt: new Date().toISOString(),
    })
    .in("id", claimedIds)
    .is("nodeId", null);  // Optimistic lock: fails if already claimed
```

### Response

```json
{
  "chunks": [
    { "id": "chunk-uuid-1", "iterations": 1000, "seedOffset": 0 },
    { "id": "chunk-uuid-2", "iterations": 1000, "seedOffset": 1000 }
  ],
  "configHash": "sha256-hash",
  "config": { /* full simulation config */ }
}
```

---

## 6. Node Executes Simulation

**Location:** `crates/node-core/src/worker/runner.rs`

### Worker Pool

```rust
// Worker pool with semaphore for concurrency control
pub struct WorkerPool {
    max_workers: usize,
    work_tx: mpsc::Sender<WorkItem>,
    result_rx: mpsc::Receiver<WorkResult>,
}

// Each chunk becomes a WorkItem
let work_item = WorkItem {
    chunk_id,
    config: sim_config.clone(),
    rotation: rotation_script.clone(),
    iterations,
    seed_offset,
};
work_tx.send(work_item).await?;
```

### SimRunner

```rust
impl SimRunner {
    pub fn run(&self, config: &SimConfig, rotation: &str, iterations: u32, seed: u64) -> Result<BatchResult> {
        // Create simulator from engine crate
        let simulator = Simulator::new(config.clone(), rotation)?;

        // Run batch simulation
        let result = simulator.run_batch(iterations, seed);

        Ok(BatchResult {
            iterations,
            mean_dps: result.mean_dps,
            std_dps: result.std_dps,
            min_dps: result.min_dps,
            max_dps: result.max_dps,
            total_casts: result.total_casts,
        })
    }
}
```

---

## 7. Node Reports Results

**Location:** `crates/node-core/src/core.rs:553-587`

### Request

```rust
// POST /functions/v1/chunk-complete
let response = client.post(format!("{}/functions/v1/chunk-complete", api_url))
    .json(&json!({
        "chunkId": chunk_id,
        "result": {
            "meanDps": result.mean_dps,
            "minDps": result.min_dps,
            "maxDps": result.max_dps,
        }
    }))
    .send().await?;
```

### Edge Function: chunk-complete (v2)

```typescript
// 1. Update chunk (idempotent)
const { data: updated } = await supabase
    .from("sim_chunks")
    .update({
        status: "completed",
        result: result,
        completedAt: new Date().toISOString(),
    })
    .eq("id", chunkId)
    .eq("status", "running")  // Only if still running (idempotent)
    .select()
    .single();

if (!updated) {
    return { success: true, alreadyCompleted: true };
}

// 2. Increment job's completed iterations
await supabase.rpc("increment_completed_iterations", {
    job_id: updated.jobId,
    amount: updated.iterations,
});

// 3. Check if job is complete
const { count } = await supabase
    .from("sim_chunks")
    .select("*", { count: "exact" })
    .eq("jobId", updated.jobId)
    .neq("status", "completed");

if (count === 0) {
    // 4. Aggregate results
    const { data: allChunks } = await supabase
        .from("sim_chunks")
        .select("iterations, result")
        .eq("jobId", updated.jobId);

    const totalIterations = allChunks.reduce((sum, c) => sum + c.iterations, 0);
    const meanDps = allChunks.reduce((sum, c) =>
        sum + (c.result.meanDps * c.iterations), 0) / totalIterations;

    // 5. Update job as completed
    await supabase
        .from("sim_jobs")
        .update({
            status: "completed",
            result: { meanDps, minDps, maxDps, totalIterations },
            completedAt: new Date().toISOString(),
        })
        .eq("id", updated.jobId);
}
```

---

## 8. Portal Polls for Results

**Location:** `apps/portal/src/hooks/rotations/use-distributed-simulation.ts:56-120`

### Polling Loop

```typescript
// Poll every 5 seconds (no realtime for browser - too expensive at scale)
useEffect(() => {
  if (!state.jobId || state.phase === "completed") return;

  const interval = setInterval(async () => {
    const { data: job } = await supabase
        .from("sim_jobs")
        .select("status, completedIterations, totalIterations, result")
        .eq("id", state.jobId)
        .single();

    // Update progress
    const progress = job.completedIterations / job.totalIterations;
    updateProgress({ jobId: state.jobId, progress });

    // Check completion
    if (job.status === "completed") {
        completeJob({
            jobId: state.jobId,
            result: {
                dps: job.result.meanDps,
                totalDamage: job.result.meanDps * 300,
            },
        });
    }
  }, 5000);

  return () => clearInterval(interval);
}, [state.jobId, state.phase]);
```

---

## 9. Stale Chunk Recovery

**Edge Function:** `chunk-reaper` (v1)
**Trigger:** Cron job (every ~1 minute)

```typescript
// Find stale chunks (claimed > 5 minutes ago, not completed)
const { data: staleChunks } = await supabase
    .from("sim_chunks")
    .select("id, nodeId")
    .eq("status", "running")
    .lt("claimedAt", fiveMinutesAgo);

if (staleChunks.length > 0) {
    // Reset to pending
    await supabase
        .from("sim_chunks")
        .update({
            nodeId: null,
            status: "pending",
            claimedAt: null,
        })
        .in("id", staleChunks.map(c => c.id));

    // Broadcast to wake nodes
    await supabase.channel("pending-chunks").send({
        type: "broadcast",
        event: "work-available",
        payload: { reason: "stale-recovery" },
    });
}
```

---

## 10. Database Tables

### sim_jobs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → auth.users |
| configHash | TEXT | FK → sim_configs |
| totalIterations | INT | Total requested |
| completedIterations | INT | Progress counter |
| status | TEXT | pending/running/completed/failed |
| result | JSONB | Aggregated result |
| createdAt | TIMESTAMPTZ | Submission time |
| completedAt | TIMESTAMPTZ | Completion time |

### sim_chunks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| jobId | UUID | FK → sim_jobs |
| nodeId | UUID | FK → user_nodes (nullable) |
| configHash | TEXT | FK → sim_configs |
| iterations | INT | Chunk size |
| seedOffset | INT | RNG seed for determinism |
| status | TEXT | pending/running/completed |
| result | JSONB | Chunk result |
| claimedAt | TIMESTAMPTZ | When node claimed |
| completedAt | TIMESTAMPTZ | When completed |

### sim_configs
| Column | Type | Description |
|--------|------|-------------|
| hash | TEXT | Primary key (SHA256) |
| config | JSONB | Full simulation config |
| lastUsedAt | TIMESTAMPTZ | Cache tracking |

### user_nodes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → auth.users (nullable until claimed) |
| claimCode | TEXT | 6-char claim code |
| status | TEXT | pending/online/offline |
| maxParallel | INT | Concurrent worker capacity |
| lastSeenAt | TIMESTAMPTZ | Last heartbeat |
| version | TEXT | Node binary version |

---

## 11. Key Design Patterns

### Content-Addressed Config Storage
- Configs stored by SHA256 hash
- Multiple jobs can share same config
- Reduces storage and bandwidth

### Optimistic Locking for Chunk Claims
```sql
UPDATE sim_chunks
SET nodeId = $1, status = 'running'
WHERE id = $2 AND nodeId IS NULL;  -- Fails if already claimed
```

### Idempotent Result Submission
```sql
UPDATE sim_chunks
SET status = 'completed', result = $1
WHERE id = $2 AND status = 'running';  -- No-op if already completed
```

### Weighted Result Aggregation
```typescript
meanDps = sum(chunk.meanDps * chunk.iterations) / totalIterations;
```

### Push + Pull Hybrid Distribution
- **Push:** Realtime broadcast wakes idle nodes
- **Pull:** Nodes actively claim work (prevents overload)

---

## 12. Sequence Diagram

```
User          Portal           job-create      Database        Node
 │              │                  │              │              │
 │──Click Test──▶                  │              │              │
 │              │                  │              │              │
 │              │──POST /job-create─▶             │              │
 │              │                  │              │              │
 │              │                  │──INSERT job──▶              │
 │              │                  │──INSERT chunks▶             │
 │              │                  │              │              │
 │              │                  │──BROADCAST────────────────▶│
 │              │                  │  "work-available"          │
 │              │◀──{jobId, chunks}─│              │              │
 │              │                  │              │              │
 │              │                  │              │◀─chunk-claim─│
 │              │                  │              │──{chunks}───▶│
 │              │                  │              │              │
 │              │                  │              │    [simulate]│
 │              │                  │              │              │
 │              │                  │              │◀chunk-complete│
 │              │                  │              │              │
 │              │──Poll sim_jobs───────────────▶│              │
 │              │◀──{progress}─────────────────│              │
 │              │                  │              │              │
 │              │                  │    [when all chunks done]  │
 │              │                  │              │              │
 │              │──Poll sim_jobs───────────────▶│              │
 │              │◀──{result: dps}──────────────│              │
 │              │                  │              │              │
 │◀──Show DPS──│                  │              │              │
 │              │                  │              │              │
```

---

## 13. File Locations

| Component | Path |
|-----------|------|
| Test Button | `apps/portal/src/components/rotations/editor/editor-view.tsx:291` |
| handleTest | `apps/portal/src/components/rotations/editor/rotation-editor.tsx:137` |
| useDistributedSimulation | `apps/portal/src/hooks/rotations/use-distributed-simulation.ts` |
| job-create | Supabase Edge Function (deployed) |
| chunk-claim | Supabase Edge Function (deployed) |
| chunk-complete | Supabase Edge Function (deployed) |
| chunk-reaper | Supabase Edge Function (deployed) |
| NodeCore | `crates/node-core/src/core.rs` |
| Worker Pool | `crates/node-core/src/worker/pool.rs` |
| SimRunner | `crates/node-core/src/worker/runner.rs` |
| Supabase Client | `crates/node-core/src/supabase/client.rs` |
| Realtime WS | `crates/node-core/src/supabase/realtime.rs` |
| Database Types | `apps/portal/src/lib/supabase/database.types.ts` |
