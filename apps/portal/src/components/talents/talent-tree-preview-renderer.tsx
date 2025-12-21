"use client";

import type { TalentViewModel } from "@wowlab/services/Talents";
import { cn } from "@/lib/utils";

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
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
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
            stroke="#6366f1"
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
            stroke="#fbbf24"
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
            fill="#6366f1"
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
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          );
        })}
    </svg>
  );
}
