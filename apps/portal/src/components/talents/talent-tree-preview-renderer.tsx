"use client";

import type { TalentViewModel } from "@wowlab/services/Talents";
import { cn } from "@/lib/utils";
import {
  PREVIEW_BG,
  PREVIEW_EDGE,
  PREVIEW_EDGE_ACTIVE,
  PREVIEW_NODE,
  PREVIEW_NODE_ACTIVE,
  PREVIEW_NODE_ACTIVE_STROKE,
} from "./constants";

interface TalentTreePreviewRendererProps {
  viewModel: TalentViewModel;
  className?: string;
}

export function TalentTreePreviewRenderer({
  viewModel,
  className,
}: TalentTreePreviewRendererProps) {
  const width = viewModel.layout.width;
  const height = viewModel.layout.height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-auto rounded-lg", className)}
      style={{
        background: PREVIEW_BG,
      }}
    >
      {viewModel.edges
        .filter((edge) => !(edge.fromSelected && edge.toSelected))
        .map((edge) => (
          <line
            key={edge.id}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke={PREVIEW_EDGE}
            strokeWidth={1}
            opacity={0.2}
          />
        ))}

      {viewModel.edges
        .filter((edge) => edge.fromSelected && edge.toSelected)
        .map((edge) => (
          <line
            key={`active-${edge.id}`}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke={PREVIEW_EDGE_ACTIVE}
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}

      {viewModel.nodes
        .filter(
          (node) =>
            !(
              node.selection?.selected &&
              (node.selection.ranksPurchased ?? 0) > 0
            ),
        )
        .map((nodePos) => (
          <circle
            key={nodePos.id}
            cx={nodePos.x}
            cy={nodePos.y}
            r={3}
            fill={PREVIEW_NODE}
            opacity={0.3}
          />
        ))}

      {viewModel.nodes
        .filter(
          (node) =>
            node.selection?.selected &&
            (node.selection.ranksPurchased ?? 0) > 0,
        )
        .map((nodePos) => {
          const isChoice = nodePos.node.type === 2;
          return (
            <circle
              key={`selected-${nodePos.id}`}
              cx={nodePos.x}
              cy={nodePos.y}
              r={isChoice ? 10 : 7}
              fill={PREVIEW_NODE_ACTIVE}
              stroke={PREVIEW_NODE_ACTIVE_STROKE}
              strokeWidth={2}
            />
          );
        })}
    </svg>
  );
}
