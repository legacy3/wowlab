import { Tool, Toolkit } from "@effect/ai";
import * as Schema from "effect/Schema";

import {
  AllowedFunctionSchema,
  AllowedTableSchema,
  FilterSchema,
  FunctionCallResponseSchema,
  FunctionListResponseSchema,
  ItemBatchResponseSchema,
  ItemSearchResponseSchema,
  QueryTableResponseSchema,
  SchemaOutputSchema,
  SpellBatchResponseSchema,
  SpellSearchResponseSchema,
  StatusOutputSchema,
} from "./schemas.js";

export const GetSpell = Tool.make("get_spell", {
  description:
    "Get complete spell data when you have a spell ID. Returns timing, resources, range, damage, effects, and all computed fields. Use search_spells first if you only know the spell name.",
  parameters: {
    id: Schema.Number.annotations({ description: "The spell ID to look up" }),
  },
  success: Schema.Unknown,
})
  .annotate(Tool.Title, "Get Spell by ID")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetItem = Tool.make("get_item", {
  description:
    "Get complete item data when you have an item ID. Returns stats, effects, pricing, and all computed fields. Use search_items first if you only know the item name.",
  parameters: {
    id: Schema.Number.annotations({ description: "The item ID to look up" }),
  },
  success: Schema.Unknown,
})
  .annotate(Tool.Title, "Get Item by ID")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetSpellsBatch = Tool.make("get_spells_batch", {
  description:
    "Get multiple spells by ID in one request. Use this instead of multiple get_spell calls when you need data for several spells. Max 50 IDs per request.",
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({
        description: "Array of spell IDs to retrieve (max 50)",
      }),
    ),
  },
  success: SpellBatchResponseSchema,
})
  .annotate(Tool.Title, "Get Multiple Spells")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetItemsBatch = Tool.make("get_items_batch", {
  description:
    "Get multiple items by ID in one request. Use this instead of multiple get_item calls when you need data for several items. Max 50 IDs per request.",
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({
        description: "Array of item IDs to retrieve (max 50)",
      }),
    ),
  },
  success: ItemBatchResponseSchema,
})
  .annotate(Tool.Title, "Get Multiple Items")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const SearchSpells = Tool.make("search_spells", {
  description:
    "Find spells by name when you don't know the spell ID. Returns matching spell IDs, names, and descriptions. Use this first, then get_spell for full details.",
  parameters: {
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 50),
        Schema.annotations({
          description: "Maximum results (default 10, max 50)",
        }),
      ),
    ),
    query: Schema.String.annotations({
      description: "Spell name to search for (partial match)",
    }),
  },
  success: SpellSearchResponseSchema,
})
  .annotate(Tool.Title, "Search Spells by Name")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const SearchItems = Tool.make("search_items", {
  description:
    "Find items by name when you don't know the item ID. Returns matching item IDs, names, and descriptions. Use this first, then get_item for full details.",
  parameters: {
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 50),
        Schema.annotations({
          description: "Maximum results (default 10, max 50)",
        }),
      ),
    ),
    query: Schema.String.annotations({
      description: "Item name to search for (partial match)",
    }),
  },
  success: ItemSearchResponseSchema,
})
  .annotate(Tool.Title, "Search Items by Name")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const QueryTable = Tool.make("query_table", {
  description:
    "Query raw DBC database tables directly. Only use this for advanced lookups when get_spell/get_item don't provide the data you need. Call get_schema first to see available tables and columns.",
  parameters: {
    ascending: Schema.optional(
      Schema.Boolean.annotations({
        description: "Sort direction (default: true)",
      }),
    ),
    filters: Schema.optional(
      FilterSchema.annotations({
        description:
          "Column filters. Examples: {quality: 4}, {itemLevel: {gte: 60}}, {name: {ilike: 'fire'}}",
      }),
    ),
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 100),
        Schema.annotations({
          description: "Maximum rows (default 10, max 100)",
        }),
      ),
    ),
    orderBy: Schema.optional(
      Schema.String.annotations({ description: "Column to sort by" }),
    ),
    select: Schema.optional(
      Schema.Array(Schema.String).annotations({
        description: "Columns to return (default: all)",
      }),
    ),
    table: AllowedTableSchema.annotations({
      description: "Table name from get_schema",
    }),
  },
  success: QueryTableResponseSchema,
})
  .annotate(Tool.Title, "Query Raw Database Table")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetSchema = Tool.make("get_schema", {
  description:
    "Discover available database tables and their columns. Call without parameters to list all tables. Call with a table name to see its columns. Use before query_table.",
  parameters: {
    table: Schema.optional(
      Schema.String.annotations({
        description: "Table name (omit to list all tables)",
      }),
    ),
  },
  success: SchemaOutputSchema,
})
  .annotate(Tool.Title, "Get Database Schema")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const CallFunction = Tool.make("call_function", {
  description:
    "Compute derived spell/item values like damage, cooldowns, or scaling coefficients. Call list_functions first to see available functions and required parameters.",
  parameters: {
    args: Schema.Record({
      key: Schema.String,
      value: Schema.Unknown,
    }).annotations({
      description: "Function arguments (see list_functions for required args)",
    }),
    function: AllowedFunctionSchema.annotations({
      description: "Function name from list_functions",
    }),
  },
  success: FunctionCallResponseSchema,
})
  .annotate(Tool.Title, "Call Extractor Function")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const ListFunctions = Tool.make("list_functions", {
  description:
    "List available extractor functions for computing derived spell/item data. Shows function signatures and descriptions. Call this before using call_function.",
  parameters: {
    function: Schema.optional(
      Schema.String.annotations({
        description: "Filter by function name (optional)",
      }),
    ),
  },
  success: FunctionListResponseSchema,
})
  .annotate(Tool.Title, "List Available Functions")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetStatus = Tool.make("get_status", {
  description:
    "Check if the server is healthy and connected to the database. Use this to diagnose connection issues or verify the server is working.",
  parameters: {},
  success: StatusOutputSchema,
})
  .annotate(Tool.Title, "Check Server Status")
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

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
  GetStatus,
);

export type WowLabToolkitType = typeof WowLabToolkit;
