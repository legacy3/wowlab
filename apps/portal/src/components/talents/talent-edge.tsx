"use client";

import { memo } from "react";
import { Line } from "react-konva";
import type { TalentEdgePosition } from "./types";
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
}

export const TalentEdge = memo(function TalentEdge({ edge }: TalentEdgeProps) {
  const { fromX, fromY, toX, toY, fromSelected, toSelected } = edge;

  const isActive = fromSelected && toSelected;
  const isUnlocked = fromSelected && !toSelected;

  const stroke = isActive
    ? EDGE_COLOR_ACTIVE
    : isUnlocked
      ? EDGE_COLOR_UNLOCKED
      : EDGE_COLOR_LOCKED;

  const strokeWidth = isActive
    ? EDGE_WIDTH_ACTIVE
    : isUnlocked
      ? EDGE_WIDTH_UNLOCKED
      : EDGE_WIDTH_LOCKED;

  const opacity = isActive ? 1 : isUnlocked ? 0.8 : 0.5;

  return (
    <Line
      points={[fromX, fromY, toX, toY]}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
});
