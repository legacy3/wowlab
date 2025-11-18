#!/usr/bin/env tsx

import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { config } from "dotenv";
import * as Effect from "effect/Effect";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

function loadEnvironment(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(__dirname, ".env");

  config({ path: envPath });
}

// Load environment variables first
loadEnvironment();

// Import commands after env is loaded
import { commands } from "./commands/index.js";

const mainCommand = Command.make("lib-innocent", {}, () =>
  Effect.log("Use --help to see available commands"),
).pipe(Command.withSubcommands(commands));

const cli = Command.run(mainCommand, {
  name: "lib-innocent CLI",
  version: "1.0.0",
});

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
