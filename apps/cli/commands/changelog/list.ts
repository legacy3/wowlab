import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { readChangelog } from "./shared.js";

const listProgram = Effect.gen(function* () {
  const entries = yield* readChangelog;

  if (entries.length === 0) {
    yield* Effect.logInfo("No changelog entries found");
    return;
  }

  for (const entry of entries) {
    console.log(`\n## ${entry.version} (${entry.date})`);
    for (const change of entry.changes) {
      const desc = change.description ? ` - ${change.description}` : "";
      console.log(`  [${change.type}] ${change.title}${desc}`);
    }
  }
});

export const listCommand = Command.make("list", {}, () => listProgram);
