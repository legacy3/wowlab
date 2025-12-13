import type { SupabaseClient } from "@supabase/supabase-js";

import { Args, Command } from "@effect/cli";
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

interface ChrClass {
  ID: number;
  Name_lang: string | null;
}

interface ChrSpecialization {
  ClassID: number;
  ID: number;
  Name_lang: string | null;
}

interface ManifestInterfaceData {
  FileName: string | null;
  ID: number;
}

interface SpecSetMember {
  ChrSpecializationID: number;
  SpecSet: number;
}

interface Spell {
  Description_lang: string | null;
  ID: number;
}

interface SpellMisc {
  ID: number;
  SpellIconFileDataID: number | null;
  SpellID: number;
}

interface SpellName {
  ID: number;
  Name_lang: string | null;
}

interface TalentTree {
  className: string;
  edges: Array<{
    id: number;
    fromNodeId: number;
    toNodeId: number;
    visualStyle: number;
  }>;
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
  specId: number;
  specName: string;
  subTrees: Array<{
    id: number;
    name: string;
    description: string;
    iconFileName: string;
  }>;
  treeId: number;
}

interface TraitCond {
  ID: number;
  SpecSetID: number;
}

interface TraitDefinition {
  ID: number;
  OverrideDescription_lang: string | null;
  OverrideIcon: number;
  OverrideName_lang: string | null;
  SpellID: number;
}

interface TraitEdge {
  ID: number;
  LeftTraitNodeID: number;
  RightTraitNodeID: number;
  VisualStyle: number;
}

interface TraitNode {
  ID: number;
  PosX: number;
  PosY: number;
  TraitSubTreeID: number;
  TraitTreeID: number;
  Type: number;
}

interface TraitNodeEntry {
  ID: number;
  MaxRanks: number;
  TraitDefinitionID: number;
}

interface TraitNodeXTraitCond {
  TraitCondID: number;
  TraitNodeID: number;
}

interface TraitNodeXTraitNodeEntry {
  TraitNodeEntryID: number;
  TraitNodeID: number;
}

interface TraitSubTree {
  Description_lang: string | null;
  ID: number;
  Name_lang: string | null;
}

interface TraitTreeLoadout {
  ID: number;
  TraitTreeID: number;
}

interface TraitTreeLoadoutEntry {
  OrderIndex: number;
  SelectedTraitNodeID: number;
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

  const subTreeData: Array<{ id: number; name: string; description: string }> =
    [];
  for (const subTreeId of availableSubTreeIds) {
    const subTree = await query<TraitSubTree | null>(
      supabase,
      "trait_sub_tree",
      (b) => b.select("*").eq("ID", subTreeId).maybeSingle(),
    );
    if (subTree) {
      subTreeData.push({
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

  const subTrees: TalentTree["subTrees"] = subTreeData.map((st) => {
    const firstHeroNode = nodes.find((n) => n.subTreeId === st.id);
    const iconFileName =
      firstHeroNode?.entries[0]?.iconFileName || "inv_misc_questionmark";

    return {
      description: st.description,
      iconFileName,
      id: st.id,
      name: st.name,
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
    .node.choice { display: flex; padding: 0; }
    .node.choice img {
      width: 50%; height: 100%; border-radius: 0;
    }
    .node.choice img:first-child { border-radius: 4px 0 0 4px; }
    .node.choice img:last-child { border-radius: 0 4px 4px 0; }
    .node:hover { transform: scale(1.3); border-color: #f1c40f; z-index: 100; }
    .node.choice { border-width: 3px; border-color: #9b59b6; background: #2c1f3d; }
    .node.hero { border-color: #e67e22; background: #3d2c1f; }
    .node.hidden { display: none; }
    .tooltip {
      display: none; position: fixed; background: #1e272e; border: 1px solid #636e72;
      padding: 12px; border-radius: 8px; max-width: 420px; z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .tooltip.visible { display: block; }
    .tooltip h3 { color: #f1c40f; margin-bottom: 8px; font-size: 14px; }
    .tooltip p { font-size: 12px; line-height: 1.4; color: #b2bec3; }
    .tooltip .meta { font-size: 11px; color: #636e72; margin-top: 8px; }
    .tooltip .choice-container { display: flex; gap: 12px; }
    .tooltip .choice-option {
      flex: 1; padding: 8px; background: #2d3436; border-radius: 6px;
      border: 1px solid #636e72;
    }
    .tooltip .choice-option .choice-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    }
    .tooltip .choice-option img { width: 32px; height: 32px; border-radius: 4px; }
    .tooltip .choice-option h4 { color: #9b59b6; font-size: 13px; margin: 0; }
    .tooltip .choice-option p { font-size: 11px; color: #b2bec3; margin: 0; }
    .tooltip .choice-divider { color: #636e72; font-size: 11px; text-align: center; margin: 8px 0; }
    svg { position: absolute; top: 0; left: 0; pointer-events: none; }
    .edge { stroke: #636e72; stroke-width: 2; }
    .edge.hidden { display: none; }
    .legend { display: flex; gap: 16px; font-size: 12px; }
    .legend span { display: flex; align-items: center; gap: 4px; }
    .legend .dot { width: 12px; height: 12px; border-radius: 3px; border: 2px solid; }
    .dot.normal { border-color: #636e72; background: #2d3436; }
    .dot.choice { border-color: #9b59b6; background: #2c1f3d; }
    .dot.hero { border-color: #e67e22; background: #3d2c1f; }
    .hero-selector { display: flex; gap: 8px; align-items: center; }
    .hero-btn {
      display: flex; align-items: center; gap: 6px; padding: 6px 12px;
      background: #2d3436; border: 2px solid #636e72; border-radius: 6px;
      color: #eee; cursor: pointer; transition: all 0.15s;
    }
    .hero-btn:hover { border-color: #e67e22; }
    .hero-btn.active { border-color: #e67e22; background: #3d2c1f; }
    .hero-btn img { width: 24px; height: 24px; border-radius: 4px; }
    .hero-btn span { font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <h1>${tree.className} - ${tree.specName}</h1>
    <div class="hero-selector" id="heroSelector">
      ${tree.subTrees.map((s, i) => `<button class="hero-btn${i === 0 ? " active" : ""}" data-subtree="${s.id}"><img src="${supabaseUrl}/functions/v1/icons/small/${s.iconFileName}.jpg" alt="${s.name}"><span>${s.name}</span></button>`).join("")}
      <button class="hero-btn" data-subtree="none"><span>None</span></button>
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
    const heroSelector = document.getElementById("heroSelector");
    const heroBtns = heroSelector.querySelectorAll(".hero-btn");
    const getIconUrl = (iconName, size = "medium") => supabaseUrl + "/functions/v1/icons/" + size + "/" + iconName + ".jpg";

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
      const isChoice = node.type === 2 && node.entries.length > 1;
      if (isChoice) {
        for (const entry of node.entries.slice(0, 2)) {
          const img = document.createElement("img");
          img.src = getIconUrl(entry.iconFileName || "inv_misc_questionmark");
          img.alt = entry.name || "?";
          el.appendChild(img);
        }
      } else {
        const img = document.createElement("img");
        img.src = getIconUrl(node.entries[0]?.iconFileName || "inv_misc_questionmark");
        img.alt = node.entries[0]?.name || "?";
        el.appendChild(img);
      }
      el.dataset.subTreeId = node.subTreeId;
      el.addEventListener("mouseenter", e => {
        const subTree = data.subTrees.find(s => s.id === node.subTreeId);
        const heroLabel = subTree ? " [" + subTree.name + "]" : "";
        const isChoice = node.type === 2 && node.entries.length > 1;

        if (isChoice) {
          const choiceHtml = node.entries.map(entry => \`
            <div class="choice-option">
              <div class="choice-header">
                <img src="\${getIconUrl(entry.iconFileName, "small")}" alt="\${entry.name}">
                <h4>\${entry.name}</h4>
              </div>
              <p>\${entry.description || ""}</p>
            </div>
          \`).join("");
          tooltip.innerHTML = \`<h3>Choice Node\${heroLabel}</h3><div class="choice-container">\${choiceHtml}</div><div class="meta">ID: \${node.id} | Order: \${node.orderIndex}</div>\`;
        } else {
          const name = node.entries[0]?.name || "(empty)";
          const desc = node.entries[0]?.description || "";
          tooltip.innerHTML = \`<h3>\${name}\${heroLabel}</h3><p>\${desc}</p><div class="meta">ID: \${node.id} | Ranks: \${node.maxRanks} | Order: \${node.orderIndex}</div>\`;
        }
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

    let selectedHeroId = data.subTrees[0]?.id ?? -1;

    function updateVisibility() {
      for (const { el, node } of nodeEls) {
        let visible = true;
        if (node.subTreeId > 0) {
          visible = selectedHeroId > 0 && node.subTreeId === selectedHeroId;
        }
        el.classList.toggle("hidden", !visible);
      }
      for (const line of edgeEls) {
        const fromSub = parseInt(line.dataset.fromSub);
        const toSub = parseInt(line.dataset.toSub);
        let visible = true;
        if (fromSub > 0 || toSub > 0) {
          if (selectedHeroId < 0) {
            visible = false;
          } else {
            if (fromSub > 0 && fromSub !== selectedHeroId) {
              visible = false;
            }
            if (toSub > 0 && toSub !== selectedHeroId) {
              visible = false;
            }
          }
        }
        line.classList.toggle("hidden", !visible);
      }
      heroBtns.forEach(btn => {
        const btnId = btn.dataset.subtree === "none" ? -1 : parseInt(btn.dataset.subtree);
        btn.classList.toggle("active", btnId === selectedHeroId);
      });
    }

    heroBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        selectedHeroId = btn.dataset.subtree === "none" ? -1 : parseInt(btn.dataset.subtree);
        updateVisibility();
      });
    });
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
