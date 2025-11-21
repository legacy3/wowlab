#!/usr/bin/env tsx

import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import * as Effect from "effect/Effect";

import { commands } from "./commands/index.js";

const mainCommand = Command.make("wowlab-standalone", {}, () =>
  Effect.log("Use --help to see available commands"),
).pipe(Command.withSubcommands(commands));

const cli = Command.run(mainCommand, {
  name: "WowLab Standalone CLI",
  version: "0.1.0",
});

cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
