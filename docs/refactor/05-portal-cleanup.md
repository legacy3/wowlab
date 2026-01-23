# Phase 5: Clean Up Portal Dead Code

## Problem

The portal has a phantom "local worker" system (`computing.ts`, hardware hooks, dashboard cards) that was designed for in-browser simulation but never connected to anything. It conflicts conceptually with the distributed system and shows fake data.

## Files to Delete

### Phantom Worker System

| File | Reason |
|------|--------|
| `src/lib/state/computing.ts` | Zustand store with fake job phases, ETAs, worker management. Not used by distributed system. |
| `src/hooks/use-client-hardware.ts` | Reads `navigator.hardwareConcurrency`. Only feeds phantom cards. |

### Phantom Dashboard Cards

| File | Reason |
|------|--------|
| `src/components/computing/cards/workers-card.tsx` | Shows browser CPU cores as "workers" |
| `src/components/computing/cards/simulations-card.tsx` | Reads from phantom `useWorkerSystem` |
| `src/components/computing/cards/iterations-card.tsx` | Shows fake iteration metrics |
| `src/components/computing/cards/status-card.tsx` | Shows phantom system status |

### Related imports

Any imports of the above in:
- `src/app/[locale]/dev/computing/page.tsx`
- `src/components/layout/computing-drawer.tsx`

## What to Keep

| File | Reason |
|------|--------|
| `src/lib/state/jobs.ts` | Real distributed job hooks (`useJob`, `useSubmitJob`, `useUserJobs`) |
| `src/lib/state/nodes/` | Real node queries from Supabase |
| `src/components/computing/cards/job-history-card.tsx` | Shows real job history (if it uses `useUserJobs`) |
| `src/components/simulate/` | Real simulation wizard |

## Computing Dashboard Rewire

The `/dev/computing` page should show real distributed system state instead of phantom data:

### Real data sources available:
- `useUserJobs()` — user's actual jobs with status
- `useNodes(userId)` — real online/offline nodes with cores and load
- `jobs_chunks` could be queried for real-time chunk progress

### Suggested replacement cards:

1. **Nodes Card** — Online nodes count, total cores, total capacity (from `useNodes`)
2. **Jobs Card** — Active/completed job counts (from `useUserJobs`)
3. **Job History Card** — Already exists, keep as-is

If the computing dashboard is a dev-only page that's not critical, just delete the phantom cards and leave the job history card. The real monitoring is in sentinel's `/status` and `/metrics` endpoints.

## Computing Drawer

`src/components/layout/computing-drawer.tsx` currently shows:
- Active jobs with phantom phases/ETAs
- Worker system status

Rewire to show:
- Active jobs from `useUserJobs()` with real `pending/running/completed` status
- Progress via `completedIterations / totalIterations` (once Phase 1 fix is in)

Or delete if the simulate wizard's results step is sufficient.

## Steps

1. Delete phantom files listed above
2. Remove all imports of deleted modules
3. Update computing dashboard page (keep job history, delete phantom cards)
4. Update computing drawer to use real job data or delete
5. Build to verify no broken imports
