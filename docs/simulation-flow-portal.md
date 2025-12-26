# Portal Simulation Data Flow

This document traces the complete simulation data flow in `apps/portal` from the test button in the rotation editor through to the end of the simulation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAIN THREAD (React)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌────────────────────┐    ┌───────────────────────┐   │
│  │ Test Button  │───▶│ useWorkerSimulation│───▶│ runSimulations()      │   │
│  │ (EditorView) │    │ (React Hook)       │    │ (Effect-TS)           │   │
│  └──────────────┘    └────────────────────┘    └───────────┬───────────┘   │
│                                                             │               │
│                              ┌──────────────────────────────┘               │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      WORKER POOL (Effect)                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Worker 1   │  │  Worker 2   │  │  Worker 3   │  │  Worker N   │   │ │
│  │  │ (Web Worker)│  │ (Web Worker)│  │ (Web Worker)│  │ (Web Worker)│   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  │         │                │                │                │          │ │
│  │         ▼                ▼                ▼                ▼          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │              ManagedRuntime per Worker                          │  │ │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ Effect Layers: RotationContext, State, Unit, CombatLog   │  │  │ │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow Sequence

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: USER INTERACTION                                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    User clicks "Test" button                                                   │
│            │                                                                   │
│            ▼                                                                   │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ rotation-editor.tsx:142-156                       │                       │
│    │ handleTest() callback                             │                       │
│    │                                                   │                       │
│    │ • Gets draft rotation name                        │                       │
│    │ • Passes script code to hook                      │                       │
│    │ • Default: 100k iterations, 12 workers            │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ use-worker-simulation.ts:154-326                  │                       │
│    │ runWorkerSimulation()                             │                       │
│    │                                                   │                       │
│    │ 1. Creates job via Jotai atom (createSimJobAtom)  │                       │
│    │ 2. Extracts spell IDs from code (regex parsing)   │                       │
│    │ 3. Updates phase: "preparing-spells"              │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 2: DATA LOADING    │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ loader.ts:36-59                                   │                       │
│    │ loadSpellsById() + loadAurasById()                │                       │
│    │                                                   │                       │
│    │ Effect.forEach(spellIds, transformSpell, {        │                       │
│    │   concurrency: "unbounded",                       │◀── Parallel loading   │
│    │   batching: true                                  │◀── Grouped requests   │
│    │ })                                                │                       │
│    │                                                   │                       │
│    │ Uses:                                             │                       │
│    │ • Ref.make() for atomic progress counter          │                       │
│    │ • DBC layer with React Query + IndexedDB cache    │                       │
│    │ • ExtractorService for spell transformation       │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ Returns: SpellDataFlat[] + AuraDataFlat[]         │                       │
│    │ Phase updates: "Loading spell 1/N..."             │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 3: EFFECT CREATION │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ use-worker-simulation.ts:211-254                  │                       │
│    │                                                   │                       │
│    │ const effect = runSimulations(                    │                       │
│    │   { code, spellIds, spells, auras, iterations },  │                       │
│    │   workerConfig,                                   │                       │
│    │   progressCallback                                │                       │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ // Run as fiber for cancellation support          │                       │
│    │ const fiber = Effect.runFork(effect);     ◀────── Creates Fiber         │
│    │ activeFibers.set(jobId, fiber);           ◀────── Store for cancel      │
│    │                                                   │                       │
│    │ const exit = await Effect.runPromise(             │                       │
│    │   Fiber.await(fiber)                      ◀────── Block until done      │
│    │ );                                                │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 4: WORKER POOL     │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ worker-pool.ts:148-227                            │                       │
│    │ runSimulationsInternal()                          │                       │
│    │                                                   │                       │
│    │ yield* Effect.gen(function* () {                  │                       │
│    │                                                   │                       │
│    │   // 1. Create worker pool                        │                       │
│    │   const pool = yield* Worker.makePool<            │                       │
│    │     WorkerInit | SimulationBatch,                 │                       │
│    │     SimulationResult                              │                       │
│    │   >({ size: workerCount });              ◀────── Pool creation           │
│    │                                                   │                       │
│    │   // 2. Initialize ALL workers (parallel)         │                       │
│    │   yield* Effect.all(                              │                       │
│    │     workers.map(() => pool.executeEffect(init)),  │                       │
│    │     { concurrency: "unbounded" }          ◀────── Unbounded concurrency  │
│    │   );                                              │                       │
│    │                                                   │                       │
│    │   // 3. Create batches                            │                       │
│    │   const batches = createBatches(                  │                       │
│    │     iterations, duration, batchSize       ◀────── Default: 100 per batch │
│    │   );                                              │                       │
│    │                                                   │                       │
│    │   // 4. Process batches with limited concurrency  │                       │
│    │   yield* Effect.forEach(                          │                       │
│    │     batches,                                      │                       │
│    │     (batch) => pool.executeEffect(batch),         │                       │
│    │     { concurrency: workerCount }          ◀────── Limited to workers     │
│    │   );                                              │                       │
│    │ });                                               │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: WORKER INITIALIZATION (Inside Web Worker)                             │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ simulation-worker.ts:292-302                      │                       │
│    │ Worker Entry Point                                │                       │
│    │                                                   │                       │
│    │ const WorkerLive = WorkerRunner.layer(            │                       │
│    │   handleRequest                                   │                       │
│    │ ).pipe(                                           │                       │
│    │   Layer.provide(BrowserWorkerRunner.layer)◀────── Browser-specific       │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ Effect.runFork(Layer.launch(WorkerLive)); ◀────── Start worker loop     │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ simulation-worker.ts:169-187                      │                       │
│    │ initWorker(WorkerInit)                            │                       │
│    │                                                   │                       │
│    │ 1. compileRotation(code, spellIds)                │                       │
│    │    ├─ new Function("api", wrappedCode)    ◀────── Dynamic compilation    │
│    │    ├─ Sandbox: blocks globalThis, fetch, etc      │                       │
│    │    └─ Returns Effect.gen() wrapped rotation       │                       │
│    │                                                   │                       │
│    │ 2. createRuntime(spells)                          │                       │
│    │    ├─ Metadata.InMemoryMetadata(spells)           │                       │
│    │    ├─ createAppLayer({ metadata })                │                       │
│    │    ├─ Layer.merge(RotationContext, AppLayer)      │                       │
│    │    └─ ManagedRuntime.make(fullLayer)      ◀────── Creates runtime        │
│    │                                                   │                       │
│    │ 3. workerState = { rotation, runtime, spells }    │                       │
│    │    ◀── Cached for all subsequent batches          │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: BATCH PROCESSING (Inside Web Worker)                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ simulation-worker.ts:271-289                      │                       │
│    │ runBatch(SimulationBatch)                         │                       │
│    │                                                   │                       │
│    │ Effect.gen(function* () {                         │                       │
│    │   const results: SingleSimResult[] = [];          │                       │
│    │                                                   │                       │
│    │   for (const simId of batch.simIds) {     ◀────── Sequential in batch   │
│    │     const result = yield* runSingleSim(           │                       │
│    │       simId, duration, workerState                │                       │
│    │     );                                            │                       │
│    │     results.push(result);                         │                       │
│    │   }                                               │                       │
│    │                                                   │                       │
│    │   return { batchId, results };                    │                       │
│    │ });                                               │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ simulation-worker.ts:191-269                      │                       │
│    │ runSingleSim(simId, duration, state)              │                       │
│    │                                                   │                       │
│    │ yield* Effect.promise(() =>                       │                       │
│    │   runtime.runPromise(                     ◀────── Uses ManagedRuntime    │
│    │     Effect.gen(function* () {                     │                       │
│    │                                                   │                       │
│    │       // Register spec                            │                       │
│    │       yield* Shared.registerSpec(BeastMastery);   │                       │
│    │                                                   │                       │
│    │       // Reset game state                         │                       │
│    │       const stateService = yield* State.Service;  │                       │
│    │       yield* stateService.setState(               │                       │
│    │         GameState.createGameState()               │                       │
│    │       );                                          │                       │
│    │                                                   │                       │
│    │       // Create units                             │                       │
│    │       const unitService = yield* Unit.Service;    │                       │
│    │       yield* unitService.add(player);             │                       │
│    │       yield* unitService.add(target);             │                       │
│    │                                                   │                       │
│    │       // Subscribe to events                      │                       │
│    │       const simDriver = yield* SimDriver;         │                       │
│    │       yield* simDriver.subscribe({                │                       │
│    │         filter: EVENT_TYPES,                      │                       │
│    │         onEvent: (e) => {                         │                       │
│    │           events.push(e);                         │                       │
│    │           if (e._tag === "SPELL_DAMAGE")          │                       │
│    │             totalDamage += e.amount;              │                       │
│    │         }                                         │                       │
│    │       });                                         │                       │
│    │                                                   │                       │
│    │       // SIMULATION LOOP                          │                       │
│    │       while (currentTime < duration) {    ◀────── Main loop             │
│    │         yield* rotation.run(playerId, targetId);  │                       │
│    │         yield* simDriver.run(currentTime + 0.1);  │◀── 0.1s tick         │
│    │       }                                           │                       │
│    │                                                   │                       │
│    │       return { simId, casts, totalDamage, dps };  │                       │
│    │     })                                            │                       │
│    │   )                                               │                       │
│    │ );                                                │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: RESULT AGGREGATION (Main Thread)                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ worker-pool.ts:79-100                             │                       │
│    │ aggregateResult(stats, result)                    │                       │
│    │                                                   │                       │
│    │ if (result.error) {                               │                       │
│    │   stats.errors.push(result.error);                │                       │
│    │   return;                                         │                       │
│    │ }                                                 │                       │
│    │                                                   │                       │
│    │ stats.completedSims++;                            │                       │
│    │ stats.totalCasts += result.casts;                 │                       │
│    │ stats.totalDamage += result.totalDamage;          │                       │
│    │                                                   │                       │
│    │ // Track best result by DPS                       │                       │
│    │ if (!stats.bestResult || result.dps > best.dps) { │                       │
│    │   stats.bestResult = result;              ◀────── Keep best for events  │
│    │ }                                                 │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ use-worker-simulation.ts:234-246                  │                       │
│    │ Progress & Performance Tracking                   │                       │
│    │                                                   │                       │
│    │ // Throttled at 500ms intervals                   │                       │
│    │ updateProgress({ jobId, current, total, eta });   │                       │
│    │ pushPerformanceData({                             │                       │
│    │   time,                                           │                       │
│    │   itersPerSec,                            ◀────── Throughput metric     │
│    │   memoryMB                                ◀────── From performance.memory│
│    │ });                                               │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: COMPLETION                                                            │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ use-worker-simulation.ts:257-295                  │                       │
│    │ Exit Handling                                     │                       │
│    │                                                   │                       │
│    │ if (Exit.isFailure(exit)) {                       │                       │
│    │   if (Exit.isInterrupted(exit)) {         ◀────── Canceled by user      │
│    │     // Cleanup, no error                          │                       │
│    │     return null;                                  │                       │
│    │   }                                               │                       │
│    │   // Handle error with failSimJobAtom             │                       │
│    │ }                                                 │                       │
│    │                                                   │                       │
│    │ const stats = exit.value;                         │                       │
│    │                                                   │                       │
│    │ // Update atoms                                   │                       │
│    │ completeSimJobAtom({ jobId, result: stats });     │                       │
│    │ setCombatDataAtom(stats.bestResult?.events);      │                       │
│    │ updateWorkerSystemAtom(stats.workerVersion);      │                       │
│    │                                                   │                       │
│    │ // Callbacks                                      │                       │
│    │ onComplete?.(stats);                              │                       │
│    └──────────────────────────────────────────────────┘                       │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Effect Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| `Effect.gen()` | All Effect code | Monadic composition with generators |
| `Effect.runFork()` | use-worker-simulation.ts:251 | Run effect as fiber for cancellation |
| `Fiber.await()` | use-worker-simulation.ts:254 | Wait for fiber completion |
| `Fiber.interrupt()` | use-worker-simulation.ts:43 | Cancel simulation |
| `Effect.all()` | worker-pool.ts:169 | Concurrent worker init |
| `Effect.forEach()` | worker-pool.ts:204, loader.ts:41 | Batch/parallel processing |
| `Effect.scoped` | worker-pool.ts:239 | Resource cleanup |
| `Layer.provide()` | simulation-worker.ts:161 | Dependency injection |
| `Layer.merge()` | simulation-worker.ts:162 | Combine layers |
| `ManagedRuntime.make()` | simulation-worker.ts:166 | Create runtime from layer |
| `Ref.make()` | loader.ts:39 | Atomic counter |
| `Effect.promise()` | simulation-worker.ts:199 | Wrap Promise in Effect |
| `Effect.catchAll()` | simulation-worker.ts:266 | Error handling |

---

## Concurrency Model

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          CONCURRENCY ARCHITECTURE                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  MAIN THREAD                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Spell Loading:    concurrency: "unbounded", batching: true             │ │
│  │  Worker Init:      concurrency: "unbounded" (all workers at once)       │ │
│  │  Batch Execution:  concurrency: workerCount (limited)                   │ │
│  │  Progress Updates: throttled @ 500ms                                    │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  WEB WORKERS (N = CPU cores / 2, min 2)                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                  │
│  │   Worker 1     │  │   Worker 2     │  │   Worker N     │                  │
│  │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │                  │
│  │ │ Batch A    │ │  │ │ Batch B    │ │  │ │ Batch C    │ │                  │
│  │ │ (100 sims) │ │  │ │ (100 sims) │ │  │ │ (100 sims) │ │                  │
│  │ │            │ │  │ │            │ │  │ │            │ │                  │
│  │ │ Sequential │ │  │ │ Sequential │ │  │ │ Sequential │ │                  │
│  │ │ within     │ │  │ │ within     │ │  │ │ within     │ │                  │
│  │ │ batch      │ │  │ │ batch      │ │  │ │ batch      │ │                  │
│  │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │                  │
│  └────────────────┘  └────────────────┘  └────────────────┘                  │
│         │                   │                   │                            │
│         └───────────────────┴───────────────────┘                            │
│                             │                                                │
│                    Parallel across workers                                   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

Example: 10,000 iterations with 4 workers, batch size 100:
  • 100 batches created
  • Batches 1-4 run in parallel (one per worker)
  • When batch 1 completes, worker picks up batch 5
  • Within each batch: 100 sims run sequentially
```

---

## Cancellation Flow

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         CANCELLATION MECHANISM                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│   Job History Card                                                             │
│         │                                                                      │
│         ▼                                                                      │
│   cancelSimulation(jobId)                                                      │
│   use-worker-simulation.ts:40-46                                               │
│         │                                                                      │
│         ▼                                                                      │
│   ┌─────────────────────────────────────────────┐                             │
│   │ const fiber = activeFibers.get(jobId);       │                             │
│   │ if (fiber) {                                 │                             │
│   │   Effect.runFork(Fiber.interrupt(fiber));◀── Interrupt fiber              │
│   │   activeFibers.delete(jobId);                │                             │
│   │ }                                            │                             │
│   └───────────────────────┬─────────────────────┘                             │
│                           │                                                    │
│                           ▼                                                    │
│   ┌─────────────────────────────────────────────┐                             │
│   │ Effect.scoped automatically cleans up:       │                             │
│   │ • Worker pool terminated                     │                             │
│   │ • All pending batches cancelled              │                             │
│   │ • Resources released                         │                             │
│   └───────────────────────┬─────────────────────┘                             │
│                           │                                                    │
│                           ▼                                                    │
│   ┌─────────────────────────────────────────────┐                             │
│   │ Exit.isInterrupted(exit) → true              │                             │
│   │ No error shown, job marked as canceled       │                             │
│   └─────────────────────────────────────────────┘                             │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### WorkerInit (Initialization Message)
```typescript
interface WorkerInit {
  type: "init";
  code: string;                          // User's rotation code
  spellIds: readonly number[];           // Spell IDs to register
  spells: Schemas.Spell.SpellDataFlat[]; // Full spell data
  auras: Schemas.Aura.AuraDataFlat[];    // Full aura data
}
```

### SimulationBatch (Batch Request)
```typescript
interface SimulationBatch {
  type: "batch";
  batchId: number;          // Sequential batch ID
  duration: number;         // Simulation duration (seconds)
  simIds: number[];         // Array of simulation IDs [1, 2, 3, ...]
}
```

### SingleSimResult (Per-Simulation Result)
```typescript
interface SingleSimResult {
  simId: number;
  casts: number;
  duration: number;
  totalDamage: number;
  dps: number;
  error?: string;
  events?: SimulationEvent[];  // Full combat log for best result
}
```

### SimulationStats (Aggregated Result)
```typescript
interface SimulationStats {
  completedSims: number;
  totalCasts: number;
  totalDamage: number;
  avgDps: number;
  errors: string[];
  workerVersion: string | null;
  bestResult: SingleSimResult | null;  // Highest DPS result with events
}
```

---

## Key File Locations

| Component | File | Lines |
|-----------|------|-------|
| Test Button | `components/rotations/editor/editor-view.tsx` | 311 |
| handleTest | `components/rotations/editor/rotation-editor.tsx` | 142-156 |
| useWorkerSimulation | `hooks/rotations/use-worker-simulation.ts` | 132-326 |
| runSimulations | `lib/workers/worker-pool.ts` | 231-253 |
| Batch Creation | `lib/workers/worker-pool.ts` | 116-135 |
| Worker Entry | `lib/workers/simulation-worker.ts` | 292-302 |
| initWorker | `lib/workers/simulation-worker.ts` | 169-187 |
| runBatch | `lib/workers/simulation-worker.ts` | 271-289 |
| runSingleSim | `lib/workers/simulation-worker.ts` | 191-269 |
| Spell Loading | `lib/simulation/loader.ts` | 36-59 |
| Job Atoms | `atoms/simulation/job.ts` | 17-127 |

All paths relative to `/home/user/source/wowlab/apps/portal/src/`
