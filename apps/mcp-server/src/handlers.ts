import {
  DbcService,
  ExtractorService,
  transformItem,
  transformSpell,
} from "@wowlab/services/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { FUNCTION_HANDLERS, getFunctionMetadata } from "./functions.js";
import {
  ALLOWED_FUNCTIONS,
  ALLOWED_TABLES,
  type AllowedFunction,
  type AllowedTable,
} from "./schemas.js";
import {
  getTableSchema,
  queryTable,
  searchItems,
  searchSpells,
  SupabaseClientService,
} from "./supabase.js";
import { WowLabToolkit } from "./toolkit.js";

// ============================================================================
// Handler Implementations via Toolkit.toLayer
// ============================================================================

// Note: toLayer receives an Effect that creates handlers. The handlers themselves
// can access services from context, but those services must be provided to the layer.
export const WowLabToolHandlers = WowLabToolkit.toLayer(
  Effect.gen(function* () {
    const { client } = yield* SupabaseClientService;
    // Access services we'll need for the handlers
    const dbc = yield* DbcService;
    const extractor = yield* ExtractorService;

    return {
      // Get a single spell by ID - use provideService to inject the services
      get_spell: ({ id }) =>
        transformSpell(id).pipe(
          Effect.provideService(DbcService, dbc),
          Effect.provideService(ExtractorService, extractor),
          Effect.catchAll((e) =>
            Effect.succeed({
              error: `Failed to get spell ${id}: ${String(e)}`,
            }),
          ),
        ),

      // Get a single item by ID
      get_item: ({ id }) =>
        transformItem(id).pipe(
          Effect.provideService(DbcService, dbc),
          Effect.provideService(ExtractorService, extractor),
          Effect.catchAll((e) =>
            Effect.succeed({ error: `Failed to get item ${id}: ${String(e)}` }),
          ),
        ),

      // Get multiple spells by ID
      get_spells_batch: ({ ids }) =>
        Effect.forEach(
          ids,
          (id) =>
            transformSpell(id).pipe(
              Effect.provideService(DbcService, dbc),
              Effect.provideService(ExtractorService, extractor),
              Effect.catchAll((e) =>
                Effect.succeed({
                  error: `Spell ${id} error: ${String(e)}`,
                  id,
                }),
              ),
            ),
          { concurrency: 10 },
        ).pipe(Effect.map((spells) => ({ count: spells.length, spells }))),

      // Get multiple items by ID
      get_items_batch: ({ ids }) =>
        Effect.forEach(
          ids,
          (id) =>
            transformItem(id).pipe(
              Effect.provideService(DbcService, dbc),
              Effect.provideService(ExtractorService, extractor),
              Effect.catchAll((e) =>
                Effect.succeed({ error: `Item ${id} error: ${String(e)}`, id }),
              ),
            ),
          { concurrency: 10 },
        ).pipe(Effect.map((items) => ({ count: items.length, items }))),

      // Search spells by name
      search_spells: ({ limit, query }) =>
        searchSpells(client, query, limit ?? 10).pipe(
          Effect.map((results) => ({ count: results.length, results })),
          Effect.catchAll((e) =>
            Effect.succeed({
              count: 0,
              results: [
                { description: `Error: ${String(e)}`, id: 0, name: "Error" },
              ],
            }),
          ),
        ),

      // Search items by name
      search_items: ({ limit, query }) =>
        searchItems(client, query, limit ?? 10).pipe(
          Effect.map((results) => ({ count: results.length, results })),
          Effect.catchAll((e) =>
            Effect.succeed({
              count: 0,
              results: [
                { description: `Error: ${String(e)}`, id: 0, name: "Error" },
              ],
            }),
          ),
        ),

      // Query raw DBC tables
      query_table: ({ ascending, filters, limit, orderBy, select, table }) => {
        // Validate table is allowed
        if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
          return Effect.succeed({
            count: 0,
            rows: [
              {
                error: `Table '${table}' is not allowed. Use get_schema to see available tables.`,
              } as Record<string, unknown>,
            ],
          });
        }

        return queryTable(client, {
          ascending,
          filters,
          limit,
          orderBy,
          select: select ? [...select] : undefined, // Convert readonly to mutable
          table,
        }).pipe(
          Effect.map((rows) => ({
            count: rows.length,
            rows: rows as Array<Record<string, unknown>>,
          })),
          Effect.catchAll((e) =>
            Effect.succeed({
              count: 0,
              rows: [
                { error: `Query error: ${String(e)}` } as Record<
                  string,
                  unknown
                >,
              ],
            }),
          ),
        );
      },

      // Get table schema
      get_schema: ({ table }) => {
        if (!table) {
          // Return list of available tables (wrapped in object)
          return Effect.succeed({ tables: [...ALLOWED_TABLES] });
        }

        // Validate table is allowed
        if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
          return Effect.succeed({
            columns: [],
            table: `Table '${table}' is not allowed. Available tables: ${ALLOWED_TABLES.join(", ")}`,
          });
        }

        return getTableSchema(client, table).pipe(
          Effect.catchAll((e) =>
            Effect.succeed({ columns: [], table: `Error: ${String(e)}` }),
          ),
        );
      },

      // Call an extractor function
      call_function: ({ args, function: fn }) => {
        // Validate function is allowed
        if (!ALLOWED_FUNCTIONS.includes(fn as AllowedFunction)) {
          return Effect.succeed({
            result: {
              allowed: ALLOWED_FUNCTIONS,
              error: `Function '${fn}' is not allowed. Use list_functions to see available functions.`,
            },
          });
        }

        const handler = FUNCTION_HANDLERS[fn as AllowedFunction];
        // Cast to proper Effect type after providing services
        const effect = handler(args).pipe(
          Effect.provideService(DbcService, dbc),
          Effect.provideService(ExtractorService, extractor),
        ) as Effect.Effect<unknown, unknown, never>;

        return effect.pipe(
          // Wrap result in object for MCP structuredContent compatibility
          Effect.map((result) => ({ result })),
          Effect.catchAll((e) =>
            Effect.succeed({
              result: {
                cause: String(e),
                error: `Function call failed`,
                function: fn,
              },
            }),
          ),
        );
      },

      // List available functions
      list_functions: ({ function: filter }) => {
        const functions = getFunctionMetadata(filter);
        return Effect.succeed({ count: functions.length, functions });
      },

      // Get server status
      get_status: () =>
        Effect.gen(function* () {
          // Test connection with a simple query
          const startTime = Date.now();
          let connected = false;
          let latencyMs: number | undefined;

          try {
            const result = yield* Effect.tryPromise({
              catch: () => new Error("Connection failed"),
              try: () =>
                client
                  .schema("raw_dbc")
                  .from("spell_name")
                  .select("ID")
                  .limit(1),
            });

            connected = !result.error;
            latencyMs = Date.now() - startTime;
          } catch {
            connected = false;
          }

          return {
            status: connected ? ("healthy" as const) : ("unhealthy" as const),
            supabase: {
              connected,
              latencyMs,
            },
            timestamp: new Date().toISOString(),
            version: "0.5.0",
          };
        }).pipe(
          Effect.catchAll(() =>
            Effect.succeed({
              status: "unhealthy" as const,
              supabase: { connected: false },
              timestamp: new Date().toISOString(),
              version: "0.5.0",
            }),
          ),
        ),
    };
  }),
).pipe(
  // Provide the services that handlers need
  Layer.provide(ExtractorService.Default),
);
