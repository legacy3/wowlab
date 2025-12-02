import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { addCommand } from "./add.js";
import { listCommand } from "./list.js";
import { syncCommand } from "./sync.js";

export const changelogCommand = Command.make("changelog", {}, () =>
  Effect.log("Use: changelog add|sync|list"),
).pipe(Command.withSubcommands([addCommand, listCommand, syncCommand]));
