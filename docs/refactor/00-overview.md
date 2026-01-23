# Simulation System Refactor Plan

## Principles

1. No backwards compatibility. Old code gets deleted, not wrapped.
2. Sentinel handles all node-facing operations.
3. All scheduled maintenance moves to sentinel. No pg_cron, no DB functions for housekeeping.
4. Edge functions eliminated wherever possible. Direct Supabase queries and Postgres RPC replace user-facing functions. Only asset proxies remain.

## Phases

| Phase | Scope | File |
|-------|-------|------|
| 1 | Fix broken result pipeline | `01-fix-results.md` |
| 2 | Move node ops to sentinel HTTP | `02-sentinel-node-api.md` |
| 3 | Move cron jobs to sentinel | `03-sentinel-maintenance.md` |
| 4 | Replace user-facing edge functions with direct queries + RPC | `04-eliminate-edge-functions.md` |
| 5 | Clean up portal dead code | `05-portal-cleanup.md` |
| 6 | Delete old edge functions, DB functions, cron jobs | `06-delete-old.md` |

## Final State: Edge Functions

Only two remain (asset proxies that can't be replaced):

| Function | Reason |
|----------|--------|
| `icons` | Wowhead icon proxy (external asset, needs server-side fetch) |
| `talent-atlas` | Wowhead talent atlas proxy (external asset) |

## What moves to sentinel

| Current location | New location |
|-----------------|--------------|
| `node-register` edge fn | Sentinel HTTP `POST /nodes/register` |
| `node-heartbeat` edge fn | Sentinel HTTP `POST /nodes/heartbeat` |
| `chunk-complete` edge fn | Sentinel HTTP `POST /chunks/complete` |
| `reap_stale_chunks()` pg_cron | Sentinel scheduler loop |
| `mark_nodes_offline()` pg_cron | Sentinel scheduler loop |
| `cleanup_stale_data()` pg_cron | Sentinel scheduler loop (hourly) |

## What becomes direct Supabase operations

| Current edge function | Replacement |
|----------------------|-------------|
| `config-upsert` | Direct `supabase.from('jobs_configs').upsert(...)` with RLS |
| `config-fetch` | Direct `supabase.from('jobs_configs').select(...)` |
| `rotation-fetch` | Direct `supabase.from('rotations').select(...)` |
| `job-create` | Postgres RPC: `supabase.rpc('create_job', {...})` |

## What gets deleted from portal

| Item | Reason |
|------|--------|
| `src/lib/state/computing.ts` | Phantom local worker model, not connected to distributed system |
| `src/components/computing/cards/workers-card.tsx` | Shows `navigator.hardwareConcurrency`, not real nodes |
| `src/components/computing/cards/simulations-card.tsx` | Reads from phantom store |
| `src/components/computing/cards/iterations-card.tsx` | Reads from phantom store |
| `src/hooks/use-client-hardware.ts` | Only feeds phantom cards |
| Related computing dashboard wiring | Rewire to real node/job queries or remove |
