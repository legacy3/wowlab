import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";

import { supabase } from "../supabase.js";

export function registerSpellTools(server: McpServer) {
  // Search spells by name
  server.registerTool(
    "search_spells",
    {
      description:
        "Search for WoW spells by name. Returns matching spells with id, name, and description.",
      inputSchema: {
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Maximum number of results (max 50)"),
        query: z.string().describe("Search query to match against spell names"),
      },
      outputSchema: {
        spells: z.array(
          z.object({
            description: z.string(),
            id: z.number(),
            name: z.string(),
          }),
        ),
      },
      title: "Search Spells",
    },
    async ({ limit = 10, query }) => {
      const safeLimit = Math.min(limit, 50);

      const { data, error } = await supabase
        .from("spell_data")
        .select("id, name, description")
        .ilike("name", `%${query}%`)
        .limit(safeLimit);

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

  // Get single spell by ID
  server.registerTool(
    "get_spell",
    {
      description:
        "Get complete data for a single spell by ID. Returns all spell properties.",
      inputSchema: {
        id: z.number().describe("The spell ID"),
      },
      outputSchema: {
        spell: z.record(z.any()),
      },
      title: "Get Spell",
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("spell_data")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      const output = { spell: data };
      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );

  // Get multiple spells by IDs
  server.registerTool(
    "get_spells_batch",
    {
      description:
        "Get complete data for multiple spells by their IDs. More efficient than calling get_spell multiple times.",
      inputSchema: {
        ids: z.array(z.number()).describe("Array of spell IDs to retrieve"),
      },
      outputSchema: {
        spells: z.array(z.record(z.any())),
      },
      title: "Get Spells Batch",
    },
    async ({ ids }) => {
      const { data, error } = await supabase
        .from("spell_data")
        .select("*")
        .in("id", ids);

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
}
