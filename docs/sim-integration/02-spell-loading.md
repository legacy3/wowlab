# Phase 2: Spell Loading Integration

> Load spell data for a rotation using the existing portal dbc-layer (same pattern as data inspector).

## What Already Exists

The portal already has spell loading working in the data inspector:

```typescript
// apps/portal/src/lib/services/dbc-layer.ts
// Creates DbcService backed by React Query + 60-day IndexedDB cache
const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);

// Load a spell (already works in data inspector)
const spell = await Effect.runPromise(
  transformSpell(spellId).pipe(Effect.provide(appLayer))
);
```

## What To Create

```
apps/portal/src/lib/simulation/
└── loader.ts    # Load multiple spells for a rotation
```

## Step 1: Create Spell Loader

```typescript
// apps/portal/src/lib/simulation/loader.ts

import { createPortalDbcLayer } from "@/lib/services/dbc-layer";
import { ExtractorService, transformSpell } from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { QueryClient } from "@tanstack/react-query";
import type { DataProvider } from "@refinedev/core";
import type { RotationDefinition } from "./types";

export interface SpellLoadProgress {
  loaded: number;
  total: number;
  currentSpellId: number;
}

export type OnSpellProgress = (progress: SpellLoadProgress) => void;

/**
 * Loads all spells needed for a rotation.
 * Uses existing dbcLayer (React Query + IndexedDB cache).
 */
export async function loadSpellsForRotation(
  rotation: RotationDefinition,
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnSpellProgress,
) {
  const spellIds = rotation.spellIds;
  const total = spellIds.length;

  // Create layers (same as data inspector)
  const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);
  const appLayer = Layer.mergeAll(dbcLayer, extractorLayer);

  // Load spells with progress tracking
  const spells = await Effect.runPromise(
    Effect.forEach(
      spellIds,
      (spellId, index) =>
        Effect.gen(function* () {
          const spell = yield* transformSpell(spellId);

          // Report progress
          onProgress?.({
            loaded: index + 1,
            total,
            currentSpellId: spellId,
          });

          return spell;
        }),
      { concurrency: 5 }, // Load 5 at a time
    ).pipe(Effect.provide(appLayer)),
  );

  return spells;
}

/**
 * Loads spells by ID array (for custom spell lists).
 */
export async function loadSpellsById(
  spellIds: readonly number[],
  queryClient: QueryClient,
  dataProvider: DataProvider,
  onProgress?: OnSpellProgress,
) {
  const total = spellIds.length;

  const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
  const extractorLayer = Layer.provide(dbcLayer)(ExtractorService.Default);
  const appLayer = Layer.mergeAll(dbcLayer, extractorLayer);

  const spells = await Effect.runPromise(
    Effect.forEach(
      spellIds,
      (spellId, index) =>
        Effect.gen(function* () {
          const spell = yield* transformSpell(spellId);

          onProgress?.({
            loaded: index + 1,
            total,
            currentSpellId: spellId,
          });

          return spell;
        }),
      { concurrency: 5 },
    ).pipe(Effect.provide(appLayer)),
  );

  return spells;
}
```

## Step 2: Update Index Exports

```typescript
// apps/portal/src/lib/simulation/index.ts

export * from "./types";
export * from "./runtime";
export * from "./rotation-utils";
export * from "./loader";  // ADD THIS
export { getRotation, listRotations, BeastMasteryRotation } from "./rotations";
```

## Step 3: Test Spell Loading

Create a simple test to verify spell loading works:

```typescript
// In browser console or a test component:

import { loadSpellsForRotation, BeastMasteryRotation } from "@/lib/simulation";
import { useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";

// Inside a component:
const queryClient = useQueryClient();
const dataProvider = useDataProvider()();

const spells = await loadSpellsForRotation(
  BeastMasteryRotation,
  queryClient,
  dataProvider,
  (progress) => console.log(`Loaded ${progress.loaded}/${progress.total}`),
);

console.log("Spells loaded:", spells);
```

## Caching Behavior

The spell data is automatically cached:

1. **React Query**: In-memory cache during session
2. **IndexedDB**: 60-day persistent cache

On subsequent loads, spells come from cache (near-instant).

## Checklist

- [ ] Create `lib/simulation/loader.ts`
- [ ] Add `loadSpellsForRotation` function with progress callback
- [ ] Add `loadSpellsById` function for custom spell lists
- [ ] Update `lib/simulation/index.ts` exports
- [ ] Test: load BeastMasteryRotation spells in data inspector page
- [ ] Verify cached spells load instantly on second call

## Success Criteria

1. `loadSpellsForRotation(BeastMasteryRotation, ...)` returns spell data
2. Progress callback fires for each spell
3. Second load is instant (from cache)
4. No errors in console

## Next Phase

→ [Phase 3: Computing Integration](./03-computing-integration.md)
