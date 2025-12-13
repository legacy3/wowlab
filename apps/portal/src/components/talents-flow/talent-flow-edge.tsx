"use client";

import { memo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";

export interface TalentEdgeData extends Record<string, unknown> {
  fromSelected: boolean;
  toSelected: boolean;
}

export type TalentFlowEdge = Edge<TalentEdgeData, "talent">;

function TalentFlowEdgeComponent({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<TalentFlowEdge>) {
  const fromSelected = data?.fromSelected ?? false;
  const toSelected = data?.toSelected ?? false;

  // Determine edge state
  const isActive = fromSelected && toSelected;
  const isUnlocked = fromSelected && !toSelected;

  // Edge styling based on state
  const strokeColor = isActive
    ? "#facc15" // yellow-400
    : isUnlocked
      ? "#22c55e" // green-500
      : "#4b5563"; // gray-600

  const strokeWidth = isActive ? 2.5 : isUnlocked ? 2 : 1.5;
  const strokeOpacity = isActive ? 1 : isUnlocked ? 0.8 : 0.4;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: strokeColor,
        strokeWidth,
        strokeOpacity,
        transition: "stroke 0.2s, stroke-width 0.2s, stroke-opacity 0.2s",
      }}
    />
  );
}

export const TalentFlowEdge = memo(TalentFlowEdgeComponent);
