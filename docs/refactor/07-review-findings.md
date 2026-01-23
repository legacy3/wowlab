# Refactor Plan Review Findings

Comprehensive review of phases 01-06 against the actual codebase.

## Verification Status

All major claims in the plan have been verified against the code:

| Claim | Status |
|-------|--------|
| `chunk-complete` never aggregates results | Confirmed |
| `completed_iterations` never incremented | Confirmed |
| Sentinel scheduler uses PG LISTEN with 30s timeout | Confirmed |
| Sentinel stale threshold is 60s (conflicts with DB 5min) | Confirmed |
| Node calls 5 edge functions (register, heartbeat, complete, config-fetch, rotation-fetch) | Confirmed |
| Portal `useSubmitJob` calls config-upsert then job-create | Confirmed |
| Phantom computing.ts store exists | Confirmed |
| All 4+ phantom cards exist | Confirmed |
| Realtime subscription for chunk assignments | Confirmed |
| ed25519-dalek not in sentinel dependencies | Confirmed (sha2 is, ed25519 is not) |

---

## Issues Found

### 1. Nodes Don't Sign Requests (Critical)

**Problem:** The plan assumes Ed25519 is a working auth system that needs porting to Rust. Reality: **nodes send no auth headers at all.** The edge functions have `verifyNode()` code in `_shared/ed25519.ts`, but `crates/node/src/supabase/client.rs` makes plain HTTP requests with no `X-Node-Key`, `X-Node-Sig`, or `X-Node-Ts` headers.

**Impact on plan:** Phase 2 needs a sub-phase for node-side implementation:
1. Generate Ed25519 keypair on first run
2. Persist keypair in `config.ini`
3. Add signing to all outgoing requests in `ApiClient`
4. Add `ed25519-dalek`, `base64` to node's `Cargo.toml`

**Open question:** If nodes aren't signing today, is the edge function verification dead code? Or is there a separate auth path (anon key header?) that we're not seeing?

### 2. Nodes Also Call config-fetch and rotation-fetch

**Problem:** Phase 4 replaces these edge functions with portal-side `supabase.from()` queries. Phase 6 deletes the edge functions. But **nodes call them too** to fetch config and rotation data before running simulations.

**Node flow:**
```
Realtime fires → { config_hash, seed_offset, iterations }
                        ↓
GET /functions/v1/config-fetch?hash={hash}    ← deleted in Phase 6
                        ↓
GET /functions/v1/rotation-fetch?id={id}      ← deleted in Phase 6
                        ↓
Run simulation → POST /functions/v1/chunk-complete
```

**Fix:** After Phase 4 adds public SELECT RLS on `jobs_configs` and `rotations`, nodes can query PostgREST directly:
```rust
// Before:
GET {api_url}/functions/v1/config-fetch?hash={hash}

// After:
GET {api_url}/rest/v1/jobs_configs?hash=eq.{hash}&select=config
Headers: apikey={anon_key}, Authorization: Bearer {anon_key}
```

Same for rotations. Nodes already have the anon key.

### 3. No Migrations in Repository

**Problem:** `supabase/migrations/` is empty. Schema exists only in the remote Supabase project. Phase 4 and 6 require creating migrations.

**Fix:** Run `supabase db pull` first to establish a baseline migration, then add Phase 4/6 migrations on top.

### 4. DB Functions/Trigger Existence Unverified

**Problem:** `reap_stale_chunks()`, `mark_nodes_offline()`, `cleanup_stale_data()`, and `trg_pending_chunk` are referenced in TypeScript types and the analysis doc, but no SQL source exists in the repo.

**Impact:** Phase 3 (move cron to sentinel) and Phase 6 (drop functions) assume these exist. They probably do in the live DB, but should be verified.

**Fix:** After `supabase db pull`, confirm these exist. If `trg_pending_chunk` doesn't exist, sentinel's `LISTEN "pending_chunk"` is silently receiving nothing and the system works purely via the 30s polling fallback.

### 5. Additional Phantom Cards Not Listed

Phase 5 lists 4 phantom cards to delete but misses 2 more:
- `cpu-cores-card.tsx` — reads from `use-client-hardware.ts`
- `memory-card.tsx` — reads from `use-client-hardware.ts`

### 6. /old Directory Doesn't Exist

The analysis doc mentions `/old/apps/portal/` but this directory doesn't exist. Either already deleted or never committed. Remove reference.

### 7. Unaddressed Edge Functions

Five edge function directories exist but aren't mentioned in the plan:

| Function | Needs |
|----------|-------|
| `permission-update` | Analyze and categorize |
| `permission-revoke` | Analyze and categorize |
| `token-issue` | Analyze and categorize |
| `token-refresh` | Analyze and categorize |
| `generate-signing-keys` | Likely dead code if nodes don't sign; delete |

Portal already manages `nodes_permissions` via direct PostgREST queries (`useNodeMutations()`). The edge functions may be unused dead code, or called from somewhere not yet identified.

### 8. Deployment Ordering Risk

Old nodes can't talk to sentinel (no auth headers, wrong URL). New nodes can't talk to old edge functions (different URL). Need a transition strategy:

**Option A:** Sentinel initially accepts unsigned requests, enforce signing after all nodes update.

**Option B:** Keep edge functions alive during transition, delete only after confirming no traffic.

### 9. config-upsert Race Condition

Phase 4 splits config upsert and job creation into two separate portal calls (upsert + RPC). If two users submit the same config hash simultaneously, there's a race on the upsert. Consider having `create_job` RPC also handle the config upsert internally for atomicity.

---

## Improvements

### 1. Fix Stale Threshold in Phase 2, Not Phase 3

The 60s sentinel reclaim threshold causes premature chunk reclaim during computation. Since Phase 2 already touches `reclaim.rs` (changing it to sentinel's chunk-complete handler), fix the threshold to 5 minutes at the same time.

### 2. Merge config-upsert into create_job RPC

Instead of two calls (upsert config, then RPC), make the RPC accept the raw config:
```sql
CREATE FUNCTION create_job(p_config jsonb, p_iterations int, ...)
-- Function hashes config internally, upserts, creates job+chunks atomically
```

Benefits: single round-trip, atomic, no browser-side SHA-256, no race condition.

### 3. Node PostgREST for Config/Rotation

After Phase 4 adds public SELECT RLS policies, node can fetch directly from PostgREST without any edge function or sentinel proxy. Minimal code change in `ApiClient`:
- Change URL pattern from `/functions/v1/config-fetch?hash=X` to `/rest/v1/jobs_configs?hash=eq.X&select=config`
- Add `apikey` and `Authorization` headers (already has anon key)

### 4. Consider Embedding Config in Assignment

Instead of node fetching config after assignment, sentinel could include config in the Realtime payload by updating a JSONB column on `jobs_chunks` during assignment. Eliminates the fetch round-trip entirely. Trade-off: larger Realtime payloads, but configs are typically small JSON.

### 5. Sentinel Health During Transition

Add a `/ready` endpoint to sentinel that returns 503 until the first successful PG LISTEN + chunk assignment cycle completes. Useful for Fly.dev health checks during deploy.

---

## Revised Phase Order

Based on findings, recommended adjustments:

```
Phase 0 (NEW): supabase db pull — establish migration baseline
Phase 1:       Fix results (as planned)
Phase 2:       Sentinel HTTP API + node signing + fix stale threshold
Phase 2.5:     Node PostgREST migration (config-fetch, rotation-fetch)
Phase 3:       Move cron to sentinel (as planned)
Phase 4:       Portal direct queries + RPC (as planned, consider merged RPC)
Phase 5:       Portal cleanup (add cpu-cores-card, memory-card to deletion list)
Phase 6:       Delete edge functions + DB functions (verify they exist first)
Phase 7 (NEW): Audit remaining edge functions (permissions, tokens)
```
