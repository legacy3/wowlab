# Client-Side Simulation - Implementation Prompt

> The portal already loads spell data client-side (see data inspector). Just wire the simulation to run in the browser.

## What Already Exists

```typescript
// apps/portal/src/lib/services/dbc-layer.ts
// Creates DbcService backed by React Query + 60-day IndexedDB cache
const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);

// Load a spell (already works in data inspector)
const spell = await Effect.runPromise(
  transformSpell(spellId).pipe(Effect.provide(appLayer))
);
```

## What Needs to Happen

1. **Load multiple spells** for a rotation (same pattern as data inspector)
2. **Create runtime** in browser (adapt RotationRuntime from standalone)
3. **Run simulation loop** (same logic as standalone's run command)
4. **Display results** in existing timeline/chart components

## Files to Create

```
apps/portal/src/
├── lib/simulation/
│   ├── index.ts
│   ├── runtime.ts          # Browser-adapted RotationRuntime
│   ├── loader.ts           # Load spells for rotation
│   └── runner.ts           # Run simulation, collect events
├── hooks/
│   └── use-simulation.ts   # Hook to run sim from UI
└── components/simulate/
    └── (wire to existing UI)
```

## Implementation

### 1. Spell Loader (lib/simulation/loader.ts)

```typescript
import { createPortalDbcLayer } from "@/lib/services";
import { ExtractorService, transformSpell } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { QueryClient } from "@tanstack/react-query";
import type { DataProvider } from "@refinedev/core";

export const loadSpellsForRotation = async (
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
) => {
  const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);
  const appLayer = Layer.mergeAll(dbcLayer, extractorLayer);

  const spells = await Effect.runPromise(
    Effect.forEach(spellIds, (id) => transformSpell(id), { concurrency: 10 }).pipe(
      Effect.provide(appLayer)
    )
  );

  return spells;
};
```

### 2. Browser Runtime (lib/simulation/runtime.ts)

```typescript
// Adapt from apps/standalone/src/runtime/RotationRuntime.ts
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import { createAppLayer } from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as ManagedRuntime from "effect/ManagedRuntime";

export interface SimulationRuntimeConfig {
  spells: Schemas.Spell.SpellDataFlat[];
  items?: Schemas.Item.ItemDataFlat[];
}

export const createBrowserRuntime = (config: SimulationRuntimeConfig) => {
  const metadataLayer = Metadata.InMemoryMetadata({
    items: config.items ?? [],
    spells: config.spells,
  });

  const baseAppLayer = createAppLayer({ metadata: metadataLayer });

  const loggerLayer = Layer.merge(
    Logger.replace(Logger.defaultLogger, Logger.none),
    Logger.minimumLogLevel(LogLevel.None),
  );

  const fullLayer = Context.RotationContext.Default.pipe(
    Layer.provide(baseAppLayer),
    Layer.merge(baseAppLayer),
    Layer.provide(loggerLayer),
  );

  return ManagedRuntime.make(fullLayer);
};
```

### 3. Simulation Runner (lib/simulation/runner.ts)

```typescript
// Adapt from apps/standalone/src/commands/run/index.ts
import * as Schemas from "@wowlab/core/Schemas";
import * as CombatLogService from "@wowlab/services/CombatLog";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Hunter from "@wowlab/specs/Hunter";
import * as Shared from "@wowlab/specs/Shared";
import * as Effect from "effect/Effect";

import { createBrowserRuntime } from "./runtime";
import type { RotationDefinition } from "./types";

export interface SimulationConfig {
  rotation: RotationDefinition;
  spells: Schemas.Spell.SpellDataFlat[];
  durationMs: number;
}

export interface SimulationResult {
  events: Schemas.CombatLog.CombatLogEvent[];
  casts: number;
  durationMs: number;
}

export const runSimulation = async (
  config: SimulationConfig,
): Promise<SimulationResult> => {
  const runtime = createBrowserRuntime({ spells: config.spells });

  try {
    return await runtime.runPromise(
      Effect.gen(function* () {
        // Register spec (TODO: make dynamic based on rotation)
        yield* Shared.registerSpec(Hunter.BeastMastery);

        const playerId = Schemas.Branded.UnitID("player-1");
        const player = createRotationPlayer(config.rotation, playerId, config.spells);

        const unitService = yield* Unit.UnitService;
        yield* unitService.add(player);

        const stateService = yield* State.StateService;
        const simDriver = yield* CombatLogService.SimDriver;

        const events: Schemas.CombatLog.CombatLogEvent[] = [];
        let casts = 0;

        // Subscribe to events
        const subscription = yield* simDriver.subscribe({
          filter: ["SPELL_CAST_SUCCESS", "SPELL_DAMAGE", "SPELL_AURA_APPLIED"],
          onEvent: (event) => {
            events.push(event);
            return Effect.void;
          },
        });

        // Main loop
        while (true) {
          const state = yield* stateService.getState();
          if (state.currentTime >= config.durationMs) break;

          yield* config.rotation.run(playerId);
          casts++;
          yield* simDriver.run(state.currentTime + 100);
        }

        yield* subscription.unsubscribe;

        return { events, casts, durationMs: config.durationMs };
      })
    );
  } finally {
    await runtime.dispose();
  }
};
```

### 4. React Hook (hooks/use-simulation.ts)

```typescript
"use client";

import { useState, useCallback } from "react";
import { useDataProvider } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { loadSpellsForRotation } from "@/lib/simulation/loader";
import { runSimulation, type SimulationResult } from "@/lib/simulation/runner";
import { BeastMasteryRotation } from "@/lib/simulation/rotations/beast-mastery";

export function useSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  const run = useCallback(async (durationSeconds: number) => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const rotation = BeastMasteryRotation;
      const spells = await loadSpellsForRotation(
        rotation.spellIds,
        queryClient,
        dataProvider,
      );

      const result = await runSimulation({
        rotation,
        spells,
        durationMs: durationSeconds * 1000,
      });

      setResult(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsRunning(false);
    }
  }, [queryClient, dataProvider]);

  return { run, isRunning, result, error };
}
```

### 5. Copy Rotation Definition

Copy from `apps/standalone/src/`:
- `framework/types.ts` → `lib/simulation/types.ts`
- `framework/rotation-utils.ts` → `lib/simulation/rotation-utils.ts`
- `rotations/beast-mastery.ts` → `lib/simulation/rotations/beast-mastery.ts`

---

## Checklist

- [ ] Create `lib/simulation/loader.ts` - load spells via existing dbcLayer
- [ ] Create `lib/simulation/runtime.ts` - browser-adapted runtime
- [ ] Create `lib/simulation/runner.ts` - run simulation, collect events
- [ ] Create `lib/simulation/types.ts` - copy RotationDefinition
- [ ] Create `lib/simulation/rotation-utils.ts` - copy helpers
- [ ] Create `lib/simulation/rotations/beast-mastery.ts` - copy rotation
- [ ] Create `hooks/use-simulation.ts` - React hook
- [ ] Wire to /simulate UI - call hook, pass results to timeline/charts
- [ ] Test: run simulation, see events in console
- [ ] Test: display results in existing timeline component

## Success Criteria

1. Click "Run Simulation" on /simulate page
2. Spells load from Supabase (cached in IndexedDB)
3. Simulation runs in browser (no server calls during sim)
4. Events display in timeline
5. Stats display in overview
