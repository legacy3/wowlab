/**
 * Debug Loadout Command - analyze loadout string parsing
 */

import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";

const loadoutOption = Options.text("loadout").pipe(
  Options.withAlias("l"),
  Options.withDescription("Talent loadout export string"),
);

const specOption = Options.integer("spec").pipe(
  Options.withAlias("s"),
  Options.withDescription("Specialization ID"),
);

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const debugLoadoutCommand = Command.make(
  "debug-loadout",
  { loadout: loadoutOption, spec: specOption },
  ({ loadout, spec }) =>
    Effect.gen(function* () {
      yield* Effect.log("=== Debug Loadout ===");
      yield* Effect.log(`Loadout string: ${loadout}`);
      yield* Effect.log(`Spec ID: ${spec}`);

      // Parse the loadout header
      const values: number[] = [];
      for (const char of loadout) {
        const idx = BASE64_CHARS.indexOf(char);
        if (idx === -1) {
          yield* Effect.log(`Invalid character: ${char}`);
          return;
        }
        values.push(idx);
      }

      yield* Effect.log(`\nString length: ${loadout.length}`);
      yield* Effect.log(`Total bits: ${loadout.length * 6}`);

      let bitPos = 0;
      function extractValue(bits: number): number {
        let result = 0;
        for (let i = 0; i < bits; i++) {
          const charIndex = Math.floor(bitPos / 6);
          const bitIndex = bitPos % 6;
          const bit = (values[charIndex] >> bitIndex) & 1;
          result |= bit << i;
          bitPos++;
        }
        return result;
      }

      const version = extractValue(8);
      const specId = extractValue(16);

      yield* Effect.log(`\n=== Header ===`);
      yield* Effect.log(`Version: ${version}`);
      yield* Effect.log(`Spec ID in loadout: ${specId}`);

      if (specId !== spec) {
        yield* Effect.log(
          `WARNING: Spec mismatch! Loadout is for ${specId}, not ${spec}`,
        );
      }

      // Skip tree hash
      extractValue(128);

      yield* Effect.log(`\nBit position after header: ${bitPos}`);
      yield* Effect.log(`Remaining bits: ${loadout.length * 6 - bitPos}`);

      // Get tree ID for this spec
      const { data: loadouts } = yield* Effect.tryPromise(() =>
        supabaseClient
          .schema("raw_dbc")
          .from("trait_tree_loadout")
          .select("TraitTreeID")
          .eq("ChrSpecializationID", spec),
      );

      if (!loadouts || loadouts.length === 0) {
        yield* Effect.log("No tree found for spec");
        return;
      }

      const treeIDs = [...new Set(loadouts.map((l: any) => l.TraitTreeID))];

      const { data: trees } = yield* Effect.tryPromise(() =>
        supabaseClient
          .schema("raw_dbc")
          .from("trait_tree")
          .select("ID, TraitSystemID")
          .in("ID", treeIDs),
      );

      const mainTree = (trees as any[])?.find((t) => t.TraitSystemID === 0);
      if (!mainTree) {
        yield* Effect.log("No main tree found");
        return;
      }

      yield* Effect.log(`\n=== Tree Info ===`);
      yield* Effect.log(`Main tree ID: ${mainTree.ID}`);

      // Get ALL nodes in this tree (this is what C_Traits.GetTreeNodes returns)
      const { data: allNodes } = yield* Effect.tryPromise(() =>
        supabaseClient
          .schema("raw_dbc")
          .from("trait_node")
          .select("ID")
          .eq("TraitTreeID", mainTree.ID)
          .order("ID", { ascending: true }),
      );

      const nodeIds = (allNodes as any[])?.map((n) => n.ID) ?? [];

      yield* Effect.log(`Total nodes in tree: ${nodeIds.length}`);
      yield* Effect.log(`First 5 node IDs: ${nodeIds.slice(0, 5).join(", ")}`);
      yield* Effect.log(`Last 5 node IDs: ${nodeIds.slice(-5).join(", ")}`);

      // Now parse the loadout content
      interface ParsedNode {
        nodeId: number;
        index: number;
        purchased: boolean;
        granted: boolean;
        partialRank?: number;
        isChoice: boolean;
        choiceIndex?: number;
      }

      const selectedNodes: ParsedNode[] = [];
      let nodeIndex = 0;

      yield* Effect.log(`\n=== Parsing Nodes ===`);

      while (nodeIndex < nodeIds.length && bitPos < loadout.length * 6) {
        const isSelected = extractValue(1) === 1;

        if (isSelected) {
          const isPurchased = extractValue(1) === 1;
          let partialRank: number | undefined;
          let isChoice = false;
          let choiceIndex: number | undefined;

          if (isPurchased) {
            const isPartial = extractValue(1) === 1;
            if (isPartial) {
              partialRank = extractValue(6);
            }
            isChoice = extractValue(1) === 1;
            if (isChoice) {
              choiceIndex = extractValue(2);
            }
          }

          selectedNodes.push({
            nodeId: nodeIds[nodeIndex],
            index: nodeIndex,
            purchased: isPurchased,
            granted: !isPurchased,
            partialRank,
            isChoice,
            choiceIndex,
          });
        }

        nodeIndex++;
      }

      yield* Effect.log(`Nodes parsed: ${nodeIndex}`);
      yield* Effect.log(`Nodes selected: ${selectedNodes.length}`);
      yield* Effect.log(`Final bit position: ${bitPos}`);

      // Get node details for selected nodes
      const selectedIds = selectedNodes.map((n) => n.nodeId);

      const { data: nodeDetails } = yield* Effect.tryPromise(() =>
        supabaseClient
          .schema("raw_dbc")
          .from("trait_node")
          .select("ID, TraitSubTreeID, Type")
          .in("ID", selectedIds),
      );

      const nodeDetailMap = new Map(
        (nodeDetails as any[])?.map((n) => [n.ID, n]) ?? [],
      );

      // Get subtree names
      const subTreeIds = [
        ...new Set(
          (nodeDetails as any[])
            ?.filter((n) => n.TraitSubTreeID > 0)
            .map((n) => n.TraitSubTreeID) ?? [],
        ),
      ];

      const { data: subTrees } = yield* Effect.tryPromise(() =>
        supabaseClient
          .schema("raw_dbc")
          .from("trait_sub_tree")
          .select("ID, Name_lang")
          .in("ID", subTreeIds),
      );

      const subTreeNames = new Map(
        (subTrees as any[])?.map((s) => [s.ID, s.Name_lang]) ?? [],
      );

      yield* Effect.log(`\n=== Selected Nodes ===`);

      // Group by subtree
      const bySubtree: Record<string, ParsedNode[]> = { "Class/Spec": [] };

      for (const node of selectedNodes) {
        const detail = nodeDetailMap.get(node.nodeId);
        const subTreeId = detail?.TraitSubTreeID;
        const subTreeName = subTreeId ? subTreeNames.get(subTreeId) : null;
        const key = subTreeName ?? "Class/Spec";

        if (!bySubtree[key]) bySubtree[key] = [];
        bySubtree[key].push(node);
      }

      for (const [group, nodes] of Object.entries(bySubtree)) {
        yield* Effect.log(`\n${group}: ${nodes.length} nodes`);
        for (const n of nodes.slice(0, 10)) {
          const detail = nodeDetailMap.get(n.nodeId);
          const type =
            detail?.Type === 2
              ? "choice"
              : detail?.Type === 3
                ? "subtree-sel"
                : "normal";
          const choice = n.isChoice ? ` choice=${n.choiceIndex}` : "";
          const partial =
            n.partialRank !== undefined ? ` ranks=${n.partialRank}` : "";
          const grant = n.granted ? " (granted)" : "";
          yield* Effect.log(
            `  Node ${n.nodeId} [idx=${n.index}] type=${type}${choice}${partial}${grant}`,
          );
        }
        if (nodes.length > 10) {
          yield* Effect.log(`  ... and ${nodes.length - 10} more`);
        }
      }

      yield* Effect.log(`\n=== Summary ===`);
      yield* Effect.log(`Selected node IDs: ${selectedIds.join(", ")}`);
    }),
);
