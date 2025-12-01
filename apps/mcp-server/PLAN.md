# MCP Server Update Plan

## Current State

The MCP server is **broken** - it queries `spell_data` and `item_data` tables that no longer exist.

## New Architecture

**Use `@effect/ai` McpServer** instead of raw `@modelcontextprotocol/sdk`:
- `McpServer.layerStdio` - Built-in stdio transport
- `McpServer.toolkit` - Type-safe tool registration via `Toolkit`
- `Tool.make` - Schema-validated tool definitions
- Native Effect integration - no async/await bridge needed

**Use `@wowlab/services` with**:
- `DbcService` - Data access layer for `raw_dbc` schema
- `ExtractorService` - Modular extractor functions
- `transformSpell` / `transformItem` - Full transformations

**Key Decisions**:
1. Reuse `SupabaseDbcService` from portal (don't reimplement caching)
2. Use `@effect/ai` for MCP server (not raw SDK)
3. Use `Effect.Cache` / `Effect.cachedWithTTL` for caching (not manual)

---

## Dependencies

```json
{
  "dependencies": {
    "@effect/ai": "^0.x.x",
    "@effect/platform": "^0.x.x",
    "@effect/platform-node": "^0.x.x",
    "@wowlab/services": "workspace:*",
    "@wowlab/core": "workspace:*",
    "effect": "^3.x.x"
  }
}
```

**Remove**: `@modelcontextprotocol/sdk` (replaced by `@effect/ai`)

---

## MCP Tools (11 total)

### 1. `get_spell`
```typescript
const GetSpell = Tool.make("get_spell", {
  description: "Get complete spell data by ID",
  success: SpellDataFlat,
  failure: Schema.Never,
  parameters: {
    id: Schema.Number.annotations({ description: "Spell ID" })
  }
})
```

### 2. `get_item`
```typescript
const GetItem = Tool.make("get_item", {
  description: "Get complete item data by ID",
  success: ItemDataFlat,
  failure: Schema.Never,
  parameters: {
    id: Schema.Number.annotations({ description: "Item ID" })
  }
})
```

### 3. `get_spells_batch`
```typescript
const GetSpellsBatch = Tool.make("get_spells_batch", {
  description: "Get multiple spells by ID (max 50)",
  success: Schema.Array(SpellDataFlat),
  failure: Schema.Never,
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({ description: "Array of spell IDs (max 50)" })
    )
  }
})
```

### 4. `get_items_batch`
```typescript
const GetItemsBatch = Tool.make("get_items_batch", {
  description: "Get multiple items by ID (max 50)",
  success: Schema.Array(ItemDataFlat),
  failure: Schema.Never,
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({ description: "Array of item IDs (max 50)" })
    )
  }
})
```

### 5. `search_spells`
```typescript
const SearchSpells = Tool.make("search_spells", {
  description: "Search spells by name",
  success: Schema.Array(Schema.Struct({
    id: Schema.Number,
    name: Schema.String,
    description: Schema.String
  })),
  failure: Schema.Never,
  parameters: {
    query: Schema.String.annotations({ description: "Search term" }),
    limit: Schema.optional(Schema.Number.pipe(Schema.between(1, 50)))
      .annotations({ description: "Max results (default 10, max 50)" })
  }
})
```

### 6. `search_items`
```typescript
const SearchItems = Tool.make("search_items", {
  description: "Search items by name",
  success: Schema.Array(Schema.Struct({
    id: Schema.Number,
    name: Schema.String,
    description: Schema.String
  })),
  failure: Schema.Never,
  parameters: {
    query: Schema.String.annotations({ description: "Search term" }),
    limit: Schema.optional(Schema.Number.pipe(Schema.between(1, 50)))
      .annotations({ description: "Max results (default 10, max 50)" })
  }
})
```

### 7. `query_table`
```typescript
const QueryTable = Tool.make("query_table", {
  description: "Query raw DBC tables with filters",
  success: Schema.Array(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  failure: Schema.Never,
  parameters: {
    table: AllowedTableSchema.annotations({ description: "Table name" }),
    filters: Schema.optional(FilterSchema),
    select: Schema.optional(Schema.Array(Schema.String)),
    limit: Schema.optional(Schema.Number.pipe(Schema.between(1, 100))),
    orderBy: Schema.optional(Schema.String),
    ascending: Schema.optional(Schema.Boolean)
  }
})
```

**Allowed Tables** (whitelist via Schema union):
- `spell`, `spell_name`, `spell_misc`, `spell_effect`, `spell_power`
- `spell_cooldowns`, `spell_categories`, `spell_class_options`
- `spell_aura_options`, `spell_duration`, `spell_range`, `spell_radius`
- `spell_interrupts`, `spell_empower`, `spell_empower_stage`
- `item`, `item_sparse`, `item_effect`, `item_x_item_effect`
- `difficulty`, `expected_stat`

**Denied Tables** (too large):
- `spell_casting_requirements` (27k rows)
- `spell_target_restrictions` (46k rows)
- `manifest_interface_data` (138k rows)

### 8. `get_schema`
```typescript
const GetSchema = Tool.make("get_schema", {
  description: "Get table schema and available enums",
  success: SchemaOutput,
  failure: Schema.Never,
  parameters: {
    table: Schema.optional(Schema.String.annotations({
      description: "Table name (omit for list of all tables)"
    }))
  }
})
```

**Caching**: Use `Effect.cachedWithTTL` for 1-hour cache.

### 9. `call_function`
```typescript
const CallFunction = Tool.make("call_function", {
  description: "Call an extractor function",
  success: Schema.Unknown,
  failure: Schema.Never,
  parameters: {
    function: AllowedFunctionSchema.annotations({
      description: "Function name (use list_functions to see available)"
    }),
    args: Schema.Record({ key: Schema.String, value: Schema.Unknown })
  }
})
```

**Security**: Uses a static whitelist map - no dynamic function resolution.

```typescript
// Whitelist map (secure - no eval/dynamic access)
const FUNCTION_HANDLERS = {
  getDamage: (args) => ExtractorService.pipe(
    Effect.flatMap(svc => svc.getDamage(args.spellId, args.config))
  ),
  extractCooldown: (args) => ExtractorService.pipe(
    Effect.flatMap(svc => svc.extractCooldown(args.spellId))
  ),
  // ... all 17 functions explicitly mapped
} as const satisfies Record<AllowedFunction, (args: any) => Effect.Effect<any, any, any>>
```

### 10. `list_functions`
```typescript
const ListFunctions = Tool.make("list_functions", {
  description: "List available extractor functions with signatures",
  success: Schema.Array(FunctionMetadata),
  failure: Schema.Never,
  parameters: {
    function: Schema.optional(Schema.String.annotations({
      description: "Filter to specific function"
    }))
  }
})
```

Returns function metadata for LLM discovery:
```json
{
  "functions": [{
    "name": "getDamage",
    "description": "Calculate spell damage with expected stats",
    "args": {
      "spellId": { "type": "number", "required": true },
      "config": { "type": "{ level: number, difficultyId: number }", "required": true }
    },
    "returns": "DamageResult"
  }]
}
```

### 11. `get_status`
```typescript
const GetStatus = Tool.make("get_status", {
  description: "Check server health and connection status",
  success: StatusOutput,
  failure: Schema.Never,
  parameters: {}
})
```

Returns health probe for retry logic:
```json
{
  "version": "0.3.0",
  "status": "healthy",
  "supabase": { "connected": true, "latencyMs": 45 },
  "cache": { "enabled": true },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   MCP Server (@effect/ai)                       │
├─────────────────────────────────────────────────────────────────┤
│  McpServer.layerStdio                                           │
│  └── NodeStream.stdin / NodeSink.stdout                         │
├─────────────────────────────────────────────────────────────────┤
│  Toolkit (11 tools)                                             │
│  ├── get_spell, get_item, *_batch (transforms)                  │
│  ├── search_spells, search_items (discovery)                    │
│  ├── query_table (raw_dbc queries, whitelisted tables)          │
│  ├── get_schema (Effect.cachedWithTTL - 1 hour)                 │
│  ├── call_function (whitelisted extractor gateway)              │
│  ├── list_functions (extractor discovery)                       │
│  └── get_status (health probe)                                  │
├─────────────────────────────────────────────────────────────────┤
│  Tool Handlers Layer                                            │
│  └── WowLabToolHandlers = WowLabToolkit.toLayer(...)            │
├─────────────────────────────────────────────────────────────────┤
│  Services Layer (from @wowlab/services)                         │
│  ├── SupabaseDbcService (with Effect.Cache - 5min TTL)          │
│  ├── ExtractorService.Default                                   │
│  └── transformSpell / transformItem                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Client (raw_dbc schema, read-only)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Effect-TS Patterns (using built-in primitives)

### Server Entry Point

```typescript
// src/index.ts
import { McpServer } from "@effect/ai"
import { NodeRuntime, NodeSink, NodeStream } from "@effect/platform-node"
import { Effect, Layer, Logger } from "effect"

// Merge all tool layers
const ServerLayer = Layer.mergeAll(
  WowLabToolHandlers,  // Tool implementations
).pipe(
  // Provide MCP server with stdio transport
  Layer.provide(McpServer.layerStdio({
    name: "wowlab",
    version: "0.3.0",
    stdin: NodeStream.stdin,
    stdout: NodeSink.stdout
  })),
  // Add stderr logging
  Layer.provide(Logger.add(Logger.prettyLogger({ stderr: true }))),
  // Provide services
  Layer.provide(SupabaseDbcService.Live),
  Layer.provide(ExtractorService.Default)
)

Layer.launch(ServerLayer).pipe(NodeRuntime.runMain)
```

### Toolkit Definition

```typescript
// src/toolkit.ts
import { Tool, Toolkit } from "@effect/ai"

// Define all 11 tools
const GetSpell = Tool.make("get_spell", { ... })
const GetItem = Tool.make("get_item", { ... })
// ... etc

// Create toolkit
export const WowLabToolkit = Toolkit.make(
  GetSpell,
  GetItem,
  GetSpellsBatch,
  GetItemsBatch,
  SearchSpells,
  SearchItems,
  QueryTable,
  GetSchema,
  CallFunction,
  ListFunctions,
  GetStatus
)
```

### Tool Handlers

```typescript
// src/handlers.ts
import { Effect, Layer } from "effect"
import { WowLabToolkit } from "./toolkit"
import { DbcService, ExtractorService, transformSpell, transformItem } from "@wowlab/services"

export const WowLabToolHandlers = WowLabToolkit.toLayer(
  Effect.gen(function* () {
    const dbc = yield* DbcService
    const extractor = yield* ExtractorService

    return {
      get_spell: ({ id }) => transformSpell(id),

      get_item: ({ id }) => transformItem(id),

      get_spells_batch: ({ ids }) =>
        Effect.forEach(ids, transformSpell, { concurrency: 10 }),

      get_items_batch: ({ ids }) =>
        Effect.forEach(ids, transformItem, { concurrency: 10 }),

      search_spells: ({ query, limit }) =>
        searchSpellsInDb(query, limit ?? 10),

      search_items: ({ query, limit }) =>
        searchItemsInDb(query, limit ?? 10),

      query_table: (params) =>
        queryTableSafe(params),

      get_schema: ({ table }) =>
        cachedGetSchema(table),

      call_function: ({ function: fn, args }) =>
        FUNCTION_HANDLERS[fn](args),

      list_functions: ({ function: fn }) =>
        Effect.succeed(getFunctionMetadata(fn)),

      get_status: () =>
        getServerStatus()
    }
  })
)
```

### Caching with Effect.cachedWithTTL

```typescript
// src/cache.ts
import { Effect, Duration } from "effect"

// Schema cache - 1 hour TTL (Effect handles everything)
const schemaEffect = Effect.gen(function* () {
  const schema = yield* fetchSchemaFromDb()
  return schema
})

// Create cached version
export const cachedGetSchema = Effect.cachedWithTTL(schemaEffect, Duration.hours(1))
  .pipe(Effect.flatten)  // Unwrap the cached effect

// Usage: yield* cachedGetSchema - automatically cached for 1 hour
```

### Cache.make for Lookup Caching

```typescript
// For DbcService lookups (already in SupabaseDbcService)
import { Cache, Duration } from "effect"

const spellCache = Cache.make({
  capacity: 1000,
  timeToLive: Duration.minutes(5),
  lookup: (spellId: number) => fetchSpellFromDb(spellId)
})

// Usage: yield* spellCache.get(spellId) - auto-deduped concurrent requests
```

---

## Error Handling

### Tagged Errors (Effect pattern)

```typescript
// src/errors.ts
import { Data } from "effect"

export class SpellNotFound extends Data.TaggedError("SpellNotFound")<{
  readonly spellId: number
}> {}

export class ItemNotFound extends Data.TaggedError("ItemNotFound")<{
  readonly itemId: number
}> {}

export class InvalidTable extends Data.TaggedError("InvalidTable")<{
  readonly table: string
  readonly allowed: readonly string[]
}> {}

export class InvalidFunction extends Data.TaggedError("InvalidFunction")<{
  readonly function: string
  readonly allowed: readonly string[]
}> {}

export class DatabaseUnavailable extends Data.TaggedError("DatabaseUnavailable")<{
  readonly cause: unknown
}> {}
```

### Error Mapping

```typescript
// Tool handlers catch and map errors
get_spell: ({ id }) => transformSpell(id).pipe(
  Effect.catchTag("SpellInfoNotFound", () =>
    Effect.fail(new SpellNotFound({ spellId: id }))
  ),
  Effect.catchTag("DbcError", (e) =>
    Effect.fail(new DatabaseUnavailable({ cause: e }))
  )
)
```

---

## Security

### Read-Only Access
- `raw_dbc` schema is read-only for anon keys
- No access to `public`, `auth`, or other schemas

### Query Safety (Schema validation)
```typescript
// Whitelist tables via Schema.Literal union
const AllowedTableSchema = Schema.Literal(
  "spell", "spell_name", "spell_misc", "spell_effect", "spell_power",
  "spell_cooldowns", "spell_categories", "spell_class_options",
  "spell_aura_options", "spell_duration", "spell_range", "spell_radius",
  "spell_interrupts", "spell_empower", "spell_empower_stage",
  "item", "item_sparse", "item_effect", "item_x_item_effect",
  "difficulty", "expected_stat"
)
type AllowedTable = Schema.Schema.Type<typeof AllowedTableSchema>
```

### Function Safety (static map)
```typescript
// Whitelist functions via Schema.Literal union
const AllowedFunctionSchema = Schema.Literal(
  "getDamage", "getEffectsForDifficulty", "hasAoeDamageEffect",
  "getVarianceForDifficulty", "extractCooldown", "extractCastTime",
  "extractDuration", "extractRange", "extractRadius", "extractCharges",
  "extractPower", "extractScaling", "extractEmpower", "extractInterrupts",
  "extractClassOptions", "extractName", "extractDescription"
)
type AllowedFunction = Schema.Schema.Type<typeof AllowedFunctionSchema>

// Static handler map - no dynamic access
const FUNCTION_HANDLERS: Record<AllowedFunction, Handler> = { ... }
```

### Rate Limiting
- Max 50 items per batch request (Schema.maxItems)
- Max 100 rows per query_table (Schema.between)
- Effect's built-in interruption handles timeouts

---

## Files to Create/Modify

```
apps/mcp-server/
├── package.json                # Update deps: @effect/ai, remove @modelcontextprotocol/sdk
├── src/
│   ├── index.ts                # McpServer.layerStdio entry point
│   ├── toolkit.ts              # Tool.make definitions (11 tools)
│   ├── handlers.ts             # Toolkit.toLayer handlers
│   ├── schemas.ts              # Shared schemas (AllowedTable, filters, etc)
│   ├── errors.ts               # Tagged error classes
│   ├── cache.ts                # Effect.cachedWithTTL for schema
│   ├── functions.ts            # FUNCTION_HANDLERS map + metadata
│   └── supabase.ts             # SupabaseDbcService (or import from shared)
```

**Removed files** (no longer needed):
- `src/tools/` directory (replaced by toolkit pattern)
- `src/types.ts` (schemas inline with Tool.make)
- `src/config.ts` (env vars via Effect's Config)

---

## Migration Path

### Phase 1: Dependencies
1. Add `@effect/ai`, `@effect/platform-node`
2. Add `@wowlab/services`, `@wowlab/core`
3. Remove `@modelcontextprotocol/sdk`

### Phase 2: Toolkit & Server
4. Create `schemas.ts` with AllowedTable, AllowedFunction
5. Create `toolkit.ts` with 11 Tool.make definitions
6. Create `index.ts` with McpServer.layerStdio

### Phase 3: Handlers
7. Create `handlers.ts` with Toolkit.toLayer
8. Create `functions.ts` with FUNCTION_HANDLERS
9. Create `cache.ts` with Effect.cachedWithTTL

### Phase 4: Services
10. Import/create SupabaseDbcService
11. Wire up layers in index.ts
12. Test with `npx @wowlab/mcp-server`

---

## Benefits of @effect/ai Approach

| Aspect | Raw SDK | @effect/ai |
|--------|---------|------------|
| **Transport** | Manual stdio handling | `McpServer.layerStdio` built-in |
| **Tool Schema** | Zod + manual JSON Schema | `Tool.make` with Effect Schema |
| **Type Safety** | Manual type assertions | Full inference from Schema |
| **Error Handling** | try/catch | Tagged errors, Effect.catchTag |
| **Caching** | Manual TTL logic | `Effect.cachedWithTTL`, `Cache.make` |
| **Concurrency** | Promise.all | `Effect.forEach({ concurrency })` |
| **Logging** | console.log | `Logger.prettyLogger({ stderr })` |
| **Testing** | Mocking imports | Swap Layer in tests |
| **Service Access** | Global singletons | `yield* DbcService` in Effect.gen |

---

## Open Questions (Resolved)

1. ~~Shared Package~~ → Import SupabaseDbcService directly or copy
2. ~~Rate Limiting~~ → Schema.maxItems/between handles limits
3. ~~Response Format~~ → Tool.make success schema defines format
4. ~~Custom caching~~ → Use Effect.cachedWithTTL (not manual)
5. ~~MCP SDK abstraction~~ → Use @effect/ai McpServer (not raw SDK)
