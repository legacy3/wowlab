import type * as fabric from "fabric";

import type { TraitTreeFlat } from "@/lib/trait";

import { preloadImages } from "@/components/fabric";

import type { RenderOptions } from "./types";

import {
  buildEdgeLookup,
  buildPositionMap,
  calculateGrid,
  collectIconUrls,
} from "./layout";
import { createEdge } from "./render-edge";
import { createNode } from "./render-node";

export async function renderTraitTree(
  canvas: fabric.Canvas,
  data: TraitTreeFlat,
  options: RenderOptions,
): Promise<void> {
  const { edges, nodes } = data;
  const {
    getEdgeState,
    getNodeSelection,
    getNodeState,
    onNodeHover,
    onNodePurchase,
    onNodeRefund,
  } = options;

  if (nodes.length === 0) {
    return;
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edgesByNode = buildEdgeLookup(edges, nodeIds);
  const canvasWidth = canvas.width ?? 800;
  const canvasHeight = canvas.height ?? 600;
  const grid = calculateGrid(nodes, canvasWidth, canvasHeight);
  const positions = buildPositionMap(nodes, grid);
  const iconUrls = collectIconUrls(nodes);
  const images = await preloadImages(iconUrls);

  for (const node of nodes) {
    const fromPos = positions.get(node.id);
    if (!fromPos) {
      continue;
    }

    const targets = edgesByNode.get(node.id) ?? [];
    for (const targetId of targets) {
      const toPos = positions.get(targetId);
      if (!toPos) {
        continue;
      }

      canvas.add(
        createEdge(
          fromPos.x,
          fromPos.y,
          toPos.x,
          toPos.y,
          getEdgeState(node.id, targetId),
        ),
      );
    }
  }

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) {
      continue;
    }

    canvas.add(
      createNode({
        images,
        isHero: node.subTreeId > 0,
        node,
        onHover: onNodeHover,
        onPurchase: onNodePurchase,
        onRefund: onNodeRefund,
        selection: getNodeSelection(node.id),
        state: getNodeState(node.id),
        x: pos.x,
        y: pos.y,
      }),
    );
  }

  canvas.requestRenderAll();
}
