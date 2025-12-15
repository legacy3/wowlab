import { Args, Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";
import { generateHtml } from "./html-template.js";
import { loadTalentTree } from "./loader.js";

const specIdArg = Args.integer({ name: "specId" }).pipe(
  Args.withDescription("The spec ID to dump the talent tree for"),
);

export const dumpTalentTreeCommand = Command.make(
  "dump-talent-tree",
  { specId: specIdArg },
  ({ specId }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Loading talent tree for spec ${specId}...`);

      const tree = yield* Effect.tryPromise({
        catch: (error) => {
          console.error("Failed to load talent tree:", error);
          return error as Error;
        },
        try: () => loadTalentTree(supabaseClient, specId),
      });

      yield* Effect.log(
        `Loaded: ${tree.className} - ${tree.specName} (${tree.nodes.length} nodes)`,
      );

      const supabaseUrl = process.env.SUPABASE_URL ?? "";
      const html = generateHtml(tree, supabaseUrl);
      const outputPath = `/tmp/talent-tree-${specId}.html`;

      const fs = yield* Effect.promise(() => import("node:fs/promises"));
      yield* Effect.tryPromise({
        catch: (e) => new Error(String(e)),
        try: () => fs.writeFile(outputPath, html),
      });

      yield* Effect.log(`Written to ${outputPath}`);
      yield* Effect.log(`Open: file://${outputPath}`);
    }),
);
