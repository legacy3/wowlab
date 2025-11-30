# DBC Service Refactor Plan

Replace sync extractors with Effect-based `DbcService` abstraction. Two backends: in-memory for CLI, Supabase for Portal.

## Goal

1. `DbcService` abstracts data source
2. `InMemoryDbcService` - CLI/V8, reads from Immutable Maps
3. `SupabaseDbcService` - Portal/MCP, queries Supabase
4. Delete old `DbcCache` parameter plumbing entirely

## DbcService Interface

File: `packages/wowlab-services/src/internal/data/dbc/DbcService.ts`

```typescript
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { Dbc } from "@wowlab/core/Schemas";
import type { DbcError } from "./errors.js";

export interface DbcServiceInterface {
  // Spell tables (keyed by SpellID)
  readonly getSpellEffects: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.SpellEffectRow>, DbcError>;
  readonly getSpellMisc: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellMiscRow | undefined, DbcError>;
  readonly getSpellCooldowns: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellCooldownsRow | undefined, DbcError>;
  readonly getSpellCategories: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellCategoriesRow | undefined, DbcError>;
  readonly getSpellClassOptions: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellClassOptionsRow | undefined, DbcError>;
  readonly getSpellPower: (
    spellId: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.SpellPowerRow>, DbcError>;
  readonly getSpellName: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellNameRow | undefined, DbcError>;

  // Lookup tables (keyed by ID)
  readonly getDifficulty: (
    id: number,
  ) => Effect.Effect<Dbc.DifficultyRow | undefined, DbcError>;
  readonly getSpellCastTimes: (
    id: number,
  ) => Effect.Effect<Dbc.SpellCastTimesRow | undefined, DbcError>;
  readonly getSpellDuration: (
    id: number,
  ) => Effect.Effect<Dbc.SpellDurationRow | undefined, DbcError>;
  readonly getSpellRange: (
    id: number,
  ) => Effect.Effect<Dbc.SpellRangeRow | undefined, DbcError>;
  readonly getSpellRadius: (
    id: number,
  ) => Effect.Effect<Dbc.SpellRadiusRow | undefined, DbcError>;
  readonly getSpellCategory: (
    id: number,
  ) => Effect.Effect<Dbc.SpellCategoryRow | undefined, DbcError>;

  // Batch (avoids N+1 on Supabase)
  readonly getDifficultyChain: (
    id: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.DifficultyRow>, DbcError>;
}

export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}
```

## Error Types

File: `packages/wowlab-services/src/internal/data/dbc/errors.ts`

```typescript
import * as Data from "effect/Data";

export class DbcQueryError extends Data.TaggedError("DbcQueryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type DbcError = DbcQueryError;
```

## Extractors

All extractors take `spellId` and return `Effect<T, DbcError, DbcService>`. No cache parameter.

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

    // Batch-fetch difficulty chain (single query on Supabase)
    const difficultyChain = yield* dbc.getDifficultyChain(difficultyId);

    for (const difficulty of difficultyChain) {
      const fallbackFiltered = effects.filter(
        (e) => e.Effect === effectType && e.DifficultyID === difficulty.ID,
      );
      if (fallbackFiltered.length > 0) {
        return fallbackFiltered;
      }
    }

    return effects.filter(
      (e) => e.Effect === effectType && e.DifficultyID === 0,
    );
  });
```

## transformSpell

```typescript
export const transformSpell = (
  spellId: number,
  difficultyId: number = 0,
): Effect.Effect<SpellDataFlat, DbcError, DbcService> =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;

    const [effects, misc, cooldowns, power] = yield* Effect.all(
      [
        dbc.getSpellEffects(spellId),
        dbc.getSpellMisc(spellId),
        dbc.getSpellCooldowns(spellId),
        dbc.getSpellPower(spellId),
      ],
      { concurrency: "unbounded" },
    );

    const damageEffects = yield* getEffectsForDifficulty(
      spellId,
      SpellEffect.SchoolDamage,
      difficultyId,
    );
    const scaling = extractScaling(damageEffects);
    const name = yield* extractName(spellId);
    const cooldown = yield* extractCooldown(spellId);

    return { id: spellId, name, scaling, cooldown /* ... */ };
  });
```

## InMemoryDbcService

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { DbcService } from "./DbcService.js";
import type { DbcCache } from "../DbcCache.js";

export const InMemoryDbcService = (cache: DbcCache): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    getSpellEffects: (spellId) =>
      Effect.succeed(cache.spellEffect.get(spellId) ?? []),

    getSpellMisc: (spellId) => Effect.succeed(cache.spellMisc.get(spellId)),

    getDifficulty: (id) => Effect.succeed(cache.difficulty.get(id)),

    getSpellCooldowns: (spellId) =>
      Effect.succeed(cache.spellCooldowns.get(spellId)),

    getSpellCategories: (spellId) =>
      Effect.succeed(cache.spellCategories.get(spellId)),

    getSpellCastTimes: (id) => Effect.succeed(cache.spellCastTimes.get(id)),

    getSpellDuration: (id) => Effect.succeed(cache.spellDuration.get(id)),

    getSpellRange: (id) => Effect.succeed(cache.spellRange.get(id)),

    getSpellRadius: (id) => Effect.succeed(cache.spellRadius.get(id)),

    getSpellCategory: (id) => Effect.succeed(cache.spellCategory.get(id)),

    getSpellClassOptions: (spellId) =>
      Effect.succeed(cache.spellClassOptions.get(spellId)),

    getSpellPower: (spellId) =>
      Effect.succeed(cache.spellPower.get(spellId) ?? []),

    getSpellName: (spellId) => Effect.succeed(cache.spellName.get(spellId)),

    getDifficultyChain: (id) =>
      Effect.sync(() => {
        const chain: Dbc.DifficultyRow[] = [];
        let currentId = id;
        while (currentId !== 0) {
          const row = cache.difficulty.get(currentId);
          if (!row) break;
          chain.push(row);
          currentId = row.FallbackDifficultyID ?? 0;
        }
        return chain;
      }),
  });
```

## SupabaseDbcService

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Cache from "effect/Cache";
import * as Duration from "effect/Duration";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DbcService, type DbcServiceInterface } from "./DbcService.js";
import { DbcQueryError } from "./errors.js";

export const SupabaseDbcService = (supabase: SupabaseClient): Layer.Layer<DbcService> =>
  Layer.effect(
    DbcService,
    Effect.gen(function* () {
      const spellEffectsCache = yield* Cache.make({
        capacity: 100,
        timeToLive: Duration.minutes(5),
        lookup: (spellId: number) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase.schema("raw_dbc").from("spell_effect").select("*").eq("SpellID", spellId)
            );
            if (error) return yield* Effect.fail(new DbcQueryError({ message: error.message, cause: error }));
            return data ?? [];
          }),
      });

      const difficultyCache = yield* Cache.make({
        capacity: 50,
        timeToLive: Duration.minutes(5),
        lookup: (id: number) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase.schema("raw_dbc").from("difficulty").select("*").eq("ID", id).maybeSingle()
            );
            if (error) return yield* Effect.fail(new DbcQueryError({ message: error.message, cause: error }));
            return data ?? undefined;
          }),
      });

      const service: DbcServiceInterface = {
        getSpellEffects: (spellId) => spellEffectsCache.get(spellId),
        getDifficulty: (id) => difficultyCache.get(id),

        getDifficultyChain: (id) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase.rpc("get_difficulty_chain", { start_id: id })
            );
            if (error) return yield* Effect.fail(new DbcQueryError({ message: error.message, cause: error }));
            return data ?? [];
          }),

        getSpellMisc: (spellId) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase.schema("raw_dbc").from("spell_misc").select("*").eq("SpellID", spellId).maybeSingle()
            );
            if (error) return yield* Effect.fail(new DbcQueryError({ message: error.message, cause: error }));
            return data ?? undefined;
          }),

        // Same pattern for remaining methods...
        getSpellCooldowns: (spellId) => /* ... */,
        getSpellCategories: (spellId) => /* ... */,
        getSpellClassOptions: (spellId) => /* ... */,
        getSpellPower: (spellId) => /* ... */,
        getSpellName: (spellId) => /* ... */,
        getSpellCastTimes: (id) => /* ... */,
        getSpellDuration: (id) => /* ... */,
        getSpellRange: (id) => /* ... */,
        getSpellRadius: (id) => /* ... */,
        getSpellCategory: (id) => /* ... */,
      };

      return service;
    })
  );
```

## Required SQL

```sql
CREATE OR REPLACE FUNCTION raw_dbc.get_difficulty_chain(start_id INTEGER)
RETURNS SETOF raw_dbc.difficulty
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE chain AS (
    SELECT d.* FROM raw_dbc.difficulty d WHERE d."ID" = start_id
    UNION ALL
    SELECT d.* FROM raw_dbc.difficulty d
    INNER JOIN chain c ON d."ID" = c."FallbackDifficultyID"
    WHERE c."FallbackDifficultyID" IS NOT NULL AND c."FallbackDifficultyID" != 0
  )
  SELECT * FROM chain;
$$;

-- Indexes
CREATE INDEX idx_spell_effect_spell_id ON raw_dbc.spell_effect ("SpellID");
CREATE INDEX idx_spell_effect_spell_difficulty ON raw_dbc.spell_effect ("SpellID", "DifficultyID");
CREATE INDEX idx_spell_misc_spell_id ON raw_dbc.spell_misc ("SpellID");
CREATE INDEX idx_spell_cooldowns_spell_id ON raw_dbc.spell_cooldowns ("SpellID");
CREATE INDEX idx_spell_power_spell_id ON raw_dbc.spell_power ("SpellID");
CREATE INDEX idx_difficulty_fallback ON raw_dbc.difficulty ("FallbackDifficultyID");
```

## Layer Composition

```typescript
export interface AppLayerOptions<R> {
  readonly logger?: Layer.Layer<Log.LogService>;
  readonly metadata: Layer.Layer<Metadata.MetadataService, never, R>;
  readonly dbc: Layer.Layer<Dbc.DbcService, never, R>;
  readonly rng?: Layer.Layer<Rng.RNGService>;
}

export const createAppLayer = <R>(options: AppLayerOptions<R>) => {
  const {
    logger = Log.ConsoleLogger,
    metadata,
    dbc,
    rng = Rng.RNGServiceDefault,
  } = options;

  const BaseLayer = Layer.mergeAll(
    State.StateService.Default,
    logger,
    rng,
    metadata,
    dbc,
  );
  // ...
};
```

### CLI Usage

```typescript
const cache = createCache(rawData);
const dbcLayer = InMemoryDbcService(cache);
const runtime = createAppLayer({ metadata: metadataLayer, dbc: dbcLayer });
```

### Portal Usage

```typescript
const dbcLayer = SupabaseDbcService(supabaseClient);
const runtime = createAppLayer({ metadata: metadataLayer, dbc: dbcLayer });
```

## File Structure

```text
packages/wowlab-services/src/internal/data/dbc/
├── DbcService.ts
├── errors.ts
├── InMemoryDbcService.ts
├── SupabaseDbcService.ts
└── index.ts

packages/wowlab-services/src/internal/data/transformer/
├── extractors.ts
├── spell.ts
└── item.ts
```

## Implementation Steps

1. Create `DbcService` interface and error types
2. Create `InMemoryDbcService`
3. Rewrite all extractors to use `DbcService` (delete old signatures)
4. Rewrite `transformSpell` / `transformItem`
5. Update all call sites
6. Delete old `DbcCache` parameter from all functions
7. Create `SupabaseDbcService`
8. Add SQL function + indexes to Supabase
9. Wire Portal to use Supabase layer

## What Gets Deleted

- `cache: DbcCache` parameter from all extractors
- Old sync extractor signatures
- Any `DbcCache` imports in transformer code
- Bridge functions (none needed - clean cut)
