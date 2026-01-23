# Phase 1: Fix Broken Result Pipeline

## Problem

When all chunks complete, `chunk-complete` sets `jobs.status = 'completed'` but never:
- Aggregates chunk results into `jobs.result`
- Increments `jobs.completed_iterations`

The portal polls `jobs.result` which is always `null`. The system is broken end-to-end.

## Plan

Since we're moving chunk-complete to sentinel in Phase 2, we fix this directly in the sentinel's new chunk-complete handler rather than patching the edge function. However, if we want the system working before Phase 2, we can patch the edge function first and then delete it later.

### Option A: Fix in edge function now, delete in Phase 2

Patch `supabase/functions/chunk-complete/index.ts`:

1. After confirming `pendingCount === 0`, query all completed chunks for this job:
   ```sql
   SELECT result, iterations FROM jobs_chunks WHERE job_id = $1 AND status = 'completed'
   ```

2. Aggregate results:
   ```ts
   const aggregated = {
     meanDps: weightedMean(chunks, c => c.result.meanDps, c => c.iterations),
     minDps: Math.min(...chunks.map(c => c.result.minDps)),
     maxDps: Math.max(...chunks.map(c => c.result.maxDps)),
     totalIterations: chunks.reduce((s, c) => s + c.iterations, 0),
     chunksCompleted: chunks.length,
   };
   ```

3. Write to job:
   ```sql
   UPDATE jobs SET status = 'completed', result = $aggregated, completed_at = now()
   WHERE id = $job_id
   ```

4. On each chunk completion (not just final), increment `completed_iterations`:
   ```sql
   UPDATE jobs SET completed_iterations = completed_iterations + $chunk_iterations
   WHERE id = $job_id
   ```

### Option B: Skip straight to Phase 2, build it in sentinel

Do Phase 2 first. The sentinel's `POST /chunks/complete` handler does the aggregation natively in Rust.

## Recommendation

**Option A** — get the pipeline working now. The edge function patch is small. Phase 2 replaces it entirely.

## Result Types

Portal expects (`apps/portal/src/lib/state/jobs.ts`):
```ts
interface SimulationResult {
  meanDps: number;
  minDps: number;
  maxDps: number;
  totalIterations: number;
  chunksCompleted: number;
}
```

Node sends per-chunk (`ChunkResult`):
```ts
interface ChunkResult {
  meanDps: number;
  stdDps: number;
  minDps: number;
  maxDps: number;
  iterations: number;
}
```

## Aggregation Formula

```
meanDps = sum(chunk.meanDps * chunk.iterations) / sum(chunk.iterations)
minDps  = min(chunk.minDps)
maxDps  = max(chunk.maxDps)
totalIterations = sum(chunk.iterations)
chunksCompleted = count(chunks)
```
