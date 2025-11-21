# Phase 2: @wowlab/services - Interfaces

**Goal:** Create service interface definitions (Context.Tag) with internal/ structure.

## What to Build

### Package Structure

```
packages/
  wowlab-services/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      index.ts              # export * as State from "./State.js"
      State.ts              # export * from "./internal/state/index.js"
      Log.ts
      Rng.ts
      Metadata.ts
      Scheduler.ts
      Data.ts
      Unit.ts
      Spell.ts
      Simulation.ts
      internal/
        state/
          index.ts          # export * from "./StateService.js"
          StateService.ts   # Interface definition only
        log/
          index.ts
          LogService.ts
        rng/
          index.ts
          RNGService.ts
        metadata/
          index.ts
          MetadataService.ts
        scheduler/
          index.ts
          EventSchedulerService.ts
        data/
          index.ts
          SpellInfoService.ts
        unit/
          index.ts
          UnitService.ts
        spell/
          index.ts
          SpellService.ts
        simulation/
          index.ts
          SimulationService.ts
```

### Files to Create

**1. `packages/wowlab-services/package.json`**

```json
{
  "name": "@wowlab/services",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./package.json": "./package.json",
    ".": "./build/index.js",
    "./*": "./build/*.js",
    "./internal/*": null
  },
  "files": ["build"],
  "scripts": {
    "build": "vite build && tsc-alias -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@wowlab/core": "workspace:*",
    "effect": "^3.19.4",
    "immutable": "^5.1.4"
  },
  "devDependencies": {
    "tsc-alias": "^1.8.16",
    "vite-plugin-dts": "^4.5.4"
  }
}
```

**2. `src/index.ts` (Main entry)**

```typescript
// Namespace exports following Effect pattern
export * as State from "./State.js";
export * as Log from "./Log.js";
export * as Rng from "./Rng.js";
export * as Metadata from "./Metadata.js";
export * as Scheduler from "./Scheduler.js";
export * as Data from "./Data.js";
export * as Unit from "./Unit.js";
export * as Spell from "./Spell.js";
export * as Simulation from "./Simulation.js";
```

**3. Barrel exports**

```typescript
// src/State.ts
export * from "./internal/state/index.js";

// src/Log.ts
export * from "./internal/log/index.js";

// src/Rng.ts
export * from "./internal/rng/index.js";

// ... etc for all services
```

**4. Internal namespace exports**

```typescript
// src/internal/state/index.ts
export * from "./StateService.js";

// src/internal/log/index.ts
export * from "./LogService.js";

// ... etc
```

**5. Service Interface Pattern**

```typescript
// src/internal/state/StateService.ts
import * as Entities from "@wowlab/core/Entities";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export class StateService extends Context.Tag("StateService")<
  StateService,
  {
    readonly getState: () => Effect.Effect<Entities.GameState>;
    readonly setState: (state: Entities.GameState) => Effect.Effect<void>;
    readonly updateState: (
      fn: (state: Entities.GameState) => Entities.GameState
    ) => Effect.Effect<void>;
  }
>() {}
```

**6. Create interfaces for:**

- `StateService` - GameState management
- `LogService` - Logging abstraction
- `RNGService` - Random number generation
- `MetadataService` - Spell/Item data loading (pluggable!)
- `EventSchedulerService` - Event scheduling
- `SpellInfoService` - Spell info composition
- `UnitService` - Unit CRUD operations
- `SpellService` - Spell CRUD operations
- `SimulationService` - Simulation execution

## Reference Implementation

Copy service signatures from:
- `@packages/innocent-services/src/internal/state/StateService.ts` → `StateService`
- `@packages/innocent-services/src/internal/log/LogService.ts` → `LogService`
- etc.

**Key difference:** Only the interface (Context.Tag), no implementation yet.

## Import Pattern

**Usage:**
```typescript
import * as State from "@wowlab/services/State"
import * as Log from "@wowlab/services/Log"

// In Effect.gen
const stateService = yield* State.StateService
const logService = yield* Log.LogService
```

## How to Test

Run:
```bash
pnpm --filter @wowlab/services build
```

## Verification Criteria

- ✅ All service interfaces compile
- ✅ No implementations yet (pure interfaces)
- ✅ Types reference `@wowlab/core` correctly
- ✅ `internal/*` not exposed in exports
- ✅ No `@ts-ignore` comments

## Next Phase

Phase 3: Implement core services (State, Log, RNG)
