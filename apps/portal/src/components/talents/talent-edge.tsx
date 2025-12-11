"use client";

import type { Talent } from "@wowlab/core/Schemas";

interface TalentEdgeProps {
  edge: Talent.TalentEdge;
  fromNode: Talent.TalentNode;
  toNode: Talent.TalentNode;
  fromSelected?: boolean;
  toSelected?: boolean;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export function TalentEdge({
  fromNode,
  toNode,
  fromSelected,
  toSelected,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
}: TalentEdgeProps) {
  const x1 = fromNode.posX * scale + offsetX;
  const y1 = fromNode.posY * scale + offsetY;
  const x2 = toNode.posX * scale + offsetX;
  const y2 = toNode.posY * scale + offsetY;

  const isActive = fromSelected && toSelected;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isActive ? "#facc15" : "#4b5563"}
      strokeWidth={isActive ? 2 : 1}
      strokeOpacity={isActive ? 1 : 0.5}
    />
  );
}
