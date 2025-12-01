#!/usr/bin/env node

import { McpServer } from "@effect/ai";
import { NodeRuntime, NodeSink, NodeStream } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import { createRequire } from "module";

import { WowLabToolHandlers } from "./handlers.js";
import { SupabaseClientService, SupabaseDbcServiceLayer } from "./supabase.js";
import { WowLabToolkit } from "./toolkit.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

const McpServerLayer = McpServer.layerStdio({
  name: "wowlab",
  stdin: NodeStream.stdin,
  stdout: NodeSink.stdout,
  version: pkg.version,
});

const ToolkitLayer = Layer.effectDiscard(
  McpServer.registerToolkit(WowLabToolkit),
);

const ServerLayer = ToolkitLayer.pipe(
  Layer.provide(WowLabToolHandlers),
  Layer.provide(McpServerLayer),
  Layer.provide(SupabaseDbcServiceLayer),
  Layer.provide(SupabaseClientService.Default),
  Layer.provide(Logger.minimumLogLevel(LogLevel.Info)),
);

const main = Layer.launch(ServerLayer).pipe(
  Effect.catchAllCause((cause) =>
    Effect.sync(() => {
      console.error("Fatal error:", cause);
      process.exit(1);
    }),
  ),
);

NodeRuntime.runMain(main);
