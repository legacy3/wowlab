import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";

import { supabase } from "../supabase.js";

export function registerSchemaTools(server: McpServer) {
  // Get spell table schema
  server.registerTool(
    "get_spell_schema",
    {
      description:
        "Get the schema/structure of the spell_data table. Returns all available columns and their data types that can be used for filtering.",
      inputSchema: {},
      outputSchema: {
        columns: z.array(
          z.object({
            column_name: z.string(),
            data_type: z.string(),
          }),
        ),
      },
      title: "Get Spell Schema",
    },
    async () => {
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type")
        .eq("table_name", "spell_data")
        .order("ordinal_position");

      if (error) {
        throw error;
      }

      const output = { columns: data || [] };

      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );

  // Get item table schema
  server.registerTool(
    "get_item_schema",
    {
      description:
        "Get the schema/structure of the item_data table. Returns all available columns and their data types that can be used for filtering.",
      inputSchema: {},
      outputSchema: {
        columns: z.array(
          z.object({
            column_name: z.string(),
            data_type: z.string(),
          }),
        ),
      },
      title: "Get Item Schema",
    },
    async () => {
      const { data, error } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type")
        .eq("table_name", "item_data")
        .order("ordinal_position");

      if (error) {
        throw error;
      }

      const output = { columns: data || [] };

      return {
        content: [{ text: JSON.stringify(output, null, 2), type: "text" }],
        structuredContent: output,
      };
    },
  );
}
