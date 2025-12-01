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
    "Get complete spell data by ID. Returns all spell properties including timing, resources, range, damage, and effects.",
  parameters: {
    id: Schema.Number.annotations({ description: "The spell ID to look up" }),
  },
  success: Schema.Unknown, // SpellDataFlat - using Unknown for flexibility
});

export const GetItem = Tool.make("get_item", {
  description:
    "Get complete item data by ID. Returns all item properties including stats, effects, and pricing.",
  parameters: {
    id: Schema.Number.annotations({ description: "The item ID to look up" }),
  },
  success: Schema.Unknown, // ItemDataFlat - using Unknown for flexibility
});

export const GetSpellsBatch = Tool.make("get_spells_batch", {
  description:
    "Get multiple spells by ID in a single request. More efficient than calling get_spell multiple times.",
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({
        description: "Array of spell IDs to retrieve (max 50)",
      }),
    ),
  },
  success: SpellBatchResponseSchema,
});

export const GetItemsBatch = Tool.make("get_items_batch", {
  description:
    "Get multiple items by ID in a single request. More efficient than calling get_item multiple times.",
  parameters: {
    ids: Schema.Array(Schema.Number).pipe(
      Schema.maxItems(50),
      Schema.annotations({
        description: "Array of item IDs to retrieve (max 50)",
      }),
    ),
  },
  success: ItemBatchResponseSchema,
});

export const SearchSpells = Tool.make("search_spells", {
  description:
    "Search for spells by name. Returns matching spells with id, name, and description.",
  parameters: {
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 50),
        Schema.annotations({
          description: "Maximum number of results (default 10, max 50)",
        }),
      ),
    ),
    query: Schema.String.annotations({
      description: "Search term to match against spell names",
    }),
  },
  success: SpellSearchResponseSchema,
});

export const SearchItems = Tool.make("search_items", {
  description:
    "Search for items by name. Returns matching items with id, name, and description.",
  parameters: {
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 50),
        Schema.annotations({
          description: "Maximum number of results (default 10, max 50)",
        }),
      ),
    ),
    query: Schema.String.annotations({
      description: "Search term to match against item names",
    }),
  },
  success: ItemSearchResponseSchema,
});

export const QueryTable = Tool.make("query_table", {
  description:
    "Query raw DBC tables with filters. Use get_schema to see available tables and columns.",
  parameters: {
    ascending: Schema.optional(
      Schema.Boolean.annotations({
        description: "Sort direction (default: true)",
      }),
    ),
    filters: Schema.optional(
      FilterSchema.annotations({
        description:
          "Column filters as key-value pairs. Examples: {quality: 4}, {itemLevel: {gte: 60}}, {name: {ilike: 'fire'}}",
      }),
    ),
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.between(1, 100),
        Schema.annotations({
          description: "Maximum number of rows (default 10, max 100)",
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
      description:
        "Table name (use get_schema without table param to list all)",
    }),
  },
  success: QueryTableResponseSchema,
});

export const GetSchema = Tool.make("get_schema", {
  description:
    "Get table schema information. Without a table name, returns list of available tables. With a table name, returns column details.",
  parameters: {
    table: Schema.optional(
      Schema.String.annotations({
        description:
          "Table name to get schema for (omit for list of all tables)",
      }),
    ),
  },
  success: SchemaOutputSchema,
});

export const CallFunction = Tool.make("call_function", {
  description:
    "Call an extractor function to compute derived spell/item data. Use list_functions to see available functions and their parameters.",
  parameters: {
    args: Schema.Record({
      key: Schema.String,
      value: Schema.Unknown,
    }).annotations({
      description: "Function arguments as key-value pairs",
    }),
    function: AllowedFunctionSchema.annotations({
      description: "Function name (use list_functions to see available)",
    }),
  },
  success: FunctionCallResponseSchema,
});

export const ListFunctions = Tool.make("list_functions", {
  description:
    "List available extractor functions with their signatures and descriptions.",
  parameters: {
    function: Schema.optional(
      Schema.String.annotations({
        description: "Filter to a specific function name",
      }),
    ),
  },
  success: FunctionListResponseSchema,
});

export const GetStatus = Tool.make("get_status", {
  description:
    "Check server health and connection status. Use this to verify the server is working.",
  parameters: {},
  success: StatusOutputSchema,
});

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
