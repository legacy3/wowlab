import * as fabric from "fabric";

import { preloadImages } from "@/components/fabric";
import { env } from "@/lib/env";

import type {
  NodeSelection,
  RenderOptions,
  TalentEdge,
  TalentNode,
  TalentTreeData,
  TooltipData,
} from "./types";

import {
  CELL_SIZE,
  CHOICE_CORNER_RADIUS,
  CHOICE_NODE_SIZE,
  COLORS,
  EDGE_WIDTH_LOCKED,
  NODE_BORDER,
  NODE_CORNER_RADIUS,
  NODE_SIZE,
} from "./constants";

// =============================================================================
// Helpers
// =============================================================================

interface NodeRenderContext {
  images: Map<string, HTMLImageElement>;
  isHero: boolean;
  node: TalentNode;
  onHover?: (data: TooltipData | null) => void;
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  selection?: NodeSelection;
  x: number;
  y: number;
}

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
  const edgesByNode = new Map<number, number[]>();
  for (const edge of edges) {
    if (
      !visibleNodeIds.has(edge.fromNodeId) ||
      !visibleNodeIds.has(edge.toNodeId)
    ) {
      continue;
    }
    const list = edgesByNode.get(edge.fromNodeId) ?? [];
    list.push(edge.toNodeId);
    edgesByNode.set(edge.fromNodeId, list);
  }

  // Calculate layout grid
  const uniqueX = [...new Set(visibleNodes.map((n) => n.posX))].sort(
    (a, b) => a - b,
  );
  const uniqueY = [...new Set(visibleNodes.map((n) => n.posY))].sort(
    (a, b) => a - b,
  );
  const xToCol = new Map(uniqueX.map((x, i) => [x, i]));
  const yToRow = new Map(uniqueY.map((y, i) => [y, i]));

  const numCols = uniqueX.length;
  const numRows = uniqueY.length;
  const gridWidth = numCols * CELL_SIZE;
  const gridHeight = numRows * CELL_SIZE;
  const canvasWidth = canvas.width ?? 800;
  const canvasHeight = canvas.height ?? 600;
  const offsetX = (canvasWidth - gridWidth) / 2 + CELL_SIZE / 2;
  const offsetY = (canvasHeight - gridHeight) / 2 + CELL_SIZE / 2;

  // Build position map
  const positions = new Map<number, { x: number; y: number }>();
  for (const node of visibleNodes) {
    const col = xToCol.get(node.posX) ?? 0;
    const row = yToRow.get(node.posY) ?? 0;
    positions.set(node.id, {
      x: offsetX + col * CELL_SIZE,
      y: offsetY + row * CELL_SIZE,
    });
  }

  // Collect icon URLs
  const iconUrls: string[] = [];
  for (const node of visibleNodes) {
    for (const entry of node.entries) {
      if (entry.iconFileName) {
        iconUrls.push(getIconUrl(entry.iconFileName));
      }
    }
  }

  // Preload all images
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

// =============================================================================
// Node Rendering
// =============================================================================

function createEdge(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): fabric.Line {
  return new fabric.Line([fromX, fromY, toX, toY], {
    evented: false,
    objectCaching: true,
    selectable: false,
    stroke: COLORS.edgeLocked,
    strokeWidth: EDGE_WIDTH_LOCKED,
  });
}

function createNode(ctx: NodeRenderContext): fabric.Group {
  const { images, isHero, node, onHover, onNodeClick, selection, x, y } = ctx;
  const isChoice = isChoiceNode(node);
  const isSelected = selection !== undefined && selection.ranksPurchased > 0;

  const size = isChoice ? CHOICE_NODE_SIZE : NODE_SIZE;
  const cornerRadius = isChoice ? CHOICE_CORNER_RADIUS : NODE_CORNER_RADIUS;
  const iconSize = size - NODE_BORDER * 2;

  const objects: fabric.FabricObject[] = [];

  // Border color based on state
  let borderColor: string = COLORS.borderDefault;
  if (isSelected) {
    borderColor = COLORS.borderSelected;
  } else if (isHero) {
    borderColor = COLORS.borderHero;
  } else if (isChoice) {
    borderColor = COLORS.borderChoice;
  }

  // Background frame
  const frame = new fabric.Rect({
    fill: isChoice ? COLORS.nodeBgChoice : COLORS.nodeBg,
    height: size,
    originX: "center",
    originY: "center",
    rx: cornerRadius,
    ry: cornerRadius,
    stroke: borderColor,
    strokeWidth: NODE_BORDER,
    width: size,
  });
  objects.push(frame);

  // Selection ring
  if (isSelected) {
    const ring = new fabric.Rect({
      fill: "transparent",
      height: size + 6,
      originX: "center",
      originY: "center",
      rx: cornerRadius + 2,
      ry: cornerRadius + 2,
      stroke: COLORS.selectionRing,
      strokeWidth: 2,
      width: size + 6,
    });
    objects.unshift(ring); // Behind frame
  }

  // Icon rendering
  if (isChoice && !isSelected) {
    // Choice node without selection: split view
    const entry1 = node.entries[0];
    const entry2 = node.entries[1];
    const halfWidth = iconSize / 2;

    // Left icon (clipped)
    if (entry1?.iconFileName) {
      const img = images.get(getIconUrl(entry1.iconFileName));
      if (img) {
        const leftClip = new fabric.Rect({
          absolutePositioned: true,
          height: iconSize,
          left: -halfWidth,
          top: -iconSize / 2,
          width: halfWidth,
        });
        const leftIcon = new fabric.FabricImage(img, {
          clipPath: leftClip,
          originX: "center",
          originY: "center",
          scaleX: iconSize / (img.width || 56),
          scaleY: iconSize / (img.height || 56),
        });
        objects.push(leftIcon);
      }
    }

    // Right icon (clipped)
    if (entry2?.iconFileName) {
      const img = images.get(getIconUrl(entry2.iconFileName));
      if (img) {
        const rightClip = new fabric.Rect({
          absolutePositioned: true,
          height: iconSize,
          left: 0,
          top: -iconSize / 2,
          width: halfWidth,
        });
        const rightIcon = new fabric.FabricImage(img, {
          clipPath: rightClip,
          originX: "center",
          originY: "center",
          scaleX: iconSize / (img.width || 56),
          scaleY: iconSize / (img.height || 56),
        });
        objects.push(rightIcon);
      }
    }

    // Divider line
    const divider = new fabric.Line([0, -iconSize / 2, 0, iconSize / 2], {
      originX: "center",
      originY: "center",
      stroke: COLORS.divider,
      strokeWidth: 1,
    });
    objects.push(divider);
  } else {
    // Single icon (normal node or selected choice)
    const entryIndex = isChoice ? (selection?.choiceIndex ?? 0) : 0;
    const entry = node.entries[entryIndex];

    if (entry?.iconFileName) {
      const img = images.get(getIconUrl(entry.iconFileName));
      if (img) {
        const icon = new fabric.FabricImage(img, {
          originX: "center",
          originY: "center",
          scaleX: iconSize / (img.width || 56),
          scaleY: iconSize / (img.height || 56),
        });
        objects.push(icon);
      }
    }
  }

  // Rank badge for multi-rank talents
  if (node.maxRanks > 1) {
    const rankBg = new fabric.Circle({
      fill: COLORS.rankBg,
      left: size / 2 - 6,
      originX: "center",
      originY: "center",
      radius: 8,
      stroke: COLORS.rankStroke,
      strokeWidth: 1,
      top: size / 2 - 6,
    });
    objects.push(rankBg);

    const rankText = isSelected
      ? `${selection.ranksPurchased}`
      : `${node.maxRanks}`;
    const rankLabel = new fabric.Text(rankText, {
      fill: isSelected ? COLORS.rankTextSelected : COLORS.rankTextDefault,
      fontFamily: "system-ui, sans-serif",
      fontSize: 10,
      fontWeight: "bold",
      left: size / 2 - 6,
      originX: "center",
      originY: "center",
      top: size / 2 - 6,
    });
    objects.push(rankLabel);
  }

  // Create group
  const group = new fabric.Group(objects, {
    hasBorders: false,
    hasControls: false,
    hoverCursor: "pointer",
    left: x,
    objectCaching: true,
    originX: "center",
    originY: "center",
    selectable: false,
    top: y,
  });

  // Hover events
  group.on("mouseover", (e) => {
    if (!onHover) return;
    const pointer = e.viewportPoint;
    if (!pointer) return;

    onHover({
      entryIndex: 0,
      node,
      screenX: pointer.x,
      screenY: pointer.y,
    });
  });

  group.on("mouseout", () => {
    onHover?.(null);
  });

  // Click events
  group.on("mouseup", () => {
    onNodeClick?.(node.id, 0);
  });

  return group;
}

// =============================================================================
// Edge Rendering
// =============================================================================

function getIconUrl(iconName: string): string {
  return `${env.SUPABASE_URL}/functions/v1/icons/medium/${iconName}.jpg`;
}

// =============================================================================
// Main Renderer
// =============================================================================

function isChoiceNode(node: TalentNode): boolean {
  return node.type === 2 && node.entries.length > 1;
}
