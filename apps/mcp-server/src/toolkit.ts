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
  description: `WHEN: You have a spell ID and need full details.
NOT IF: You only have a name → use search_spells first.
Returns: id, name, description, timing, resources, range, damage, effects.`,
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
  description: `WHEN: You have an item ID and need full details.
NOT IF: You only have a name → use search_items first.
Returns: id, name, description, stats, effects, pricing.`,
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
  description: `WHEN: You need full details for multiple spells (2+) and have their IDs.
USE INSTEAD OF: Multiple get_spell calls.
Returns: Array of spell objects (max 50).`,
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
  description: `WHEN: You need full details for multiple items (2+) and have their IDs.
USE INSTEAD OF: Multiple get_item calls.
Returns: Array of item objects (max 50).`,
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
  description: `WHEN: You know a spell name but not its ID.
WORKFLOW: search_spells → get ID from results → get_spell(id) for full details.
NOT IF: You already have the spell ID → use get_spell directly.
Returns: Array of {id, name, description}.`,
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
  description: `WHEN: You know an item name but not its ID.
WORKFLOW: search_items → get ID from results → get_item(id) for full details.
NOT IF: You already have the item ID → use get_item directly.
Returns: Array of {id, name, description}.`,
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
  description: `WHEN: get_spell/get_item don't have the data you need.
REQUIRES: Call get_schema first to see available tables/columns.
NOT IF: You just need spell or item data → use get_spell/get_item.
Returns: Array of rows with selected columns.`,
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
  description: `WHEN: You need to use query_table but don't know the schema.
WORKFLOW: get_schema() → list tables → get_schema(table) → see columns → query_table.
Returns: Tables list (no param) or columns for a specific table.`,
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
  description: `WHEN: You need computed values (damage, cooldowns, scaling) not in raw data.
REQUIRES: Call list_functions first to see available functions and args.
Returns: Computed value or data object.`,
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
  description: `WHEN: You need to use call_function but don't know available functions.
WORKFLOW: list_functions → pick function → call_function with correct args.
Returns: Function names, signatures, and descriptions.`,
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
  description: `WHEN: Diagnosing connection issues or verifying server health.
NOT IF: You just want to query data → use other tools directly.
Returns: Server status and DB connection state.`,
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
