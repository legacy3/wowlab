/**
 * Dump Talent Tree Command
 */

import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";

import type { TalentTree } from "./types.js";

import { supabaseClient } from "../../data/supabase.js";
import { generateHtml } from "./html-template.js";
import { applyLoadoutToTree, parseLoadoutString } from "./loadout.js";
import {
  GetAllClasses,
  GetAllSpecializations,
  GetNodeInfo,
  GetTraitTreeForSpec,
  GetTreeNodes,
  LoadTalentTree,
} from "./wow-api.js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://api.wowlab.gg";

const htmlOption = Options.text("html").pipe(
  Options.withDescription("Output HTML viewer file path"),
  Options.optional,
);

const loadoutOption = Options.text("loadout").pipe(
  Options.withAlias("l"),
  Options.withDescription("Talent loadout export string to overlay"),
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

const specOption = Options.integer("spec").pipe(
  Options.withAlias("s"),
  Options.withDescription("Specialization ID to dump (omit for all specs)"),
  Options.optional,
);

export const dumpTalentTreeCommand = Command.make(
  "dump-talent-tree",
  {
    html: htmlOption,
    loadout: loadoutOption,
    output: outputOption,
    pretty: prettyOption,
    spec: specOption,
  },
  ({ html, loadout, output, pretty, spec }) =>
    Effect.gen(function* () {
      yield* Effect.log("Starting talent tree dump ...");

      const results: TalentTree[] = [];

      if (spec._tag === "Some") {
        const specId = spec.value;
        yield* Effect.log(`Loading spec ${specId}...`);

        const allSpecs = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => GetAllSpecializations(supabaseClient),
        });

        const specInfo = allSpecs.find((s) => s.specID === specId);
        if (!specInfo) {
          yield* Effect.fail(new Error(`Spec ${specId} not found`));
          return;
        }

        const allClasses = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => GetAllClasses(supabaseClient),
        });

        const classInfo = allClasses.find(
          (c) => c.classID === specInfo.classID,
        );
        const className = classInfo?.name ?? "Unknown";

        const tree = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () =>
            LoadTalentTree(
              supabaseClient,
              specId,
              specInfo.name,
              specInfo.classID,
              className,
            ),
        });

        if (tree) {
          results.push(tree);
          yield* Effect.log(
            `Loaded ${className} ${specInfo.name}: ${tree.nodes.length} nodes`,
          );
        }
      } else {
        yield* Effect.log("Loading all specs ...");

        const allSpecs = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => GetAllSpecializations(supabaseClient),
        });

        const allClasses = yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => GetAllClasses(supabaseClient),
        });

        const classMap = new Map(allClasses.map((c) => [c.classID, c.name]));

        allSpecs.sort((a, b) => {
          if (a.classID !== b.classID) return a.classID - b.classID;
          return a.name.localeCompare(b.name);
        });

        for (const specInfo of allSpecs) {
          const className = classMap.get(specInfo.classID) ?? "Unknown";
          process.stdout.write(`  ${className} / ${specInfo.name}...`);

          const tree = yield* Effect.tryPromise({
            catch: (e) => new Error(String(e)),
            try: () =>
              LoadTalentTree(
                supabaseClient,
                specInfo.specID,
                specInfo.name,
                specInfo.classID,
                className,
              ),
          });

          if (tree) {
            results.push(tree);
            console.log(` ${tree.nodes.length} nodes`);
          } else {
            console.log(" no tree");
          }
        }
      }

      if (results.length === 0) {
        yield* Effect.log("No talent trees found");
        return;
      }

      // JSON output
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

      // HTML output
      if (html._tag === "Some") {
        let selectedNodeIds: Set<number> | null = null;
        let nodeChoices: Map<number, number> | null = null;
        let nodeRanks: Map<number, number> | null = null;

        // Parse loadout if provided
        if (loadout._tag === "Some" && results.length === 1) {
          const tree = results[0];

          try {
            // Get tree ID using exact WoW API
            const treeID = yield* Effect.tryPromise({
              catch: (e) => new Error(String(e)),
              try: () => GetTraitTreeForSpec(supabaseClient, tree.specId),
            });

            if (!treeID) {
              throw new Error(`No tree found for spec ${tree.specId}`);
            }

            // C_Traits.GetTreeNodes - ALL nodes, sorted ascending
            const allNodeIds = yield* Effect.tryPromise({
              catch: (e) => new Error(String(e)),
              try: () => GetTreeNodes(supabaseClient, treeID),
            });

            yield* Effect.log(
              `Tree ${treeID} has ${allNodeIds.length} total nodes`,
            );

            // Parse the loadout string
            const parsed = parseLoadoutString(loadout.value, allNodeIds);

            yield* Effect.log(
              `Loadout: version=${parsed.header.version}, specId=${parsed.header.specId}`,
            );
            yield* Effect.log(
              `Selected nodes in loadout: ${parsed.selectedNodes.size}`,
            );

            // Verify spec matches
            if (parsed.header.specId !== tree.specId) {
              yield* Effect.log(
                `Warning: Loadout spec ${parsed.header.specId} != tree spec ${tree.specId}`,
              );
            }

            // Get maxRanks for each node using exact WoW API
            const nodeMaxRanks = new Map<number, number>();
            for (const nodeId of parsed.selectedNodes.keys()) {
              const nodeInfo = yield* Effect.tryPromise({
                catch: (e) => new Error(String(e)),
                try: () => GetNodeInfo(supabaseClient, nodeId),
              });
              if (nodeInfo) {
                nodeMaxRanks.set(nodeId, nodeInfo.maxRanks);
              }
            }

            // Apply loadout
            const applied = applyLoadoutToTree(
              parsed.selectedNodes,
              nodeMaxRanks,
            );

            selectedNodeIds = new Set(applied.keys());
            nodeChoices = new Map();
            nodeRanks = new Map();

            for (const [nodeId, state] of applied) {
              if (state.choiceEntryIndex !== null) {
                nodeChoices.set(nodeId, state.choiceEntryIndex);
              }
              nodeRanks.set(nodeId, state.ranks);
            }

            yield* Effect.log(
              `Applied loadout: ${selectedNodeIds.size} talents selected`,
            );
          } catch (e) {
            yield* Effect.log(`Warning: Failed to parse loadout: ${e}`);
          }
        }

        if (results.length === 1) {
          const htmlContent = generateHtml(
            results[0],
            SUPABASE_URL,
            selectedNodeIds,
            nodeChoices,
            nodeRanks,
          );

          yield* Effect.tryPromise({
            catch: (e) => new Error(String(e)),
            try: async () => {
              const fs = await import("node:fs/promises");
              await fs.writeFile(html.value, htmlContent);
            },
          });

          yield* Effect.log(`HTML written to ${html.value}`);
        } else {
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

            yield* Effect.log(`HTML written to ${filename}`);
          }
        }
      }

      yield* Effect.log(`Done! Dumped ${results.length} talent tree(s)`);
    }),
);
