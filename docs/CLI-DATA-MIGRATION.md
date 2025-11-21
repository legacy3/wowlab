# CLI Data Infrastructure: wowlab-data CSV Integration

**Status:** Planning
**Created:** 2025-11-21
**Target:** Build CLI commands to import wowlab-data CSV tables into Supabase

## Overview

This document outlines the plan for building `apps/cli` commands to parse CSV game data from `third_party/wowlab-data` and populate Supabase tables.

## Data Source

- **Location:** `third_party/wowlab-data/data/tables/`
- **Format:** CSV with headers, comma-delimited
- **Total Tables:** 1,079 files
- **Priority Tables:** 160 Spell/Item related tables
- **Advantages:** Comprehensive, actively maintained, industry standard format

## Technical Decisions

### ✅ Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSV Parser | **papaparse** | Feature-rich, streaming support, battle-tested, TypeScript types |
| Schema Location | `packages/wowlab-core/src/internal/schemas/dbc/` | Keep DBC schemas with domain entities |
| Data Service | `packages/wowlab-services/src/Data.ts` | Centralized data services |
| Cache Strategy | Selective loading (spell/item tables only) | Start small, expand as needed |

### ❓ Pending Decisions

- Array field parsing strategy (inspect CSV to determine format)
- Error handling: Skip malformed rows or fail entire import?
- Supabase schema requirements

## Implementation Phases

### Phase 1: Data Layer Infrastructure

#### 1.1 CSV Parser Service

**File:** `packages/wowlab-services/src/internal/data/CsvLoader.ts`

```typescript
import * as Effect from "effect/Effect"
import Papa from "papaparse"
import * as fs from "node:fs"

export const loadCsvFile = <T>(
  filePath: string,
  schema: Schema.Schema<T>
): Effect.Effect<T[], FileReadError | ParseError>
```

**Features:**
- Stream-based parsing for large files (papaparse streaming API)
- Effect Schema validation
- Type-safe parsing
- Error handling for malformed CSV

**Dependencies:**
```json
{
  "papaparse": "^5.4.1",
  "@types/papaparse": "^5.3.14"
}
```

**Implementation Pattern:**
```typescript
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import Papa from "papaparse"
import * as fs from "node:fs"

export const loadCsvFile = <A, I>(
  filePath: string,
  schema: Schema.Schema<A, I>
): Effect.Effect<A[], FileReadError | ParseError> =>
  Effect.gen(function* () {
    const rows: A[] = []

    yield* Effect.tryPromise({
      try: async () => {
        return new Promise((resolve, reject) => {
          Papa.parse(fs.createReadStream(filePath), {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            step: (result) => {
              const decoded = Schema.decodeUnknownEither(schema)(result.data)
              if (decoded._tag === "Right") {
                rows.push(decoded.right)
              } else {
                // Log validation error, continue
              }
            },
            complete: () => resolve(rows),
            error: (error) => reject(error)
          })
        })
      },
      catch: (error) => new FileReadError({ filePath, cause: error })
    })

    return rows
  })
```

#### 1.2 DBC Schema Definitions

**Location:** `packages/wowlab-core/src/internal/schemas/dbc/`

**Priority Tables (Spell):**
- `Spell.csv` - Core spell data
- `SpellEffect.csv` - Spell effects
- `SpellMisc.csv` - Miscellaneous spell properties
- `SpellName.csv` - Spell names/descriptions
- `SpellCastTimes.csv` - Cast time data
- `SpellCooldowns.csv` - Cooldown data
- `SpellDuration.csv` - Duration data
- `SpellRadius.csv` - Area of effect radii
- `SpellRange.csv` - Range data
- `SpellCategories.csv` - Spell categories
- `SpellCategory.csv` - Category definitions

**Priority Tables (Item):**
- `Item.csv` - Core item data
- `ItemEffect.csv` - Item effects/spells
- `ItemSparse.csv` - Item extended properties

**Schema Pattern:**
```typescript
// packages/wowlab-core/src/internal/schemas/dbc/SpellEffectSchema.ts
import * as Schema from "effect/Schema"
import * as Branded from "../Branded.js"

export const SpellEffectRowSchema = Schema.Struct({
  ID: Schema.Number,
  SpellID: Branded.SpellIDSchema,
  EffectIndex: Schema.Number,
  Effect: Schema.Number,
  EffectAura: Schema.Number,
  EffectAmplitude: Schema.Number,
  EffectAttributes: Schema.Number,
  EffectAuraPeriod: Schema.Number,
  EffectBonusCoefficient: Schema.Number,
  EffectChainAmplitude: Schema.Number,
  EffectChainTargets: Schema.Number,
  EffectItemType: Schema.Number,
  EffectMechanic: Schema.Number,
  EffectPointsPerResource: Schema.Number,
  EffectPos_facing: Schema.Number,
  EffectRealPointsPerLevel: Schema.Number,
  EffectTriggerSpell: Schema.Number,
  BonusCoefficientFromAP: Schema.Number,
  PvpMultiplier: Schema.Number,
  Coefficient: Schema.Number,
  Variance: Schema.Number,
  ResourceCoefficient: Schema.Number,
  GroupSizeBasePointsCoefficient: Schema.Number,
  EffectBasePointsF: Schema.Number,
  ScalingClass: Schema.Number,
  // Array fields as individual columns
  EffectMiscValue_0: Schema.Number,
  EffectMiscValue_1: Schema.Number,
  EffectRadiusIndex_0: Schema.Number,
  EffectRadiusIndex_1: Schema.Number,
  EffectSpellClassMask_0: Schema.Number,
  EffectSpellClassMask_1: Schema.Number,
  EffectSpellClassMask_2: Schema.Number,
  EffectSpellClassMask_3: Schema.Number,
  ImplicitTarget_0: Schema.Number,
  ImplicitTarget_1: Schema.Number,
})

export type SpellEffectRow = Schema.Schema.Type<typeof SpellEffectRowSchema>
```

#### 1.3 Data Cache Service

**File:** `packages/wowlab-services/src/internal/data/DbcCache.ts`

```typescript
import { Map } from "immutable"

export interface DbcCache {
  spell: Map<number, SpellRow>
  spellEffect: Map<number, SpellEffectRow[]>
  spellMisc: Map<number, SpellMiscRow>
  spellName: Map<number, SpellNameRow>
  spellCastTimes: Map<number, SpellCastTimesRow>
  spellCooldowns: Map<number, SpellCooldownsRow>
  spellDuration: Map<number, SpellDurationRow>
  spellRadius: Map<number, SpellRadiusRow>
  spellRange: Map<number, SpellRangeRow>
  spellCategories: Map<number, SpellCategoriesRow>
  spellCategory: Map<number, SpellCategoryRow>
}

export const createCache = (
  rawData: RawDbcData
): DbcCache => ({
  spell: Map(rawData.spell.map(row => [row.ID, row])),
  spellEffect: groupBySpellId(rawData.spellEffect),
  spellMisc: Map(rawData.spellMisc.map(row => [row.SpellID, row])),
  // ... other tables
})

const groupBySpellId = <T extends { SpellID: number }>(
  rows: T[]
): Map<number, T[]> => {
  const grouped = new Map<number, T[]>()
  rows.forEach(row => {
    const existing = grouped.get(row.SpellID) || []
    grouped.set(row.SpellID, [...existing, row])
  })
  return Map(grouped)
}
```

**Features:**
- Immutable.js Map-based storage
- Indexed lookups by ID, SpellID, etc.
- Relationship mapping (e.g., SpellID → Effects[])
- Memory-efficient structure

### Phase 2: CLI Commands

#### 2.1 Shared Infrastructure

**Location:** `apps/cli/commands/shared/`

```
shared/
├── csv-loader.ts         # CSV loading utilities
├── dbc-config.ts         # Table configurations
├── supabase.ts           # Shared Supabase client & operations
├── errors.ts             # Shared error types
├── types.ts              # Shared types
└── transform-utils.ts    # Common transform helpers
```

**dbc-config.ts:**
```typescript
import * as path from "node:path"
import * as Dbc from "@packages/wowlab-core/Schemas/dbc"

export const REPO_ROOT = path.join(process.cwd(), "../..")
export const DBC_DATA_DIR = path.join(
  REPO_ROOT,
  "third_party/wowlab-data/data/tables"
)

export const SPELL_TABLES = [
  { file: "Spell.csv", schema: Dbc.SpellRowSchema },
  { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema },
  { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema },
  { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema },
  { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema },
  { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema },
  { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema },
  { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema },
  { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema },
  { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema },
  { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema },
] as const

export const ITEM_TABLES = [
  { file: "Item.csv", schema: Dbc.ItemRowSchema },
  { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema },
  { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema },
] as const
```

#### 2.2 `update-spell-data` Command

**Structure:**
```
update-spell-data/
├── index.ts              # Command definition
├── loader.ts             # Load CSV tables
├── transform.ts          # Transform to Supabase format
├── supabase.ts           # Supabase operations
└── types.ts              # Command-specific types
```

**loader.ts:**
```typescript
import * as Effect from "effect/Effect"
import * as path from "node:path"
import { loadCsvFile } from "@packages/wowlab-services/Data"
import { SPELL_TABLES, DBC_DATA_DIR } from "../shared/dbc-config"

export interface RawSpellData {
  spell: SpellRow[]
  spellEffect: SpellEffectRow[]
  spellMisc: SpellMiscRow[]
  spellName: SpellNameRow[]
  spellCastTimes: SpellCastTimesRow[]
  spellCooldowns: SpellCooldownsRow[]
  spellDuration: SpellDurationRow[]
  spellRadius: SpellRadiusRow[]
  spellRange: SpellRangeRow[]
  spellCategories: SpellCategoriesRow[]
  spellCategory: SpellCategoryRow[]
}

export const loadAllSpellTables = (): Effect.Effect<
  RawSpellData,
  FileReadError | ParseError
> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Loading spell tables from wowlab-data...")

    const [
      spell,
      spellEffect,
      spellMisc,
      spellName,
      spellCastTimes,
      spellCooldowns,
      spellDuration,
      spellRadius,
      spellRange,
      spellCategories,
      spellCategory,
    ] = yield* Effect.all(
      SPELL_TABLES.map(({ file, schema }) =>
        loadCsvFile(path.join(DBC_DATA_DIR, file), schema)
      ),
      { concurrency: "unbounded" }
    )

    yield* Effect.logInfo(`Loaded ${spell.length} spells`)

    return {
      spell,
      spellEffect,
      spellMisc,
      spellName,
      spellCastTimes,
      spellCooldowns,
      spellDuration,
      spellRadius,
      spellRange,
      spellCategories,
      spellCategory,
    }
  })
```

**transform.ts:**
```typescript
import * as Effect from "effect/Effect"
import { createCache } from "@packages/wowlab-services/Data"

export const transformSpell = (
  spellId: number,
  cache: DbcCache
): Effect.Effect<SpellDataFlat, SpellNotFoundError> =>
  Effect.gen(function* () {
    const misc = cache.spellMisc.get(spellId)
    if (!misc) {
      return yield* Effect.fail(new SpellNotFoundError({ spellId }))
    }

    const name = cache.spellName.get(spellId)
    const effects = cache.spellEffect.get(spellId) || []
    const cooldowns = cache.spellCooldowns.get(misc.ID)
    const castTimes = cache.spellCastTimes.get(misc.CastingTimeIndex)
    const duration = cache.spellDuration.get(misc.DurationIndex)
    const range = cache.spellRange.get(misc.RangeIndex)

    // Transform to flat structure for Supabase
    return {
      id: spellId,
      name: name?.Name_lang || "",
      iconName: "", // TODO: lookup from FileData
      castTime: castTimes?.Base || 0,
      cooldown: cooldowns?.RecoveryTime || 0,
      gcd: cooldowns?.CategoryRecoveryTime || 0,
      // ... map all fields to Supabase schema
    }
  })
```

**index.ts:**
```typescript
import { Command, Options } from "@effect/cli"
import * as Effect from "effect/Effect"

const updateSpellDataProgram = (options: CliOptions) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting spell data import...")

    const supabase = yield* createSupabaseClient()

    if (options.clear && !options.dryRun) {
      yield* clearAllSpells(supabase)
    }

    const rawData = yield* loadAllSpellTables()
    const cache = createCache(rawData)

    const spellIds = options.spells === "all"
      ? Array.from(cache.spellMisc.keys())
      : parseSpellIds(options.spells)

    yield* Effect.logInfo(`Processing ${spellIds.length} spells...`)

    const transformedSpells = yield* Effect.forEach(
      spellIds,
      (spellId) => transformSpell(spellId, cache),
      { concurrency: "unbounded" }
    )

    if (options.dryRun) {
      yield* showDryRunPreview(transformedSpells)
      return 0
    }

    const inserted = yield* insertSpellsInBatches(
      supabase,
      transformedSpells,
      options.batch
    )

    yield* Effect.logInfo(`✓ Import complete! Inserted ${inserted} spells`)
    return 0
  })

export const updateSpellDataCommand = Command.make(
  "update-spell-data",
  {
    batch: Options.integer("batch").pipe(Options.withDefault(1000)),
    clear: Options.boolean("clear").pipe(Options.withDefault(false)),
    dryRun: Options.boolean("dry-run").pipe(Options.withDefault(false)),
    spells: Options.text("spells").pipe(Options.withDefault("all")),
  },
  updateSpellDataProgram
)
```

#### 2.3 `update-item-data` Command

Same structure as `update-spell-data`:
- Load Item, ItemEffect, ItemSparse CSV tables
- Create cache with Immutable.js Maps
- Transform to Supabase `item_data` schema
- Batch insert with progress logging

### Phase 3: Transform Layer

#### 3.1 CSV Field Parsers

**File:** `packages/wowlab-services/src/internal/data/CsvTransforms.ts`

```typescript
// Parse indexed array fields from CSV
export const parseIndexedFields = <T>(
  row: Record<string, unknown>,
  fieldName: string,
  maxIndex: number
): T[] => {
  const result: T[] = []
  for (let i = 0; i < maxIndex; i++) {
    const value = row[`${fieldName}_${i}`]
    if (value !== undefined) {
      result.push(value as T)
    }
  }
  return result
}

// Example usage:
// const effectMiscValue = parseIndexedFields<number>(row, "EffectMiscValue", 2)
// → [row.EffectMiscValue_0, row.EffectMiscValue_1]
```

### Phase 4: Configuration & Dependencies

#### 4.1 Install Dependencies

```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

#### 4.2 Data Directory

All CLI commands use:
```
third_party/wowlab-data/data/tables/
```

### Phase 5: Testing & Validation

#### 5.1 Test Commands

```bash
# Dry run to preview data
pnpm cli update-spell-data --dry-run

# Import single spell
pnpm cli update-spell-data --spells 1449

# Full import
pnpm cli update-spell-data --clear --batch 1000
```

#### 5.2 Validation Checklist

- [ ] CSV parsing produces correct data types
- [ ] Indexed array fields parse correctly (EffectMiscValue_0, _1)
- [ ] Relationships maintained (SpellID → Effects)
- [ ] Supabase insertions succeed
- [ ] No data corruption

### Phase 6: Documentation

#### 6.1 Documentation Tasks

- [x] This implementation guide
- [ ] Update `README.md` with CLI commands
- [ ] Document CSV table structure
- [ ] Add troubleshooting guide

## Implementation Order

1. **CSV Parser + Dependencies** (1 hour)
   - Install papaparse
   - Create CsvLoader.ts in wowlab-services

2. **Spell Schemas** (2-3 hours)
   - Create 11 spell table schemas in wowlab-core/schemas/dbc/
   - Test parsing with sample CSV

3. **Spell Cache** (1 hour)
   - Create DbcCache.ts
   - Implement createCache function

4. **update-spell-data Command** (3-4 hours)
   - Create loader.ts
   - Create transform.ts
   - Create index.ts
   - Test dry-run

5. **Test & Validate** (1-2 hours)
   - Verify CSV parsing
   - Test Supabase insertions
   - Compare output format

6. **Item Schemas + Command** (2-3 hours)
   - Create item table schemas
   - Implement update-item-data command

**Total Estimated Time:** 10-14 hours

## Success Criteria

- ✅ papaparse successfully parses all CSV tables
- ✅ Schemas validate data correctly
- ✅ Cache structure supports efficient lookups
- ✅ Transform produces correct Supabase format
- ✅ Spell data imports without errors
- ✅ Item data imports without errors
- ✅ CLI commands work as expected

## Open Questions

1. **Indexed Array Fields:** Confirmed CSV uses `FieldName_0`, `FieldName_1` pattern
2. **Schema Validation:** Validate at parse time (fail-fast)
3. **Error Handling:** Log warnings for invalid rows, continue import
4. **Supabase Schema:** Keep current schema, adapt transform layer
5. **Cache Memory:** Start with full in-memory cache, optimize if needed

## References

- Data source: `third_party/wowlab-data/data/tables/`
- PapaParse docs: https://www.papaparse.com/docs
- Effect Schema: https://effect.website/docs/schema/introduction
