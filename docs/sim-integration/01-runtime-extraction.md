# Phase 1: Runtime Extraction

> Move simulation runtime to a shared package for portal use

## Goal

Extract the simulation runtime from `apps/standalone` into a new package `packages/wowlab-sim-engine` that can be imported by both the CLI and the portal's API routes.

---

## Current Location

The simulation runtime is currently embedded in `apps/standalone`:

```
apps/standalone/src/
├── runtime/
│   └── RotationRuntime.ts        # Creates ManagedRuntime with all services
├── data/
│   ├── spell-loader.ts           # Supabase spell loading (600+ lines)
│   └── supabase.ts               # Client initialization
├── rotations/
│   ├── index.ts                  # Rotation registry
│   └── beast-mastery.ts          # BM Hunter rotation
├── framework/
│   ├── types.ts                  # RotationDefinition interface
│   └── rotation-utils.ts         # tryCast, runPriorityList helpers
└── utils/
    ├── results.ts                # Stats aggregation
    └── timeline.ts               # Event formatting
```

---

## Target Structure

Create a new package: `packages/wowlab-sim-engine`

```
packages/wowlab-sim-engine/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # Main exports
│   ├── runtime/
│   │   ├── SimulationRuntime.ts  # Extracted from RotationRuntime
│   │   └── index.ts
│   ├── data/
│   │   ├── SpellLoader.ts        # Extracted spell loading
│   │   ├── SupabaseService.ts    # Supabase as Effect service
│   │   └── index.ts
│   ├── rotations/
│   │   ├── registry.ts           # Rotation registry
│   │   ├── beast-mastery.ts      # BM Hunter
│   │   └── index.ts
│   ├── framework/
│   │   ├── types.ts              # RotationDefinition
│   │   ├── rotation-utils.ts     # Helper functions
│   │   └── index.ts
│   └── execution/
│       ├── runSimulation.ts      # Single simulation runner
│       ├── runBatch.ts           # Batch execution
│       └── index.ts
```

---

## Key Exports

```typescript
// packages/wowlab-sim-engine/src/index.ts

// Runtime
export { SimulationRuntime, createSimulationRuntime } from "./runtime";
export type { SimulationRuntimeConfig } from "./runtime";

// Data loading
export { SpellLoader, loadSpells } from "./data";
export type { SpellLoadResult } from "./data";

// Rotations
export { RotationRegistry, getRotation, listRotations } from "./rotations";
export { BeastMasteryRotation } from "./rotations/beast-mastery";
export type { RotationDefinition } from "./framework/types";

// Execution
export { runSimulation, runBatch } from "./execution";
export type {
  SimulationResult,
  BatchResult,
  SimulationConfig,
} from "./execution";

// Framework utilities
export { tryCast, runPriorityList } from "./framework/rotation-utils";
```

---

## Implementation Steps

### Step 1: Create Package Scaffold

```bash
# Create directory structure
mkdir -p packages/wowlab-sim-engine/src/{runtime,data,rotations,framework,execution}

# Initialize package.json
cd packages/wowlab-sim-engine
pnpm init
```

**package.json:**

```json
{
  "name": "@wowlab/sim-engine",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch"
  },
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "@wowlab/services": "workspace:*",
    "@wowlab/rotation": "workspace:*",
    "@wowlab/runtime": "workspace:*",
    "@wowlab/specs": "workspace:*",
    "@supabase/supabase-js": "^2.x",
    "effect": "^3.x"
  },
  "devDependencies": {
    "tsup": "^8.x",
    "typescript": "^5.x"
  }
}
```

### Step 2: Extract Runtime

Move `apps/standalone/src/runtime/RotationRuntime.ts` to new package:

```typescript
// packages/wowlab-sim-engine/src/runtime/SimulationRuntime.ts

import { ManagedRuntime } from "effect";
import { createAppLayer } from "@wowlab/runtime";
import type { SpellDataFlat } from "@wowlab/core";

export interface SimulationRuntimeConfig {
  spells: SpellDataFlat[];
  logLevel?: "none" | "debug" | "info";
}

export function createSimulationRuntime(config: SimulationRuntimeConfig) {
  const metadataLayer = createMetadataLayer(config.spells);
  const loggerLayer = createLoggerLayer(config.logLevel ?? "none");

  const appLayer = createAppLayer({
    metadata: metadataLayer,
    logger: loggerLayer,
  });

  return ManagedRuntime.make(appLayer);
}

export type SimulationRuntime = ReturnType<typeof createSimulationRuntime>;
```

### Step 3: Extract Spell Loader

Convert to Effect service pattern:

```typescript
// packages/wowlab-sim-engine/src/data/SpellLoader.ts

import { Effect, Layer, Context } from "effect";
import type { SpellDataFlat } from "@wowlab/core";

// Service interface
export interface SpellLoader {
  readonly _tag: "SpellLoader";
  readonly loadSpells: (
    spellIds: number[],
  ) => Effect.Effect<SpellDataFlat[], SpellLoadError>;
}

export const SpellLoader = Context.GenericTag<SpellLoader>("SpellLoader");

// Error types
export class SpellLoadError extends Data.TaggedError("SpellLoadError")<{
  message: string;
  cause?: unknown;
}> {}

// Implementation using Supabase
export const SpellLoaderSupabase = Layer.succeed(
  SpellLoader,
  SpellLoader.of({
    _tag: "SpellLoader",
    loadSpells: (spellIds) =>
      Effect.gen(function* () {
        // ... existing spell loading logic from standalone
      }),
  }),
);

// Convenience function
export const loadSpells = (spellIds: number[]) =>
  Effect.gen(function* () {
    const loader = yield* SpellLoader;
    return yield* loader.loadSpells(spellIds);
  });
```

### Step 4: Extract Rotations

```typescript
// packages/wowlab-sim-engine/src/rotations/registry.ts

import type { RotationDefinition } from "../framework/types";
import { BeastMasteryRotation } from "./beast-mastery";

const ROTATIONS: Record<string, RotationDefinition> = {
  "beast-mastery": BeastMasteryRotation,
};

export function getRotation(name: string): RotationDefinition | undefined {
  return ROTATIONS[name];
}

export function listRotations(): string[] {
  return Object.keys(ROTATIONS);
}

export const RotationRegistry = {
  get: getRotation,
  list: listRotations,
  register: (name: string, rotation: RotationDefinition) => {
    ROTATIONS[name] = rotation;
  },
};
```

### Step 5: Extract Execution Logic

```typescript
// packages/wowlab-sim-engine/src/execution/runSimulation.ts

import { Effect } from "effect";
import type { SimulationRuntime } from "../runtime";
import type { RotationDefinition } from "../framework/types";
import * as Shared from "@wowlab/specs/Shared";
import * as Hunter from "@wowlab/specs/Hunter";

export interface SimulationConfig {
  simId: number;
  duration: number; // milliseconds
  rotation: RotationDefinition;
}

export interface SimulationResult {
  simId: number;
  duration: number;
  casts: number;
  events: SimulationEvent[]; // For timeline
}

export function runSimulation(
  runtime: SimulationRuntime,
  config: SimulationConfig,
): Effect.Effect<SimulationResult, SimulationError> {
  return runtime.runPromise(
    Effect.gen(function* () {
      // Register spec
      yield* Shared.registerSpec(Hunter.BeastMastery);

      // Create player
      const playerId = createPlayerId(config.simId);
      const player = createRotationPlayer(config.rotation, playerId);

      const unitService = yield* Unit.UnitService;
      yield* unitService.add(player);

      const stateService = yield* State.StateService;
      const simDriver = yield* CombatLogService.SimDriver;

      const events: SimulationEvent[] = [];
      let casts = 0;

      // Main loop
      while (true) {
        const state = yield* stateService.getState();
        if (state.currentTime >= config.duration) break;

        yield* config.rotation.run(playerId);
        casts++;

        yield* simDriver.run(state.currentTime + 100);
      }

      return { simId: config.simId, duration: config.duration, casts, events };
    }),
  );
}
```

---

## Migration Checklist

- [ ] Create `packages/wowlab-sim-engine` directory structure
- [ ] Add package.json with correct dependencies
- [ ] Move RotationRuntime.ts → SimulationRuntime.ts
- [ ] Move spell-loader.ts → SpellLoader.ts (as Effect service)
- [ ] Move rotations/\*.ts → rotations/
- [ ] Move framework/\*.ts → framework/
- [ ] Extract runSimulation from commands/run/index.ts
- [ ] Add runBatch for batch execution
- [ ] Update apps/standalone to import from @wowlab/sim-engine
- [ ] Verify standalone CLI still works after migration
- [ ] Run `pnpm build` to verify compilation

---

## Standalone Refactoring

After extraction, `apps/standalone/src/commands/run/index.ts` becomes:

```typescript
import {
  createSimulationRuntime,
  loadSpells,
  getRotation,
  runSimulation,
  runBatch,
} from "@wowlab/sim-engine";

// CLI just orchestrates:
// 1. Parse args
// 2. Load rotation
// 3. Load spells via loader
// 4. Create runtime
// 5. Call runSimulation or runBatch
// 6. Format and print results
```

---

## Success Criteria

1. `apps/standalone` works identically after refactoring
2. `packages/wowlab-sim-engine` builds without errors
3. All existing tests pass
4. Portal can import: `import { createSimulationRuntime, runSimulation } from "@wowlab/sim-engine"`

---

## Dependencies Diagram

```
@wowlab/sim-engine (NEW)
├── @wowlab/core
├── @wowlab/services
├── @wowlab/rotation
├── @wowlab/runtime
├── @wowlab/specs
└── @supabase/supabase-js

apps/standalone
└── @wowlab/sim-engine (NEW)

apps/portal
├── @wowlab/sim-engine (NEW)  ← Will use in API routes
├── @wowlab/core
└── @wowlab/services
```

---

## Next Steps

→ [Phase 2: API Layer](./02-api-layer.md)
