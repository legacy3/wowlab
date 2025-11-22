#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  registerItemTools,
  registerQueryTools,
  registerSchemaTools,
  registerSpellTools,
} from "./tools/index.js";

// Create server instance
const server = new McpServer({
  name: "wowlab-mcp",
  version: "0.2.0",
});

// Register all tools
registerSpellTools(server);
registerItemTools(server);
registerQueryTools(server);
registerSchemaTools(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WowLab MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
