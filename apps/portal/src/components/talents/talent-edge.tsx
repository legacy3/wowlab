"use client";

import { memo } from "react";
import { KonvaLine } from "@/components/konva";
import type { TalentEdgePosition } from "@wowlab/services/Talents";
import {
  EDGE_WIDTH_ACTIVE,
  EDGE_WIDTH_UNLOCKED,
  EDGE_WIDTH_LOCKED,
  EDGE_COLOR_ACTIVE,
  EDGE_COLOR_UNLOCKED,
  EDGE_COLOR_LOCKED,
} from "./constants";

interface TalentEdgeProps {
  edge: TalentEdgePosition;
  isPathHighlight?: boolean;
}

export const TalentEdge = memo(function TalentEdge({
  edge,
  isPathHighlight = false,
}: TalentEdgeProps) {
  const { fromX, fromY, toX, toY, fromSelected, toSelected } = edge;

  const isActive = fromSelected && toSelected;
  const isUnlocked = fromSelected && !toSelected;

  const stroke = isPathHighlight
    ? "#22c55e"
    : isActive
      ? EDGE_COLOR_ACTIVE
      : isUnlocked
        ? EDGE_COLOR_UNLOCKED
        : EDGE_COLOR_LOCKED;

  const strokeWidth = isPathHighlight
    ? 3
    : isActive
      ? EDGE_WIDTH_ACTIVE
      : isUnlocked
        ? EDGE_WIDTH_UNLOCKED
        : EDGE_WIDTH_LOCKED;

  const opacity = isPathHighlight ? 1 : isActive ? 1 : isUnlocked ? 0.8 : 0.5;

  return (
    <KonvaLine
      points={[fromX, fromY, toX, toY]}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      shadowColor={isPathHighlight ? "#22c55e" : undefined}
      shadowBlur={isPathHighlight ? 6 : 0}
      shadowOpacity={isPathHighlight ? 0.5 : 0}
      listening={false}
    />
  );
});
