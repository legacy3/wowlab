# Phase 6: Simulation Orchestration

**Goal:** Implement simulation execution service that ties everything together.

## What to Build

### Add to Package Structure

```
packages/wowlab-services/src/internal/
  simulation/
    index.ts
    SimulationService.ts
  lifecycle/
    index.ts
    SpellLifecycleService.ts
  periodic/
    index.ts
    PeriodicTriggerService.ts
```

### Files to Create

**1. SimulationService**

```typescript
// src/internal/simulation/SimulationService.ts
import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";

import { StateService } from "../state/StateService.js";
import { EventSchedulerService } from "../scheduler/EventSchedulerService.js";
import { UnitService } from "../unit/UnitService.js";

export class SimulationService extends Effect.Service<SimulationService>()(
  "SimulationService",
  {
    dependencies: [
      StateService.Default,
      EventSchedulerService.Default,
      UnitService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateService;
      const scheduler = yield* EventSchedulerService;

      const snapshotStreamRef = yield* Ref.make<
        Array<(snapshot: unknown) => void>
      >([]);

      return {
        run: (durationMs: number) =>
          Effect.gen(function* () {
            const startTime = yield* state
              .getState()
              .pipe(Effect.map((s) => s.currentTime));
            const endTime = startTime + durationMs;

            // Main simulation loop
            while (true) {
              const nextEvent = yield* scheduler.peek();

              if (!nextEvent || nextEvent.time > endTime) {
                // No more events or past end time
                yield* state.updateState((s) => s.set("currentTime", endTime));
                break;
              }

              // Dequeue and process event
              yield* scheduler.dequeue();
              yield* state.updateState((s) =>
                s.set("currentTime", nextEvent.time),
              );

              // Process event based on type
              // TODO: Dispatch to appropriate handlers

              // Publish snapshot
              const currentState = yield* state.getState();
              const subscribers = yield* Ref.get(snapshotStreamRef);
              subscribers.forEach((fn) => fn(currentState));
            }

            const finalState = yield* state.getState();
            return {
              finalTime: finalState.currentTime,
              eventsProcessed: 0, // TODO: track
            };
          }),

        subscribeSnapshots: (callback: (snapshot: unknown) => void) =>
          Ref.update(snapshotStreamRef, (subs) => [...subs, callback]),
      };
    }),
  },
) {}
```

**2. SpellLifecycleService (simplified for now)**

```typescript
// src/internal/lifecycle/SpellLifecycleService.ts
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class SpellLifecycleService extends Effect.Service<SpellLifecycleService>()(
  "SpellLifecycleService",
  {
    dependencies: [StateService.Default],
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        startCast: (spellId: number) =>
          Effect.gen(function* () {
            // TODO: Implement spell cast start logic
            yield* Effect.void;
          }),
      };
    }),
  },
) {}
```

**3. Add barrel exports**

```typescript
// src/Simulation.ts
export * from "./internal/simulation/index.js";

// src/Lifecycle.ts
export * from "./internal/lifecycle/index.js";

// src/index.ts (update)
export * as Simulation from "./Simulation.js";
export * as Lifecycle from "./Lifecycle.js";
```

## Reference Implementation

Copy from `@packages/innocent-services/src/internal/`:

- `simulation/*` → SimulationService
- `lifecycle/*` → SpellLifecycleService
- `periodic/*` → PeriodicTriggerService

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-06-test.ts`

```typescript
import * as State from "@wowlab/services/State";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const testSimulation = Effect.gen(function* () {
  const sim = yield* Simulation.SimulationService;
  const scheduler = yield* Scheduler.EventSchedulerService;

  // Schedule a test event
  yield* scheduler.schedule({
    type: "DAMAGE",
    time: 1000,
    data: { amount: 100 },
  } as any);

  // Subscribe to snapshots
  const snapshots: unknown[] = [];
  yield* sim.subscribeSnapshots((snapshot) => {
    snapshots.push(snapshot);
  });

  // Run simulation for 5 seconds
  const result = yield* sim.run(5000);

  console.log("Simulation complete");
  console.log("Final time:", result.finalTime);
  console.log("Snapshots collected:", snapshots.length);

  return { success: true, snapshots: snapshots.length };
});

const appLayer = Layer.mergeAll(
  State.StateServiceLive,
  Scheduler.EventSchedulerService.Default,
  Unit.UnitService.Default,
  Simulation.SimulationService.Default,
);

const main = async () => {
  const result = await Effect.runPromise(
    testSimulation.pipe(Effect.provide(appLayer)),
  );
  console.log("Result:", result);
};

main();
```

Run:

```bash
cd apps/standalone
pnpm tsx src/new/phase-06-test.ts
```

## Verification Criteria

- ✅ SimulationService runs event loop
- ✅ Events are processed in time order
- ✅ Snapshot subscription works
- ✅ NO @ts-ignore needed (dependencies resolve correctly)
- ✅ All services compose via Layer.mergeAll
- ✅ Snapshot schema matches contract below and is emitted in non-decreasing `timestamp`

## Snapshot schema (standardize now)

Each snapshot must include at least:

- `timestamp: number` (ms since sim start)
- `units: Immutable.Map<UnitID, Entities.Unit>`
- `eventsProcessed: Events.Event[]` (events executed at this tick)
- `pendingEvents: number` (queue length after processing)
- `rngState?: unknown` (optional for reproducibility)

Ordering rules: snapshots emit after every processed event batch; timestamps must never go backwards; scheduler must dequeue strictly by earliest time.

## Next Phase

Phase 7: Runtime composition (NO @ts-ignore!)
