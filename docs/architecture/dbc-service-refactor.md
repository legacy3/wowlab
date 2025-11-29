# DBC Service Refactor Plan

Refactor WowLab's DBC extractors from pure sync functions with a preloaded cache to Effect-based operations with pluggable backends.

## Current State

- Extractors in `packages/wowlab-services/src/internal/data/transformer/extractors.ts` are pure sync functions
- They take a `DbcCache` parameter with Immutable.js Maps preloaded from CSV (~800MB)
- Example: `getEffectsForDifficulty(effects, effectType, difficultyId, cache)`
- `DbcCache` interface has ~18 tables (spellEffect, spellMisc, difficulty, spellCooldowns, etc.)

## Goal

1. Extractors become Effect-based operations that describe *what* data they need
2. `DbcService` abstracts the data source
3. Two implementations:
   - `InMemoryDbcService` - for V8/CLI, reads from preloaded Immutable Maps
   - `SupabaseDbcService` - for Portal/MCP, queries Supabase per call
4. `transformSpell` composes extractors without knowing about backend
5. Many small queries is acceptable - just don't load 800MB

## DbcService Interface

File: `packages/wowlab-services/src/internal/data/dbc/DbcService.ts`

```typescript
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { Dbc } from "@wowlab/core/Schemas";
import type { DbcError } from "./errors.js";

export interface DbcService {
  // Spell tables
  readonly getSpellEffects: (spellId: number) => Effect.Effect<ReadonlyArray<Dbc.SpellEffectRow>, DbcError>;
  readonly getSpellMisc: (spellId: number) => Effect.Effect<Dbc.SpellMiscRow | undefined, DbcError>;
  readonly getSpellCooldowns: (spellId: number) => Effect.Effect<Dbc.SpellCooldownsRow | undefined, DbcError>;
  readonly getSpellCategories: (spellId: number) => Effect.Effect<Dbc.SpellCategoriesRow | undefined, DbcError>;
  readonly getSpellClassOptions: (spellId: number) => Effect.Effect<Dbc.SpellClassOptionsRow | undefined, DbcError>;
  readonly getSpellPower: (spellId: number) => Effect.Effect<ReadonlyArray<Dbc.SpellPowerRow>, DbcError>;
  readonly getSpellName: (spellId: number) => Effect.Effect<Dbc.SpellNameRow | undefined, DbcError>;

  // Lookup tables (by ID, not SpellID)
  readonly getDifficulty: (id: number) => Effect.Effect<Dbc.DifficultyRow | undefined, DbcError>;
  readonly getSpellCastTimes: (id: number) => Effect.Effect<Dbc.SpellCastTimesRow | undefined, DbcError>;
  readonly getSpellDuration: (id: number) => Effect.Effect<Dbc.SpellDurationRow | undefined, DbcError>;
  readonly getSpellRange: (id: number) => Effect.Effect<Dbc.SpellRangeRow | undefined, DbcError>;
  readonly getSpellRadius: (id: number) => Effect.Effect<Dbc.SpellRadiusRow | undefined, DbcError>;
  readonly getSpellCategory: (id: number) => Effect.Effect<Dbc.SpellCategoryRow | undefined, DbcError>;
}

export const DbcService = Context.GenericTag<DbcService>("@wowlab/services/DbcService");
```

## Error Types

File: `packages/wowlab-services/src/internal/data/dbc/errors.ts`

```typescript
import * as Data from "effect/Data";

export class RowNotFoundError extends Data.TaggedError("RowNotFoundError")<{
  readonly table: string;
  readonly key: number;
  readonly message: string;
}> {}

export class DbcQueryError extends Data.TaggedError("DbcQueryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class DecodeError extends Data.TaggedError("DecodeError")<{
  readonly table: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type DbcError = RowNotFoundError | DbcQueryError | DecodeError;
```

## Extractor Refactor

### Before (sync with cache parameter)

```typescript
export const getEffectsForDifficulty = (
  effects: Dbc.SpellEffectRow[],
  effectType: number,
  difficultyId: number,
  cache: DbcCache,
): Dbc.SpellEffectRow[] => {
  const filtered = effects.filter(
    (e) => e.Effect === effectType && e.DifficultyID === difficultyId,
  );

  if (filtered.length > 0 || difficultyId === 0) {
    return filtered;
  }

  const difficultyRow = cache.difficulty.get(difficultyId);
  const parentId = difficultyRow?.FallbackDifficultyID ?? 0;
  return getEffectsForDifficulty(effects, effectType, parentId, cache);
};
```

### After (Effect-based with service)

```typescript
export const getEffectsForDifficulty = (
  spellId: number,
  effectType: number,
  difficultyId: number,
): Effect.Effect<ReadonlyArray<Dbc.SpellEffectRow>, DbcError, DbcService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    const effects = yield* dbc.getSpellEffects(spellId);

    const filtered = effects.filter(
      (e) => e.Effect === effectType && e.DifficultyID === difficultyId,
    );

    if (filtered.length > 0 || difficultyId === 0) {
      return filtered;
    }

    const difficultyRow = yield* dbc.getDifficulty(difficultyId);
    const parentId = difficultyRow?.FallbackDifficultyID ?? 0;
    return yield* getEffectsForDifficulty(spellId, effectType, parentId);
  });
```

### transformSpell (composes extractors)

```typescript
export const transformSpell = (
  spellId: number,
  difficultyId: number = 0,
): Effect.Effect<SpellDataFlat, DbcError, DbcService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;

    // Parallel fetch of independent data
    const [effects, misc, cooldowns, power] = yield* Effect.all([
      dbc.getSpellEffects(spellId),
      dbc.getSpellMisc(spellId),
      dbc.getSpellCooldowns(spellId),
      dbc.getSpellPower(spellId),
    ], { concurrency: "unbounded" });

    // Compose extractors
    const damageEffects = yield* getEffectsForDifficulty(spellId, SpellEffect.SchoolDamage, difficultyId);
    const scaling = extractScaling(damageEffects);
    const name = yield* extractName(spellId);
    const cooldown = yield* extractCooldown(spellId);
    // ... more extractors

    return {
      id: spellId,
      name,
      scaling,
      cooldown,
      // ...
    };
  });
```

## InMemoryDbcService

File: `packages/wowlab-services/src/internal/data/dbc/InMemoryDbcService.ts`

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { Map as ImmutableMap } from "immutable";
import { DbcService } from "./DbcService.js";
import type { DbcCache } from "../DbcCache.js";

export const InMemoryDbcService = (cache: DbcCache): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    getSpellEffects: (spellId) =>
      Effect.succeed(cache.spellEffect.get(spellId) ?? []),

    getSpellMisc: (spellId) =>
      Effect.succeed(cache.spellMisc.get(spellId)),

    getDifficulty: (id) =>
      Effect.succeed(cache.difficulty.get(id)),

    getSpellCooldowns: (spellId) =>
      Effect.succeed(cache.spellCooldowns.get(spellId)),

    getSpellCategories: (spellId) =>
      Effect.succeed(cache.spellCategories.get(spellId)),

    getSpellCastTimes: (id) =>
      Effect.succeed(cache.spellCastTimes.get(id)),

    getSpellDuration: (id) =>
      Effect.succeed(cache.spellDuration.get(id)),

    getSpellRange: (id) =>
      Effect.succeed(cache.spellRange.get(id)),

    getSpellRadius: (id) =>
      Effect.succeed(cache.spellRadius.get(id)),

    getSpellCategory: (id) =>
      Effect.succeed(cache.spellCategory.get(id)),

    getSpellClassOptions: (spellId) =>
      Effect.succeed(cache.spellClassOptions.get(spellId)),

    getSpellPower: (spellId) =>
      Effect.succeed(cache.spellPower.get(spellId) ?? []),

    getSpellName: (spellId) =>
      Effect.succeed(cache.spellName.get(spellId)),
  });
```

## SupabaseDbcService

File: `packages/wowlab-services/src/internal/data/dbc/SupabaseDbcService.ts`

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DbcService } from "./DbcService.js";
import { DbcQueryError, DecodeError } from "./errors.js";

export const SupabaseDbcService = (supabase: SupabaseClient): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    getSpellEffects: (spellId) =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase
            .schema("raw_dbc")
            .from("spell_effect")
            .select("*")
            .eq("SpellID", spellId)
        );

        if (error) {
          return yield* Effect.fail(
            new DbcQueryError({ message: error.message, cause: error })
          );
        }

        return data ?? [];
      }),

    getDifficulty: (id) =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase
            .schema("raw_dbc")
            .from("difficulty")
            .select("*")
            .eq("ID", id)
            .single()
        );

        if (error) {
          if (error.code === "PGRST116") {
            return undefined; // Not found
          }
          return yield* Effect.fail(
            new DbcQueryError({ message: error.message, cause: error })
          );
        }

        return data;
      }),

    // ... similar pattern for other methods
  });
```

## Layer Composition

File: `packages/wowlab-runtime/src/AppLayer.ts`

```typescript
export interface AppLayerOptions<R> {
  readonly logger?: Layer.Layer<Log.LogService>;
  readonly metadata: Layer.Layer<Metadata.MetadataService, never, R>;
  readonly dbc: Layer.Layer<Dbc.DbcService, never, R>;  // NEW
  readonly rng?: Layer.Layer<Rng.RNGService>;
}

export const createAppLayer = <R>(options: AppLayerOptions<R>) => {
  const {
    logger = Log.ConsoleLogger,
    metadata,
    dbc,  // NEW
    rng = Rng.RNGServiceDefault,
  } = options;

  const BaseLayer = Layer.mergeAll(
    State.StateService.Default,
    logger,
    rng,
    metadata,
    dbc,  // NEW
  );

  // ... rest unchanged
};
```

### CLI/V8 Usage

```typescript
// Load CSV data as before
const cache = createCache(rawData);

// Create layers
const dbcLayer = InMemoryDbcService(cache);
const metadataLayer = InMemoryMetadata({ spells, items });

// Run
const runtime = createAppLayer({ metadata: metadataLayer, dbc: dbcLayer });
```

### Portal/MCP Usage

```typescript
// Create layers
const dbcLayer = SupabaseDbcService(supabaseClient);
const metadataLayer = createSupabaseMetadataService(supabaseClient);

// Run
const runtime = createAppLayer({ metadata: metadataLayer, dbc: dbcLayer });
```

## File Structure

```
packages/wowlab-services/src/internal/data/dbc/
├── DbcService.ts           # Service interface
├── errors.ts               # Error types
├── InMemoryDbcService.ts   # In-memory implementation
├── SupabaseDbcService.ts   # Supabase implementation
└── index.ts                # Barrel exports

packages/wowlab-services/src/internal/data/transformer/
├── extractors.ts           # Effect-based extractors (refactored)
├── spell.ts                # transformSpell (refactored)
└── item.ts                 # transformItem (refactored)
```

## Migration Path

### Phase 1: Infrastructure

1. Create `DbcService` interface and error types
2. Create `InMemoryDbcService` that wraps existing `DbcCache`
3. Add to layer composition with feature flag

### Phase 2: Extractor Conversion (one at a time)

1. Start with simplest extractor (e.g., `extractName`)
2. Convert to Effect, add bridge function for backwards compat
3. Update callers incrementally
4. Repeat for each extractor

### Phase 3: transformSpell

1. Convert `transformSpell` to use Effect extractors
2. Update all call sites (standalone, portal, etc.)
3. Remove bridge functions

### Phase 4: Supabase Implementation

1. Implement `SupabaseDbcService`
2. Add raw DBC tables to Supabase (using generate-ddl)
3. Integration test with mocked Supabase
4. Wire into Portal/MCP

### Phase 5: Cleanup

1. Remove old `DbcCache` parameter plumbing
2. Remove bridge functions
3. Update tests

## Benefits

1. **Same code, different backends** - V8 uses in-memory, Portal uses Supabase
2. **No 800MB load** - Supabase queries only what's needed
3. **Effect composition** - Natural error handling, concurrency
4. **Testable** - Mock DbcService for unit tests
5. **Incremental migration** - Convert one extractor at a time
