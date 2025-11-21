# Phase 3: Core Service Implementations

**Goal:** Implement State, Log, and RNG services using Effect.Service pattern with internal/ structure.

## What to Build

### Add to Package Structure

```
packages/wowlab-services/src/internal/
  state/
    index.ts              # export * from "./StateService.js"
    StateService.ts       # Interface (already done in Phase 2)
    StateServiceLive.ts   # Implementation
  log/
    index.ts
    LogService.ts
    ConsoleLogger.ts      # Default implementation
    NoOpLogger.ts         # Test implementation
  rng/
    index.ts
    RNGService.ts
    MersenneTwisterRNG.ts # Default implementation
    DeterministicRNG.ts   # Test implementation
```

### Files to Create

**1. StateServiceLive**

```typescript
// src/internal/state/StateServiceLive.ts
import * as Entities from "@wowlab/core/Entities";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

import { StateService } from "./StateService.js";

export const StateServiceLive = Layer.effect(
  StateService,
  Effect.gen(function* () {
    const ref = yield* Ref.make(Entities.GameState.createInitial());

    return StateService.of({
      getState: () => Ref.get(ref),
      setState: (state) => Ref.set(ref, state),
      updateState: (fn) => Ref.update(ref, fn),
    });
  })
);
```

**2. Update internal/state/index.ts**

```typescript
// src/internal/state/index.ts
export * from "./StateService.js";
export * from "./StateServiceLive.js";
```

**3. ConsoleLogger**

```typescript
// src/internal/log/ConsoleLogger.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { LogService } from "./LogService.js";

export const ConsoleLogger = Layer.succeed(
  LogService,
  LogService.of({
    debug: (message) => Effect.sync(() => console.debug(message)),
    info: (message) => Effect.sync(() => console.info(message)),
    warn: (message) => Effect.sync(() => console.warn(message)),
    error: (message) => Effect.sync(() => console.error(message)),
  })
);
```

**4. NoOpLogger (for tests)**

```typescript
// src/internal/log/NoOpLogger.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { LogService } from "./LogService.js";

export const NoOpLogger = Layer.succeed(
  LogService,
  LogService.of({
    debug: () => Effect.void,
    info: () => Effect.void,
    warn: () => Effect.void,
    error: () => Effect.void,
  })
);
```

**5. Update internal/log/index.ts**

```typescript
// src/internal/log/index.ts
export * from "./LogService.js";
export * from "./ConsoleLogger.js";
export * from "./NoOpLogger.js";
```

**6. MersenneTwisterRNG**

```typescript
// src/internal/rng/MersenneTwisterRNG.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";

import { RNGService } from "./RNGService.js";

// Simplified MT implementation - use real one from existing code
const nextMT = (state: number): readonly [number, number] => {
  const next = (state * 1103515245 + 12345) & 0x7fffffff;
  return [next / 0x7fffffff, next] as const;
};

export const MersenneTwisterRNG = (seed?: number) =>
  Layer.effect(
    RNGService,
    Effect.gen(function* () {
      const stateRef = yield* Ref.make(seed ?? Date.now());

      return RNGService.of({
        next: () => Ref.modify(stateRef, nextMT),
        nextInt: (min, max) =>
          Effect.gen(function* () {
            const val = yield* Ref.modify(stateRef, nextMT);
            return Math.floor(val * (max - min)) + min;
          }),
      });
    })
  );

// Default export with no seed
export const RNGServiceDefault = MersenneTwisterRNG();
```

**7. DeterministicRNG (for tests)**

```typescript
// src/internal/rng/DeterministicRNG.ts
import { MersenneTwisterRNG } from "./MersenneTwisterRNG.js";

// Just a named export for testing
export const DeterministicRNG = (seed: number) => MersenneTwisterRNG(seed);
```

**8. Update internal/rng/index.ts**

```typescript
// src/internal/rng/index.ts
export * from "./RNGService.js";
export * from "./MersenneTwisterRNG.js";
export * from "./DeterministicRNG.js";
```

## Reference Implementation

Copy and adapt from:
- `@packages/innocent-services/src/internal/state/StateService.ts`
- `@packages/innocent-services/src/internal/log/LogService.ts`
- `@packages/innocent-services/src/internal/rng/RNGService.ts`

## Wiring notes

- `StateServiceLive` must use `Entities.GameState.createInitial()` for defaults (no duplicated defaults elsewhere).
- `ConsoleLogger` stays dependency-free; `NoOpLogger` is 100% silent for deterministic tests.
- Both RNG implementations share the same contract from Phase 2 (`next`, `nextInt`, seedable constructor) to keep swapping trivial.

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-03-test.ts`

```typescript
import * as State from "@wowlab/services/State";
import * as Log from "@wowlab/services/Log";
import * as Rng from "@wowlab/services/Rng";
import * as Entities from "@wowlab/core/Entities";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

const testCoreServices = Effect.gen(function* () {
  // Test StateService
  const state = yield* State.StateService;
  const initialState = yield* state.getState();
  console.log("Initial state time:", initialState.currentTime);

  yield* state.updateState((s) => s.set("currentTime", 5000));

  const updatedState = yield* state.getState();
  console.log("Updated time:", updatedState.currentTime);

  // Test LogService
  const log = yield* Log.LogService;
  yield* log.info("Core services working!");

  // Test RNG
  const rng = yield* Rng.RNGService;
  const random = yield* rng.next();
  const randomInt = yield* rng.nextInt(1, 100);
  console.log("Random value:", random);
  console.log("Random int (1-100):", randomInt);

  return { success: true };
});

const coreLayer = Layer.mergeAll(
  State.StateServiceLive,
  Log.ConsoleLogger,
  Rng.RNGServiceDefault
);

const main = async () => {
  const result = await Effect.runPromise(
    testCoreServices.pipe(Effect.provide(coreLayer))
  );
  console.log("Result:", result);
};

main();
```

**Update `apps/standalone/package.json`:**

```json
{
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "@wowlab/services": "workspace:*"
  }
}
```

Run:
```bash
cd apps/standalone
pnpm install
pnpm tsx src/new/phase-03-test.ts
```

## Verification Criteria

- ✅ StateService manages state correctly
- ✅ LogService outputs to console
- ✅ RNG generates random numbers
- ✅ No `@ts-ignore` needed
- ✅ Services compose cleanly with `Layer.mergeAll`
- ✅ Can import from `@wowlab/services/State` etc.
- ✅ StateService `setState`/`getState` round-trips the same reference
- ✅ RNG produces deterministic sequence when seeded identically

## Next Phase

Phase 4: Metadata and SpellData services
