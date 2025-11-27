# Performance Tuning Guide

## Current Performance (Nov 2025)

| Iterations | Workers | Throughput | Time | Status |
|------------|---------|------------|------|--------|
| 100,000 | 8 | 13,692 sims/s | 7.3s | ✅ |
| 1,000,000 | 16 | 23,097 sims/s | 43s | ✅ |
| 5,000,000 | 16 | 24,923 sims/s | 3.3min | ✅ |
| 10,000,000 | 16 | 24,332 sims/s | 6.8min | ✅ |
| 16,000,000 | 16 | 24,611 sims/s | 10.8min | ✅ |
| 20,000,000 | 16 | - | - | ❌ Crash ~40% |

**Target:** Beat Raidbots (16M+ permutations)

---

## Architecture Overview

```
Main Thread                    Worker Threads (N)
    │                               │
    ├─► WorkerInit (spells) ───────►│ (once per worker)
    │                               │
    ├─► SimulationBatch ───────────►│ (lightweight, no spells)
    │◄── SimulationResult ──────────┤
    │                               │
    └─► Wave-based streaming        └─► Reuses ManagedRuntime
        (aggregates stats,              (resets GameState per sim)
         doesn't store all results)
```

---

## Optimization Roadmap

### 🔴 HIGH IMPACT

#### 1. Batch Size Tuning
**Current:** Fixed 100 sims/batch
**Optimal:** 500-2000 sims/batch for 16M+ iterations

```typescript
// src/commands/run/index.ts
const batchSizeOpt = Options.integer("batch-size").pipe(
  Options.withDefault(500),  // Increase from 100
);
```

**Why:** Reduces message passing overhead. At 100 sims/batch, 16M iterations = 160k batches. At 1000 sims/batch = 16k batches.

#### 2. Worker Pool Concurrency Config
**Current:** No concurrency setting

```typescript
// Optimized pool creation
const pool = yield* Worker.makePool<...>({
  size: workerCount,
  concurrency: workerCount * 4,  // Control in-flight requests
  targetUtilization: 0.85,
});
```

**Why:** Without explicit concurrency, Effect uses unbounded which can cause memory pressure.

#### 3. Avoid Effect.promise() in Hot Path
**Current:** Each sim wraps `runtime.runPromise()` in `Effect.promise()`

```typescript
// Current (simulation-worker.ts:112-138)
const result = yield* Effect.promise(() =>
  runtime.runPromise(Effect.gen(function* () { ... }))
);
```

**Better:** Batch multiple sims within a single `runPromise` call or use `runtime.runSync` if possible.

#### 4. Increase Worker Heap Size
**Current:** Default Node heap (~2GB)

```javascript
// worker-bootstrap.mjs - add execArgv or modify spawn
// Or run with:
NODE_OPTIONS="--max-old-space-size=4096" pnpm start run ...
```

---

### 🟡 MEDIUM IMPACT

#### 5. Effect Stream for Result Processing
**Current:** Wave-based imperative loop

```typescript
// Better approach using Stream
import * as Stream from "effect/Stream";
import * as Sink from "effect/Sink";

const resultStream = Stream.fromIterable(batches).pipe(
  Stream.mapConcurrently(workerCount * 4)((batch) =>
    pool.executeEffect(batch)
  ),
  Stream.flatMap((result) => Stream.fromIterable(result.results)),
  Stream.runFold(
    { completedSims: 0, totalCasts: 0 },
    (stats, result) => ({
      completedSims: stats.completedSims + 1,
      totalCasts: stats.totalCasts + result.casts,
    })
  )
);
```

**Why:** Built-in backpressure, memory-efficient, composable.

#### 6. Dynamic Batch Sizing

```typescript
const computeOptimalBatchSize = (iterations: number): number => {
  if (iterations > 1_000_000) return 1000;
  if (iterations > 100_000) return 500;
  return 100;
};

const computeWaveSize = (workerCount: number, iterations: number): number => {
  const targetWaves = Math.max(50, Math.min(200, iterations / 100_000));
  return Math.ceil(iterations / targetWaves / computeOptimalBatchSize(iterations));
};
```

#### 7. Pre-allocate Result Arrays

```typescript
// Current
const results: SingleSimResult[] = [];
results.push(result);

// Better
const results = new Array<SingleSimResult>(batch.simIds.length);
let resultIndex = 0;
// ...
results[resultIndex++] = result;
```

#### 8. Reduce Object Creation in Hot Loop

```typescript
// Current - creates new string and objects each iteration
const playerId = Schemas.Branded.UnitID(`player-${simId}`);
const player = rotation.setupPlayer(playerId, spells);

// Better - reuse/pool player objects
// Reset player state instead of creating new
```

---

### 🟢 LOWER IMPACT

#### 9. Worker Recycling for Very Long Runs
For 20M+ iterations, workers accumulate memory. Periodically terminate and respawn:

```typescript
// Every N batches, check memory and recycle if needed
if (batchId % 10000 === 0) {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 2 * 1024 * 1024 * 1024) { // 2GB
    // Signal worker to restart
  }
}
```

#### 10. SharedArrayBuffer for Stats
Avoid message passing for simple counters:

```typescript
// Main thread
const statsBuffer = new SharedArrayBuffer(16);
const stats = new Int32Array(statsBuffer);
// Pass to workers, use Atomics for updates
```

#### 11. WebAssembly for Simulation Core
If simulation logic is CPU-bound, compile hot paths to WASM.

---

## V8/Node Flags Worth Testing

```bash
# Increase heap
--max-old-space-size=8192

# Expose GC for manual hints
--expose-gc

# Optimize for throughput over latency
--max-semi-space-size=128

# Disable pointer compression (uses more memory but faster)
--no-turbo-compress-displacement
```

---

## Benchmarking Commands

```bash
# Quick test
pnpm start run --iterations 10000 --workers 8 beast-mastery

# Throughput test
pnpm start run --iterations 1000000 --workers 16 beast-mastery

# Stress test (current max stable)
pnpm start run --iterations 16000000 --workers 16 beast-mastery

# With custom batch size
pnpm start run --iterations 1000000 --workers 16 --batch-size 500 beast-mastery

# With increased heap
NODE_OPTIONS="--max-old-space-size=8192" pnpm start run --iterations 20000000 --workers 16 beast-mastery
```

---

## Known Issues

1. **20M+ iterations crash** - Segfault (139) or OOM (137) around 8-10M into run
   - Likely cause: Memory growth in workers over time
   - Potential fix: Worker recycling, explicit GC, or reduce object allocation

2. **Auto-detect workers can be suboptimal** - More workers != more throughput
   - 4-8 workers often faster than 16-24 for smaller runs
   - Worker spawn overhead dominates at low iteration counts

3. **Batch size tradeoff** - Larger batches = fewer messages but more memory per batch

---

## Future Optimizations to Explore

- [ ] Implement worker recycling for 20M+ runs
- [ ] Add pool concurrency configuration
- [ ] Increase default batch size to 500
- [ ] Test Effect Stream approach
- [ ] Profile memory growth in workers
- [ ] Consider SharedArrayBuffer for stats
- [ ] Benchmark WASM simulation core
