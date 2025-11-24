import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";

import { supabase } from "../supabase.js";

export function registerItemTools(server: McpServer) {
  // Search items by name
  server.registerTool(
    "search_items",
    {
      description:
        "Search for WoW items by name. Returns matching items with id, name, and description.",
      inputSchema: {
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Maximum number of results (max 50)"),
        query: z.string().describe("Search query to match against item names"),
      },
      outputSchema: {
        items: z.array(
          z.object({
            description: z.string(),
            id: z.number(),
            name: z.string(),
          }),
        ),
      },
      title: "Search Items",
    },
    async ({ limit = 10, query }) => {
      const safeLimit = Math.min(limit, 50);

      const { data, error } = await supabase
        .from("item_data")
        .select("id, name, description")
        .ilike("name", `%${query}%`)
        .limit(safeLimit);

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

  // Get single item by ID
  server.registerTool(
    "get_item",
    {
      description:
        "Get complete data for a single item by ID. Returns all item properties.",
      inputSchema: {
        id: z.number().describe("The item ID"),
      },
      outputSchema: {
        item: z.record(z.any()),
      },
      title: "Get Item",
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("item_data")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      const output = { item: data };
      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );

  // Get multiple items by IDs
  server.registerTool(
    "get_items_batch",
    {
      description:
        "Get complete data for multiple items by their IDs. More efficient than calling get_item multiple times.",
      inputSchema: {
        ids: z.array(z.number()).describe("Array of item IDs to retrieve"),
      },
      outputSchema: {
        items: z.array(z.record(z.any())),
      },
      title: "Get Items Batch",
    },
    async ({ ids }) => {
      const { data, error } = await supabase
        .from("item_data")
        .select("*")
        .in("id", ids);

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
