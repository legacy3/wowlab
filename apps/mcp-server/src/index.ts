#!/usr/bin/env node

import { McpServer } from "@effect/ai";
import { NodeRuntime, NodeSink, NodeStream } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { WowLabToolHandlers } from "./handlers.js";
import { SupabaseClientService, SupabaseDbcServiceLayer } from "./supabase.js";
import { WowLabToolkit } from "./toolkit.js";

// ============================================================================
// Server Configuration
// ============================================================================

const SERVER_NAME = "wowlab";
const SERVER_VERSION = "0.3.0";

// ============================================================================
// Main Server Layer
// ============================================================================

const McpServerLayer = McpServer.layerStdio({
  name: SERVER_NAME,
  stdin: NodeStream.stdin,
  stdout: NodeSink.stdout,
  version: SERVER_VERSION,
});

// Register toolkit with MCP server
const ToolkitLayer = Layer.effectDiscard(
  McpServer.registerToolkit(WowLabToolkit),
);

// Compose all layers
// WowLabToolHandlers already includes ExtractorService.Default
const ServerLayer = ToolkitLayer.pipe(
  // Provide tool handlers (includes ExtractorService)
  Layer.provide(WowLabToolHandlers),
  // Provide MCP server
  Layer.provide(McpServerLayer),
  // Provide database services
  Layer.provide(SupabaseDbcServiceLayer),
  Layer.provide(SupabaseClientService.Default),
  // Add stderr logging (MCP uses stdout for protocol)
  Layer.provide(Logger.minimumLogLevel(LogLevel.Info)),
);

// ============================================================================
// Entry Point
// ============================================================================

const main = Layer.launch(ServerLayer).pipe(
  Effect.catchAllCause((cause) =>
    Effect.sync(() => {
      console.error("Fatal error:", cause);
      process.exit(1);
    }),
  ),
);

NodeRuntime.runMain(main);
