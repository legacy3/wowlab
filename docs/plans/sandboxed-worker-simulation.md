# Worker Simulation Plan

## Problem Statement

User rotations are currently executed in the browser's main thread with full access to globals. Issues:

1. **UI blocking** - Long simulations freeze the UI
2. **No parallelism** - Can't utilize multiple CPU cores
3. **Security exposure** - Full access to DOM, cookies, network

## Goals (Priority Order)

1. **Speed** - Parallel execution, runtime reuse, minimal overhead
2. **Responsiveness** - Keep UI thread free
3. **Reasonable security** - Best effort without sacrificing speed

---

## Benchmarks (apps/standalone)

### Parallelism Impact

```
1000 iterations × 60s duration:

Single-threaded:  18.67s elapsed  →  53.6 sims/s
11 workers:        5.18s elapsed  → 193.0 sims/s  (3.6x speedup)

Note: Worker init took ~3.3s of the 5.18s. Actual sim time was ~1.9s.
```

### Time Distribution (profiled)

```
100 iterations × 60s duration, single-threaded:

┌─────────────────────────────────────────┐
│           Profiling Results             │
├─────────────────────────────────────────┤
│  Total Time:                 526.4ms    │
│  State Reset:                  1.1ms    │  ( 0.2%)
│  Unit Setup:                  29.1ms    │  ( 5.5%)
│  Rotation Code:              482.5ms    │  (91.7%)  ← WHERE ALL THE TIME GOES
│  Other (Effect OH):           13.6ms    │  ( 2.6%)
├─────────────────────────────────────────┤
│  Rotation calls:                 4000   │
│  Avg per call:               120.63μs   │
└─────────────────────────────────────────┘
```

**Key insight:** 91.7% of time is in `rotation.run()`, which includes Effect service calls (tryCast → SpellActions.cast → state updates). This is the hot path to optimize.

### Current Inefficiencies

The current implementation is naive:

1. **No warm state forking** - Full GameState recreation each sim
2. **Repeated lookups** - Re-lookup units/spells every yield*
3. **Immutable.js overhead** - Every state update creates new objects
4. **Effect fiber overhead** - Each service call has runtime cost
5. **No caching** - Computed values recalculated repeatedly

### Optimization Potential

If optimized properly, the 91.7% in rotation code could drop to 30-50%, making the architecture choice less critical. **Optimize first, then evaluate.**

---

## Decided Architecture

### Option B: Workers + Compile-time Checks + Frozen APIs

| Aspect | Details |
|--------|---------|
| **Speed** | ✅ Native JS speed, multi-core parallelism |
| **Parallelism** | ✅ Worker pool with batching (same as standalone) |
| **Security** | ⚠️ ~80% - stops casual abuse, bypassable by determined code |
| **Complexity** | Medium |

**Why this option:**
- Zero runtime overhead for security
- Compile-time rejection catches 80% of issues
- Frozen APIs prevent prototype pollution
- Users only harm their own browser if they bypass

**Security layers:**
1. **Compile-time (edge function):** Reject `globalThis`, `self`, `eval`, `Function`, `import`
2. **Runtime (worker):** `Object.freeze()` all exposed APIs
3. **Watchdog:** `Worker.terminate()` after timeout

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAIN THREAD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Fetch rotation code (string, not imported)                               │
│  2. Load spells/auras for rotation.spellIds                                  │
│  3. Create/reuse worker pool                                                 │
│                                                                              │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────┐                                                 │
│  │  WorkerInit (once)      │                                                 │
│  │  - code: string         │─────────────────┐                               │
│  │  - spells: [...]        │                 │                               │
│  │  - auras: [...]         │                 │                               │
│  └─────────────────────────┘                 │                               │
│                                              │                               │
│         │                                    │                               │
│         ▼                                    ▼                               │
│  ┌─────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │  SimulationBatch (many) │    │           WORKER POOL                  │  │
│  │  - batchId: number      │───►│                                        │  │
│  │  - duration: number     │    │  Worker 1: runtime (reused)            │  │
│  │  - simIds: [...]        │    │  Worker 2: runtime (reused)            │  │
│  └─────────────────────────┘    │  Worker N: runtime (reused)            │  │
│                                 │                                        │  │
│         ▲                       │  Each worker:                          │  │
│         │                       │  - Eval rotation (frozen APIs)         │  │
│  ┌─────────────────────────┐    │  - Create runtime once                 │  │
│  │  SimulationResult       │◄───│  - Fork warm state per sim             │  │
│  │  - events: [...]        │    │  - Run simulation loop                 │  │
│  │  - dps: number          │    │                                        │  │
│  └─────────────────────────┘    └────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Roadmap

### Phase 1: Worker Infrastructure

1. **Effect BrowserWorker pool** - Port standalone pattern to portal
2. **Runtime reuse** - Init once per worker, persist across batches
3. **Pre-loaded data** - Send spells/auras at init, not per batch

**Benchmark target:** Match standalone throughput (193 sims/s with 11 workers)

### Phase 2: Hot Path Optimization

1. **Warm state forking** - Clone ready-to-go state instead of recreating
2. **Cached accessors** - Don't re-lookup units/spells every call
3. **Batch state updates** - Reduce immutable.js churn
4. **Memoized computations** - Cache spell.isReady, cooldown checks

**Benchmark target:** 2-3x improvement in per-simulation time

### Phase 3: Advanced Optimizations

1. **SharedArrayBuffer** - Share spell data across workers (requires COOP/COEP)
2. **Hot path bypass** - Skip Effect overhead for inner loop
3. **SIMD/WASM** - For damage calculations (if bottleneck)

**Benchmark target:** Evaluate if needed based on Phase 2 results

---

## Implementation Plan

### Step 1: Worker Infrastructure (apps/portal)

**New files:**
```
apps/portal/src/lib/simulation/
  worker-types.ts       # Message protocol
  worker-pool.ts        # Effect BrowserWorker pool setup
  simulation.worker.ts  # Worker implementation
  sandbox.ts            # createSandboxedRotation()
```

**Modified files:**
```
apps/portal/src/hooks/rotations/use-compiled-rotation.ts  # Return code string
apps/portal/src/hooks/use-simulation.ts                   # Use worker pool
apps/portal/next.config.ts                                # Worker bundling
```

### Step 2: Core Optimizations (packages/)

**Optimization targets:**
```
packages/wowlab-services/src/internal/state/      # Warm state forking
packages/wowlab-services/src/internal/accessors/  # Cached lookups
packages/wowlab-rotation/src/internal/actions/    # Batch updates
```

### Step 3: Benchmark & Iterate

Use `apps/standalone profile` command to measure:
```bash
cd apps/standalone
pnpm start profile --iterations 1000 --duration 60
```

---

## Message Protocol

```typescript
/** Sent once to initialize worker with rotation code and data */
interface WorkerInit {
  type: 'init';
  code: string;                           // Compiled rotation JS source
  spells: Schemas.Spell.SpellDataFlat[];  // Pre-loaded spell data
  auras: Schemas.Aura.AuraDataFlat[];     // Pre-loaded aura data
}

/** Sent for each batch of simulations */
interface SimulationBatch {
  type: 'batch';
  batchId: number;
  duration: number;      // Simulation duration in seconds
  simIds: number[];      // IDs for this batch
}

/** Returned from worker */
interface SimulationResult {
  batchId: number;
  results: SingleSimResult[];
}

interface SingleSimResult {
  simId: number;
  dps: number;
  totalDamage: number;
  casts: number;
  events?: SimulationEvent[];  // Optional, for timeline visualization
}
```

---

## Security (Best Effort, Low Overhead)

**Threat model:** prevent accidental misuse and casual abuse of rotation code while keeping near-native speed. This is **not** a hardened sandbox; a determined user can still break out. We explicitly avoid heavy sandboxing (e.g., SES/QuickJS) due to unacceptable slowdown.

### Compile-time Checks (Edge Function)

Use a real JS parser (Acorn/Meriyah) and reject by syntax, not string match.
Reject if AST contains:
- Identifier access to `globalThis`, `self`, `window`, `document`, `parent`, `top`
- Calls to `eval`, `Function`, `import`, `importScripts`, `require`
- `new Function(...)` or `Function(...)` anywhere
- `MemberExpression` that resolves to `constructor` off a function or object literal
- Access to network APIs: `fetch`, `XMLHttpRequest`, `WebSocket`, `WebTransport` (belt & suspenders)

**Notes:**
- String/regex scanning is insufficient (Unicode escapes, comments, concatenation).
- This is a fast parse step; it should not affect runtime perf.

### Runtime Protection (Worker)

1) **Hardened execution wrapper** (low overhead, avoids globals in scope):

```typescript
// Build a factory that only sees whitelisted APIs.
const buildRotation = new Function(
  "api",
  `"use strict";
   const globalThis = undefined;
   const self = undefined;
   const window = undefined;
   const document = undefined;
   const parent = undefined;
   const top = undefined;
   const Function = undefined;
   const eval = undefined;
   const importScripts = undefined;
   const fetch = undefined;
   const XMLHttpRequest = undefined;
   const WebSocket = undefined;
   const WebTransport = undefined;
   const { Effect, RotationContext, tryCast, /* ... */ } = api;
   return (function() { return ROTATION_CODE; })();`
);

const ALLOWED_APIS = Object.freeze({
  Effect: Object.freeze(Effect),
  RotationContext: Object.freeze(Context.RotationContext),
  tryCast: Object.freeze(tryCast),
  // ... etc
});

const rotation = buildRotation(ALLOWED_APIS);
```

2) **Freeze exposed APIs** to prevent prototype pollution (no runtime cost).

3) **Optional global hardening** (best effort): attempt to shadow/disable
`self.fetch`, `self.WebSocket`, etc. where configurable (not guaranteed).

### Watchdog

```typescript
const TIMEOUT_MS = 60_000;  // 60 seconds max per batch

const timeoutId = setTimeout(() => {
  worker.terminate();
  reject(new Error('Simulation timeout'));
}, TIMEOUT_MS);
```

**Pool resilience:** if a worker is terminated, replace it so the pool never shrinks permanently.

---

## Open Questions

1. **Worker count?**
   - `navigator.hardwareConcurrency` can be aggressive
   - Recommendation: `Math.max(2, Math.floor(hc / 2))` to leave room for UI

2. **Batch size?**
   - Standalone uses 100
   - Smaller = better progress reporting, slight overhead

3. **Worker lifecycle?**
   - Keep alive between simulations (faster, uses memory)
   - Terminate after idle timeout (cleaner)

4. **Next.js worker bundling?**
   - `new Worker(new URL(...), { type: 'module' })` for Turbopack
   - May need separate build for webpack

---

## Success Criteria

1. **UI stays responsive** - Main thread never blocks during simulation
2. **Parallelism works** - Linear-ish speedup with worker count
3. **Runtime reuse** - No cold start per simulation batch
4. **Matches standalone** - Same throughput as CLI (193 sims/s baseline)
5. **Optimize to 2-3x** - After hot path optimizations
