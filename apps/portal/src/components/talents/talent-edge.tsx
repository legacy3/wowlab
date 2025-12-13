"use client";

import type { Talent } from "@wowlab/core/Schemas";

interface TalentEdgeProps {
  fromNode: Talent.TalentNode;
  toNode: Talent.TalentNode;
  fromSelected?: boolean;
  toSelected?: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function TalentEdge({
  fromNode,
  toNode,
  fromSelected,
  toSelected,
  scale,
  offsetX,
  offsetY,
}: TalentEdgeProps) {
  const x1 = fromNode.posX * scale + offsetX;
  const y1 = fromNode.posY * scale + offsetY;
  const x2 = toNode.posX * scale + offsetX;
  const y2 = toNode.posY * scale + offsetY;

  // Three states: active (both selected), unlocked (from selected), locked (neither)
  const isActive = fromSelected && toSelected;
  const isUnlocked = fromSelected && !toSelected;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isActive ? "#facc15" : isUnlocked ? "#22c55e" : "#4b5563"}
      strokeWidth={isActive ? 2 : isUnlocked ? 1.5 : 1}
      strokeOpacity={isActive ? 1 : isUnlocked ? 0.8 : 0.5}
    />
  );
}
