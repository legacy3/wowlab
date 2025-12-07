# Phase 1: Browser Runtime Setup

> Create the simulation runtime that runs in the browser. Copy and adapt from standalone.

## Key Principle

**Simulations run CLIENT-SIDE in the browser.** No server execution. The browser loads spells, runs the sim, and uploads results.

## What To Create

```
apps/portal/src/lib/simulation/
├── index.ts              # Re-exports
├── types.ts              # RotationDefinition, SimulationConfig, SimulationResult
├── runtime.ts            # Browser-adapted createBrowserRuntime
├── rotation-utils.ts     # tryCast, runPriorityList helpers
└── rotations/
    ├── index.ts          # Registry
    └── beast-mastery.ts  # BM Hunter rotation
```

## Step 1: Create Types

Copy from `apps/standalone/src/framework/types.ts`:

```typescript
// apps/portal/src/lib/simulation/types.ts

import type * as Schemas from "@wowlab/core/Schemas";
import type * as Effect from "effect/Effect";

export interface RotationDefinition {
  name: string;
  run: (playerId: Schemas.Branded.UnitID) => Effect.Effect<void, never, any>;
  spellIds: readonly number[];
}

export interface SimulationConfig {
  rotation: RotationDefinition;
  spells: Schemas.Spell.SpellDataFlat[];
  durationMs: number;
}

export interface SimulationResult {
  events: Schemas.CombatLog.CombatLogEvent[];
  casts: number;
  durationMs: number;
  totalDamage: number;
  dps: number;
}
```

## Step 2: Create Rotation Utils

Copy from `apps/standalone/src/framework/rotation-utils.ts`:

```typescript
// apps/portal/src/lib/simulation/rotation-utils.ts

import * as Effect from "effect/Effect";
import * as RotationContext from "@wowlab/rotation/Context";

export const tryCast = (spellId: number) =>
  Effect.gen(function* () {
    const ctx = yield* RotationContext.RotationContext;
    const canCast = yield* ctx.spellActions.canCast(spellId);
    if (canCast) {
      yield* ctx.spellActions.cast(spellId);
      return true;
    }
    return false;
  });

export const runPriorityList = (spellIds: readonly number[]) =>
  Effect.gen(function* () {
    for (const spellId of spellIds) {
      const didCast = yield* tryCast(spellId);
      if (didCast) return;
    }
  });
```

## Step 3: Copy Beast Mastery Rotation

Copy from `apps/standalone/src/rotations/beast-mastery.ts`:

```typescript
// apps/portal/src/lib/simulation/rotations/beast-mastery.ts

import type { RotationDefinition } from "../types";
import { runPriorityList } from "../rotation-utils";

// Spell IDs for Beast Mastery Hunter
const KILL_COMMAND = 34026;
const BARBED_SHOT = 217200;
const COBRA_SHOT = 193455;
const BESTIAL_WRATH = 19574;
const MULTI_SHOT = 2643;

export const BeastMasteryRotation: RotationDefinition = {
  name: "Beast Mastery",
  spellIds: [KILL_COMMAND, BARBED_SHOT, COBRA_SHOT, BESTIAL_WRATH, MULTI_SHOT],
  run: () =>
    runPriorityList([
      BESTIAL_WRATH,
      BARBED_SHOT,
      KILL_COMMAND,
      COBRA_SHOT,
    ]),
};
```

## Step 4: Create Rotation Registry

```typescript
// apps/portal/src/lib/simulation/rotations/index.ts

import type { RotationDefinition } from "../types";
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

export { BeastMasteryRotation };
```

## Step 5: Create Browser Runtime

Adapt from `apps/standalone/src/runtime/RotationRuntime.ts`:

```typescript
// apps/portal/src/lib/simulation/runtime.ts

import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

export interface BrowserRuntimeConfig {
  spells: Schemas.Spell.SpellDataFlat[];
  items?: Schemas.Item.ItemDataFlat[];
}

export function createBrowserRuntime(config: BrowserRuntimeConfig) {
  // Create metadata layer with loaded spells
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  // Create base app layer
  const baseAppLayer = createAppLayer({ metadata: metadataLayer });

  // Suppress logging in browser (or use console logger)
  const loggerLayer = Layer.merge(
    Logger.replace(Logger.defaultLogger, Logger.none),
    Logger.minimumLogLevel(LogLevel.None),
  );

  // Compose full layer with rotation context
  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(baseAppLayer),
    Layer.merge(baseAppLayer),
    Layer.provide(loggerLayer),
  );

  return ManagedRuntime.make(fullLayer);
}

export type BrowserRuntime = Awaited<ReturnType<typeof createBrowserRuntime>>;
```

## Step 6: Create Index

```typescript
// apps/portal/src/lib/simulation/index.ts

export * from "./types";
export * from "./runtime";
export * from "./rotation-utils";
export { getRotation, listRotations, BeastMasteryRotation } from "./rotations";
```

## Checklist

- [ ] Create `lib/simulation/types.ts` with RotationDefinition, SimulationConfig, SimulationResult
- [ ] Create `lib/simulation/rotation-utils.ts` with tryCast, runPriorityList
- [ ] Create `lib/simulation/rotations/beast-mastery.ts`
- [ ] Create `lib/simulation/rotations/index.ts` with registry
- [ ] Create `lib/simulation/runtime.ts` with createBrowserRuntime
- [ ] Create `lib/simulation/index.ts` re-exports
- [ ] Verify imports resolve correctly (`pnpm build`)

## Success Criteria

1. `import { createBrowserRuntime, BeastMasteryRotation } from "@/lib/simulation"` works
2. `pnpm build` passes with no errors
3. No Node.js-specific code in the simulation folder

## Next Phase

→ [Phase 2: Spell Loading](./02-spell-loading.md)
