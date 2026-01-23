# Phase 6: Delete Old Edge Functions & DB Functions

## Prerequisites

- Phase 2 complete (sentinel handles node register/heartbeat/chunk-complete)
- Phase 3 complete (sentinel handles maintenance)
- Phase 4 complete (portal uses direct queries + RPC instead of edge functions)
- Nodes updated to point at sentinel URL
- Verified working end-to-end

## Edge Functions to Delete

```
supabase/functions/node-register/
supabase/functions/node-heartbeat/
supabase/functions/chunk-complete/
supabase/functions/config-upsert/
supabase/functions/config-fetch/
supabase/functions/job-create/
supabase/functions/rotation-fetch/
```

## Edge Functions to Keep

```
supabase/functions/icons/            # Wowhead asset proxy (can't be replaced)
supabase/functions/talent-atlas/     # Wowhead asset proxy (can't be replaced)
supabase/functions/_shared/          # Keep only what icons/talent-atlas need
```

## Shared Code Cleanup

After deleting functions, audit `_shared/`:
- `ed25519.ts` — delete (logic now in sentinel Rust)
- `auth.ts` — delete if only used by deleted functions
- `response.ts` — keep if icons/talent-atlas use it
- `supabase.ts` — keep if icons/talent-atlas use it
- `cors.ts` — keep if icons/talent-atlas use it

## Database Functions to Drop

```sql
DROP FUNCTION IF EXISTS reap_stale_chunks();
DROP FUNCTION IF EXISTS mark_nodes_offline();
DROP FUNCTION IF EXISTS cleanup_stale_data();
```

## Cron Jobs to Remove

```sql
SELECT cron.unschedule(4);  -- mark_nodes_offline
SELECT cron.unschedule(5);  -- cleanup_stale_data
SELECT cron.unschedule(6);  -- reap_stale_chunks
```

Keep cron jobs 1 and 2 (materialized view refreshes) — these are query-layer concerns, not sentinel's job.

## Database Trigger: Keep

`trg_pending_chunk` on `jobs_chunks` stays — sentinel still uses `PG LISTEN 'pending_chunk'` for real-time chunk notification.

## Database Function: Keep

`create_job` (added in Phase 4) — this is the RPC function the portal calls directly.

## Migration File

Create a Supabase migration:

```sql
-- Drop maintenance functions (moved to sentinel)
DROP FUNCTION IF EXISTS reap_stale_chunks();
DROP FUNCTION IF EXISTS mark_nodes_offline();
DROP FUNCTION IF EXISTS cleanup_stale_data();

-- Remove cron jobs (by name or id)
SELECT cron.unschedule('reap_stale_chunks');
SELECT cron.unschedule('mark_nodes_offline');
SELECT cron.unschedule('cleanup_stale_data');
```

## Deployment Order

1. Deploy updated sentinel (Phase 2 + 3 routes live)
2. Deploy updated node binaries (pointing at sentinel URL)
3. Deploy updated portal (Phase 4, uses direct queries + RPC)
4. Verify full pipeline works without edge functions
5. Run migration to drop DB functions and cron jobs
6. Delete edge function directories (keep only icons + talent-atlas + minimal _shared)
7. Deploy Supabase functions (two proxies only)

## Verification

After deletion:
- `pnpm build` passes
- Sentinel `/status` shows healthy
- Node can register, heartbeat, complete chunks via sentinel
- Portal can submit jobs via RPC and see results via direct query
- No pg_cron errors in Supabase logs
- Icons and talent-atlas still work
