/**
 * HTML Template Generator for Talent Tree Viewer
 */

import type { TalentSubTree, TalentTree } from "./types.js";

interface TemplateData {
  activeHeroTreeId: number | null;
  iconBaseUrl: string;
  nodeChoices: Map<number, number> | null;
  nodeRanks: Map<number, number> | null;
  selectedNodeIds: Set<number> | null;
  tree: TalentTree;
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getIconUrl = (
  iconFileName: string | null,
  baseUrl: string,
  size: "small" | "medium" | "large" = "large",
): string => {
  const filename = iconFileName || "inv_misc_questionmark";
  return `${baseUrl}/functions/v1/icons/${size}/${filename}.jpg`;
};

const renderStyles = (): string => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a24;
  --bg-elevated: #22222e;
  --border-subtle: rgba(255,255,255,0.08);
  --border-medium: rgba(255,255,255,0.15);
  --text-primary: #f0f0f5;
  --text-secondary: #a0a0b0;
  --text-muted: #606070;
  --accent-gold: #ffd700;
  --accent-purple: #a855f7;
  --accent-orange: #f97316;
  --accent-blue: #3b82f6;
  --accent-green: #22c55e;
  --node-size: 52px;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  min-height: 100vh;
}

header {
  position: sticky;
  top: 0;
  z-index: 500;
  padding: 14px 24px;
  background: rgba(10,10,15,0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

header h1 {
  font-size: 17px;
  font-weight: 600;
}

.container {
  position: relative;
  width: 100%;
  height: calc(100vh - 57px);
  overflow: auto;
}

.tree {
  position: relative;
  margin: 32px;
}

.node {
  position: absolute;
  width: var(--node-size);
  height: var(--node-size);
  background: linear-gradient(180deg, #2a2a38 0%, #1e1e28 100%);
  border: 2px solid #3d3d4d;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.15s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.node img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.node:hover {
  transform: scale(1.15);
  border-color: var(--accent-gold);
  box-shadow: 0 0 20px rgba(255,215,0,0.5);
  z-index: 100;
}

.node.choice {
  border-color: #7c3aed;
  background: linear-gradient(180deg, #2e2448 0%, #1e1830 100%);
}

.node.choice:hover {
  border-color: var(--accent-purple);
  box-shadow: 0 0 20px rgba(168,85,247,0.5);
}

.node.choice img {
  width: 50%;
  height: 100%;
  border-radius: 4px;
}

.node.hero {
  border-color: #ea580c;
  background: linear-gradient(180deg, #3d2818 0%, #2a1c10 100%);
}

.node.hero:hover {
  border-color: var(--accent-orange);
  box-shadow: 0 0 20px rgba(249,115,22,0.5);
}

.node.hidden { display: none; }

.node-ranks {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0,0,0,0.75);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-green);
}

svg { position: absolute; top: 0; left: 0; pointer-events: none; }

.edge {
  stroke: #3a3a4a;
  stroke-width: 2.5;
  stroke-linecap: round;
}

.edge.hero-edge {
  stroke: rgba(249,115,22,0.4);
  stroke-dasharray: 6 4;
}

.edge.hidden { display: none; }

.tooltip {
  display: none;
  position: fixed;
  background: rgba(16,16,24,0.98);
  border: 1px solid var(--border-medium);
  padding: 16px;
  border-radius: 12px;
  max-width: 400px;
  min-width: 280px;
  z-index: 1000;
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
}

.tooltip.visible { display: block; }

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tooltip-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
}

.tooltip h3 {
  color: var(--accent-gold);
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.tooltip .subtitle {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.tooltip p {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.tooltip .meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  font-family: monospace;
}

.hero-selector {
  display: flex;
  gap: 8px;
}

.hero-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.15s;
}

.hero-btn:hover {
  background: var(--bg-elevated);
  border-color: #ea580c;
}

.hero-btn.active {
  background: rgba(249,115,22,0.12);
  border-color: var(--accent-orange);
  color: var(--accent-orange);
}

.hero-btn img {
  width: 22px;
  height: 22px;
  border-radius: 4px;
}

.search-input {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  width: 160px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-blue);
}

.stats {
  font-size: 11px;
  color: var(--text-muted);
  padding: 5px 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-family: monospace;
  margin-left: auto;
}

.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend .dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 2px solid;
}

.dot.normal { border-color: #3d3d4d; background: #2a2a38; }
.dot.choice { border-color: #7c3aed; background: #2e2448; }
.dot.hero { border-color: #ea580c; background: #3d2818; }

.node.search-match {
  box-shadow: 0 0 0 3px var(--accent-blue), 0 0 20px var(--accent-blue);
}

.node.search-dim { opacity: 0.3; }

/* Loadout selection states */
.node.selected {
  border-color: var(--accent-green);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
}

.node.selected .node-ranks {
  color: var(--accent-gold);
}

.node.unselected {
  opacity: 0.35;
  filter: grayscale(0.5);
}

.node.unselected:hover {
  opacity: 0.7;
  filter: grayscale(0.3);
}

.edge.selected {
  stroke: var(--accent-green);
  stroke-width: 3;
}

.edge.unselected {
  stroke: #2a2a3a;
  opacity: 0.4;
}

.loadout-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--accent-green);
  border-radius: 6px;
  font-size: 11px;
  color: var(--accent-green);
  font-weight: 500;
}
`;

const renderScript = (data: TemplateData): string => {
  const { iconBaseUrl, nodeChoices, nodeRanks, selectedNodeIds, tree } = data;

  // Convert loadout data to arrays for JSON serialization
  const selectedNodes = selectedNodeIds ? [...selectedNodeIds] : null;
  const choices = nodeChoices ? [...nodeChoices.entries()] : null;
  const ranks = nodeRanks ? [...nodeRanks.entries()] : null;

  return `
const treeData = ${JSON.stringify({
    bounds: tree.bounds,
    edges: tree.edges.map((e) => ({
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
    })),
    nodes: tree.nodes.map((n) => ({
      entries: n.entries.map((e) => ({
        description: e.description,
        iconFileName: e.iconFileName,
        maxRanks: e.maxRanks,
        name: e.name,
        spellId: e.spellId,
      })),
      id: n.id,
      pixelX: n.pixelX,
      pixelY: n.pixelY,
      subTreeId: n.subTreeId,
      type: n.type,
    })),
    subTrees: tree.subTrees.map((s) => ({
      iconFileName: s.iconFileName,
      id: s.id,
      name: s.name,
      nodeIds: s.nodeIds,
    })),
  })};

// Loadout data
const loadoutSelectedNodes = ${selectedNodes ? JSON.stringify(selectedNodes) : "null"};
const loadoutChoices = ${choices ? `new Map(${JSON.stringify(choices)})` : "null"};
const loadoutRanks = ${ranks ? `new Map(${JSON.stringify(ranks)})` : "null"};
const hasLoadout = loadoutSelectedNodes !== null;

const iconBaseUrl = "${iconBaseUrl}";

const getIconUrl = (iconFileName, size = "large") => {
  const filename = iconFileName || "inv_misc_questionmark";
  return iconBaseUrl + "/functions/v1/icons/" + size + "/" + filename + ".jpg";
};

const treeEl = document.getElementById("tree");
const tooltip = document.getElementById("tooltip");
const searchInput = document.getElementById("searchInput");

// Calculate dimensions
const nodes = treeData.nodes;
const padding = 60;
const nodeSize = 52;
const nodeCenter = nodeSize / 2;

const minX = Math.min(...nodes.map(n => n.pixelX));
const maxX = Math.max(...nodes.map(n => n.pixelX));
const minY = Math.min(...nodes.map(n => n.pixelY));
const maxY = Math.max(...nodes.map(n => n.pixelY));

const width = (maxX - minX) + padding * 2 + nodeSize;
const height = (maxY - minY) + padding * 2 + nodeSize;

treeEl.style.width = width + "px";
treeEl.style.height = height + "px";

const toX = x => (x - minX) + padding;
// Y is inverted: Blizzard uses Y-up (negative pixelY = top), HTML uses Y-down (top=0)
// So we flip by using (maxY - y) instead of (y - minY)
const toY = y => (maxY - y) + padding;

// Create SVG for edges
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", width);
svg.setAttribute("height", height);

const nodeMap = new Map(nodes.map(n => [n.id, n]));
const edgeEls = [];

// Pre-compute loadout set for edge rendering
const loadoutNodeSet = hasLoadout ? new Set(loadoutSelectedNodes) : null;

for (const edge of treeData.edges) {
  const from = nodeMap.get(edge.sourceNodeId);
  const to = nodeMap.get(edge.targetNodeId);
  if (!from || !to) continue;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", toX(from.pixelX) + nodeCenter);
  line.setAttribute("y1", toY(from.pixelY) + nodeCenter);
  line.setAttribute("x2", toX(to.pixelX) + nodeCenter);
  line.setAttribute("y2", toY(to.pixelY) + nodeCenter);
  line.classList.add("edge");

  const fromHero = from.subTreeId && from.subTreeId > 0;
  const toHero = to.subTreeId && to.subTreeId > 0;
  if (fromHero || toHero) {
    line.classList.add("hero-edge");
  }

  // Add loadout selection styling to edges
  if (hasLoadout && loadoutNodeSet) {
    const fromSelected = loadoutNodeSet.has(from.id);
    const toSelected = loadoutNodeSet.has(to.id);
    if (fromSelected && toSelected) {
      line.classList.add("selected");
    } else {
      line.classList.add("unselected");
    }
  }

  line.dataset.fromSub = from.subTreeId || 0;
  line.dataset.toSub = to.subTreeId || 0;
  svg.appendChild(line);
  edgeEls.push(line);
}

treeEl.appendChild(svg);

// Render nodes
const nodeEls = [];
const loadoutSet = hasLoadout ? new Set(loadoutSelectedNodes) : null;

for (const node of nodes) {
  const el = document.createElement("div");
  const isChoice = node.type === 2 && node.entries.length > 1;
  const isHero = node.subTreeId && node.subTreeId > 0;
  const isSelected = loadoutSet?.has(node.id) ?? false;
  const choiceIndex = loadoutChoices?.get(node.id) ?? null;
  const purchasedRanks = loadoutRanks?.get(node.id) ?? null;

  // Build class list
  let className = "node";
  if (isChoice) className += " choice";
  if (isHero) className += " hero";
  if (hasLoadout) {
    className += isSelected ? " selected" : " unselected";
  }
  el.className = className;
  el.style.left = toX(node.pixelX) + "px";
  el.style.top = toY(node.pixelY) + "px";
  el.dataset.subTreeId = node.subTreeId || 0;
  el.dataset.nodeId = node.id;

  if (isChoice && node.entries.length >= 2) {
    // If loadout has a choice selected, show only that icon full-size
    // Otherwise show both icons side by side
    if (hasLoadout && isSelected && choiceIndex !== null && node.entries[choiceIndex]) {
      const entry = node.entries[choiceIndex];
      const img = document.createElement("img");
      img.src = getIconUrl(entry.iconFileName);
      img.alt = entry.name || "?";
      img.loading = "lazy";
      img.style.width = "100%";
      img.style.height = "100%";
      el.appendChild(img);
    } else {
      // No loadout or not selected - show both options
      const entriesToShow = node.entries.slice(0, 2);
      entriesToShow.forEach((entry) => {
        const img = document.createElement("img");
        img.src = getIconUrl(entry.iconFileName);
        img.alt = entry.name || "?";
        img.loading = "lazy";
        el.appendChild(img);
      });
    }
  } else if (node.entries.length > 0) {
    const img = document.createElement("img");
    img.src = getIconUrl(node.entries[0].iconFileName);
    img.alt = node.entries[0].name || "?";
    img.loading = "lazy";
    el.appendChild(img);

    // Rank indicator - show purchased/max if loadout, otherwise just max
    const maxRanks = Math.max(...node.entries.map(e => e.maxRanks));
    if (maxRanks > 1) {
      const ranks = document.createElement("div");
      ranks.className = "node-ranks";
      if (hasLoadout && isSelected && purchasedRanks !== null) {
        ranks.textContent = purchasedRanks + "/" + maxRanks;
      } else {
        ranks.textContent = maxRanks;
      }
      el.appendChild(ranks);
    }
  }

  // Tooltip handlers
  el.addEventListener("mouseenter", () => {
    const subTree = treeData.subTrees.find(s => s.id === node.subTreeId);
    const heroLabel = subTree ? ' <span style="color:var(--accent-orange)">[' + subTree.name + ']</span>' : "";
    const isChoice = node.type === 2 && node.entries.length > 1;

    if (isChoice) {
      const selectedIdx = loadoutChoices?.get(node.id) ?? null;
      tooltip.innerHTML = '<div class="tooltip-header"><div><h3>Choose One' + heroLabel + '</h3><div class="subtitle">Choice Talent</div></div></div>' +
        node.entries.map((e, idx) => {
          const isChosen = selectedIdx === idx;
          const borderStyle = isChosen ? 'border:2px solid var(--accent-green);' : '';
          const labelHtml = isChosen ? ' <span style="color:var(--accent-green);font-size:11px">(Selected)</span>' : '';
          return '<div style="display:flex;gap:10px;align-items:start;margin-top:10px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;' + borderStyle + '">' +
          '<img src="' + getIconUrl(e.iconFileName, "small") + '" style="width:32px;height:32px;border-radius:6px">' +
          '<div><strong style="color:var(--accent-purple)">' + (e.name || "Unknown") + '</strong>' + labelHtml +
          '<p style="margin-top:4px">' + (e.description || "No description.") + '</p></div></div>';
        }).join("") +
        '<div class="meta"><span>Node ' + node.id + '</span></div>';
    } else {
      const entry = node.entries[0] || {};
      const maxRanks = Math.max(...node.entries.map(e => e.maxRanks));
      tooltip.innerHTML =
        '<div class="tooltip-header">' +
        '<img class="tooltip-icon" src="' + getIconUrl(entry.iconFileName, "small") + '">' +
        '<div><h3>' + (entry.name || "Unknown") + heroLabel + '</h3>' +
        '<div class="subtitle">' + (node.subTreeId > 0 ? "Hero Talent" : "Talent") + (maxRanks > 1 ? " · " + maxRanks + " Ranks" : "") + '</div></div></div>' +
        '<p>' + (entry.description || "No description.") + '</p>' +
        '<div class="meta"><span>Node ' + node.id + '</span><span>Spell ' + (entry.spellId || "N/A") + '</span></div>';
    }
    tooltip.classList.add("visible");
  });

  el.addEventListener("mousemove", e => {
    tooltip.style.left = Math.min(e.clientX + 16, window.innerWidth - 420) + "px";
    tooltip.style.top = Math.min(e.clientY + 16, window.innerHeight - 300) + "px";
  });

  el.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));

  treeEl.appendChild(el);
  nodeEls.push({ el, node });
}

// Hero tree selector - use loadout's active tree if available
const loadoutActiveHeroTreeId = ${data.activeHeroTreeId !== null ? data.activeHeroTreeId : "null"};
let selectedHeroId = loadoutActiveHeroTreeId ?? treeData.subTrees[0]?.id ?? 0;

function updateVisibility() {
  for (const { el, node } of nodeEls) {
    const isHero = node.subTreeId && node.subTreeId > 0;
    const visible = !isHero || node.subTreeId === selectedHeroId;
    el.classList.toggle("hidden", !visible);
  }

  for (const line of edgeEls) {
    const fromSub = parseInt(line.dataset.fromSub);
    const toSub = parseInt(line.dataset.toSub);
    const isHeroEdge = fromSub > 0 || toSub > 0;
    let visible = true;
    if (isHeroEdge) {
      visible = (fromSub === 0 || fromSub === selectedHeroId) && (toSub === 0 || toSub === selectedHeroId);
    }
    line.classList.toggle("hidden", !visible);
  }

  document.querySelectorAll(".hero-btn").forEach(btn => {
    const id = btn.dataset.subtree === "none" ? 0 : parseInt(btn.dataset.subtree);
    btn.classList.toggle("active", id === selectedHeroId);
  });
}

document.querySelectorAll(".hero-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedHeroId = btn.dataset.subtree === "none" ? 0 : parseInt(btn.dataset.subtree);
    updateVisibility();
  });
});

updateVisibility();

// Search
let searchTimeout;
searchInput.addEventListener("input", e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = e.target.value.toLowerCase().trim();
    for (const { el, node } of nodeEls) {
      el.classList.remove("search-match", "search-dim");
      if (!query) continue;
      const matches = node.entries.some(e => (e.name || "").toLowerCase().includes(query));
      el.classList.add(matches ? "search-match" : "search-dim");
    }
  }, 150);
});
`;
};

const renderHeroButtons = (
  subTrees: TalentSubTree[],
  iconBaseUrl: string,
): string => {
  if (subTrees.length === 0) return "";

  const buttons = subTrees
    .map(
      (s, i) =>
        `<button class="hero-btn${i === 0 ? " active" : ""}" data-subtree="${s.id}">` +
        `<img src="${getIconUrl(s.iconFileName, iconBaseUrl, "small")}" alt="${escapeHtml(s.name || "")}">` +
        `<span>${escapeHtml(s.name || "Hero " + s.id)}</span></button>`,
    )
    .join("");

  return (
    buttons +
    '<button class="hero-btn" data-subtree="none"><span>Hide Hero</span></button>'
  );
};

/**
 * Determine which hero tree is active based on the first selected hero node.
 * In the game, selecting a hero tree requires allocating a point to a node in that tree.
 */
const detectActiveHeroTree = (
  tree: TalentTree,
  selectedNodeIds: Set<number> | null,
): number | null => {
  if (!selectedNodeIds) return null;

  // Find the first selected hero node (by node ID order, which matches the loadout order)
  for (const node of tree.nodes) {
    if (node.subTreeId && node.subTreeId > 0 && selectedNodeIds.has(node.id)) {
      return node.subTreeId;
    }
  }

  return null;
};

export const generateHtml = (
  tree: TalentTree,
  supabaseUrl: string,
  selectedNodeIds: Set<number> | null = null,
  nodeChoices: Map<number, number> | null = null,
  nodeRanks: Map<number, number> | null = null,
): string => {
  const activeHeroTreeId = detectActiveHeroTree(tree, selectedNodeIds);

  const data: TemplateData = {
    activeHeroTreeId,
    iconBaseUrl: supabaseUrl,
    nodeChoices,
    nodeRanks,
    selectedNodeIds,
    tree,
  };

  const loadoutBadge = selectedNodeIds
    ? `<div class="loadout-badge">✓ Loadout: ${selectedNodeIds.size} talents selected</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(tree.className)} ${escapeHtml(tree.specName)} - Talent Tree</title>
  <style>${renderStyles()}</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(tree.className)} — ${escapeHtml(tree.specName)}</h1>
    ${loadoutBadge}
    <div class="hero-selector">
      ${renderHeroButtons(tree.subTrees, supabaseUrl)}
    </div>
    <input type="text" class="search-input" id="searchInput" placeholder="Search talents...">
    <div class="stats">${tree.nodes.length} nodes · ${tree.edges.length} edges</div>
    <div class="legend">
      <span><div class="dot normal"></div> Talent</span>
      <span><div class="dot choice"></div> Choice</span>
      <span><div class="dot hero"></div> Hero</span>
    </div>
  </header>
  <div class="container">
    <div class="tree" id="tree"></div>
  </div>
  <div class="tooltip" id="tooltip"></div>
  <script>${renderScript(data)}</script>
</body>
</html>`;
};
