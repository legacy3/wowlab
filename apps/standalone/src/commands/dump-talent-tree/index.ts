import { Args, Command, Options } from "@effect/cli";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";

const specIdArg = Args.integer({ name: "specId" }).pipe(
  Args.withDescription("The spec ID to dump the talent tree for"),
);

const outputOption = Options.text("output").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path (optional)"),
  Options.optional,
);

const formatOption = Options.choice("format", ["visual", "json", "nodes"]).pipe(
  Options.withAlias("f"),
  Options.withDescription("Output format: visual, json, or nodes"),
  Options.withDefault("visual"),
);

// Direct Supabase query helpers
const query = async <T>(
  supabase: SupabaseClient,
  table: string,
  fn: (
    builder: ReturnType<ReturnType<SupabaseClient["schema"]>["from"]>,
  ) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> => {
  const result = await fn(supabase.schema("raw_dbc").from(table));
  if (result.error) {
    throw new Error(`Query error on ${table}: ${result.error.message}`);
  }
  return result.data as T;
};

// Types for raw DBC data
interface ChrSpecialization {
  ID: number;
  ClassID: number;
  Name_lang: string | null;
}

interface ChrClass {
  ID: number;
  Name_lang: string | null;
}

interface TraitTreeLoadout {
  ID: number;
  TraitTreeID: number;
  ChrSpecializationID: number;
}

interface TraitTreeLoadoutEntry {
  ID: number;
  TraitTreeLoadoutID: number;
  SelectedTraitNodeID: number;
  OrderIndex: number;
}

interface TraitNode {
  ID: number;
  TraitTreeID: number;
  TraitSubTreeID: number;
  PosX: number;
  PosY: number;
  Type: number;
}

interface TraitEdge {
  ID: number;
  LeftTraitNodeID: number;
  RightTraitNodeID: number;
  VisualStyle: number;
}

interface TraitSubTree {
  ID: number;
  Name_lang: string | null;
  Description_lang: string | null;
}

interface TraitNodeXTraitNodeEntry {
  ID: number;
  TraitNodeID: number;
  TraitNodeEntryID: number;
}

interface TraitNodeEntry {
  ID: number;
  TraitDefinitionID: number;
  MaxRanks: number;
}

interface TraitDefinition {
  ID: number;
  SpellID: number;
  OverrideName_lang: string | null;
  OverrideDescription_lang: string | null;
  OverrideIcon: number;
}

interface SpellName {
  ID: number;
  Name_lang: string | null;
}

interface Spell {
  ID: number;
  Description_lang: string | null;
}

interface ManifestInterfaceData {
  ID: number;
  FilePath: string | null;
  FileName: string | null;
}

// Transformed output types
interface TalentNodeEntry {
  id: number;
  definitionId: number;
  name: string;
  description: string;
  iconFileName: string;
  spellId: number;
}

interface TalentNode {
  id: number;
  posX: number;
  posY: number;
  type: number;
  subTreeId: number;
  orderIndex: number;
  maxRanks: number;
  entries: TalentNodeEntry[];
}

interface TalentEdge {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  visualStyle: number;
}

interface TalentSubTree {
  id: number;
  name: string;
  description: string;
}

interface TalentTree {
  specId: number;
  specName: string;
  className: string;
  treeId: number;
  nodes: TalentNode[];
  edges: TalentEdge[];
  subTrees: TalentSubTree[];
}

// Load talent tree with direct Supabase queries
const loadTalentTreeDirect = async (
  supabase: SupabaseClient,
  specId: number,
): Promise<TalentTree> => {
  // 1. Get spec info
  const spec = await query<ChrSpecialization | null>(
    supabase,
    "chr_specialization",
    (b) => b.select("*").eq("ID", specId).maybeSingle(),
  );
  if (!spec) {
    throw new Error(`Spec ${specId} not found`);
  }

  const chrClass = await query<ChrClass | null>(supabase, "chr_classes", (b) =>
    b.select("*").eq("ID", spec.ClassID).maybeSingle(),
  );
  if (!chrClass) {
    throw new Error(`Class ${spec.ClassID} not found`);
  }

  // 2. Get loadout for ordering (take first if multiple exist)
  const loadouts = await query<TraitTreeLoadout[]>(
    supabase,
    "trait_tree_loadout",
    (b) => b.select("*").eq("ChrSpecializationID", specId).limit(1),
  );
  const loadout = loadouts[0];
  if (!loadout) {
    throw new Error(`Loadout for spec ${specId} not found`);
  }

  const loadoutEntries = await query<TraitTreeLoadoutEntry[]>(
    supabase,
    "trait_tree_loadout_entry",
    (b) =>
      b
        .select("*")
        .eq("TraitTreeLoadoutID", loadout.ID)
        .order("OrderIndex"),
  );

  // 3. Build orderIndex map
  const orderIndexMap = new Map<number, number>();
  for (const entry of loadoutEntries) {
    orderIndexMap.set(entry.SelectedTraitNodeID, entry.OrderIndex);
  }

  // 4. Get all nodes for this tree
  const treeNodes = await query<TraitNode[]>(supabase, "trait_node", (b) =>
    b.select("*").eq("TraitTreeID", loadout.TraitTreeID),
  );

  // 5. Get edges - filter by nodes in this tree
  const nodeIds = treeNodes.map((n) => n.ID);
  const allEdges = await query<TraitEdge[]>(supabase, "trait_edge", (b) =>
    b.select("*").in("LeftTraitNodeID", nodeIds),
  );
  const edges = allEdges.filter((e) => nodeIds.includes(e.RightTraitNodeID));

  // 6. Get unique subTrees
  const subTreeIds = [
    ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
  ];

  const subTrees: TalentSubTree[] = [];
  for (const subTreeId of subTreeIds) {
    const subTree = await query<TraitSubTree | null>(
      supabase,
      "trait_sub_tree",
      (b) => b.select("*").eq("ID", subTreeId).maybeSingle(),
    );
    if (subTree) {
      subTrees.push({
        id: subTree.ID,
        name: subTree.Name_lang ?? "",
        description: subTree.Description_lang ?? "",
      });
    }
  }

  // 7. Get all nodeXEntries
  const allNodeXEntries = await query<TraitNodeXTraitNodeEntry[]>(
    supabase,
    "trait_node_x_trait_node_entry",
    (b) => b.select("*").in("TraitNodeID", nodeIds),
  );

  // 8. Get all trait node entries
  const entryIds = [...new Set(allNodeXEntries.map((x) => x.TraitNodeEntryID))];
  const allEntries = await query<TraitNodeEntry[]>(
    supabase,
    "trait_node_entry",
    (b) => b.select("*").in("ID", entryIds),
  );
  const entryMap = new Map(allEntries.map((e) => [e.ID, e]));

  // 9. Get all trait definitions
  const definitionIds = [...new Set(allEntries.map((e) => e.TraitDefinitionID))];
  const allDefinitions = await query<TraitDefinition[]>(
    supabase,
    "trait_definition",
    (b) => b.select("*").in("ID", definitionIds),
  );
  const definitionMap = new Map(allDefinitions.map((d) => [d.ID, d]));

  // 10. Get spell names and descriptions for all spells
  const spellIds = [
    ...new Set(allDefinitions.map((d) => d.SpellID).filter((id) => id > 0)),
  ];
  const [allSpellNames, allSpells] = await Promise.all([
    query<SpellName[]>(supabase, "spell_name", (b) =>
      b.select("*").in("ID", spellIds),
    ),
    query<Spell[]>(supabase, "spell", (b) => b.select("*").in("ID", spellIds)),
  ]);
  const spellNameMap = new Map(allSpellNames.map((s) => [s.ID, s]));
  const spellMap = new Map(allSpells.map((s) => [s.ID, s]));

  // 11. Get icons from manifest_interface_data
  const iconIds = [
    ...new Set(
      allDefinitions.map((d) => d.OverrideIcon).filter((id) => id > 0),
    ),
  ];
  const allIcons =
    iconIds.length > 0
      ? await query<ManifestInterfaceData[]>(
          supabase,
          "manifest_interface_data",
          (b) => b.select("*").in("ID", iconIds),
        )
      : [];
  const iconMap = new Map(allIcons.map((i) => [i.ID, i]));

  // 12. Build nodes
  const nodeXEntriesByNode = new Map<number, TraitNodeXTraitNodeEntry[]>();
  for (const nxe of allNodeXEntries) {
    const existing = nodeXEntriesByNode.get(nxe.TraitNodeID) ?? [];
    existing.push(nxe);
    nodeXEntriesByNode.set(nxe.TraitNodeID, existing);
  }

  const nodes: TalentNode[] = treeNodes.map((node) => {
    const nodeXEntries = nodeXEntriesByNode.get(node.ID) ?? [];
    const entries: TalentNodeEntry[] = [];
    let maxRanks = 1;

    for (const nodeXEntry of nodeXEntries) {
      const entry = entryMap.get(nodeXEntry.TraitNodeEntryID);
      if (!entry) continue;

      const definition = definitionMap.get(entry.TraitDefinitionID);
      if (!definition) continue;

      // Get name (prefer override, fallback to spell name)
      let name = definition.OverrideName_lang ?? "";
      if (!name && definition.SpellID > 0) {
        const spellName = spellNameMap.get(definition.SpellID);
        name = spellName?.Name_lang ?? "";
      }

      // Get description (prefer override, fallback to spell description)
      let description = definition.OverrideDescription_lang ?? "";
      if (!description && definition.SpellID > 0) {
        const spell = spellMap.get(definition.SpellID);
        description = spell?.Description_lang ?? "";
      }

      // Get icon
      let iconFileName = "";
      if (definition.OverrideIcon > 0) {
        const icon = iconMap.get(definition.OverrideIcon);
        iconFileName = icon?.FileName ?? "";
      }

      if (entries.length === 0) {
        maxRanks = entry.MaxRanks;
      }

      entries.push({
        id: entry.ID,
        definitionId: definition.ID,
        name,
        description,
        iconFileName,
        spellId: definition.SpellID,
      });
    }

    return {
      id: node.ID,
      posX: node.PosX,
      posY: node.PosY,
      type: node.Type,
      subTreeId: node.TraitSubTreeID,
      orderIndex: orderIndexMap.get(node.ID) ?? -1,
      maxRanks,
      entries,
    };
  });

  return {
    specId,
    specName: spec.Name_lang ?? "",
    className: chrClass.Name_lang ?? "",
    treeId: loadout.TraitTreeID,
    nodes,
    edges: edges.map((e) => ({
      id: e.ID,
      fromNodeId: e.LeftTraitNodeID,
      toNodeId: e.RightTraitNodeID,
      visualStyle: e.VisualStyle,
    })),
    subTrees,
  };
};

// Scale factor to convert game coordinates (0-9000) to grid positions
const GRID_SCALE = 300;

const renderVisualTree = (tree: TalentTree): string => {
  const lines: string[] = [];

  lines.push(`\n=== ${tree.className} - ${tree.specName} ===`);
  lines.push(`Tree ID: ${tree.treeId} | Spec ID: ${tree.specId}`);
  lines.push(`Total Nodes: ${tree.nodes.length} | Edges: ${tree.edges.length}`);

  if (tree.subTrees.length > 0) {
    lines.push(`Hero Trees: ${tree.subTrees.map((st) => st.name).join(", ")}`);
  }

  lines.push("");

  // Calculate bounds
  const minX = Math.min(...tree.nodes.map((n) => n.posX));
  const maxX = Math.max(...tree.nodes.map((n) => n.posX));
  const minY = Math.min(...tree.nodes.map((n) => n.posY));
  const maxY = Math.max(...tree.nodes.map((n) => n.posY));

  lines.push(`Position Bounds: X[${minX}, ${maxX}] Y[${minY}, ${maxY}]`);
  lines.push("");

  // Build a grid representation
  const gridWidth = Math.ceil((maxX - minX) / GRID_SCALE) + 1;
  const gridHeight = Math.ceil((maxY - minY) / GRID_SCALE) + 1;

  // Create empty grid
  const grid: string[][] = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => "  .  "),
  );

  // Place nodes on grid
  for (const node of tree.nodes) {
    const gridX = Math.round((node.posX - minX) / GRID_SCALE);
    const gridY = Math.round((node.posY - minY) / GRID_SCALE);

    if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
      const typeChar =
        node.type === 2 ? "C" : node.subTreeId > 0 ? "H" : node.entries.length > 0 ? "N" : "?";
      const entryCount = node.entries.length;
      const maxRanks = node.maxRanks;
      grid[gridY][gridX] = `[${typeChar}${entryCount}/${maxRanks}]`;
    }
  }

  lines.push("=== Visual Grid (Legend: N=Normal, C=Choice, H=Hero) ===");
  lines.push(`Grid size: ${gridWidth}x${gridHeight}`);
  lines.push("");

  for (const row of grid) {
    lines.push(row.join(""));
  }

  lines.push("");

  // Group nodes by section
  const classNodes = tree.nodes.filter(
    (n) => n.subTreeId === 0 && n.posY < (maxY - minY) / 2 + minY,
  );
  const specNodes = tree.nodes.filter(
    (n) => n.subTreeId === 0 && n.posY >= (maxY - minY) / 2 + minY,
  );
  const heroNodes = tree.nodes.filter((n) => n.subTreeId > 0);

  lines.push("=== Node Breakdown ===");
  lines.push(
    `Class Talents (top half, subTreeId=0): ${classNodes.length} nodes`,
  );
  lines.push(
    `Spec Talents (bottom half, subTreeId=0): ${specNodes.length} nodes`,
  );
  lines.push(`Hero Talents (subTreeId>0): ${heroNodes.length} nodes`);
  lines.push("");

  // List hero talent subtrees
  if (tree.subTrees.length > 0) {
    lines.push("=== Hero Talent Trees ===");
    for (const subTree of tree.subTrees) {
      const subTreeNodes = tree.nodes.filter((n) => n.subTreeId === subTree.id);
      lines.push(`  ${subTree.name} (ID: ${subTree.id}): ${subTreeNodes.length} nodes`);
    }
    lines.push("");
  }

  // Sample nodes with details
  lines.push("=== Sample Nodes (first 10) ===");
  for (const node of tree.nodes.slice(0, 10)) {
    const entryNames = node.entries.map((e) => e.name).join(" / ");
    const heroLabel = node.subTreeId > 0 ? ` [Hero:${node.subTreeId}]` : "";
    const typeLabel = node.type === 2 ? " [Choice]" : "";
    lines.push(
      `  Node ${node.id}: ${entryNames || "(no entries)"}${heroLabel}${typeLabel}`,
    );
    lines.push(
      `    Pos: (${node.posX}, ${node.posY}) | OrderIndex: ${node.orderIndex} | Ranks: ${node.maxRanks}`,
    );
  }

  return lines.join("\n");
};

const renderNodesList = (tree: TalentTree): string => {
  const lines: string[] = [];

  lines.push(`\n=== ${tree.className} - ${tree.specName} - All Nodes ===\n`);

  // Sort by orderIndex for talent string order
  const sortedNodes = [...tree.nodes].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const node of sortedNodes) {
    const entryNames = node.entries
      .map((e) => `${e.name} (spell:${e.spellId})`)
      .join(" / ");
    const heroLabel =
      node.subTreeId > 0
        ? ` [Hero:${tree.subTrees.find((st) => st.id === node.subTreeId)?.name || node.subTreeId}]`
        : "";
    const typeLabel = node.type === 2 ? " [Choice]" : "";

    lines.push(`[${node.orderIndex.toString().padStart(3, " ")}] Node ${node.id}${heroLabel}${typeLabel}`);
    lines.push(`       ${entryNames || "(no entries)"}`);
    lines.push(`       Pos: (${node.posX}, ${node.posY}) | Ranks: ${node.maxRanks}`);
    lines.push("");
  }

  return lines.join("\n");
};

export const dumpTalentTreeCommand = Command.make(
  "dump-talent-tree",
  { format: formatOption, output: outputOption, specId: specIdArg },
  ({ format, output, specId }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Loading talent tree for spec ${specId}...`);

      const tree = yield* Effect.tryPromise({
        try: () => loadTalentTreeDirect(supabaseClient, specId),
        catch: (error) => {
          console.error("Failed to load talent tree:", error);
          return error as Error;
        },
      });

      yield* Effect.log(
        `Loaded tree: ${tree.className} - ${tree.specName} (${tree.nodes.length} nodes)`,
      );

      let outputContent: string;

      switch (format) {
        case "json":
          outputContent = JSON.stringify(tree, null, 2);
          break;
        case "nodes":
          outputContent = renderNodesList(tree);
          break;
        case "visual":
        default:
          outputContent = renderVisualTree(tree);
          break;
      }

      if (output._tag === "Some") {
        const fs = yield* Effect.promise(() => import("node:fs/promises"));
        yield* Effect.tryPromise({
          catch: (e) => new Error(String(e)),
          try: () => fs.writeFile(output.value, outputContent),
        });
        yield* Effect.log(`Output written to ${output.value}`);
      } else {
        console.log(outputContent);
      }

      yield* Effect.log("Done!");
    }),
);
