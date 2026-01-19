import * as fabric from "fabric";

import type { NodeSelection, TalentNode, TooltipData } from "../types";

import {
  CHOICE_CORNER_RADIUS,
  CHOICE_NODE_SIZE,
  COLORS,
  NODE_BORDER,
  NODE_CORNER_RADIUS,
  NODE_SIZE,
} from "../constants";
import { getIconUrl } from "./layout";

export interface NodeRenderContext {
  images: Map<string, HTMLImageElement>;
  isHero: boolean;
  node: TalentNode;
  onHover?: (data: TooltipData | null) => void;
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  selection?: NodeSelection;
  x: number;
  y: number;
}

export function createNode(ctx: NodeRenderContext): fabric.Group {
  const { images, isHero, node, onHover, onNodeClick, selection, x, y } = ctx;
  const isChoice = isChoiceNode(node);
  const isSelected = selection !== undefined && selection.ranksPurchased > 0;

  const size = isChoice ? CHOICE_NODE_SIZE : NODE_SIZE;
  const cornerRadius = isChoice ? CHOICE_CORNER_RADIUS : NODE_CORNER_RADIUS;
  const iconSize = size - NODE_BORDER * 2;

  const objects: fabric.FabricObject[] = [];

  if (isSelected) {
    objects.push(createSelectionRing(size, cornerRadius));
  }

  objects.push(
    createNodeFrame(size, cornerRadius, isChoice, isHero, isSelected),
  );

  if (isChoice && !isSelected) {
    const choiceIcons = createChoiceIcons(node, images, iconSize);
    objects.push(...choiceIcons);
  } else {
    const entryIndex = isChoice ? (selection?.choiceIndex ?? 0) : 0;
    const icon = createSingleIcon(node, entryIndex, images, iconSize);
    if (icon) {
      objects.push(icon);
    }
  }

  if (node.maxRanks > 1) {
    objects.push(...createRankBadge(node, size, selection));
  }

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

  bindNodeEvents(group, node, onHover, onNodeClick);

  return group;
}

function bindNodeEvents(
  group: fabric.Group,
  node: TalentNode,
  onHover?: (data: TooltipData | null) => void,
  onNodeClick?: (nodeId: number, entryIndex: number) => void,
): void {
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

  group.on("mouseup", () => {
    onNodeClick?.(node.id, 0);
  });
}

function createChoiceIcons(
  node: TalentNode,
  images: Map<string, HTMLImageElement>,
  iconSize: number,
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const halfWidth = iconSize / 2;

  const entry1 = node.entries[0];
  const entry2 = node.entries[1];

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

  const divider = new fabric.Line([0, -iconSize / 2, 0, iconSize / 2], {
    originX: "center",
    originY: "center",
    stroke: COLORS.divider,
    strokeWidth: 1,
  });
  objects.push(divider);

  return objects;
}

function createNodeFrame(
  size: number,
  cornerRadius: number,
  isChoice: boolean,
  isHero: boolean,
  isSelected: boolean,
): fabric.Rect {
  let borderColor: string = COLORS.borderDefault;
  if (isSelected) {
    borderColor = COLORS.borderSelected;
  } else if (isHero) {
    borderColor = COLORS.borderHero;
  } else if (isChoice) {
    borderColor = COLORS.borderChoice;
  }

  return new fabric.Rect({
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
}

function createRankBadge(
  node: TalentNode,
  size: number,
  selection?: NodeSelection,
): fabric.FabricObject[] {
  const isSelected = selection !== undefined && selection.ranksPurchased > 0;

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

  return [rankBg, rankLabel];
}

function createSelectionRing(size: number, cornerRadius: number): fabric.Rect {
  return new fabric.Rect({
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
}

function createSingleIcon(
  node: TalentNode,
  entryIndex: number,
  images: Map<string, HTMLImageElement>,
  iconSize: number,
): fabric.FabricImage | null {
  const entry = node.entries[entryIndex];
  if (!entry?.iconFileName) return null;

  const img = images.get(getIconUrl(entry.iconFileName));
  if (!img) return null;

  return new fabric.FabricImage(img, {
    originX: "center",
    originY: "center",
    scaleX: iconSize / (img.width || 56),
    scaleY: iconSize / (img.height || 56),
  });
}

function isChoiceNode(node: TalentNode): boolean {
  return node.type === 2 && node.entries.length > 1;
}
