import type * as fabric from "fabric";

import { preloadImages } from "@/components/fabric";

import type { RenderOptions, TalentTreeData } from "../types";

import {
  buildEdgeLookup,
  buildPositionMap,
  calculateGrid,
  collectIconUrls,
} from "./layout";
import { createEdge } from "./render-edge";
import { createNode } from "./render-node";

/**
 * Render a complete talent tree to a Fabric.js canvas.
 *
 * Pipeline:
 * 1. Filter visible nodes (class tree + selected hero tree)
 * 2. Calculate grid layout
 * 3. Preload all icon images
 * 4. Render edges (connections)
 * 5. Render nodes
 */
export async function renderTalentTree(
  canvas: fabric.Canvas,
  data: TalentTreeData,
  options: RenderOptions = {},
): Promise<void> {
  const { edges, nodes, subTrees } = data;
  const { onNodeClick, onNodeHover, selectedHeroId, selection } = options;

  // Determine active hero subtree
  const heroId = selectedHeroId ?? subTrees[0]?.id ?? null;

  // Filter visible nodes (class tree + selected hero tree)
  const visibleNodes = nodes.filter((n) => {
    if (n.subTreeId === 0) return true;
    return heroId !== null && n.subTreeId === heroId;
  });

  if (visibleNodes.length === 0) return;

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // Build edge lookup
  const edgesByNode = buildEdgeLookup(edges, visibleNodeIds);

  // Calculate layout grid
  const canvasWidth = canvas.width ?? 800;
  const canvasHeight = canvas.height ?? 600;
  const grid = calculateGrid(visibleNodes, canvasWidth, canvasHeight);

  // Build position map
  const positions = buildPositionMap(visibleNodes, grid);

  // Collect and preload icon images
  const iconUrls = collectIconUrls(visibleNodes);
  const images = await preloadImages(iconUrls);

  // Render edges
  for (const node of visibleNodes) {
    const fromPos = positions.get(node.id);
    if (!fromPos) continue;

    const targets = edgesByNode.get(node.id) ?? [];
    for (const targetId of targets) {
      const toPos = positions.get(targetId);
      if (!toPos) continue;

      const edge = createEdge(fromPos.x, fromPos.y, toPos.x, toPos.y);
      canvas.add(edge);
    }
  }

  // Render nodes
  for (const node of visibleNodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const nodeSelection = selection?.nodes.get(node.id);
    const group = createNode({
      images,
      isHero: node.subTreeId > 0,
      node,
      onHover: onNodeHover,
      onNodeClick,
      selection: nodeSelection,
      x: pos.x,
      y: pos.y,
    });

    canvas.add(group);
  }

  canvas.requestRenderAll();
}
