#!/usr/bin/env tsx

import { Command } from "@effect/cli";
import { NodeContext } from "@effect/platform-node";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { commands } from "./commands/index.js";
import { printFormattedError } from "./utils/error-formatter.js";

const mainCommand = Command.make("wowlab-standalone", {}, () =>
  Effect.log("Use --help to see available commands"),
).pipe(Command.withSubcommands(commands));

const cli = Command.run(mainCommand, {
  name: "WowLab Standalone CLI",
  version: "0.1.0",
});

const program = cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(Logger.minimumLogLevel(LogLevel.Info)),
);

Effect.runPromiseExit(program).then((exit) => {
  if (Exit.isFailure(exit)) {
    printFormattedError(exit);
    process.exit(1);
  }
});
