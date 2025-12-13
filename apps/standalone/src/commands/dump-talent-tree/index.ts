import { Args, Command } from "@effect/cli";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";

import { supabaseClient } from "../../data/supabase.js";

const specIdArg = Args.integer({ name: "specId" }).pipe(
  Args.withDescription("The spec ID to dump the talent tree for"),
);

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
}

interface TraitTreeLoadoutEntry {
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

interface TraitNodeXTraitCond {
  TraitNodeID: number;
  TraitCondID: number;
}

interface TraitCond {
  ID: number;
  SpecSetID: number;
}

interface SpecSetMember {
  SpecSet: number;
  ChrSpecializationID: number;
}

interface TraitNodeXTraitNodeEntry {
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

interface SpellMisc {
  ID: number;
  SpellID: number;
  SpellIconFileDataID: number | null;
}

interface ManifestInterfaceData {
  ID: number;
  FileName: string | null;
}

interface TalentTree {
  specId: number;
  specName: string;
  className: string;
  treeId: number;
  nodes: Array<{
    id: number;
    posX: number;
    posY: number;
    type: number;
    subTreeId: number;
    orderIndex: number;
    maxRanks: number;
    entries: Array<{
      id: number;
      definitionId: number;
      name: string;
      description: string;
      iconFileName: string;
      spellId: number;
    }>;
  }>;
  edges: Array<{
    id: number;
    fromNodeId: number;
    toNodeId: number;
    visualStyle: number;
  }>;
  subTrees: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

const loadTalentTree = async (
  supabase: SupabaseClient,
  specId: number,
): Promise<TalentTree> => {
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
      b.select("*").eq("TraitTreeLoadoutID", loadout.ID).order("OrderIndex"),
  );

  const orderIndexMap = new Map<number, number>();
  for (const entry of loadoutEntries) {
    orderIndexMap.set(entry.SelectedTraitNodeID, entry.OrderIndex);
  }

  const treeNodes = await query<TraitNode[]>(supabase, "trait_node", (b) =>
    b.select("*").eq("TraitTreeID", loadout.TraitTreeID),
  );

  const nodeIds = treeNodes.map((n) => n.ID);
  const allEdges = await query<TraitEdge[]>(supabase, "trait_edge", (b) =>
    b.select("*").in("LeftTraitNodeID", nodeIds),
  );
  const edges = allEdges.filter((e) => nodeIds.includes(e.RightTraitNodeID));

  const subTreeIds = [
    ...new Set(treeNodes.map((n) => n.TraitSubTreeID).filter((id) => id > 0)),
  ];
  const heroNodeIds = treeNodes
    .filter((n) => n.TraitSubTreeID > 0)
    .map((n) => n.ID);

  const nodeConditions =
    heroNodeIds.length > 0
      ? await query<TraitNodeXTraitCond[]>(
          supabase,
          "trait_node_x_trait_cond",
          (b) => b.select("*").in("TraitNodeID", heroNodeIds),
        )
      : [];

  const condIds = [...new Set(nodeConditions.map((nc) => nc.TraitCondID))];
  const conditions =
    condIds.length > 0
      ? await query<TraitCond[]>(supabase, "trait_cond", (b) =>
          b.select("*").in("ID", condIds).gt("SpecSetID", 0),
        )
      : [];

  const specSetIds = [...new Set(conditions.map((c) => c.SpecSetID))];
  const specSetMembers =
    specSetIds.length > 0
      ? await query<SpecSetMember[]>(supabase, "spec_set_member", (b) =>
          b.select("*").in("SpecSet", specSetIds),
        )
      : [];

  const subTreeSpecRestrictions = new Map<number, Set<number>>();
  for (const nc of nodeConditions) {
    const node = treeNodes.find((n) => n.ID === nc.TraitNodeID);
    if (!node || node.TraitSubTreeID === 0) {
      continue;
    }

    const cond = conditions.find((c) => c.ID === nc.TraitCondID);
    if (!cond) {
      continue;
    }

    const allowedSpecs = specSetMembers
      .filter((ssm) => ssm.SpecSet === cond.SpecSetID)
      .map((ssm) => ssm.ChrSpecializationID);

    if (!subTreeSpecRestrictions.has(node.TraitSubTreeID)) {
      subTreeSpecRestrictions.set(node.TraitSubTreeID, new Set(allowedSpecs));
    } else {
      for (const s of allowedSpecs) {
        subTreeSpecRestrictions.get(node.TraitSubTreeID)!.add(s);
      }
    }
  }

  const availableSubTreeIds = subTreeIds.filter((stId) => {
    const restrictions = subTreeSpecRestrictions.get(stId);
    if (!restrictions || restrictions.size === 0) {
      return true;
    }
    return restrictions.has(specId);
  });

  const subTrees: TalentTree["subTrees"] = [];
  for (const subTreeId of availableSubTreeIds) {
    const subTree = await query<TraitSubTree | null>(
      supabase,
      "trait_sub_tree",
      (b) => b.select("*").eq("ID", subTreeId).maybeSingle(),
    );
    if (subTree) {
      subTrees.push({
        description: subTree.Description_lang ?? "",
        id: subTree.ID,
        name: subTree.Name_lang ?? "",
      });
    }
  }

  const filteredNodes = treeNodes.filter(
    (n) =>
      n.TraitSubTreeID === 0 || availableSubTreeIds.includes(n.TraitSubTreeID),
  );
  const filteredNodeIds = filteredNodes.map((n) => n.ID);

  const filteredEdges = edges.filter(
    (e) =>
      filteredNodeIds.includes(e.LeftTraitNodeID) &&
      filteredNodeIds.includes(e.RightTraitNodeID),
  );

  const allNodeXEntries = await query<TraitNodeXTraitNodeEntry[]>(
    supabase,
    "trait_node_x_trait_node_entry",
    (b) => b.select("*").in("TraitNodeID", filteredNodeIds),
  );

  const entryIds = [...new Set(allNodeXEntries.map((x) => x.TraitNodeEntryID))];
  const allEntries = await query<TraitNodeEntry[]>(
    supabase,
    "trait_node_entry",
    (b) => b.select("*").in("ID", entryIds),
  );
  const entryMap = new Map(allEntries.map((e) => [e.ID, e]));

  const definitionIds = [
    ...new Set(allEntries.map((e) => e.TraitDefinitionID)),
  ];
  const allDefinitions = await query<TraitDefinition[]>(
    supabase,
    "trait_definition",
    (b) => b.select("*").in("ID", definitionIds),
  );
  const definitionMap = new Map(allDefinitions.map((d) => [d.ID, d]));

  const spellIds = [
    ...new Set(allDefinitions.map((d) => d.SpellID).filter((id) => id > 0)),
  ];
  const [allSpellNames, allSpells, allSpellMisc] = await Promise.all([
    query<SpellName[]>(supabase, "spell_name", (b) =>
      b.select("*").in("ID", spellIds),
    ),
    query<Spell[]>(supabase, "spell", (b) => b.select("*").in("ID", spellIds)),
    query<SpellMisc[]>(supabase, "spell_misc", (b) =>
      b.select("*").in("SpellID", spellIds),
    ),
  ]);
  const spellNameMap = new Map(allSpellNames.map((s) => [s.ID, s]));
  const spellMap = new Map(allSpells.map((s) => [s.ID, s]));
  const spellMiscMap = new Map(allSpellMisc.map((m) => [m.SpellID, m]));

  const overrideIconIds = allDefinitions
    .map((d) => d.OverrideIcon)
    .filter((id) => id > 0);
  const spellIconIds = allSpellMisc
    .map((m) => m.SpellIconFileDataID)
    .filter((id): id is number => id !== null && id > 0);
  const iconIds = [...new Set([...overrideIconIds, ...spellIconIds])];

  const allIcons =
    iconIds.length > 0
      ? await query<ManifestInterfaceData[]>(
          supabase,
          "manifest_interface_data",
          (b) => b.select("*").in("ID", iconIds),
        )
      : [];
  const iconMap = new Map(allIcons.map((i) => [i.ID, i]));

  const nodeXEntriesByNode = new Map<number, TraitNodeXTraitNodeEntry[]>();
  for (const nxe of allNodeXEntries) {
    const existing = nodeXEntriesByNode.get(nxe.TraitNodeID) ?? [];
    existing.push(nxe);
    nodeXEntriesByNode.set(nxe.TraitNodeID, existing);
  }

  const TARGET_HERO_X = 7500;
  const TARGET_HERO_Y = 1200;
  const heroTreeOffsets = new Map<
    number,
    { offsetX: number; offsetY: number }
  >();

  for (const subTreeId of availableSubTreeIds) {
    const heroNodesInTree = filteredNodes.filter(
      (n) => n.TraitSubTreeID === subTreeId,
    );
    if (heroNodesInTree.length === 0) {
      continue;
    }

    const minX = Math.min(...heroNodesInTree.map((n) => n.PosX));
    const minY = Math.min(...heroNodesInTree.map((n) => n.PosY));
    heroTreeOffsets.set(subTreeId, {
      offsetX: TARGET_HERO_X - minX,
      offsetY: TARGET_HERO_Y - minY,
    });
  }

  const nodes: TalentTree["nodes"] = filteredNodes.map((node) => {
    const nodeXEntries = nodeXEntriesByNode.get(node.ID) ?? [];
    const entries: TalentTree["nodes"][number]["entries"] = [];
    let maxRanks = 1;

    for (const nodeXEntry of nodeXEntries) {
      const entry = entryMap.get(nodeXEntry.TraitNodeEntryID);
      if (!entry) {
        continue;
      }

      const definition = definitionMap.get(entry.TraitDefinitionID);
      if (!definition) {
        continue;
      }

      let name = definition.OverrideName_lang ?? "";
      if (!name && definition.SpellID > 0) {
        name = spellNameMap.get(definition.SpellID)?.Name_lang ?? "";
      }

      let description = definition.OverrideDescription_lang ?? "";
      if (!description && definition.SpellID > 0) {
        description = spellMap.get(definition.SpellID)?.Description_lang ?? "";
      }

      let iconFileDataId = definition.OverrideIcon;
      if (iconFileDataId === 0 && definition.SpellID > 0) {
        iconFileDataId =
          spellMiscMap.get(definition.SpellID)?.SpellIconFileDataID ?? 0;
      }

      let iconFileName = "inv_misc_questionmark";
      if (iconFileDataId > 0) {
        const manifest = iconMap.get(iconFileDataId);

        if (manifest?.FileName) {
          iconFileName = manifest.FileName.toLowerCase().replace(".blp", "");
        }
      }

      if (entries.length === 0) {
        maxRanks = entry.MaxRanks;
      }

      entries.push({
        definitionId: definition.ID,
        description,
        iconFileName,
        id: entry.ID,
        name,
        spellId: definition.SpellID,
      });
    }

    let posX = node.PosX;
    let posY = node.PosY;
    if (node.TraitSubTreeID > 0) {
      const offset = heroTreeOffsets.get(node.TraitSubTreeID);
      if (offset) {
        posX += offset.offsetX;
        posY += offset.offsetY;
      }
    }

    return {
      entries,
      id: node.ID,
      maxRanks,
      orderIndex: orderIndexMap.get(node.ID) ?? -1,
      posX,
      posY,
      subTreeId: node.TraitSubTreeID,
      type: node.Type,
    };
  });

  return {
    className: chrClass.Name_lang ?? "",
    edges: filteredEdges.map((e) => ({
      fromNodeId: e.LeftTraitNodeID,
      id: e.ID,
      toNodeId: e.RightTraitNodeID,
      visualStyle: e.VisualStyle,
    })),
    nodes,
    specId,
    specName: spec.Name_lang ?? "",
    subTrees,
    treeId: loadout.TraitTreeID,
  };
};

const generateHtml = (
  tree: TalentTree,
  supabaseUrl: string,
): string => `<!DOCTYPE html>
<html>
<head>
  <title>${tree.className} - ${tree.specName} Talent Tree</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #1a1a2e; color: #eee; font-family: system-ui, sans-serif; }
    header { padding: 16px 20px; background: #16213e; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    header h1 { font-size: 20px; }
    .controls { display: flex; gap: 12px; align-items: center; }
    .controls label { font-size: 13px; color: #b2bec3; }
    .controls select, .controls button {
      background: #2d3436; border: 1px solid #636e72; color: #eee;
      padding: 6px 12px; border-radius: 4px; cursor: pointer;
    }
    .controls select:hover, .controls button:hover { border-color: #f1c40f; }
    .container { position: relative; width: 100%; height: calc(100vh - 60px); overflow: auto; }
    .tree { position: relative; }
    .node {
      position: absolute; width: 48px; height: 48px; border-radius: 8px;
      background: #2d3436; border: 2px solid #636e72; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; transition: transform 0.1s, border-color 0.1s;
    }
    .node img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 6px;
    }
    .node:hover { transform: scale(1.3); border-color: #f1c40f; z-index: 100; }
    .node.choice { border-color: #9b59b6; background: #2c1f3d; }
    .node.hero { border-color: #e67e22; background: #3d2c1f; }
    .node.hidden { display: none; }
    .tooltip {
      display: none; position: fixed; background: #1e272e; border: 1px solid #636e72;
      padding: 12px; border-radius: 8px; max-width: 320px; z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .tooltip.visible { display: block; }
    .tooltip h3 { color: #f1c40f; margin-bottom: 8px; font-size: 14px; }
    .tooltip p { font-size: 12px; line-height: 1.4; color: #b2bec3; }
    .tooltip .meta { font-size: 11px; color: #636e72; margin-top: 8px; }
    svg { position: absolute; top: 0; left: 0; pointer-events: none; }
    .edge { stroke: #636e72; stroke-width: 2; }
    .edge.hidden { display: none; }
    .legend { display: flex; gap: 16px; font-size: 12px; }
    .legend span { display: flex; align-items: center; gap: 4px; }
    .legend .dot { width: 12px; height: 12px; border-radius: 3px; border: 2px solid; }
    .dot.normal { border-color: #636e72; background: #2d3436; }
    .dot.choice { border-color: #9b59b6; background: #2c1f3d; }
    .dot.hero { border-color: #e67e22; background: #3d2c1f; }
  </style>
</head>
<body>
  <header>
    <h1>${tree.className} - ${tree.specName}</h1>
    <div class="controls">
      <label>Hero Tree:</label>
      <select id="heroSelect">
        ${tree.subTrees.map((s, i) => `<option value="${s.id}"${i === 0 ? " selected" : ""}>${s.name}</option>`).join("")}
        <option value="none">None</option>
      </select>
    </div>
    <div class="legend">
      <span><div class="dot normal"></div> Normal</span>
      <span><div class="dot choice"></div> Choice</span>
      <span><div class="dot hero"></div> Hero</span>
    </div>
  </header>
  <div class="container">
    <div class="tree" id="tree"></div>
  </div>
  <div class="tooltip" id="tooltip"></div>
  <script>
    const data = ${JSON.stringify(tree)};
    const supabaseUrl = "${supabaseUrl}";
    const treeEl = document.getElementById("tree");
    const tooltip = document.getElementById("tooltip");
    const heroSelect = document.getElementById("heroSelect");
    const getIconUrl = (iconName) => supabaseUrl + "/functions/v1/icons/medium/" + iconName + ".jpg";

    const nodes = data.nodes.filter(n => n.orderIndex >= 0 || n.subTreeId > 0);

    const xs = nodes.map(n => n.posX);
    const ys = nodes.map(n => n.posY);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padding = 80;
    const scale = 0.12;
    const width = (maxX - minX) * scale + padding * 2;
    const height = (maxY - minY) * scale + padding * 2;
    treeEl.style.width = width + "px";
    treeEl.style.height = height + "px";

    const toX = x => (x - minX) * scale + padding;
    const toY = y => (y - minY) * scale + padding;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    const nodeSet = new Set(nodes.map(n => n.id));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgeEls = [];
    for (const edge of data.edges) {
      if (!nodeSet.has(edge.fromNodeId) || !nodeSet.has(edge.toNodeId)) {
        continue;
      }
      const from = nodeMap.get(edge.fromNodeId);
      const to = nodeMap.get(edge.toNodeId);
      if (from && to) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", toX(from.posX) + 24);
        line.setAttribute("y1", toY(from.posY) + 24);
        line.setAttribute("x2", toX(to.posX) + 24);
        line.setAttribute("y2", toY(to.posY) + 24);
        line.classList.add("edge");
        line.dataset.fromSub = from.subTreeId;
        line.dataset.toSub = to.subTreeId;
        svg.appendChild(line);
        edgeEls.push(line);
      }
    }
    treeEl.appendChild(svg);

    const nodeEls = [];
    for (const node of nodes) {
      const el = document.createElement("div");
      el.className = "node"
        + (node.type === 2 ? " choice" : "")
        + (node.subTreeId > 0 ? " hero" : "");
      el.style.left = toX(node.posX) + "px";
      el.style.top = toY(node.posY) + "px";
      const iconName = node.entries[0]?.iconFileName || "inv_misc_questionmark";
      const img = document.createElement("img");
      img.src = getIconUrl(iconName);
      img.alt = node.entries[0]?.name || "?";
      el.appendChild(img);
      el.dataset.subTreeId = node.subTreeId;
      el.addEventListener("mouseenter", e => {
        const names = node.entries.map(e => e.name).filter(Boolean).join(" / ") || "(empty)";
        const desc = node.entries[0]?.description || "";
        const subTree = data.subTrees.find(s => s.id === node.subTreeId);
        const heroLabel = subTree ? " [" + subTree.name + "]" : "";
        tooltip.innerHTML = \`<h3>\${names}\${heroLabel}</h3><p>\${desc}</p><div class="meta">ID: \${node.id} | Ranks: \${node.maxRanks} | Order: \${node.orderIndex}</div>\`;
        tooltip.classList.add("visible");
      });
      el.addEventListener("mousemove", e => {
        tooltip.style.left = Math.min(e.clientX + 15, window.innerWidth - 340) + "px";
        tooltip.style.top = Math.min(e.clientY + 15, window.innerHeight - 200) + "px";
      });
      el.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
      treeEl.appendChild(el);
      nodeEls.push({ el, node });
    }

    function updateVisibility() {
      const heroVal = heroSelect.value;
      const selectedId = heroVal === "none" ? -1 : parseInt(heroVal);
      for (const { el, node } of nodeEls) {
        let visible = true;
        if (node.subTreeId > 0) {
          visible = selectedId > 0 && node.subTreeId === selectedId;
        }
        el.classList.toggle("hidden", !visible);
      }
      for (const line of edgeEls) {
        const fromSub = parseInt(line.dataset.fromSub);
        const toSub = parseInt(line.dataset.toSub);
        let visible = true;
        if (fromSub > 0 || toSub > 0) {
          if (selectedId < 0) {
            visible = false;
          } else {
            if (fromSub > 0 && fromSub !== selectedId) {
              visible = false;
            }
            if (toSub > 0 && toSub !== selectedId) {
              visible = false;
            }
          }
        }
        line.classList.toggle("hidden", !visible);
      }
    }

    heroSelect.addEventListener("change", updateVisibility);
    updateVisibility();
  </script>
</body>
</html>`;

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
