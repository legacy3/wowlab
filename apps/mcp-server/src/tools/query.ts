import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";

import { supabase } from "../supabase.js";

// Filter value type for generic queries
const FilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.object({
    eq: z.union([z.string(), z.number(), z.boolean()]).optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    ilike: z.string().optional(),
    like: z.string().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
  }),
]);

export function registerQueryTools(server: McpServer) {
  // Generic spell query with filters
  server.registerTool(
    "query_spells",
    {
      description:
        "Query spells with flexible filters. Use get_spell_schema to see available columns. Supports equality, range (gte/lte), and pattern matching (like/ilike) filters.",
      inputSchema: {
        ascending: z
          .boolean()
          .optional()
          .default(true)
          .describe("Sort direction"),
        filters: z
          .record(FilterValueSchema)
          .optional()
          .describe(
            "Column filters as key-value pairs. Examples: {quality: 4}, {itemLevel: {gte: 60}}, {name: {ilike: 'fire'}}",
          ),
        limit: z.number().optional().default(10).describe("Maximum results"),
        orderBy: z
          .string()
          .optional()
          .describe("Column to sort by (e.g., 'name', 'itemLevel')"),
      },
      outputSchema: {
        spells: z.array(z.record(z.any())),
      },
      title: "Query Spells",
    },
    async ({ ascending = true, filters, limit = 10, orderBy }) => {
      let query = supabase.from("spell_data").select("*");

      // Apply filters dynamically
      if (filters) {
        for (const [column, value] of Object.entries(filters)) {
          if (typeof value === "object" && value !== null) {
            // Complex filter
            if (value.eq !== undefined) {
              query = query.eq(column, value.eq);
            }

            if (value.gt !== undefined) {
              query = query.gt(column, value.gt);
            }

            if (value.gte !== undefined) {
              query = query.gte(column, value.gte);
            }

            if (value.lt !== undefined) {
              query = query.lt(column, value.lt);
            }

            if (value.lte !== undefined) {
              query = query.lte(column, value.lte);
            }

            if (value.like !== undefined) {
              query = query.like(column, value.like);
            }

            if (value.ilike !== undefined) {
              query = query.ilike(column, `%${value.ilike}%`);
            }
          } else {
            // Simple equality filter
            query = query.eq(column, value);
          }
        }
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const output = { spells: data || [] };
      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );

  // Generic item query with filters
  server.registerTool(
    "query_items",
    {
      description:
        "Query items with flexible filters. Use get_item_schema to see available columns. Supports equality, range (gte/lte), and pattern matching (like/ilike) filters.",
      inputSchema: {
        ascending: z
          .boolean()
          .optional()
          .default(true)
          .describe("Sort direction"),
        filters: z
          .record(FilterValueSchema)
          .optional()
          .describe(
            "Column filters as key-value pairs. Examples: {quality: 4}, {itemLevel: {gte: 60}}, {name: {ilike: 'sword'}}",
          ),
        limit: z.number().optional().default(10).describe("Maximum results"),
        orderBy: z
          .string()
          .optional()
          .describe("Column to sort by (e.g., 'name', 'itemLevel')"),
      },
      outputSchema: {
        items: z.array(z.record(z.any())),
      },
      title: "Query Items",
    },
    async ({ ascending = true, filters, limit = 10, orderBy }) => {
      let query = supabase.from("item_data").select("*");

      // Apply filters dynamically
      if (filters) {
        for (const [column, value] of Object.entries(filters)) {
          if (typeof value === "object" && value !== null) {
            // Complex filter
            if (value.eq !== undefined) {
              query = query.eq(column, value.eq);
            }

            if (value.gt !== undefined) {
              query = query.gt(column, value.gt);
            }

            if (value.gte !== undefined) {
              query = query.gte(column, value.gte);
            }

            if (value.lt !== undefined) {
              query = query.lt(column, value.lt);
            }

            if (value.lte !== undefined) {
              query = query.lte(column, value.lte);
            }

            if (value.like !== undefined) {
              query = query.like(column, value.like);
            }

            if (value.ilike !== undefined) {
              query = query.ilike(column, `%${value.ilike}%`);
            }
          } else {
            // Simple equality filter
            query = query.eq(column, value);
          }
        }
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const output = { items: data || [] };

      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );
}
