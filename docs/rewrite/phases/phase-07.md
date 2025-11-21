# Phase 7: @wowlab/runtime - Clean Composition

**Goal:** Create composition root package that wires all services WITHOUT @ts-ignore.

## What to Build

### Package Structure

```
packages/
  wowlab-runtime/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      index.ts
      AppLayer.ts    # Clean composition - ZERO @ts-ignore
```

### Files to Create

**1. `packages/wowlab-runtime/package.json`**

```json
{
  "name": "@wowlab/runtime",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./package.json": "./package.json",
    ".": "./build/index.js"
  },
  "files": ["build"],
  "scripts": {
    "build": "vite build && tsc-alias -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "@wowlab/services": "workspace:*",
    "effect": "^3.19.4"
  },
  "devDependencies": {
    "tsc-alias": "^1.8.16",
    "vite-plugin-dts": "^4.5.4"
  }
}
```

**2. AppLayer.ts - THE CRITICAL FILE**

```typescript
// src/AppLayer.ts
import * as State from "@wowlab/services/State";
import * as Log from "@wowlab/services/Log";
import * as Rng from "@wowlab/services/Rng";
import * as Metadata from "@wowlab/services/Metadata";
import * as Scheduler from "@wowlab/services/Scheduler";
import * as Accessors from "@wowlab/services/Accessors";
import * as Unit from "@wowlab/services/Unit";
import * as Spell from "@wowlab/services/Spell";
import * as Simulation from "@wowlab/services/Simulation";
import * as Layer from "effect/Layer";

/**
 * Creates the application layer with pluggable services.
 *
 * CRITICAL: Uses Effect.Service dependencies correctly.
 * NO @ts-ignore needed - Effect handles dependency resolution automatically.
 */
export interface AppLayerOptions<R> {
  // Required: consumer must provide metadata
  readonly metadata: Layer.Layer<Metadata.MetadataService, never, R>;

  // Optional: defaults provided
  readonly logger?: Layer.Layer<Log.LogService>;
  readonly rng?: Layer.Layer<Rng.RNGService>;
}

export const createAppLayer = <R>(options: AppLayerOptions<R>) => {
  const {
    metadata,
    logger = Log.ConsoleLogger,
    rng = Rng.RNGServiceDefault,
  } = options;

  // THE KEY: Just merge all .Default layers
  // Effect automatically:
  // 1. Deduplicates services (StateService only instantiated once)
  // 2. Resolves dependencies (services find their deps in the graph)
  // 3. Topologically sorts the graph

  return Layer.mergeAll(
    // Core services
    State.StateServiceLive,
    logger,
    rng,

    // Independent services
    Scheduler.EventSchedulerService.Default,

    // Accessors (depend on StateService)
    Accessors.UnitAccessor.Default,
    Accessors.SpellAccessor.Default,

    // Business services (depend on State + Accessors)
    Unit.UnitService.Default,
    Spell.SpellService.Default,

    // Orchestration (depends on everything above)
    Simulation.SimulationService.Default,

    // Pluggable metadata
    metadata
  );

  // NO manual Layer.provide() chains
  // NO @ts-ignore comments
  // NO DefaultWithoutDependencies hacks
  //
  // Just clean, composable layers.
};
```

**3. src/index.ts**

```typescript
export * from "./AppLayer.js";
```

## The Key Insight

**Why this works without @ts-ignore:**

Each service uses `Effect.Service` with `dependencies` array:
```typescript
export class UnitService extends Effect.Service<UnitService>()(
  "UnitService",
  {
    dependencies: [StateService.Default, UnitAccessor.Default],
    effect: Effect.gen(function* () { /* ... */ }),
  }
) {}
```

This generates `UnitService.Default` which is a `Layer.Layer<UnitService>` that includes its dependencies.

When you `Layer.mergeAll()`, Effect:
1. **Deduplicates** - StateService.Default appears in multiple dependency chains, but only one instance is created
2. **Resolves** - Each service finds its required dependencies in the merged graph
3. **Type-safe** - TypeScript can infer the full dependency graph

**The old AppLayer.ts was wrong because:**
- It manually accessed `.DefaultWithoutDependencies` (internal API)
- It manually called `Layer.provide()` for each service
- TypeScript couldn't infer the manual chains, requiring `@ts-ignore`

## How to Test in Standalone

**Create:** `apps/standalone/src/new/phase-07-test.ts`

```typescript
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Simulation from "@wowlab/services/Simulation";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

const mockSpells: Schemas.Spell.SpellDataFlat[] = [
  {
    id: 108853,
    name: "Fire Blast",
    // ... fields
  } as any,
];

const testRuntime = Effect.gen(function* () {
  // Access any service from the composed layer
  const sim = yield* Simulation.SimulationService;
  const metadata = yield* Metadata.MetadataService;

  // Load spell via metadata
  const spell = yield* metadata.loadSpell(108853);
  console.log("Loaded:", spell.name);

  // Run simulation
  const result = yield* sim.run(1000);
  console.log("Simulation ran to:", result.finalTime);

  return { success: true };
});

const metadataLayer = Metadata.InMemoryMetadata({
  spells: mockSpells,
  items: [],
});

const appLayer = createAppLayer({ metadata: metadataLayer });

const main = async () => {
  const result = await Effect.runPromise(
    testRuntime.pipe(Effect.provide(appLayer))
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
    "@wowlab/services": "workspace:*",
    "@wowlab/runtime": "workspace:*"
  }
}
```

Run:
```bash
cd apps/standalone
pnpm install
pnpm dev src/new/phase-07-test.ts
```

## Verification Criteria

- ✅ **ZERO `@ts-ignore` in AppLayer.ts**
- ✅ All services accessible via the composed layer
- ✅ Services share state correctly (StateService singleton)
- ✅ Metadata is pluggable
- ✅ TypeScript compiles without errors
- ✅ Clean, readable code

## Next Phase

Phase 8: Rotation API
