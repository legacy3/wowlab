# Simulation Flow Comparison: Portal vs Standalone

This document highlights the key differences between the portal (browser) and standalone (CLI) simulation flows.

---

## Quick Reference

| Aspect | Portal (Browser) | Standalone (Node.js) |
|--------|------------------|----------------------|
| Entry Point | Test button in rotation editor | CLI `run` command |
| Worker Type | Web Workers | `worker_threads` |
| Effect Runner Layer | `BrowserWorkerRunner` | `NodeWorkerRunner` |
| Rotation Source | Dynamic code string | Pre-compiled registry |
| Data Source | React Query + IndexedDB | Supabase direct |
| Batching | Simple concurrent | Wave-based |
| Worker Count | `CPU / 2` (min 2) | `CPU - 1` (min 4) |
| Cancellation | Fiber-based | N/A |
| Results | Full (events, DPS) | Minimal (casts) |

---

## 1. Rotation Handling

### Portal
```
User writes code in editor
        ↓
Code string passed to worker via WorkerInit
        ↓
Worker compiles at runtime:
  new Function("api", sandboxedCode)
        ↓
Returns Effect.gen() wrapped rotation
```

**WorkerInit contains:**
```typescript
{
  type: "init",
  code: string,           // ← User's rotation code
  spellIds: number[],
  spells: SpellDataFlat[],
  auras: AuraDataFlat[]
}
```

### Standalone
```
Rotation name passed via CLI arg
        ↓
Name sent to worker via WorkerInit
        ↓
Worker looks up pre-compiled rotation:
  rotations[init.rotationName]
        ↓
Uses existing Effect.gen() rotation
```

**WorkerInit contains:**
```typescript
{
  type: "init",
  rotationName: string,   // ← Just the name
  spells: SpellDataFlat[]
}
```

---

## 2. Worker Platform

### Portal
```typescript
// simulation-worker.ts:298-302
const WorkerLive = WorkerRunner.layer(handleRequest).pipe(
  Layer.provide(BrowserWorkerRunner.layer)  // ← @effect/platform-browser
);

Effect.runFork(Layer.launch(WorkerLive));
```

```typescript
// worker-pool.ts:139-144
const SimulationWorkerLayer = BrowserWorker.layer(
  () => new Worker(new URL("./simulation-worker.ts", import.meta.url), {
    type: "module"
  })
);
```

### Standalone
```typescript
// simulation-worker.ts:173-177
const WorkerLive = WorkerRunner.layer(handleRequest).pipe(
  Layer.provide(NodeWorkerRunner.layer)  // ← @effect/platform-node
);

Effect.runFork(Layer.launch(WorkerLive));
```

```typescript
// run/index.ts:391-407
Effect.provide(
  Layer.merge(
    NodeWorker.layerManager,
    NodeWorker.layer(() => new NodeWorkerThread(workerPath))
  )
)
```

**Standalone requires bootstrap** (`worker-bootstrap.mjs`):
```javascript
import { register } from "tsx/esm/api";
register();  // Enable TypeScript
await import("./simulation-worker.ts");
```

---

## 3. Batching Strategy

### Portal: Simple Concurrent
```typescript
// worker-pool.ts:204-220
yield* Effect.forEach(
  batches,
  (batch) => pool.executeEffect(batch),
  { concurrency: config.workerCount }  // ← Limited to worker count
);
```

- Batches distributed as workers become available
- No wave boundaries
- Progress updates per batch completion

### Standalone: Wave-Based
```typescript
// run/index.ts:203-251
const waveSize = workerCount * 10;

for (waveStart = 0; waveStart < iterations; waveStart += waveSize * batchSize) {
  // Create wave of batches
  const waveBatches = [...];

  // Execute ENTIRE wave in parallel
  const waveResults = yield* Effect.all(
    waveBatches.map(batch => pool.executeEffect(batch)),
    { concurrency: "unbounded" }  // ← All batches at once
  );

  // Wait for wave to complete, then next wave
}
```

- All batches in wave launched simultaneously
- Backpressure: wait for wave completion before next wave
- Better for high iteration counts (prevents queue overflow)

---

## 4. Worker Count Defaults

### Portal
```typescript
// worker-pool.ts:29-35
const DEFAULT_CONFIG = {
  workerCount: Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2)),
  batchSize: 100
};
```
- **Formula**: `CPU cores / 2` (minimum 2)
- **Rationale**: Leave cores for UI responsiveness

### Standalone
```typescript
// run/index.ts:180
const workerCount = workers === -1
  ? Math.max(4, os.cpus().length - 1)
  : workers;
```
- **Formula**: `CPU cores - 1` (minimum 4)
- **Rationale**: Maximize throughput, leave 1 core for main thread

---

## 5. Data Loading

### Portal
```typescript
// loader.ts:36-59
const spells = await Effect.runPromise(
  Effect.forEach(spellIds, transformSpell, {
    concurrency: "unbounded",
    batching: true
  }).pipe(Effect.provide(appLayer))
);
```
- Uses React Query for caching
- IndexedDB for persistence
- `createPortalDbcLayer()` with browser adapters

### Standalone
```typescript
// spell-loader.ts:103-106
yield* Effect.forEach(spellIds, transformSpell, {
  concurrency: 10,
  batching: true
});
```
- Direct Supabase queries
- `SupabaseDbcBatchFetcherLive` layer
- Limited concurrency (10) to avoid rate limits

---

## 6. Cancellation

### Portal
```typescript
// use-worker-simulation.ts:40-46
const activeFibers = new Map<string, Fiber.RuntimeFiber<SimulationStats, unknown>>();

export function cancelSimulation(jobId: string): void {
  const fiber = activeFibers.get(jobId);
  if (fiber) {
    Effect.runFork(Fiber.interrupt(fiber));
    activeFibers.delete(jobId);
  }
}
```

```typescript
// use-worker-simulation.ts:251-261
const fiber = Effect.runFork(effect);
activeFibers.set(jobId, fiber);

const exit = await Effect.runPromise(Fiber.await(fiber));

if (Exit.isInterrupted(exit)) {
  // Canceled - no error shown
}
```

### Standalone
- **No cancellation support**
- CLI runs to completion
- Ctrl+C terminates process

---

## 7. Result Data

### Portal
```typescript
interface SingleSimResult {
  simId: number;
  casts: number;
  duration: number;
  totalDamage: number;
  dps: number;
  error?: string;
  events?: SimulationEvent[];  // ← Full combat log
}

interface SimulationStats {
  completedSims: number;
  totalCasts: number;
  totalDamage: number;
  avgDps: number;
  errors: string[];
  workerVersion: string | null;
  bestResult: SingleSimResult | null;  // ← Best DPS with events
}
```

### Standalone
```typescript
interface SingleSimResult {
  simId: number;
  casts: number;
  duration: number;
  error?: string;
  // No damage, no DPS, no events
}

interface AggregatedStats {
  completedSims: number;
  totalCasts: number;
  // No damage tracking
}
```

---

## 8. Progress Tracking

### Portal
```typescript
// use-worker-simulation.ts:234-246
// Throttled at 500ms intervals
onProgress?.({
  completed: processedSims,
  total: params.iterations,
  elapsedMs,
  etaMs
});

// Jotai atoms for UI
updateProgress({ jobId, current, total, eta });
pushPerformanceData({ time, itersPerSec, memoryMB });
```

### Standalone
```typescript
// run/index.ts:247-251
// Console logging every 500K for large runs
if (iterations > 100000 && completedSims % 500000 === 0) {
  console.log(`Progress: ${pct}%`);
}
```

---

## 9. Effect Patterns: Shared vs Different

### Shared Patterns
Both implementations use:
- `ManagedRuntime.make(fullLayer)` - per-worker runtime
- `WorkerRunner.layer(handleRequest)` - message dispatch
- `Layer.launch()` - worker lifecycle
- `Effect.gen()` - generator-based composition
- `Effect.scoped` - resource cleanup
- Same service layers: `StateService`, `UnitService`, `CombatLogService`, `SimDriver`

### Different Patterns

| Pattern | Portal | Standalone |
|---------|--------|------------|
| Entry execution | `Effect.runFork()` → `Fiber.await()` | `Effect.runPromiseExit()` |
| Batch concurrency | `{ concurrency: workerCount }` | `{ concurrency: "unbounded" }` per wave |
| Error handling | `Exit.isFailure()` / `Exit.isInterrupted()` | `Effect.catchAll()` |
| State management | Jotai atoms | Console output |

---

## 10. Runtime Lifecycle

### Portal
```typescript
// simulation-worker.ts:154-167
function createRuntime(spells): WorkerRuntime {
  const fullLayer = RotationContext.Default.pipe(
    Layer.provide(createAppLayer({ metadata })),
    Layer.merge(baseAppLayer),
    Layer.provide(loggerLayer)  // Logger disabled
  );
  return ManagedRuntime.make(fullLayer);
}

// Cached in workerState, reused for all batches
workerState = { rotation, runtime, spells };
```

### Standalone
```typescript
// run/index.ts:91-161 (single-threaded path)
yield* Effect.acquireUseRelease(
  createRotationRuntime(config),  // acquire
  (runtime) => runSimLoop(runtime),  // use
  (runtime) => runtime.dispose()  // release
);
```

```typescript
// simulation-worker.ts:42-93 (multi-threaded)
// Same pattern as portal - cached ManagedRuntime
workerState = { runtime, rotation, spells };
```

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PORTAL FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Test Button → useWorkerSimulation → runSimulations                         │
│       │              │                    │                                 │
│       │              ▼                    ▼                                 │
│       │     Load spells via        Worker.makePool()                        │
│       │     React Query            (BrowserWorker.layer)                    │
│       │              │                    │                                 │
│       │              └────────────────────┤                                 │
│       │                                   ▼                                 │
│       │                    Effect.forEach(batches, execute, {               │
│       │                      concurrency: workerCount                       │
│       │                    })                                               │
│       │                                   │                                 │
│       ▼                                   ▼                                 │
│  Fiber.await(fiber)              Workers compile code,                      │
│  Exit handling                   run sims, return full results              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            STANDALONE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLI run → Load rotation by name → runWithWorkers                           │
│       │              │                    │                                 │
│       │              ▼                    ▼                                 │
│       │     Load spells via        Worker.makePool()                        │
│       │     Supabase direct        (NodeWorker.layer)                       │
│       │              │                    │                                 │
│       │              └────────────────────┤                                 │
│       │                                   ▼                                 │
│       │                    for each wave:                                   │
│       │                      Effect.all(waveBatches, {                      │
│       │                        concurrency: "unbounded"                     │
│       │                      })                                             │
│       │                      wait for wave completion                       │
│       │                                   │                                 │
│       ▼                                   ▼                                 │
│  Effect.runPromiseExit()         Workers lookup rotation,                   │
│  Print results                   run sims, return minimal results           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
