# System Communication Map

Complete map of every component's database/backend communication patterns.

## Architecture Overview

```
Portal (Browser)          Supabase                    Sentinel (Fly.dev)         Nodes (Desktop/Server)
────────────────          ────────                    ──────────────────         ──────────────────────
PostgREST (RLS) ────────→ Tables (public.*, game.*)
RPC ────────────────────→ DB Functions
Edge Functions ─────────→ Tables (admin client)
                                                      sqlx PgPool ─────────────→ Tables (direct SQL)
                                                      PG LISTEN ←──────────────  pg_notify trigger
Edge Functions ←────────────────────────────────────────────────────────────────  HTTP POST/GET
Realtime WS ←───────────  Table change events ──────────────────────────────────→ Realtime WS
```

---

## A. Direct Database Access (sqlx PgPool)

**Only sentinel uses this.** Raw SQL queries via connection pool, no RLS.

### Scheduler Queries

| File | Function | SQL | Tables | Op |
|------|----------|-----|--------|-----|
| `scheduler/mod.rs` | `listen_and_assign()` | `LISTEN "pending_chunk"` | - | LISTEN |
| `scheduler/mod.rs` | `fetch_pending_chunks()` | `SELECT id, job_id FROM jobs_chunks WHERE status='pending' AND node_id IS NULL ORDER BY created_at LIMIT 100` | `jobs_chunks` | SELECT |
| `scheduler/mod.rs` | `record_gauges()` | `SELECT COUNT(*) FROM jobs_chunks WHERE status='running'` | `jobs_chunks` | SELECT |
| `scheduler/mod.rs` | `record_gauges()` | `SELECT COUNT(*) FROM nodes WHERE last_seen_at > now()-30s` | `nodes` | SELECT |
| `scheduler/assign.rs` | `fetch_jobs()` | `SELECT id, user_id, access_type, discord_server_id FROM jobs WHERE id = ANY($1)` | `jobs` | SELECT |
| `scheduler/assign.rs` | `fetch_online_nodes()` | `SELECT n.*, i.provider_id FROM nodes n LEFT JOIN auth.identities i ON ... WHERE n.last_seen_at > now()-30s` | `nodes`, `auth.identities` | SELECT |
| `scheduler/assign.rs` | `fetch_permissions()` | `SELECT node_id, access_type, target_id FROM nodes_permissions WHERE node_id = ANY($1)` | `nodes_permissions` | SELECT |
| `scheduler/assign.rs` | `fetch_backlogs()` | `SELECT node_id, COUNT(*) FROM jobs_chunks WHERE status='running' AND node_id IS NOT NULL GROUP BY node_id` | `jobs_chunks` | SELECT |
| `scheduler/assign.rs` | `batch_assign()` | `UPDATE jobs_chunks SET node_id=data.node_id, status='running', claimed_at=now() FROM (unnest arrays)` | `jobs_chunks` | UPDATE |
| `scheduler/reclaim.rs` | `do_reclaim()` | `UPDATE jobs_chunks SET node_id=NULL, status='pending', claimed_at=NULL WHERE status='running' AND node_id IN (SELECT id FROM nodes WHERE last_seen_at < now()-60s)` | `jobs_chunks`, `nodes` | UPDATE |

### HTTP Routes

| File | Function | SQL | Tables | Op |
|------|----------|-----|--------|-----|
| `http/routes/status.rs` | `handler()` | `SELECT 1` | - | SELECT (health check) |

### Bot Commands

| File | Function | SQL | Tables | Op |
|------|----------|-----|--------|-----|
| `bot/commands/wlab/jobs.rs` | `resolve_user_id()` | `SELECT user_id FROM auth.identities WHERE provider='discord' AND provider_id=$1` | `auth.identities` | SELECT |
| `bot/commands/wlab/jobs.rs` | `jobs()` | `SELECT j.*, COUNT(*) FILTER ... FROM jobs j LEFT JOIN jobs_chunks jc ...` | `jobs`, `jobs_chunks` | SELECT |
| `bot/commands/wlab/nodes.rs` | `nodes()` | `SELECT n.*, COUNT(jc.id) FILTER ... FROM nodes n LEFT JOIN jobs_chunks jc ...` | `nodes`, `jobs_chunks` | SELECT |
| `bot/commands/wlab/stats.rs` | `stats()` | `SELECT COUNT(*) FILTER ..., AVG(...) FROM jobs_chunks WHERE created_at > now()-1h` | `jobs_chunks` | SELECT |
| `bot/commands/wlab/stats.rs` | `stats()` | `SELECT COUNT(*) FROM nodes WHERE last_seen_at > now()-30s` | `nodes` | SELECT |

### Sentinel DB Summary

- **16 total queries** (15 SELECT, 2 UPDATE, 1 LISTEN)
- **No INSERT or DELETE** — sentinel never creates or removes rows
- **Tables touched:** `jobs_chunks` (10), `nodes` (6), `jobs` (2), `nodes_permissions` (1), `auth.identities` (2)

---

## B. Supabase PostgREST (JS client `supabase.from()`)

**Only the portal uses this.** Queries go through Supabase REST API with Row Level Security enforced.

### Jobs

| Hook | Operation | Query |
|------|-----------|-------|
| `useJob(jobId)` | SELECT | `jobs WHERE id = ? (single)` — polls every 2s until completed |
| `useUserJobs()` | SELECT | `jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50` — polls 5s if running |

### Rotations

| Hook | Operation | Query |
|------|-----------|-------|
| `useLoadRotation(id)` | SELECT | `rotations WHERE id = ?` |
| `useSaveRotation()` | INSERT | `rotations (...) RETURNING *` |
| `useSaveRotation()` | UPDATE | `rotations SET (...) WHERE id = ?` |
| Rotation browser | SELECT | `rotations` + dynamic filters (is_public, user_id, name ILIKE, spec_ids) |
| Rotation browser | DELETE | `rotations WHERE id = ?` |

### Nodes

| Hook | Operation | Query |
|------|-----------|-------|
| `useNode(nodeId)` | SELECT | `nodes WHERE id = ?` + nested `nodes_permissions(*)` |
| `useNodes(userId)` | SELECT | `nodes WHERE user_id = ?` + separate permissions fetch |
| `useNodes(userId)` | SELECT | `nodes` with permissions join (shared nodes) |
| `useClaimNode()` | SELECT | `nodes WHERE claim_code = ? AND user_id IS NULL` |
| `useClaimNode()` | UPDATE | `nodes SET claim_code=NULL, max_parallel=?, name=?, user_id=?` |
| `useNodeMutations()` | UPDATE | `nodes SET max_parallel=?, name=?` |
| `useNodeMutations()` | DELETE | `nodes WHERE id = ?` |

### Nodes Permissions

| Hook | Operation | Query |
|------|-----------|-------|
| `useNodeMutations()` | DELETE | `nodes_permissions WHERE node_id = ?` (clear before update) |
| `useNodeMutations()` | INSERT | `nodes_permissions (access_type, node_id, target_id)` |
| `useNodeMutations()` | DELETE | `nodes_permissions WHERE node_id = ?` (cascade before node delete) |

### User Profiles

| Hook | Operation | Query |
|------|-----------|-------|
| `useUser()` | SELECT | `user_profiles WHERE id = ?` (handle, avatar_url) |
| `useUserProfile(handle)` | SELECT | `user_profiles WHERE handle = ?` + nested `rotations(*)` |

### Game Schema (Read-Only)

All use `schema("game")`, all are SELECT only, all cached via React Query.

| Hook | Table | Query |
|------|-------|-------|
| `useAura(spellId)` | `game.auras` | `WHERE spell_id = ?` |
| `useAuras(spellIds)` | `game.auras` | `WHERE spell_id IN (...)` |
| `useClass(id)` | `game.classes` | `WHERE id = ?` |
| `useClasses()` | `game.classes` | `ORDER BY id` |
| `useGlobalColors(...names)` | `game.global_colors` | `WHERE name IN (...)` |
| `useGlobalStrings(...tags)` | `game.global_strings` | `WHERE tag IN (...)` |
| `useItem(id)` | `game.items` | `WHERE id = ?` |
| `useItems(ids)` | `game.items` | `WHERE id IN (...)` |
| `useItemSearch(query)` | `game.items` | `WHERE name ILIKE ? LIMIT 20` |
| `useSpec(id)` | `game.specs` | `WHERE id = ?` |
| `useSpecs()` | `game.specs` | `ORDER BY class_name, order_index` |
| `useSpecsByClass(classId)` | `game.specs` | `WHERE class_id = ?` |
| `useSpecTraits(specId)` | `game.specs_traits` | `WHERE spec_id = ?` |
| `useSpell(id)` | `game.spells` | `WHERE id = ?` |
| `useSpells(ids)` | `game.spells` | `WHERE id IN (...)` |
| `useSpellSearch(query)` | `game.spells` | `WHERE name ILIKE ? LIMIT 20` |
| `fetchSpecTraits(specId)` | `game.specs_traits` | Server component fetch |

---

## C. Supabase RPC Functions

| Caller | Function | Purpose |
|--------|----------|---------|
| Portal `useUser()` | `delete_own_account` | Cascade-delete user and related data |

---

## D. Edge Functions

### Portal → Edge Functions

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `config-upsert` | POST | JWT | Hash + store sim config |
| `job-create` | POST | JWT | Create job + chunk rows |
| `icons` | GET | None | Wowhead icon CDN proxy |
| `talent-atlas` | GET | None | Wowhead atlas CDN proxy |

### Node → Edge Functions

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `node-register` | POST | Ed25519 | Register new node |
| `node-heartbeat` | POST | Ed25519 | Heartbeat (every 5min running, every 3s claiming) |
| `chunk-complete` | POST | Ed25519 | Report chunk result |
| `config-fetch` | GET | None | Fetch sim config by hash |
| `rotation-fetch` | GET | None | Fetch rotation script by ID |

### Edge Function → Database Operations

| Function | Tables Read | Tables Written |
|----------|-------------|----------------|
| `config-upsert` | `rotations` (validate) | `jobs_configs` (upsert) |
| `job-create` | `jobs_configs` (validate) | `jobs` (insert), `jobs_chunks` (batch insert) |
| `config-fetch` | `jobs_configs` (select) | `jobs_configs` (update last_used_at) |
| `rotation-fetch` | `rotations` (select) | - |
| `node-register` | `nodes` (select by pubkey) | `nodes` (insert if new) |
| `node-heartbeat` | - | `nodes` (update status, last_seen_at) |
| `chunk-complete` | `nodes` (lookup), `jobs_chunks` (status check) | `jobs_chunks` (result), `jobs` (status) |
| `icons` | - | - |
| `talent-atlas` | - | - |

### Additional Edge Functions (Unread, Directories Exist)

| Function | Status |
|----------|--------|
| `permission-update` | Exists in filesystem, not analyzed |
| `permission-revoke` | Exists in filesystem, not analyzed |
| `token-issue` | Exists in filesystem, not analyzed |
| `token-refresh` | Exists in filesystem, not analyzed |
| `generate-signing-keys` | Exists in filesystem, not analyzed |

---

## E. Supabase Realtime (WebSocket)

| Component | Channel | Table | Filter | Events | Purpose |
|-----------|---------|-------|--------|--------|---------|
| Node | `chunks:{node_id}` | `jobs_chunks` | `node_id=eq.{id}` | INSERT, UPDATE | Receive chunk assignments |
| Node | `node:{node_id}` | `nodes` | `id=eq.{id}` | UPDATE | Detect claim event |
| Portal | Auth state | - | - | State change | Session invalidation |

---

## F. External APIs

| Component | API | Method | Purpose |
|-----------|-----|--------|---------|
| Node | `api.github.com/repos/legacy3/wowlab/releases` | GET | Auto-update check |
| Portal | Same GitHub API | GET | Download link redirect (edge runtime, 300s cache) |

---

## G. Authentication Flows

| Component | Operation | Purpose |
|-----------|-----------|---------|
| Portal | `supabase.auth.signInWithOAuth()` | Discord/GitHub/Google/Twitch login |
| Portal | `supabase.auth.exchangeCodeForSession()` | OAuth callback |
| Portal | `supabase.auth.linkIdentity()` | Link additional provider |
| Portal | `supabase.auth.signOut()` | Logout |
| Portal | `supabase.auth.getUserIdentities()` | List linked providers |
| Portal | `supabase.auth.onAuthStateChange()` | Session change listener |

---

## Node Chunk Processing Flow

Why nodes call `config-fetch` and `rotation-fetch`:

```
1. Sentinel assigns chunk:
   UPDATE jobs_chunks SET node_id={id}, status='running'

2. Realtime subscription fires on node:
   ChunkPayload { id, iterations, config_hash, seed_offset }
                                   ↑ only a hash, not the config

3. Node fetches config (cached 1h, max 1000 entries):
   GET /functions/v1/config-fetch?hash={config_hash}
   → { rotationId, duration, targets, buffs, ... }

4. Node fetches rotation (cached 1h, max 500 entries):
   GET /functions/v1/rotation-fetch?id={rotationId}
   → { script, checksum }

5. Node runs simulation locally (CPU-bound, no I/O)

6. Node reports result:
   POST /functions/v1/chunk-complete
   → { chunkId, result: { meanDps, stdDps, minDps, maxDps, iterations } }
```

The chunk assignment payload is intentionally minimal. Configs are deduplicated by hash (many jobs share the same config), so fetching separately with caching avoids redundant data transfer.

---

## Node Configuration

```ini
# ~/.config/wowlab-node/config.ini
[node]
node_id = <uuid>           # Set after registration
api_url = https://api.wowlab.gg  # Default
anon_key = <supabase_anon_jwt>   # Hardcoded default
```

- **HTTP timeouts:** 30s request, 10s connect
- **Heartbeat interval:** 5 minutes (running state)
- **Claim poll:** 3 seconds (claiming state)
- **Reconnect backoff:** 1s → 60s exponential with jitter
- **No Ed25519 signing currently implemented in node** (edge functions have verification code but node sends no auth headers)

---

## Sentinel Configuration

- **HTTP port:** 8080
- **Online threshold:** `last_seen_at > now() - 30s` (for assignment)
- **Stale threshold:** `last_seen_at < now() - 60s` (for chunk reclaim)
- **Scheduler tick:** 30s timeout on PG LISTEN
- **Health check:** scheduler tick < 60s old
- **Metrics:** Prometheus on `/metrics`

---

## Database Tables Accessed (Summary)

| Table | Portal | Sentinel | Nodes (via edge fn) |
|-------|--------|----------|---------------------|
| `jobs` | R | R | W (status) |
| `jobs_chunks` | - | R/W | W (result) |
| `jobs_configs` | - | - | R/W |
| `nodes` | R/W | R | R/W |
| `nodes_permissions` | R/W | R | - |
| `rotations` | R/W | - | R |
| `user_profiles` | R | - | - |
| `game.*` (14 tables) | R | - | - |
| `auth.identities` | - | R | - |

---

## Proposed Architecture (Post-Refactor)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TARGET ARCHITECTURE                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘


  ┌──────────────────┐          ┌──────────────────────────────────────────────────────┐
  │                  │          │                    SUPABASE                            │
  │   Portal         │          │                                                       │
  │   (Browser)      │          │  ┌─────────────┐  ┌──────────┐  ┌────────────────┐   │
  │                  │─────────────→│  PostgREST  │  │   Auth   │  │ Edge Functions │   │
  │  - React/Next.js │  JWT/RLS │  │             │  │          │  │                │   │
  │  - Supabase JS   │          │  │ jobs        │  │ OAuth    │  │ icons (proxy)  │   │
  │                  │          │  │ rotations   │  │ Session  │  │ talent-atlas   │   │
  │                  │          │  │ nodes       │  │          │  │   (proxy)      │   │
  │                  │─────────────→│ nodes_perms │  └──────────┘  └───────┬────────┘   │
  │                  │  RPC     │  │ user_profs  │                         │             │
  │                  │          │  │ game.*      │                         │             │
  └──────────────────┘          │  │             │                         ▼             │
         │                      │  │ RPC:        │                  ┌─────────────┐      │
         │ Realtime WS          │  │ create_job  │                  │  Wowhead    │      │
         │ (auth state)         │  │ delete_acct │                  │  CDN        │      │
         │                      │  └──────┬──────┘                  └─────────────┘      │
         ▼                      │         │                                              │
  ┌──────────────────┐          │         │                                              │
  │ Auth State       │          │         ▼                                              │
  │ Changes          │          │  ┌─────────────────────────────────────────────────┐   │
  └──────────────────┘          │  │                                                 │   │
                                │  │              POSTGRES                            │   │
                                │  │                                                 │   │
                                │  │  jobs ─── jobs_chunks ─── jobs_configs           │   │
  ┌──────────────────┐          │  │              │                                  │   │
  │                  │          │  │  nodes ─── nodes_permissions                    │   │
  │   Sentinel       │          │  │                                                 │   │
  │   (Fly.dev)      │─────────────→│  rotations    user_profiles    game.*          │   │
  │                  │  sqlx    │  │                                                 │   │
  │  - Scheduler     │  (direct)│  │  ┌─────────────────────────────────┐            │   │
  │  - HTTP API      │          │  │  │ pg_notify('pending_chunk', id)  │            │   │
  │  - Discord Bot   │←────────────┤  │ (trigger on jobs_chunks INSERT) │            │   │
  │  - Maintenance   │  LISTEN  │  │  └─────────────────────────────────┘            │   │
  │                  │          │  │                                                 │   │
  └──────┬───────────┘          │  │  Maintenance (sentinel-driven):                 │   │
         │                      │  │  - mark_nodes_offline (every 60s)               │   │
         │ :8080                │  │  - reclaim_stale_chunks (every 30s, 5min thresh) │   │
         │                      │  │  - cleanup_stale_data (every 1h)                │   │
         │                      │  │                                                 │   │
         │                      │  │  Kept cron:                                     │   │
         │                      │  │  - spec_rankings_hourly (materialized view)     │   │
         │                      │  │  - top_sims_daily (materialized view)           │   │
         │                      │  └─────────────────────────────────────────────────┘   │
         │                      │         ▲                                              │
         │                      │         │ Realtime WS                                  │
         │                      │         │ (chunk assignments + claim events)            │
  ┌──────▼───────────┐          └─────────┼──────────────────────────────────────────────┘
  │                  │                    │
  │   Nodes          │                    │
  │   (Desktop/VPS)  │────────────────────┘
  │                  │
  │  - Rust binary   │          Sentinel HTTP (:8080)
  │  - Worker pool   │          ─────────────────────
  │  - Local cache   │   POST /nodes/register     (Ed25519)
  │                  │───→POST /nodes/heartbeat    (Ed25519, every 5min)
  │                  │   POST /chunks/complete     (Ed25519)
  │                  │
  │                  │          Supabase PostgREST
  │                  │          ─────────────────
  │                  │───→GET  /rest/v1/jobs_configs?hash=eq.X  (anon key)
  │                  │   GET  /rest/v1/rotations?id=eq.X        (anon key)
  │                  │
  └──────────────────┘
```

### Data Flow: Job Lifecycle

```
Portal                     Supabase                   Sentinel                 Node
──────                     ────────                   ────────                 ────
  │                           │                          │                       │
  │─── RPC: create_job() ───→ │                          │                       │
  │                           │── INSERT jobs_chunks ──→  │                       │
  │                           │   (trigger: pg_notify)    │                       │
  │                           │                          │── LISTEN fires         │
  │                           │                          │── assign_pending()     │
  │                           │←── UPDATE chunks ────────│   (match node)        │
  │                           │    node_id, status=running                       │
  │                           │                          │                       │
  │                           │──── Realtime WS ─────────────────────────────────→│
  │                           │     ChunkPayload                                 │
  │                           │                                                  │
  │                           │←── GET configs (PostgREST) ──────────────────────│
  │                           │                                                  │
  │                           │                                                  │── simulate
  │                           │                                                  │
  │                           │                          │←── POST /chunks/complete ──│
  │                           │                          │    { result }          │
  │                           │←── UPDATE chunk result ──│                        │
  │                           │←── UPDATE job result ────│ (aggregate if last)    │
  │                           │                          │                        │
  │←── poll useJob() ────────→│                          │                       │
  │    (status + result)      │                          │                       │
```

### Key Changes from Current State

| What | Before (current) | After (proposed) |
|------|-------------------|------------------|
| Node register/heartbeat/complete | Edge functions | Sentinel HTTP |
| Node config/rotation fetch | Edge functions | PostgREST direct |
| Portal job creation | Edge function (`job-create`) | Postgres RPC (`create_job`) |
| Portal config upload | Edge function (`config-upsert`) | PostgREST upsert |
| Chunk result aggregation | Missing (bug) | Sentinel on chunk-complete |
| Progress tracking | Missing (bug) | Sentinel increments on chunk-complete |
| Stale chunk reclaim | Sentinel (60s) + pg_cron (5min) | Sentinel only (5min) |
| Node offline marking | pg_cron | Sentinel scheduler |
| Data cleanup | pg_cron | Sentinel scheduler (hourly) |
| Remaining edge functions | 9+ | 2 (icons, talent-atlas) |
