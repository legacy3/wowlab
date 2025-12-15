/**
 * Dump Talent Tree Command
 *
 * Exports talent tree data following Blizzard's data structure.
 */

import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";

import type { TalentTree } from "./types.js";

import { supabaseClient } from "../../data/supabase.js";
import { generateHtml } from "./html-template.js";
import { getAllSpecs, getClasses, loadTalentTree } from "./loader.js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://api.wowlab.gg";

const specOption = Options.integer("spec").pipe(
  Options.withAlias("s"),
  Options.withDescription("Specialization ID to dump (omit for all specs)"),
  Options.optional,
);

const outputOption = Options.text("output").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path (JSON)"),
  Options.optional,
);

const prettyOption = Options.boolean("pretty").pipe(
  Options.withAlias("p"),
  Options.withDescription("Pretty-print JSON output"),
  Options.withDefault(false),
);

const htmlOption = Options.text("html").pipe(
  Options.withDescription("Output HTML viewer file path"),
  Options.optional,
);

export const dumpTalentTreeCommand = Command.make(
  "dump-talent-tree",
  {
    html: htmlOption,
    output: outputOption,
    pretty: prettyOption,
    spec: specOption,
  },
  ({ html, output, pretty, spec }) =>
    Effect.gen(function* () {
      yield* Effect.log("Starting talent tree dump...");

      const results: TalentTree[] = [];

      if (spec._tag === "Some") {
        // Dump single spec
        const specId = spec.value;

        yield* Effect.log(`Loading spec ${specId}...`);

        // Get spec info
        const allSpecs = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => getAllSpecs(supabaseClient),
        });

        const specInfo = allSpecs.find((s) => s.specId === specId);

        if (!specInfo) {
          yield* Effect.fail(new Error(`Spec ${specId} not found`));

          return;
        }

        // Get class name
        const classes = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => getClasses(supabaseClient),
        });

        const className = classes.get(specInfo.classId) ?? "Unknown";

        // Load tree
        const tree = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () =>
            loadTalentTree(
              supabaseClient,
              specId,
              specInfo.specName,
              specInfo.classId,
              className,
            ),
        });

        if (tree) {
          results.push(tree);
          yield* Effect.log(
            `Loaded ${className} ${specInfo.specName}: ${tree.nodes.length} nodes, ${tree.edges.length} edges`,
          );
        } else {
          yield* Effect.log(`No talent tree found for spec ${specId}`);
        }
      } else {
        // Dump all specs
        yield* Effect.log("Loading all specs...");

        const allSpecs = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => getAllSpecs(supabaseClient),
        });

        const classes = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => getClasses(supabaseClient),
        });

        // Sort by class ID, then spec name
        allSpecs.sort((a, b) => {
          if (a.classId !== b.classId) return a.classId - b.classId;

          return a.specName.localeCompare(b.specName);
        });

        yield* Effect.log(`Found ${allSpecs.length} specs`);

        for (const specInfo of allSpecs) {
          const className = classes.get(specInfo.classId) ?? "Unknown";

          process.stdout.write(`  ${className} / ${specInfo.specName}...`);

          const tree = yield* Effect.tryPromise({
            catch: (e) => new Error(String(e)),
            try: () =>
              loadTalentTree(
                supabaseClient,
                specInfo.specId,
                specInfo.specName,
                specInfo.classId,
                className,
              ),
          });

          if (tree) {
            results.push(tree);
            console.log(
              ` ${tree.nodes.length} nodes, ${tree.edges.length} edges`,
            );
          } else {
            console.log(" no tree");
          }
        }
      }

      // Output results
      if (results.length === 0) {
        yield* Effect.log("No talent trees found");

        return;
      }

      const jsonOutput = pretty
        ? JSON.stringify(results, null, 2)
        : JSON.stringify(results);

      if (output._tag === "Some") {
        yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: async () => {
            const fs = await import("node:fs/promises");

            await fs.writeFile(output.value, jsonOutput);
          },
        });

        yield* Effect.log(`JSON written to ${output.value}`);
      } else if (html._tag === "None") {
        console.log(jsonOutput);
      }

      // Generate HTML if requested
      if (html._tag === "Some") {
        if (results.length === 1) {
          const htmlContent = generateHtml(results[0], SUPABASE_URL);

          yield* Effect.tryPromise({
            catch: (e) => new Error(String(e)),
            try: async () => {
              const fs = await import("node:fs/promises");

              await fs.writeFile(html.value, htmlContent);
            },
          });

          yield* Effect.log(`HTML viewer written to ${html.value}`);
        } else {
          // Generate multiple HTML files
          for (const tree of results) {
            const filename = html.value.replace(
              /\.html$/,
              `-${tree.className.toLowerCase()}-${tree.specName.toLowerCase().replace(/\s+/g, "-")}.html`,
            );
            const htmlContent = generateHtml(tree, SUPABASE_URL);

            yield* Effect.tryPromise({
              catch: (e) => new Error(String(e)),
              try: async () => {
                const fs = await import("node:fs/promises");

                await fs.writeFile(filename, htmlContent);
              },
            });

            yield* Effect.log(`HTML viewer written to ${filename}`);
          }
        }
      }

      yield* Effect.log(`Done! Dumped ${results.length} talent tree(s)`);
    }),
);
