import * as fabric from "fabric";

import { isChoiceNode, type NodeState, type TraitNode } from "@/lib/trait";

import type { NodeRenderContext, TooltipData } from "./types";

import {
  CHOICE_CORNER_RADIUS,
  CHOICE_NODE_SIZE,
  COLORS,
  NODE_BORDER,
  NODE_CORNER_RADIUS,
  NODE_SIZE,
} from "./constants";
import { getIconUrl } from "./layout";

export function createNode(ctx: NodeRenderContext): fabric.Group {
  const {
    images,
    isHero,
    node,
    onHover,
    onPurchase,
    onRefund,
    selection,
    state,
    x,
    y,
  } = ctx;
  const isChoice = isChoiceNode(node);
  const isActive = state === "active" || state === "maxed";

  const size = isChoice ? CHOICE_NODE_SIZE : NODE_SIZE;
  const cornerRadius = isChoice ? CHOICE_CORNER_RADIUS : NODE_CORNER_RADIUS;
  const iconSize = size - NODE_BORDER * 2;

  const objects: fabric.FabricObject[] = [];

  if (isActive) {
    objects.push(createSelectionRing(size, cornerRadius, state));
  }

  objects.push(createNodeFrame(size, cornerRadius, isChoice, isHero, state));

  if (isChoice && !isActive) {
    objects.push(...createChoiceIcons(node, images, iconSize));
  } else {
    const entryIndex = isChoice ? (selection?.choiceIndex ?? 0) : 0;
    const icon = createSingleIcon(node, entryIndex, images, iconSize);
    if (icon) {
      objects.push(icon);
    }
  }

  if (node.maxRanks > 1) {
    objects.push(
      ...createRankBadge(node, size, selection?.ranksPurchased ?? 0, state),
    );
  }

  if (state === "locked") {
    objects.push(createLockOverlay(size, cornerRadius));
  }

  const group = new fabric.Group(objects, {
    hasBorders: false,
    hasControls: false,
    hoverCursor: state === "locked" ? "not-allowed" : "pointer",
    left: x,
    objectCaching: true,
    originX: "center",
    originY: "center",
    selectable: false,
    top: y,
  });

  bindNodeEvents(
    group,
    node,
    selection?.ranksPurchased ?? 0,
    state,
    onHover,
    onPurchase,
    onRefund,
  );

  return group;
}

function bindNodeEvents(
  group: fabric.Group,
  node: TraitNode,
  ranksPurchased: number,
  state: NodeState,
  onHover?: (data: TooltipData | null) => void,
  onPurchase?: (nodeId: number, entryIndex?: number) => void,
  onRefund?: (nodeId: number) => void,
): void {
  group.on("mouseover", (e) => {
    if (!onHover) {
      return;
    }
    const pointer = e.viewportPoint;
    if (!pointer) {
      return;
    }

    onHover({
      entryIndex: 0,
      node,
      ranksPurchased,
      screenX: pointer.x,
      screenY: pointer.y,
    });
  });

  group.on("mouseout", () => {
    onHover?.(null);
  });

  group.on("mouseup", (e) => {
    if (e.e instanceof MouseEvent && e.e.button === 2) {
      onRefund?.(node.id);
      return;
    }

    if (state !== "locked") {
      const entryIndex = isChoiceNode(node)
        ? getClickedEntryIndex(node, e)
        : undefined;
      onPurchase?.(node.id, entryIndex);
    }
  });
}

function createChoiceIcons(
  node: TraitNode,
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
      objects.push(
        new fabric.FabricImage(img, {
          clipPath: leftClip,
          originX: "center",
          originY: "center",
          scaleX: iconSize / (img.width || 56),
          scaleY: iconSize / (img.height || 56),
        }),
      );
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
      objects.push(
        new fabric.FabricImage(img, {
          clipPath: rightClip,
          originX: "center",
          originY: "center",
          scaleX: iconSize / (img.width || 56),
          scaleY: iconSize / (img.height || 56),
        }),
      );
    }
  }

  objects.push(
    new fabric.Line([0, -iconSize / 2, 0, iconSize / 2], {
      originX: "center",
      originY: "center",
      stroke: COLORS.divider,
      strokeWidth: 1,
    }),
  );

  return objects;
}

function createLockOverlay(size: number, cornerRadius: number): fabric.Rect {
  return new fabric.Rect({
    fill: "rgba(0, 0, 0, 0.4)",
    height: size,
    originX: "center",
    originY: "center",
    rx: cornerRadius,
    ry: cornerRadius,
    width: size,
  });
}

function createNodeFrame(
  size: number,
  cornerRadius: number,
  isChoice: boolean,
  isHero: boolean,
  state: NodeState,
): fabric.Rect {
  return new fabric.Rect({
    fill: isChoice ? COLORS.nodeBgChoice : COLORS.nodeBg,
    height: size,
    originX: "center",
    originY: "center",
    rx: cornerRadius,
    ry: cornerRadius,
    stroke: getBorderColor(isChoice, isHero, state),
    strokeWidth: NODE_BORDER,
    width: size,
  });
}

function createRankBadge(
  node: TraitNode,
  size: number,
  ranksPurchased: number,
  state: NodeState,
): fabric.FabricObject[] {
  const isActive = ranksPurchased > 0;
  const isMaxed = state === "maxed";

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

  let textColor: string = COLORS.rankTextDefault;
  if (isMaxed) {
    textColor = COLORS.rankTextMaxed;
  } else if (isActive) {
    textColor = COLORS.rankTextSelected;
  }

  const rankLabel = new fabric.Text(
    isActive ? `${ranksPurchased}/${node.maxRanks}` : `${node.maxRanks}`,
    {
      fill: textColor,
      fontFamily: "system-ui, sans-serif",
      fontSize: isActive ? 8 : 10,
      fontWeight: "bold",
      left: size / 2 - 6,
      originX: "center",
      originY: "center",
      top: size / 2 - 6,
    },
  );

  return [rankBg, rankLabel];
}

function createSelectionRing(
  size: number,
  cornerRadius: number,
  state: NodeState,
): fabric.Rect {
  return new fabric.Rect({
    fill: "transparent",
    height: size + 6,
    originX: "center",
    originY: "center",
    rx: cornerRadius + 2,
    ry: cornerRadius + 2,
    stroke: state === "maxed" ? COLORS.borderMaxed : COLORS.selectionRing,
    strokeWidth: 2,
    width: size + 6,
  });
}

function createSingleIcon(
  node: TraitNode,
  entryIndex: number,
  images: Map<string, HTMLImageElement>,
  iconSize: number,
): fabric.FabricImage | null {
  const entry = node.entries[entryIndex];
  if (!entry?.iconFileName) {
    return null;
  }

  const img = images.get(getIconUrl(entry.iconFileName));
  if (!img) {
    return null;
  }

  return new fabric.FabricImage(img, {
    originX: "center",
    originY: "center",
    scaleX: iconSize / (img.width || 56),
    scaleY: iconSize / (img.height || 56),
  });
}

function getBorderColor(
  isChoice: boolean,
  isHero: boolean,
  state: NodeState,
): string {
  switch (state) {
    case "active":
      return COLORS.borderActive;
    case "maxed":
      return COLORS.borderMaxed;
    case "unlocked":
      return COLORS.borderUnlocked;
    case "locked":
    default:
      if (isHero) {
        return COLORS.borderHero;
      }
      if (isChoice) {
        return COLORS.borderChoice;
      }
      return COLORS.borderLocked;
  }
}

function getClickedEntryIndex(
  node: TraitNode,
  e: fabric.TPointerEventInfo<fabric.TPointerEvent>,
): number | undefined {
  if (!isChoiceNode(node)) {
    return undefined;
  }

  const pointer = e.viewportPoint;
  if (!pointer) {
    return undefined;
  }

  const target = e.target;
  if (!target) {
    return undefined;
  }

  const centerX = target.left ?? 0;
  return pointer.x < centerX ? 0 : 1;
}
