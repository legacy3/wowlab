# ManagedRuntime Implementation for apps/standalone

**Status:** Implementation Plan
**Date:** 2025-11-23
**Purpose:** Improve apps/standalone architecture using Effect's ManagedRuntime pattern

---

## Understanding ManagedRuntime

### What is ManagedRuntime?

**ManagedRuntime** converts a Layer into a pre-configured runtime that can execute Effects without needing `Effect.provide`. It:

1. **Bundles services** - All services in the layer are available to effects run through the runtime
2. **Manages lifecycle** - Properly initializes and disposes of resources
3. **Eliminates boilerplate** - No more `Effect.provide` calls scattered throughout code
4. **Enables reusability** - Create once, run multiple effects with the same configuration

### How It Works

```typescript
import { Layer, ManagedRuntime } from "effect";

// 1. Create your layer with all services
const MainLayer = Layer.mergeAll(Service1.Default, Service2.Default);

// 2. Convert layer to runtime
const AppRuntime = ManagedRuntime.make(MainLayer);

// 3. Run effects directly - no Effect.provide needed!
await AppRuntime.runPromise(myEffect);

// 4. Clean up when done
await AppRuntime.dispose();
```

### Available Methods

- `runtime.runPromise(effect)` - Execute and return Promise
- `runtime.runSync(effect)` - Execute synchronously
- `runtime.runFork(effect)` - Run as background fiber
- `runtime.runPromiseExit(effect)` - Get Exit state
- `runtime.dispose()` - Clean up all resources

---

## Current Standalone App Issues

Looking at `apps/standalone/src/framework/runner.ts:16-75`, the current architecture:

1. **Creates fresh layers every time** - Each `runRotation` call rebuilds metadataLayer, appLayer, etc.
2. **Manual layer provision** - Requires `Effect.provide` in multiple places (lines 70-74)
3. **No resource cleanup** - No explicit disposal of services
4. **Not reusable** - Can't easily run multiple rotations with same configuration

---

## Implementation Plan

### 1. Create Rotation-Specific Runtimes (New Pattern)

**File:** `apps/standalone/src/runtime/RotationRuntime.ts`

```typescript
import { ManagedRuntime } from "effect";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Context from "@wowlab/rotation/Context";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

export interface RotationRuntimeConfig {
  readonly spells: Spell[];
  readonly items?: Item[];
  readonly logLevel?: LogLevel.LogLevel;
}

export const createRotationRuntime = (config: RotationRuntimeConfig) => {
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  const appLayer = createAppLayer({ metadata: metadataLayer });

  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(appLayer),
    Layer.merge(appLayer),
    Layer.provide(Logger.pretty),
    Layer.provide(Logger.minimumLogLevel(config.logLevel ?? LogLevel.Debug)),
  );

  return ManagedRuntime.make(fullLayer);
};
```

### 2. Simplify Runner (Remove Layer Boilerplate)

**File:** `apps/standalone/src/framework/runner.ts`

```typescript
import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Simulation from "@wowlab/services/Simulation";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import type { ManagedRuntime } from "effect";

import { RotationDefinition } from "./types.js";

/**
 * Run a rotation using a pre-configured ManagedRuntime.
 * No Effect.provide needed - runtime contains all services.
 */
export const runRotationWithRuntime = (
  runtime: ManagedRuntime<...>, // TypeScript will infer this
  rotation: RotationDefinition
) => {
  const program = Effect.gen(function* () {
    const sim = yield* Simulation.SimulationService;
    const unitService = yield* Unit.UnitService;

    // Setup Player
    const playerId = Schemas.Branded.UnitID("player");
    const player = rotation.setupPlayer(playerId);
    yield* unitService.add(player);
    yield* Effect.log(`Added player: ${player.name}`);

    // Setup Enemy (Standard Target Dummy)
    const enemyId = Schemas.Branded.UnitID("enemy");
    const enemy = Entities.Unit.Unit.create({
      health: Entities.Power.Power.create({ current: 1000000, max: 1000000 }),
      id: enemyId,
      name: "Training Dummy",
    });
    yield* unitService.add(enemy);
    yield* Effect.log(`Added enemy: ${enemy.name}`);

    // Fork Rotation
    const rotationFiber = yield* Effect.fork(rotation.run(playerId));

    // Run Simulation
    yield* Effect.log(`Running rotation: ${rotation.name}`);
    const result = yield* sim.run(10000); // 10s fixed for now

    // Join Rotation
    yield* Fiber.join(rotationFiber);

    yield* Effect.log(`Simulation complete. Final time: ${result.finalTime}ms`);

    return result;
  });

  // No Effect.provide needed! Runtime has everything
  return runtime.runPromise(program);
};

// Legacy function for backwards compatibility (deprecated)
export const runRotation = (rotation: RotationDefinition) =>
  Effect.gen(function* () {
    // ... old implementation ...
  });
```

### 3. Update Commands (Cleaner Command Layer)

**File:** `apps/standalone/src/commands/run/index.ts`

```typescript
import { Args, Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { createRotationRuntime } from "../../runtime/RotationRuntime.js";
import { runRotationWithRuntime } from "../../framework/runner.js";
import { rotations } from "../../rotations/index.js";

const rotationArgument = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("fire-mage"),
);

export const runCommand = Command.make(
  "run",
  { rotation: rotationArgument },
  ({ rotation }) =>
    Effect.gen(function* () {
      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        yield* Effect.logError(
          `Rotation '${rotation}' not found. Available rotations: ${Object.keys(
            rotations,
          ).join(", ")}`,
        );
        return;
      }

      // Create runtime for this rotation's configuration
      const runtime = createRotationRuntime({
        spells: selectedRotation.spells,
      });

      try {
        // Run the rotation using the runtime
        yield* Effect.promise(() =>
          runRotationWithRuntime(runtime, selectedRotation)
        );
      } finally {
        // Ensure cleanup happens
        yield* Effect.promise(() => runtime.dispose());
      }
    }),
);
```

### 4. Advanced Patterns Enabled

#### Batch Rotations

```typescript
// Run multiple rotations with same configuration
const runtime = createRotationRuntime({ spells: allSpells });

for (const rotation of rotations) {
  await runRotationWithRuntime(runtime, rotation);
}

await runtime.dispose(); // Cleanup once at end
```

#### Comparison Mode

```typescript
// Compare same rotation with different configs
const runtime1 = createRotationRuntime({ spells: baselineSpells });
const runtime2 = createRotationRuntime({ spells: optimizedSpells });

const results = await Promise.all([
  runRotationWithRuntime(runtime1, rotation),
  runRotationWithRuntime(runtime2, rotation),
]);

await Promise.all([runtime1.dispose(), runtime2.dispose()]);
```

---

## Benefits

✅ **Cleaner Code** - Eliminate repetitive `Effect.provide` calls
✅ **Proper Cleanup** - Guaranteed resource disposal with `dispose()`
✅ **Reusability** - Run multiple simulations with same runtime
✅ **Type Safety** - Runtime enforces service availability at compile-time
✅ **Performance** - Services initialized once, not per-rotation
✅ **Testability** - Easy to create test runtimes with mock services
✅ **Separation of Concerns** - Runtime creation separate from execution logic

---

## Migration Checklist

- [ ] Create `apps/standalone/src/runtime/` directory
- [ ] Implement `RotationRuntime.ts` with `createRotationRuntime`
- [ ] Refactor `framework/runner.ts` to add `runRotationWithRuntime`
- [ ] Update `commands/run/index.ts` to use new runtime pattern
- [ ] Test with existing `fire-mage` rotation
- [ ] Remove deprecated `runRotation` function (breaking change)
- [ ] Update documentation/examples

---

## References

- [Introduction to Runtime | Effect Documentation](https://effect.website/docs/runtime/)
- [ManagedRuntime.ts - Effect API Docs](https://effect-ts.github.io/effect/effect/ManagedRuntime.ts.html)
- [Managed Runtime Tutorial](https://www.typeonce.dev/course/effect-beginners-complete-getting-started/runtime/managed-runtime)
- [Server and Client Runtimes Pattern](https://www.typeonce.dev/course/effect-react-19-project-template/project-setup/server-and-client-runtimes)
- [Next.js API Handler Example](https://effectbyexample.com/nextjs-api-handler)
