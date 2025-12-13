import type { TalentSubTree, TalentTree } from "./types.js";

const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
  line-height: 1.5;
}

img, svg {
  display: block;
  max-width: 100%;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

button:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

::selection {
  background: var(--accent-blue);
  color: white;
}

img {
  user-select: none;
  -webkit-user-drag: none;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

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
  --accent-gold-dim: #b8960b;
  --accent-purple: #a855f7;
  --accent-purple-dim: #7c3aed;
  --accent-orange: #f97316;
  --accent-orange-dim: #ea580c;
  --accent-blue: #3b82f6;
  --accent-green: #22c55e;
  --glow-gold: rgba(255,215,0,0.5);
  --glow-purple: rgba(168,85,247,0.5);
  --glow-orange: rgba(249,115,22,0.5);
  --node-size: 52px;
  --node-gap: 54px;
}

body {
  background: var(--bg-primary);
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 40%);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
}

header {
  position: sticky;
  top: 0;
  z-index: 500;
  padding: 14px 24px;
  background: rgba(10,10,15,0.9);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

header h1 {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.container {
  position: relative;
  width: 100%;
  height: calc(100vh - 57px);
  overflow: auto;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--bg-elevated) transparent;
}
.container::-webkit-scrollbar { width: 10px; height: 10px; }
.container::-webkit-scrollbar-track { background: transparent; }
.container::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 5px; }
.container::-webkit-scrollbar-thumb:hover { background: var(--bg-tertiary); }
.container::-webkit-scrollbar-corner { background: transparent; }

.tree {
  position: relative;
  margin: 32px;
}

/* Base node styles */
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
  transition: all 0.15s;
}

.node:hover {
  transform: scale(1.15);
  border-color: var(--accent-gold);
  box-shadow: 0 0 20px var(--glow-gold), 0 4px 16px rgba(0,0,0,0.5);
  z-index: 100;
}

.node:hover img { filter: brightness(1.1); }

.node.hidden { display: none; }

/* Rank indicator */
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
  z-index: 10;
}

/* Choice nodes */
.node.choice {
  border-color: var(--accent-purple-dim);
  background: linear-gradient(180deg, #2e2448 0%, #1e1830 100%);
}

.node.choice:hover {
  border-color: var(--accent-purple);
  box-shadow: 0 0 20px var(--glow-purple), 0 4px 16px rgba(0,0,0,0.5);
}

.node.choice img {
  width: 50%;
  height: 100%;
  border-radius: 4px;
}

/* Hero nodes */
.node.hero {
  border-color: var(--accent-orange-dim);
  background: linear-gradient(180deg, #3d2818 0%, #2a1c10 100%);
}

.node.hero:hover {
  border-color: var(--accent-orange);
  box-shadow: 0 0 20px var(--glow-orange), 0 4px 16px rgba(0,0,0,0.5);
}

/* Tooltip */
.tooltip {
  display: none;
  position: fixed;
  background: linear-gradient(160deg, rgba(22,22,32,0.98) 0%, rgba(16,16,24,0.98) 100%);
  border: 1px solid var(--border-medium);
  padding: 16px 18px;
  border-radius: 12px;
  max-width: 420px;
  min-width: 280px;
  z-index: 1000;
  box-shadow:
    0 12px 40px rgba(0,0,0,0.6),
    0 0 0 1px rgba(255,255,255,0.04) inset,
    0 1px 0 rgba(255,255,255,0.06) inset;
  backdrop-filter: blur(12px);
  animation: tooltipIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tooltipIn {
  from { opacity: 0; transform: translateY(6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  flex-shrink: 0;
}

.tooltip-title {
  flex: 1;
}

.tooltip h3 {
  color: var(--accent-gold);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 2px 0;
}

.tooltip .subtitle {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tooltip p {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.tooltip .meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  font-family: ui-monospace, 'SF Mono', monospace;
}

.tooltip .meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tooltip .choice-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tooltip .choice-option {
  padding: 12px;
  background: rgba(0,0,0,0.25);
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  transition: all 0.15s;
}

.tooltip .choice-option:hover {
  border-color: var(--accent-purple-dim);
  background: rgba(168,85,247,0.05);
}

.tooltip .choice-option .choice-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.tooltip .choice-option img {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.tooltip .choice-option h4 {
  color: var(--accent-purple);
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.tooltip .choice-option p {
  font-size: 11.5px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Edges */
svg { position: absolute; top: 0; left: 0; pointer-events: none; }

.edge {
  stroke: #3a3a4a;
  stroke-width: 2.5;
  stroke-linecap: round;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  transition: all 0.2s;
}

.edge.hidden { display: none; }

.edge.hero-edge {
  stroke: rgba(249,115,22,0.4);
  stroke-dasharray: 6 4;
}

/* Legend */
.legend {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
}

.legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend .dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.dot.normal {
  border-color: #3d3d4d;
  background: linear-gradient(180deg, #2a2a38, #1e1e28);
}

.dot.choice {
  border-color: var(--accent-purple-dim);
  background: linear-gradient(180deg, #2e2448, #1e1830);
}

.dot.hero {
  border-color: var(--accent-orange-dim);
  background: linear-gradient(180deg, #3d2818, #2a1c10);
}

/* Hero selector */
.hero-selector {
  display: flex;
  gap: 8px;
  align-items: center;
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
  transition: all 0.15s ease;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
}

.hero-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent-orange-dim);
  color: var(--text-primary);
}

.hero-btn.active {
  background: rgba(249,115,22,0.12);
  border-color: var(--accent-orange);
  color: var(--accent-orange);
  box-shadow: 0 0 16px rgba(249,115,22,0.2);
}

.hero-btn img {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.hero-btn span { white-space: nowrap; }

.stats {
  font-size: 11px;
  color: var(--text-muted);
  padding: 5px 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-family: ui-monospace, 'SF Mono', monospace;
  border: 1px solid var(--border-subtle);
}

/* Inactive/grayed state */
.node.inactive {
  opacity: 0.5;
}

.node.inactive img {
  filter: grayscale(1) brightness(0.7);
}

.node.inactive:hover {
  opacity: 0.8;
}

.node.inactive:hover img {
  filter: grayscale(0.5) brightness(0.9);
}

/* Toggle button */
.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}

.toggle-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: rgba(34,197,94,0.15);
  border-color: var(--accent-green);
  color: var(--accent-green);
}

/* Tree section labels */
.tree-section {
  position: absolute;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  opacity: 0.6;
  pointer-events: none;
}
`.trim();

const generateClientScript = (tree: TalentTree, supabaseUrl: string): string =>
  `
const data = ${JSON.stringify(tree)};
const supabaseUrl = "${supabaseUrl}";
const treeEl = document.getElementById("tree");
const tooltip = document.getElementById("tooltip");
const heroSelector = document.getElementById("heroSelector");
const heroBtns = heroSelector.querySelectorAll(".hero-btn");

const getIconUrl = (iconName, size = "medium") =>
  supabaseUrl + "/functions/v1/icons/" + size + "/" + iconName + ".jpg";

const allNodeMap = new Map(data.nodes.map(n => [n.id, n]));
const edgesFrom = new Map();
for (const edge of data.edges) {
  if (!edgesFrom.has(edge.fromNodeId)) {
    edgesFrom.set(edge.fromNodeId, []);
  }
  edgesFrom.get(edge.fromNodeId).push(edge.toNodeId);
}

const includedIds = new Set();
const queue = [];
for (const n of data.nodes) {
  if (n.orderIndex >= 0 || n.subTreeId > 0) {
    includedIds.add(n.id);
    queue.push(n.id);
  }
}

while (queue.length > 0) {
  const nodeId = queue.shift();
  const targets = edgesFrom.get(nodeId) || [];
  for (const targetId of targets) {
    if (!includedIds.has(targetId)) {
      const targetNode = allNodeMap.get(targetId);
      if (targetNode && targetNode.subTreeId === 0) {
        includedIds.add(targetId);
        queue.push(targetId);
      }
    }
  }
}

const nodes = data.nodes.filter(n => includedIds.has(n.id));

const gridSize = 600;
const roundToGrid = v => Math.round(v / gridSize) * gridSize;
nodes.forEach(n => {
  n.posX = roundToGrid(n.posX);
  n.posY = roundToGrid(n.posY);
});

const xs = nodes.map(n => n.posX);
const ys = nodes.map(n => n.posY);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const padding = 80;
const scale = 0.095;
const nodeSize = 52;
const nodeCenter = nodeSize / 2;
const width = (maxX - minX) * scale + padding * 2 + nodeSize;
const height = (maxY - minY) * scale + padding * 2 + nodeSize;
treeEl.style.width = width + "px";
treeEl.style.height = height + "px";

const toX = x => (x - minX) * scale + padding;
const toY = y => (y - minY) * scale + padding;

// Create SVG for edges
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", width);
svg.setAttribute("height", height);

// Add defs for gradients
const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
const defaultGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
defaultGrad.id = "edgeGradient";
defaultGrad.innerHTML = '<stop offset="0%" stop-color="#4a4a5a"/><stop offset="100%" stop-color="#3a3a4a"/>';
defs.appendChild(defaultGrad);
svg.appendChild(defs);

const nodeSet = new Set(nodes.map(n => n.id));
const nodeMap = new Map(nodes.map(n => [n.id, n]));
const edgeEls = [];

for (const edge of data.edges) {
  if (!nodeSet.has(edge.fromNodeId) || !nodeSet.has(edge.toNodeId)) continue;
  const from = nodeMap.get(edge.fromNodeId);
  const to = nodeMap.get(edge.toNodeId);
  if (from && to) {
    const x1 = toX(from.posX) + nodeCenter;
    const y1 = toY(from.posY) + nodeCenter;
    const x2 = toX(to.posX) + nodeCenter;
    const y2 = toY(to.posY) + nodeCenter;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.classList.add("edge");
    if (from.subTreeId > 0 || to.subTreeId > 0) {
      line.classList.add("hero-edge");
    }
    line.dataset.fromSub = from.subTreeId;
    line.dataset.toSub = to.subTreeId;
    svg.appendChild(line);
    edgeEls.push(line);
  }
}
treeEl.appendChild(svg);

// Render nodes
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
      img.loading = "lazy";
      el.appendChild(img);
    }
  } else {
    const img = document.createElement("img");
    img.src = getIconUrl(node.entries[0]?.iconFileName || "inv_misc_questionmark");
    img.alt = node.entries[0]?.name || "?";
    img.loading = "lazy";
    el.appendChild(img);
  }

  // Add rank indicator for multi-rank talents
  if (node.maxRanks > 1 && !isChoice) {
    const ranks = document.createElement("div");
    ranks.className = "node-ranks";
    ranks.textContent = node.maxRanks;
    el.appendChild(ranks);
  }

  el.dataset.subTreeId = node.subTreeId;

  el.addEventListener("mouseenter", () => {
    const subTree = data.subTrees.find(s => s.id === node.subTreeId);
    const heroLabel = subTree ? '<span style="color:var(--accent-orange)"> [' + subTree.name + ']</span>' : "";
    const isChoice = node.type === 2 && node.entries.length > 1;
    const nodeTypeLabel = isChoice ? "Choice Talent" : (node.subTreeId > 0 ? "Hero Talent" : "Talent");

    if (isChoice) {
      const choiceHtml = node.entries.map(entry =>
        '<div class="choice-option">' +
          '<div class="choice-header">' +
            '<img src="' + getIconUrl(entry.iconFileName, "small") + '" alt="' + entry.name + '">' +
            '<h4>' + (entry.name || "Unknown") + '</h4>' +
          '</div>' +
          '<p>' + (entry.description || "No description available.") + '</p>' +
        '</div>'
      ).join("");
      tooltip.innerHTML =
        '<div class="tooltip-header">' +
          '<div class="tooltip-title">' +
            '<h3>Choose One' + heroLabel + '</h3>' +
            '<div class="subtitle">' + nodeTypeLabel + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="choice-container">' + choiceHtml + '</div>' +
        '<div class="meta">' +
          '<span>ID ' + node.id + '</span>' +
          '<span>Order ' + node.orderIndex + '</span>' +
        '</div>';
    } else {
      const entry = node.entries[0];
      const name = entry?.name || "(Unknown)";
      const desc = entry?.description || "No description available.";
      const iconUrl = getIconUrl(entry?.iconFileName || "inv_misc_questionmark", "small");
      tooltip.innerHTML =
        '<div class="tooltip-header">' +
          '<img class="tooltip-icon" src="' + iconUrl + '" alt="' + name + '">' +
          '<div class="tooltip-title">' +
            '<h3>' + name + heroLabel + '</h3>' +
            '<div class="subtitle">' + nodeTypeLabel + (node.maxRanks > 1 ? ' &middot; ' + node.maxRanks + ' Ranks' : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<p>' + desc + '</p>' +
        '<div class="meta">' +
          '<span>ID ' + node.id + '</span>' +
          '<span>Spell ' + (entry?.spellId || 'N/A') + '</span>' +
          '<span>Order ' + node.orderIndex + '</span>' +
        '</div>';
    }
    tooltip.classList.add("visible");
  });

  el.addEventListener("mousemove", e => {
    const x = Math.min(e.clientX + 16, window.innerWidth - 440);
    const y = Math.min(e.clientY + 16, window.innerHeight - 260);
    tooltip.style.left = Math.max(8, x) + "px";
    tooltip.style.top = Math.max(8, y) + "px";
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
        if (fromSub > 0 && fromSub !== selectedHeroId) visible = false;
        if (toSub > 0 && toSub !== selectedHeroId) visible = false;
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

// Gray out toggle
const grayToggle = document.getElementById("grayToggle");
let grayedOut = false;

grayToggle.addEventListener("click", () => {
  grayedOut = !grayedOut;
  grayToggle.classList.toggle("active", !grayedOut);
  for (const { el } of nodeEls) {
    el.classList.toggle("inactive", grayedOut);
  }
});
`.trim();

const generateHeroButtons = (
  subTrees: TalentSubTree[],
  supabaseUrl: string,
): string => {
  const buttons = subTrees.map(
    (s, i) =>
      `<button class="hero-btn${i === 0 ? " active" : ""}" data-subtree="${s.id}">` +
      `<img src="${supabaseUrl}/functions/v1/icons/small/${s.iconFileName}.jpg" alt="${s.name}">` +
      `<span>${s.name}</span></button>`,
  );
  buttons.push(
    '<button class="hero-btn" data-subtree="none"><span>Hide Hero</span></button>',
  );
  return buttons.join("");
};

export const generateHtml = (tree: TalentTree, supabaseUrl: string): string =>
  `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tree.className} ${tree.specName} - Talent Tree</title>
  <style>${CSS_STYLES}</style>
</head>
<body>
  <header>
    <h1>${tree.className} &mdash; ${tree.specName}</h1>
    <div class="hero-selector" id="heroSelector">
      ${generateHeroButtons(tree.subTrees, supabaseUrl)}
    </div>
    <button class="toggle-btn active" id="grayToggle">Show All</button>
    <div class="stats">${tree.nodes.length} talents</div>
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
  <script>${generateClientScript(tree, supabaseUrl)}</script>
</body>
</html>
`.trim();
