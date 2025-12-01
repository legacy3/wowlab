# DBC Service Refactor Plan

Replace sync extractors with Effect-based `DbcService` abstraction. Two backends: in-memory for CLI, Supabase for Portal.

## Progress Tracker

| Phase | Status | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| 0     | ✅     | Cleanup: Delete old code & wipe Supabase tables |
| 1     | ✅     | Create DbcService interface and error types     |
| 2     | ✅     | Create InMemoryDbcService implementation        |
| 3     | ✅     | Rewrite extractors to use DbcService            |
| 4     | ✅     | Rewrite transformSpell/transformItem            |
| 5     | ✅     | Update all call sites and wire layers           |
| 6     | ✅     | Create raw_dbc schema in Supabase               |
| 7     | ✅     | Create SupabaseDbcService implementation        |
| 8     | ✅     | Wire Portal to use Supabase layer               |

---

## Phase 0: Cleanup

**Goal:** Remove old update commands and wipe deprecated Supabase tables.

### Delete CLI Commands

```
apps/cli/commands/update-spell-data/index.ts
apps/cli/commands/update-item-data/index.ts
apps/cli/commands/shared/data-updater.ts
```

### Update CLI Index

Edit `apps/cli/commands/index.ts` to remove:

- `updateItemDataCommand`
- `updateSpellDataCommand`

### Wipe Supabase Tables

Execute via Supabase MCP or migration:

```sql
DROP TABLE IF EXISTS public.spell_data CASCADE;
DROP TABLE IF EXISTS public.item_data CASCADE;
```

### Update Portal (remove spell_data/item_data references)

Files to check and update:

- `apps/portal/src/lib/supabase-metadata-service.ts`
- `apps/portal/src/atoms/spell-data/state.ts`
- `apps/portal/src/atoms/item-data/state.ts`
- `apps/portal/src/lib/spell-formatters.ts`
- `apps/portal/src/lib/supabase/database.types.ts`

---

## Phase 1: DbcService Interface

**Goal:** Create the service interface and error types.

### File: `packages/wowlab-services/src/internal/data/dbc/errors.ts`

```typescript
import * as Data from "effect/Data";

export class DbcQueryError extends Data.TaggedError("DbcQueryError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type DbcError = DbcQueryError;
```

### File: `packages/wowlab-services/src/internal/data/dbc/DbcService.ts`

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
  readonly getSpell: (
    spellId: number,
  ) => Effect.Effect<Dbc.SpellRow | undefined, DbcError>;

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

  // Item tables
  readonly getItem: (
    itemId: number,
  ) => Effect.Effect<Dbc.ItemRow | undefined, DbcError>;
  readonly getItemSparse: (
    itemId: number,
  ) => Effect.Effect<Dbc.ItemSparseRow | undefined, DbcError>;
  readonly getItemXItemEffects: (
    itemId: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.ItemXItemEffectRow>, DbcError>;
  readonly getItemEffect: (
    id: number,
  ) => Effect.Effect<Dbc.ItemEffectRow | undefined, DbcError>;
  readonly getManifestInterfaceData: (
    id: number,
  ) => Effect.Effect<Dbc.ManifestInterfaceDataRow | undefined, DbcError>;

  // Damage calculation support
  readonly getExpectedStats: (
    level: number,
    expansion: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.ExpectedStatRow>, DbcError>;
  readonly getContentTuningXExpected: (
    contentTuningId: number,
    mythicPlusSeasonId: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.ContentTuningXExpectedRow>, DbcError>;
  readonly getExpectedStatMod: (
    id: number,
  ) => Effect.Effect<Dbc.ExpectedStatModRow | undefined, DbcError>;

  // Batch operations (avoids N+1 on Supabase)
  readonly getDifficultyChain: (
    id: number,
  ) => Effect.Effect<ReadonlyArray<Dbc.DifficultyRow>, DbcError>;
}

export class DbcService extends Context.Tag("@wowlab/services/DbcService")<
  DbcService,
  DbcServiceInterface
>() {}
```

### File: `packages/wowlab-services/src/internal/data/dbc/index.ts`

```typescript
export * from "./DbcService.js";
export * from "./errors.js";
```

---

## Phase 2: InMemoryDbcService

**Goal:** Create the in-memory implementation that wraps DbcCache.

### File: `packages/wowlab-services/src/internal/data/dbc/InMemoryDbcService.ts`

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { DbcService, type DbcServiceInterface } from "./DbcService.js";
import type { DbcCache } from "../DbcCache.js";
import type { Dbc } from "@wowlab/core/Schemas";

export const InMemoryDbcService = (cache: DbcCache): Layer.Layer<DbcService> =>
  Layer.succeed(DbcService, {
    // Spell tables
    getSpellEffects: (spellId) =>
      Effect.succeed(cache.spellEffect.get(spellId) ?? []),
    getSpellMisc: (spellId) => Effect.succeed(cache.spellMisc.get(spellId)),
    getSpellCooldowns: (spellId) =>
      Effect.succeed(cache.spellCooldowns.get(spellId)),
    getSpellCategories: (spellId) =>
      Effect.succeed(cache.spellCategories.get(spellId)),
    getSpellClassOptions: (spellId) =>
      Effect.succeed(cache.spellClassOptions.get(spellId)),
    getSpellPower: (spellId) =>
      Effect.succeed(cache.spellPower.get(spellId) ?? []),
    getSpellName: (spellId) => Effect.succeed(cache.spellName.get(spellId)),
    getSpell: (spellId) => Effect.succeed(cache.spell.get(spellId)),

    // Lookup tables
    getDifficulty: (id) => Effect.succeed(cache.difficulty.get(id)),
    getSpellCastTimes: (id) => Effect.succeed(cache.spellCastTimes.get(id)),
    getSpellDuration: (id) => Effect.succeed(cache.spellDuration.get(id)),
    getSpellRange: (id) => Effect.succeed(cache.spellRange.get(id)),
    getSpellRadius: (id) => Effect.succeed(cache.spellRadius.get(id)),
    getSpellCategory: (id) => Effect.succeed(cache.spellCategory.get(id)),

    // Item tables
    getItem: (itemId) => Effect.succeed(cache.item.get(itemId)),
    getItemSparse: (itemId) => Effect.succeed(cache.itemSparse.get(itemId)),
    getItemXItemEffects: (itemId) =>
      Effect.succeed(cache.itemXItemEffect.get(itemId) ?? []),
    getItemEffect: (id) => Effect.succeed(cache.itemEffect.get(id)),
    getManifestInterfaceData: (id) =>
      Effect.succeed(cache.manifestInterfaceData.get(id)),

    // Damage calculation support
    getExpectedStats: (level, expansion) =>
      Effect.succeed(
        cache.expectedStat.filter(
          (stat) =>
            stat.Lvl === level &&
            (stat.ExpansionID === expansion || stat.ExpansionID === -2),
        ),
      ),
    getContentTuningXExpected: (contentTuningId, mythicPlusSeasonId) =>
      Effect.succeed(
        cache.contentTuningXExpected.filter(
          (x) =>
            x.ContentTuningID === contentTuningId &&
            (x.MinMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId >= x.MinMythicPlusSeasonID) &&
            (x.MaxMythicPlusSeasonID === 0 ||
              mythicPlusSeasonId < x.MaxMythicPlusSeasonID),
        ),
      ),
    getExpectedStatMod: (id) => Effect.succeed(cache.expectedStatMod.get(id)),

    // Batch operations
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
  } satisfies DbcServiceInterface);
```

---

## Phase 3: Rewrite Extractors

**Goal:** Convert all extractors from sync functions with `cache` param to Effect functions using `DbcService`.

### File: `packages/wowlab-services/src/internal/data/transformer/extractors.ts`

All extractors change signature from:

```typescript
// OLD
export const extractRange = (misc: Option<SpellMiscRow>, cache: DbcCache) => ...

// NEW
export const extractRange = (misc: Option<SpellMiscRow>) =>
  Effect.gen(function* () {
    const dbc = yield* DbcService;
    // ... implementation using dbc.getSpellRange(id)
  });
```

Key changes:

1. Remove `cache: DbcCache` parameter from all functions
2. Add `yield* DbcService` to access the service
3. Replace `cache.xxx.get(id)` with `yield* dbc.getXxx(id)`
4. Return type becomes `Effect.Effect<T, DbcError, DbcService>`

### Extractor Migration Checklist

- [ ] `extractRange`
- [ ] `extractRadius`
- [ ] `extractCooldown`
- [ ] `extractInterrupts`
- [ ] `extractEmpower`
- [ ] `extractCastTime`
- [ ] `extractDuration`
- [ ] `extractCharges`
- [ ] `extractName`
- [ ] `extractDescription`
- [ ] `extractPower`
- [ ] `extractClassOptions`
- [ ] `getEffectsForDifficulty`
- [ ] `hasAoeDamageEffect`
- [ ] `getVarianceForDifficulty`
- [ ] `getDamage`

---

## Phase 4: Rewrite Transformers

**Goal:** Update transformSpell and transformItem to use DbcService.

### File: `packages/wowlab-services/src/internal/data/transformer/spell.ts`

```typescript
export const transformSpell = (
  spellId: number,
  difficultyId: number = 0,
): Effect.Effect<SpellDataFlat, SpellInfoNotFound, DbcService> =>
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

    // ... rest of transformation using new extractors
  });
```

### File: `packages/wowlab-services/src/internal/data/transformer/item.ts`

Same pattern as spell.ts.

---

## Phase 5: Update Call Sites & Wire Layers

**Goal:** Update all code that uses transformers to provide DbcService layer.

### CLI Usage Pattern

```typescript
import { InMemoryDbcService } from "@wowlab/services/Data";

const cache = createCache(rawData);
const dbcLayer = InMemoryDbcService(cache);

const result = yield * transformSpell(spellId).pipe(Effect.provide(dbcLayer));
```

### Files to Update

- `apps/cli/commands/generate-spells/` - spell generation
- Any other CLI commands using transformers
- Test files if any

---

## Phase 6: Create raw_dbc Schema in Supabase

**Goal:** Create the raw DBC tables in Supabase for the Portal to query.

### Migration SQL

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS raw_dbc;

-- Spell tables
CREATE TABLE raw_dbc.spell_effect (
  "ID" INTEGER PRIMARY KEY,
  "SpellID" INTEGER NOT NULL,
  "DifficultyID" INTEGER DEFAULT 0,
  "Effect" INTEGER DEFAULT 0,
  "EffectBasePointsF" REAL DEFAULT 0,
  "BonusCoefficientFromAP" REAL DEFAULT 0,
  "EffectBonusCoefficient" REAL DEFAULT 0,
  "EffectRadiusIndex_0" INTEGER DEFAULT 0,
  "EffectRadiusIndex_1" INTEGER DEFAULT 0,
  "EffectMiscValue_0" INTEGER DEFAULT 0,
  "Variance" REAL DEFAULT 0
  -- Add other columns as needed
);

CREATE TABLE raw_dbc.spell_misc (
  "ID" INTEGER PRIMARY KEY,
  "SpellID" INTEGER NOT NULL,
  "RangeIndex" INTEGER DEFAULT 0,
  "CastingTimeIndex" INTEGER DEFAULT 0,
  "DurationIndex" INTEGER DEFAULT 0,
  "SchoolMask" INTEGER DEFAULT 0
  -- Add other columns as needed
);

-- (Similar tables for all DBC data)

-- Indexes
CREATE INDEX idx_spell_effect_spell_id ON raw_dbc.spell_effect ("SpellID");
CREATE INDEX idx_spell_effect_spell_difficulty ON raw_dbc.spell_effect ("SpellID", "DifficultyID");
CREATE INDEX idx_spell_misc_spell_id ON raw_dbc.spell_misc ("SpellID");

-- Difficulty chain function
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
```

### CLI Command for Upload

Create new command to upload raw DBC data to Supabase (replaces old update commands):

```
apps/cli/commands/upload-dbc/index.ts
```

---

## Phase 7: SupabaseDbcService

**Goal:** Create the Supabase-backed implementation with caching.

### File: `packages/wowlab-services/src/internal/data/dbc/SupabaseDbcService.ts`

```typescript
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Cache from "effect/Cache";
import * as Duration from "effect/Duration";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DbcService, type DbcServiceInterface } from "./DbcService.js";
import { DbcQueryError } from "./errors.js";

export const SupabaseDbcService = (
  supabase: SupabaseClient,
): Layer.Layer<DbcService> =>
  Layer.effect(
    DbcService,
    Effect.gen(function* () {
      // Create caches for frequently accessed data
      const spellEffectsCache = yield* Cache.make({
        capacity: 100,
        timeToLive: Duration.minutes(5),
        lookup: (spellId: number) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase
                .schema("raw_dbc")
                .from("spell_effect")
                .select("*")
                .eq("SpellID", spellId),
            );
            if (error) {
              return yield* Effect.fail(
                new DbcQueryError({ message: error.message, cause: error }),
              );
            }
            return data ?? [];
          }),
      });

      // ... similar caches for other tables

      const service: DbcServiceInterface = {
        getSpellEffects: (spellId) => spellEffectsCache.get(spellId),

        getDifficultyChain: (id) =>
          Effect.gen(function* () {
            const { data, error } = yield* Effect.promise(() =>
              supabase.rpc("get_difficulty_chain", { start_id: id }),
            );
            if (error) {
              return yield* Effect.fail(
                new DbcQueryError({ message: error.message, cause: error }),
              );
            }
            return data ?? [];
          }),

        // ... implement all other methods
      };

      return service;
    }),
  );
```

---

## Phase 8: Wire Portal

**Goal:** Connect the Portal app to use SupabaseDbcService.

### Move SupabaseDbcService to Portal

The `SupabaseDbcService` implementation was moved from `@wowlab/services` to `apps/portal/src/lib/services/` to avoid coupling the core library to Supabase. This keeps `@wowlab/services` backend-agnostic.

Files created:

- `apps/portal/src/lib/services/SupabaseDbcService.ts` - The implementation
- `apps/portal/src/lib/services/dbc-layer.ts` - Factory function
- `apps/portal/src/lib/services/index.ts` - Barrel export

### Usage

```typescript
import { createPortalDbcLayer } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const dbcLayer = createPortalDbcLayer(supabase);
const spell = await Effect.runPromise(
  transformSpell(spellId).pipe(Effect.provide(dbcLayer)),
);
```

---

## File Structure (Final)

```
packages/wowlab-services/src/internal/data/
├── dbc/
│   ├── DbcService.ts
│   ├── InMemoryDbcService.ts
│   └── index.ts
├── transformer/
│   ├── extractors.ts
│   ├── spell.ts
│   ├── item.ts
│   └── index.ts
├── DbcCache.ts (kept for InMemoryDbcService)
└── index.ts

apps/portal/src/lib/services/
├── SupabaseDbcService.ts
├── dbc-layer.ts
└── index.ts
```

---

## What Gets Deleted

### Phase 0

- `apps/cli/commands/update-spell-data/` (entire directory)
- `apps/cli/commands/update-item-data/` (entire directory)
- `apps/cli/commands/shared/data-updater.ts`
- Supabase tables: `public.spell_data`, `public.item_data`

### Phase 3-5

- `cache: DbcCache` parameter from all extractors
- All sync extractor implementations (replaced with Effect versions)
- Old transformer signatures

### Not Deleted

- `DbcCache` interface and `createCache` function (still used by InMemoryDbcService)
