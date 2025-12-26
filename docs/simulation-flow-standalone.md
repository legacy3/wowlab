# Standalone Simulation Data Flow

This document traces the complete simulation data flow in `apps/standalone` from CLI invocation through to the end of the simulation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MAIN THREAD (Node.js)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐    ┌────────────────────┐    ┌───────────────────────┐       │
│  │  CLI Entry   │───▶│  run command       │───▶│ runWithWorkers()      │       │
│  │ (index.ts)   │    │  (Effect.Command)  │    │ (Effect-TS)           │       │
│  └──────────────┘    └────────────────────┘    └───────────┬───────────┘       │
│                                                             │                   │
│                              ┌──────────────────────────────┘                   │
│                              ▼                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                    WORKER THREAD POOL (Effect + Node)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │  Worker 1   │  │  Worker 2   │  │  Worker 3   │  │  Worker N   │       │ │
│  │  │(NodeThread) │  │(NodeThread) │  │(NodeThread) │  │(NodeThread) │       │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │ │
│  │         │                │                │                │              │ │
│  │         ▼                ▼                ▼                ▼              │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │              ManagedRuntime per Worker                              │  │ │
│  │  │  ┌───────────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ Effect Layers: RotationContext, State, Unit, CombatLog        │  │  │ │
│  │  │  └───────────────────────────────────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow Sequence

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: CLI ENTRY                                                             │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    $ pnpm cli run --rotation beast-mastery --iterations 10000                 │
│            │                                                                   │
│            ▼                                                                   │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ index.ts:13-32                                    │                       │
│    │ Effect CLI Entry                                  │                       │
│    │                                                   │                       │
│    │ const program = CliApp.make({                     │                       │
│    │   name: "wowlab",                                 │                       │
│    │   version: "0.0.1",                               │                       │
│    │   command: Command.run(...)           ◀────────── Uses @effect/cli       │
│    │ });                                               │                       │
│    │                                                   │                       │
│    │ Effect.runPromiseExit(program)        ◀────────── Effect as entry        │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:302-434                     │                       │
│    │ run command definition                            │                       │
│    │                                                   │                       │
│    │ Options:                                          │                       │
│    │ • rotation: string (default: "beast-mastery")     │                       │
│    │ • duration: number (seconds, default: 60)         │                       │
│    │ • iterations: number (default: 1)                 │                       │
│    │ • workers: number (-1=auto, 0=single-threaded)    │                       │
│    │ • batch-size: number (default: 100)               │                       │
│    │ • server: string? (remote server URL)             │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 2: ROTATION LOOKUP │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ rotations/index.ts                                │                       │
│    │ Pre-defined Rotation Registry                     │                       │
│    │                                                   │                       │
│    │ export const rotations: Record<string, Rotation>  │                       │
│    │ = {                                               │                       │
│    │   "beast-mastery": BeastMasteryRotation,          │                       │
│    │   // ... other rotations                          │                       │
│    │ };                                                │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ rotations/beast-mastery.ts:20-107                 │                       │
│    │ RotationDefinition                                │                       │
│    │                                                   │                       │
│    │ {                                                 │                       │
│    │   name: "Beast Mastery",                          │                       │
│    │   spellIds: [34026, 217200, ...],         ◀────── Known at compile time  │
│    │   run: (playerId, targetId) =>                    │                       │
│    │     Effect.gen(function* () {                     │                       │
│    │       // APL: Bestial Wrath > Call of Wild > ... │                       │
│    │     })                                            │                       │
│    │ }                                                 │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 3: DATA LOADING    │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ data/spell-loader.ts:103-134                      │                       │
│    │ loadSpells() + loadAuras()                        │                       │
│    │                                                   │                       │
│    │ Effect.forEach(spellIds, transformSpell, {        │                       │
│    │   concurrency: 10,                        ◀────── Limited concurrency    │
│    │   batching: true                          ◀────── DB query batching      │
│    │ })                                                │                       │
│    │                                                   │                       │
│    │ Layer Chain:                                      │                       │
│    │ ┌─────────────────────────────────────────────┐  │                       │
│    │ │ SupabaseDbcBatchFetcherLive                 │  │                       │
│    │ │   ↓                                         │  │                       │
│    │ │ DbcBatchFetcher (batch foreign key queries) │  │                       │
│    │ │   ↓                                         │  │                       │
│    │ │ DbcServiceLive (raw_dbc schema)             │  │                       │
│    │ │   ↓                                         │  │                       │
│    │ │ ExtractorService (spell transformation)     │  │                       │
│    │ └─────────────────────────────────────────────┘  │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ data/supabase.ts                                  │                       │
│    │ Supabase Client                                   │                       │
│    │                                                   │                       │
│    │ Queries raw_dbc schema tables:                    │                       │
│    │ • spell, spell_aura_options, spell_levels        │                       │
│    │ • spell_categories, spell_cooldowns              │                       │
│    │ • spell_power, spell_misc, etc.                  │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────────────┐
│ PHASE 4: EXECUTION MODE  │                                                     │
│ DECISION                 │                                                     │
├──────────────────────────┴─────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:371-434                     │                       │
│    │ Mode Selection                                    │                       │
│    │                                                   │                       │
│    │ if (server) {                                     │                       │
│    │   // Remote execution via RPC                     │                       │
│    │   return runRemoteSimulation(...);        ◀────── HTTP to daemon         │
│    │ }                                                 │                       │
│    │                                                   │                       │
│    │ if (iterations === 1) {                           │                       │
│    │   // Single demo run (verbose output)             │                       │
│    │   return runSimulation(1, config, ...);   ◀────── Direct execution       │
│    │ }                                                 │                       │
│    │                                                   │                       │
│    │ if (workerCount === 0) {                          │                       │
│    │   // Single-threaded multi-iteration              │                       │
│    │   return Effect.all(                              │                       │
│    │     iterations.map(i => runSimulation(i)),        │                       │
│    │     { concurrency: "unbounded" }          ◀────── Main thread only       │
│    │   );                                              │                       │
│    │ }                                                 │                       │
│    │                                                   │                       │
│    │ // Multi-threaded (default path)                  │                       │
│    │ return runWithWorkers(iterations, ...);   ◀────── Worker threads         │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: WORKER POOL SETUP                                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:163-200                     │                       │
│    │ runWithWorkers()                                  │                       │
│    │                                                   │                       │
│    │ // Worker count calculation                       │                       │
│    │ const workerCount = workers === -1                │                       │
│    │   ? Math.max(4, os.cpus().length - 1)     ◀────── Auto: CPUs - 1         │
│    │   : workers;                                      │                       │
│    │                                                   │                       │
│    │ // Create pool                                    │                       │
│    │ const pool = yield* Worker.makePool<              │                       │
│    │   WorkerInit | SimulationBatch,                   │                       │
│    │   SimulationResult                                │                       │
│    │ >({ size: workerCount });                         │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:391-407                     │                       │
│    │ Layer Provision                                   │                       │
│    │                                                   │                       │
│    │ const workerPath = fileURLToPath(                 │                       │
│    │   new URL("../../workers/worker-bootstrap.mjs")   │                       │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ runWithWorkers(...).pipe(                         │                       │
│    │   Effect.scoped,                          ◀────── Scope for cleanup      │
│    │   Effect.provide(                                 │                       │
│    │     Layer.merge(                                  │                       │
│    │       NodeWorker.layerManager,            ◀────── Worker thread mgmt     │
│    │       NodeWorker.layer(                           │                       │
│    │         () => new NodeWorkerThread(path)  ◀────── Factory function       │
│    │       )                                           │                       │
│    │     )                                             │                       │
│    │   )                                               │                       │
│    │ );                                                │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: WORKER THREAD BOOTSTRAP                                               │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ workers/worker-bootstrap.mjs:1-8                  │                       │
│    │ Bootstrap Entry                                   │                       │
│    │                                                   │                       │
│    │ import { register } from "tsx/esm/api";           │                       │
│    │                                                   │                       │
│    │ register();                               ◀────── Enable TypeScript      │
│    │                                                   │                       │
│    │ await import("./simulation-worker.ts");   ◀────── Dynamic import         │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ workers/simulation-worker.ts:173-177              │                       │
│    │ Worker Entry Point                                │                       │
│    │                                                   │                       │
│    │ const WorkerLive = WorkerRunner.layer(            │                       │
│    │   handleRequest                                   │                       │
│    │ ).pipe(                                           │                       │
│    │   Layer.provide(NodeWorkerRunner.layer)   ◀────── Node-specific          │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ Effect.runFork(Layer.launch(WorkerLive)); ◀────── Start message loop     │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: WORKER INITIALIZATION                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:183-191                     │                       │
│    │ Send WorkerInit to all workers                    │                       │
│    │                                                   │                       │
│    │ const initMessage: WorkerInit = {                 │                       │
│    │   type: "init",                                   │                       │
│    │   rotationName: rotation.name,            ◀────── Just the name!         │
│    │   spells: spells                          ◀────── Pre-loaded spell data  │
│    │ };                                                │                       │
│    │                                                   │                       │
│    │ yield* Effect.all(                                │                       │
│    │   workers.map(() => pool.executeEffect(init)),    │                       │
│    │   { concurrency: "unbounded" }                    │                       │
│    │ );                                                │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ workers/simulation-worker.ts:42-93                │                       │
│    │ initWorker(WorkerInit) - Inside Worker Thread     │                       │
│    │                                                   │                       │
│    │ 1. Lookup rotation by name                        │                       │
│    │    const rotation = rotations[init.rotationName]; │                       │
│    │    ◀── Uses pre-compiled rotation registry        │                       │
│    │                                                   │                       │
│    │ 2. Create layers                                  │                       │
│    │    const metadataLayer = Metadata.InMemoryMetadata│                       │
│    │      ({ items: [], spells: init.spells });        │                       │
│    │    const baseAppLayer = createAppLayer({          │                       │
│    │      metadata: metadataLayer                      │                       │
│    │    });                                            │                       │
│    │                                                   │                       │
│    │ 3. Disable logging (performance)                  │                       │
│    │    const loggerLayer = Layer.merge(               │                       │
│    │      Logger.replace(Logger.defaultLogger, none),  │                       │
│    │      Logger.minimumLogLevel(LogLevel.None)        │                       │
│    │    );                                             │                       │
│    │                                                   │                       │
│    │ 4. Compose full layer                             │                       │
│    │    const fullLayer = RotationContext.Default.pipe(│                       │
│    │      Layer.provide(baseAppLayer),                 │                       │
│    │      Layer.merge(baseAppLayer),                   │                       │
│    │      Layer.provide(loggerLayer)                   │                       │
│    │    );                                             │                       │
│    │                                                   │                       │
│    │ 5. Create runtime (cached for all batches)        │                       │
│    │    workerState = {                                │                       │
│    │      runtime: ManagedRuntime.make(fullLayer),     │                       │
│    │      rotation,                                    │                       │
│    │      spells                                       │                       │
│    │    };                                             │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: WAVE-BASED BATCH PROCESSING                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:203-251                     │                       │
│    │ Wave Processing Loop                              │                       │
│    │                                                   │                       │
│    │ const waveSize = workerCount * 10;        ◀────── Batches per wave       │
│    │ let batchId = 0;                                  │                       │
│    │                                                   │                       │
│    │ for (waveStart = 0; waveStart < iterations;       │                       │
│    │      waveStart += waveSize * batchSize) {         │                       │
│    │                                                   │                       │
│    │   // Create wave of batches                       │                       │
│    │   const waveBatches: SimulationBatch[] = [];      │                       │
│    │   for (let i = 0; i < waveSize; i++) {            │                       │
│    │     waveBatches.push({                            │                       │
│    │       batchId: batchId++,                         │                       │
│    │       duration,                                   │                       │
│    │       simIds: [startSim...startSim+batchSize],    │                       │
│    │       type: "batch"                               │                       │
│    │     });                                           │                       │
│    │   }                                               │                       │
│    │                                                   │                       │
│    │   // Execute entire wave in parallel              │                       │
│    │   const waveResults = yield* Effect.all(          │                       │
│    │     waveBatches.map(batch =>                      │                       │
│    │       pool.executeEffect(batch)                   │                       │
│    │     ),                                            │                       │
│    │     { concurrency: "unbounded" }          ◀────── All batches parallel   │
│    │   );                                              │                       │
│    │                                                   │                       │
│    │   // Aggregate wave results                       │                       │
│    │   for (const batchResults of waveResults) {       │                       │
│    │     stats.completedSims += ...;                   │                       │
│    │     stats.totalCasts += ...;                      │                       │
│    │   }                                               │                       │
│    │                                                   │                       │
│    │   // Progress logging (every 500K for large runs) │                       │
│    │   if (iterations > 100000 && completedSims % 500000 === 0) {             │
│    │     console.log(`Progress: ${pct}%`);             │                       │
│    │   }                                               │                       │
│    │ }                                                 │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 9: BATCH EXECUTION (Inside Worker Thread)                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ workers/simulation-worker.ts:95-162               │                       │
│    │ runBatch(SimulationBatch)                         │                       │
│    │                                                   │                       │
│    │ Effect.gen(function* () {                         │                       │
│    │   const results: SingleSimResult[] = [];          │                       │
│    │                                                   │                       │
│    │   for (const simId of batch.simIds) {     ◀────── Sequential in batch   │
│    │                                                   │                       │
│    │     // Reset game state for each sim              │                       │
│    │     yield* Effect.promise(() =>                   │                       │
│    │       runtime.runPromise(                 ◀────── Reuse ManagedRuntime   │
│    │         Effect.gen(function* () {                 │                       │
│    │                                                   │                       │
│    │           // Reset state                          │                       │
│    │           const stateService = yield* State;      │                       │
│    │           yield* stateService.setState(           │                       │
│    │             GameState.createGameState()           │                       │
│    │           );                                      │                       │
│    │                                                   │                       │
│    │           // Create units                         │                       │
│    │           const player = createPlayerWithSpells(  │                       │
│    │             playerId, rotation.name,              │                       │
│    │             rotation.spellIds, spells             │                       │
│    │           );                                      │                       │
│    │           const target = createTargetDummy(...);  │                       │
│    │                                                   │                       │
│    │           yield* unitService.add(player);         │                       │
│    │           yield* unitService.add(target);         │                       │
│    │                                                   │                       │
│    │           // SIMULATION LOOP                      │                       │
│    │           while (currentTime < duration) {◀────── Main loop             │
│    │             yield* rotation.run(playerId, target);│                       │
│    │             yield* simDriver.run(time + 0.1); ◀── 0.1s tick             │
│    │             casts++;                              │                       │
│    │           }                                       │                       │
│    │                                                   │                       │
│    │           return { simId, casts, duration };      │                       │
│    │         })                                        │                       │
│    │       )                                           │                       │
│    │     );                                            │                       │
│    │                                                   │                       │
│    │     results.push(result);                         │                       │
│    │   }                                               │                       │
│    │                                                   │                       │
│    │   return { batchId, results };                    │                       │
│    │ });                                               │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
└──────────────────────────┼─────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 10: RESULT AGGREGATION                                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:233-245                     │                       │
│    │ Wave Result Aggregation                           │                       │
│    │                                                   │                       │
│    │ for (const batchResults of waveResults) {         │                       │
│    │   for (const result of batchResults.results) {    │                       │
│    │     stats.completedSims++;                        │                       │
│    │     stats.totalCasts += result.casts;             │                       │
│    │                                                   │                       │
│    │     // Sample first 10 results                    │                       │
│    │     if (sampleResults.length < 10) {              │                       │
│    │       sampleResults.push(result);         ◀────── Memory optimization    │                       │
│    │     }                                             │                       │
│    │   }                                               │                       │
│    │ }                                                 │                       │
│    └─────────────────────┬────────────────────────────┘                       │
│                          │                                                     │
│                          ▼                                                     │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ utils/results.ts:54-123                           │                       │
│    │ Final Statistics                                  │                       │
│    │                                                   │                       │
│    │ const avgCasts = totalCasts / completedSims;      │                       │
│    │ const throughput = (completedSims / elapsedMs)    │                       │
│    │                    * 1000;                ◀────── sims/sec               │
│    │                                                   │                       │
│    │ ┌─────────────────────────────────────────────┐  │                       │
│    │ │ ╔═══════════════════════════════════════╗   │  │                       │
│    │ │ ║ SIMULATION RESULTS                    ║   │  │                       │
│    │ │ ╠═══════════════════════════════════════╣   │  │                       │
│    │ │ ║ Completed: 10,000 simulations         ║   │  │                       │
│    │ │ ║ Avg Casts: 142.5 per sim              ║   │  │                       │
│    │ │ ║ Throughput: 5,234 sims/sec            ║   │  │                       │
│    │ │ ║ Elapsed: 1.91s                        ║   │  │                       │
│    │ │ ╚═══════════════════════════════════════╝   │  │                       │
│    │ └─────────────────────────────────────────────┘  │                       │
│    └──────────────────────────────────────────────────┘                       │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Alternative: Remote Execution (Daemon Mode)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           REMOTE EXECUTION PATH                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  CLIENT                                SERVER (Daemon)                         │
│  ┌─────────────────────┐              ┌─────────────────────┐                 │
│  │ $ pnpm cli run      │              │ $ pnpm cli daemon   │                 │
│  │   --server host:3847│              │   --port 3847       │                 │
│  └──────────┬──────────┘              └──────────┬──────────┘                 │
│             │                                    │                            │
│             ▼                                    ▼                            │
│  ┌─────────────────────┐              ┌─────────────────────┐                 │
│  │ runRemoteSimulation │──── HTTP ───▶│ commands/daemon/    │                 │
│  │ run/index.ts:257-300│   POST /rpc  │ index.ts:24-59      │                 │
│  │                     │              │                     │                 │
│  │ RPC Client:         │              │ RPC Server:         │                 │
│  │ • NDJSON encoding   │              │ • NDJSON decoding   │                 │
│  │ • Effect Schema     │              │ • Health check      │                 │
│  └──────────┬──────────┘              └──────────┬──────────┘                 │
│             │                                    │                            │
│             │                                    ▼                            │
│             │                         ┌─────────────────────┐                 │
│             │                         │ rpc/handlers.ts     │                 │
│             │                         │ :146-231            │                 │
│             │                         │                     │                 │
│             │                         │ SimulationHandlers: │                 │
│             │                         │ • RunSimulation()   │                 │
│             │                         │ • ListRotations()   │                 │
│             │                         │ • HealthCheck()     │                 │
│             │                         └──────────┬──────────┘                 │
│             │                                    │                            │
│             │                                    ▼                            │
│             │                         ┌─────────────────────┐                 │
│             │                         │ Same runWithWorkers │                 │
│             │                         │ as local execution  │                 │
│             │                         └──────────┬──────────┘                 │
│             │                                    │                            │
│             ◀──────── Response ──────────────────┘                            │
│             │                                                                 │
│             ▼                                                                 │
│  ┌─────────────────────┐                                                      │
│  │ Display results     │                                                      │
│  └─────────────────────┘                                                      │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Effect Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| `Effect.gen()` | All Effect code | Monadic composition with generators |
| `Effect.runPromiseExit()` | index.ts:27 | CLI entry point |
| `Effect.all()` | run/index.ts:120, 230 | Parallel batch execution |
| `Effect.forEach()` | spell-loader.ts:103 | Parallel spell loading with batching |
| `Effect.scoped` | run/index.ts:395 | Resource cleanup for worker pool |
| `Effect.acquireUseRelease` | run/index.ts:91 | Runtime lifecycle management |
| `Layer.provide()` | simulation-worker.ts:173 | Dependency injection |
| `Layer.merge()` | run/index.ts:398 | Combine worker layers |
| `ManagedRuntime.make()` | simulation-worker.ts:80 | Create runtime from layer |
| `Effect.promise()` | simulation-worker.ts:110 | Wrap Promise in Effect |
| `Worker.makePool()` | run/index.ts:176 | Create worker thread pool |
| `NodeWorkerRunner.layer` | simulation-worker.ts:174 | Node.js worker message handling |

---

## Concurrency Model

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          CONCURRENCY ARCHITECTURE                             │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  MAIN THREAD (Node.js)                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  Spell Loading:    concurrency: 10, batching: true                      │ │
│  │  Worker Init:      concurrency: "unbounded" (all workers at once)       │ │
│  │  Wave Execution:   concurrency: "unbounded" (all batches in wave)       │ │
│  │  Progress Logging: every 500K iterations (for large runs)               │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  WORKER THREADS (N = CPUs - 1, min 4)                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                  │
│  │   Worker 1     │  │   Worker 2     │  │   Worker N     │                  │
│  │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │                  │
│  │ │ Wave 1:    │ │  │ │ Wave 1:    │ │  │ │ Wave 1:    │ │                  │
│  │ │ Batches    │ │  │ │ Batches    │ │  │ │ Batches    │ │                  │
│  │ │ 1,4,7...   │ │  │ │ 2,5,8...   │ │  │ │ 3,6,9...   │ │                  │
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
│                    Wait for wave completion                                  │
│                    Then start next wave                                      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

Wave-based execution example: 100,000 iterations, 8 workers, batch size 100:
  • Wave size = 8 * 10 = 80 batches per wave
  • Each wave = 80 * 100 = 8,000 iterations
  • Total waves = 100,000 / 8,000 = 13 waves
  • All batches in wave run in parallel (concurrency: "unbounded")
  • Wait for wave to complete before starting next wave (backpressure)
```

---

## Data Structures

### WorkerInit (Initialization Message)
```typescript
interface WorkerInit {
  type: "init";
  rotationName: string;                    // Just the name (not code!)
  spells: Schemas.Spell.SpellDataFlat[];   // Pre-loaded spell data
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
  error?: string;
  // Note: No events or damage in standalone (minimal data)
}
```

### AggregatedStats (Final Result)
```typescript
interface AggregatedStats {
  completedSims: number;
  totalCasts: number;
  avgCasts: number;        // totalCasts / completedSims
  throughput: number;      // sims/sec
  elapsedMs: number;
}
```

---

## Single-Threaded Path (workers=0)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        SINGLE-THREADED EXECUTION                               │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:414-429                     │                       │
│    │ workers === 0 path                                │                       │
│    │                                                   │                       │
│    │ const effects = Array.from(                       │                       │
│    │   { length: iterations },                         │                       │
│    │   (_, i) => runSimulation(i + 1, config, ...)     │                       │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ yield* Effect.all(                                │                       │
│    │   effects,                                        │                       │
│    │   { concurrency: "unbounded" }            ◀────── All in main thread     │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ // Each runSimulation():                          │                       │
│    │ //  1. Creates fresh ManagedRuntime               │                       │
│    │ //  2. Runs simulation loop                       │                       │
│    │ //  3. Disposes runtime                           │                       │
│    │ // Uses acquireUseRelease pattern                 │                       │
│    └──────────────────────────────────────────────────┘                       │
│                                                                                │
│    Note: "unbounded" in main thread is limited by                             │
│          Node.js event loop, not truly parallel                               │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Demo Run Path (iterations=1)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           DEMO EXECUTION (verbose)                             │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│    ┌──────────────────────────────────────────────────┐                       │
│    │ commands/run/index.ts:377-385                     │                       │
│    │ iterations === 1 path                             │                       │
│    │                                                   │                       │
│    │ yield* runSimulation(                             │                       │
│    │   1,                              ◀────── Single sim ID                  │
│    │   config,                                         │                       │
│    │   rotation,                                       │                       │
│    │   duration,                                       │                       │
│    │   false                           ◀────── silent=false (verbose)         │                       │
│    │ );                                                │                       │
│    │                                                   │                       │
│    │ // Verbose output includes:                       │                       │
│    │ // • Each spell cast                              │                       │
│    │ // • Timeline events                              │                       │
│    │ // • State changes                                │                       │
│    └──────────────────────────────────────────────────┘                       │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key File Locations

| Component | File | Lines |
|-----------|------|-------|
| CLI Entry | `src/index.ts` | 13-32 |
| Run Command | `src/commands/run/index.ts` | 302-434 |
| runWithWorkers | `src/commands/run/index.ts` | 163-255 |
| runSimulation | `src/commands/run/index.ts` | 91-161 |
| Worker Bootstrap | `src/workers/worker-bootstrap.mjs` | 1-8 |
| Worker Entry | `src/workers/simulation-worker.ts` | 173-177 |
| initWorker | `src/workers/simulation-worker.ts` | 42-93 |
| runBatch | `src/workers/simulation-worker.ts` | 95-162 |
| Spell Loading | `src/data/spell-loader.ts` | 91-135 |
| Runtime Setup | `src/runtime/RotationRuntime.ts` | 35-60 |
| Daemon | `src/commands/daemon/index.ts` | 24-59 |
| RPC Handlers | `src/rpc/handlers.ts` | 146-231 |
| Beast Mastery | `src/rotations/beast-mastery.ts` | 20-107 |
| Result Display | `src/utils/results.ts` | 54-123 |

All paths relative to `/home/user/source/wowlab/apps/standalone/`

---

## Comparison: Portal vs Standalone

| Aspect | Portal (Browser) | Standalone (Node.js) |
|--------|------------------|----------------------|
| **Worker Type** | Web Workers | worker_threads |
| **Effect Layer** | `BrowserWorkerRunner` | `NodeWorkerRunner` |
| **Rotation Source** | Dynamic code string | Pre-compiled registry |
| **WorkerInit** | Contains `code: string` | Contains `rotationName: string` |
| **Data Source** | Passed in via React Query | Loaded from Supabase |
| **Batching** | Simple sequential | Wave-based (backpressure) |
| **Worker Count** | CPU / 2 (min 2) | CPU - 1 (min 4) |
| **Results** | Full with events + DPS | Minimal (casts only) |
| **Progress** | Callback + Jotai atoms | Console logging |
| **Cancellation** | Fiber.interrupt() | N/A (CLI runs to completion) |
| **Bootstrap** | Direct import | tsx register + dynamic import |
