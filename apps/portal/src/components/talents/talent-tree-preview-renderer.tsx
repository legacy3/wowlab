"use client";

import type { TalentViewModel } from "@wowlab/services/Talents";
import { cn } from "@/lib/utils";
import {
  PREVIEW_BG,
  PREVIEW_EDGE,
  PREVIEW_EDGE_ACTIVE,
  PREVIEW_NODE,
  PREVIEW_NODE_ACTIVE,
} from "./constants";

interface TalentTreePreviewRendererProps {
  viewModel: TalentViewModel;
  className?: string;
  transparentBg?: boolean;
}

const BASE_NODE_SIZE = 4;
const ACTIVE_NODE_SIZE = 5;
const CHOICE_NODE_SIZE = 6;
const EDGE_WIDTH = 1.5;

function ChoiceNodeHalf({
  cx,
  cy,
  r,
  isLeft,
  isSelected,
}: {
  cx: number;
  cy: number;
  r: number;
  isLeft: boolean;
  isSelected: boolean;
}) {
  const startY = cy - r;
  const endY = cy + r;
  const path = isLeft
    ? `M ${cx} ${startY} A ${r} ${r} 0 0 0 ${cx} ${endY} L ${cx} ${startY}`
    : `M ${cx} ${startY} A ${r} ${r} 0 0 1 ${cx} ${endY} L ${cx} ${startY}`;

  return (
    <path
      d={path}
      fill={isSelected ? PREVIEW_NODE_ACTIVE : PREVIEW_NODE}
      opacity={isSelected ? 1 : 0.25}
    />
  );
}

export function TalentTreePreviewRenderer({
  viewModel,
  className,
  transparentBg = false,
}: TalentTreePreviewRendererProps) {
  const { width, height } = viewModel.layout;

  const regularNodes = viewModel.nodes.filter((n) => n.node.type !== 2);
  const choiceNodes = viewModel.nodes.filter((n) => n.node.type === 2);
  const inactiveEdges = viewModel.edges.filter(
    (e) => !(e.fromSelected && e.toSelected),
  );
  const activeEdges = viewModel.edges.filter(
    (e) => e.fromSelected && e.toSelected,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-auto rounded", className)}
      style={{ background: transparentBg ? "transparent" : PREVIEW_BG }}
    >
      {inactiveEdges.map((edge) => (
        <line
          key={edge.id}
          x1={edge.fromX}
          y1={edge.fromY}
          x2={edge.toX}
          y2={edge.toY}
          stroke={PREVIEW_EDGE}
          strokeWidth={EDGE_WIDTH * 0.5}
          opacity={0.15}
        />
      ))}

      {activeEdges.map((edge) => (
        <line
          key={`active-${edge.id}`}
          x1={edge.fromX}
          y1={edge.fromY}
          x2={edge.toX}
          y2={edge.toY}
          stroke={PREVIEW_EDGE_ACTIVE}
          strokeWidth={EDGE_WIDTH}
          strokeLinecap="round"
        />
      ))}

      {regularNodes.map((node) => {
        const isActive = node.selection?.selected;
        return (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={isActive ? ACTIVE_NODE_SIZE : BASE_NODE_SIZE}
            fill={isActive ? PREVIEW_NODE_ACTIVE : PREVIEW_NODE}
            opacity={isActive ? 1 : 0.25}
          />
        );
      })}

      {choiceNodes.map((node) => {
        const isSelected = node.selection?.selected ?? false;
        const choiceIndex = node.selection?.choiceIndex ?? 0;
        const isLeftSelected = isSelected && choiceIndex === 0;
        const isRightSelected = isSelected && choiceIndex === 1;

        return (
          <g key={`choice-${node.id}`}>
            <ChoiceNodeHalf
              cx={node.x}
              cy={node.y}
              r={CHOICE_NODE_SIZE}
              isLeft
              isSelected={isLeftSelected}
            />
            <ChoiceNodeHalf
              cx={node.x}
              cy={node.y}
              r={CHOICE_NODE_SIZE}
              isLeft={false}
              isSelected={isRightSelected}
            />
            <line
              x1={node.x}
              y1={node.y - CHOICE_NODE_SIZE}
              x2={node.x}
              y2={node.y + CHOICE_NODE_SIZE}
              stroke={transparentBg ? "rgba(0,0,0,0.3)" : PREVIEW_BG}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </svg>
  );
}
