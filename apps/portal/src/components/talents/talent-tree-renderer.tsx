"use client";

import { memo, type RefObject } from "react";
import type Konva from "konva";
import { KonvaStage, KonvaLayer, KonvaGroup } from "@/components/konva";
import { cn } from "@/lib/utils";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";
import { TalentTooltip } from "./talent-tooltip";
import type { TooltipState } from "./types";
import type { TalentViewModel } from "@wowlab/services/Talents";

const EdgesLayer = memo(function EdgesLayer({
  edges,
  pathEdgeIds,
}: {
  edges: TalentViewModel["edges"];
  pathEdgeIds: Set<number>;
}) {
  return (
    <>
      {edges.map((edge) => (
        <TalentEdge
          key={edge.id}
          edge={edge}
          isPathHighlight={pathEdgeIds.has(edge.id)}
        />
      ))}
    </>
  );
});

const NodesLayer = memo(function NodesLayer({
  nodes,
  searchMatches,
  isSearching,
  pathMissingNodeIds,
  pathTargetNodeId,
  blockedNodeId,
  focusedNodeId,
  onNodeClick,
  onNodeRightClick,
  onNodeHoverChange,
  onPaintStart,
  onPaintEnter,
  onHover,
}: {
  nodes: TalentViewModel["nodes"];
  searchMatches: Set<number>;
  isSearching: boolean;
  pathMissingNodeIds: Set<number>;
  pathTargetNodeId: number | null;
  blockedNodeId: number | null;
  focusedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
  onNodeRightClick: (nodeId: number) => void;
  onNodeHoverChange: (nodeId: number | null) => void;
  onPaintStart: (nodeId: number) => void;
  onPaintEnter: (nodeId: number) => void;
  onHover: (state: TooltipState | null) => void;
}) {
  return (
    <>
      {nodes.map((nodePos) => (
        <TalentNode
          key={nodePos.id}
          nodePos={nodePos}
          isSearchMatch={searchMatches.has(nodePos.id)}
          isSearching={isSearching}
          isPathHighlight={pathMissingNodeIds.has(nodePos.id)}
          isPathTarget={pathTargetNodeId === nodePos.id}
          isBlocked={blockedNodeId === nodePos.id}
          isFocused={focusedNodeId === nodePos.id}
          onNodeClick={onNodeClick}
          onNodeRightClick={onNodeRightClick}
          onNodeHoverChange={onNodeHoverChange}
          onPaintStart={onPaintStart}
          onPaintEnter={onPaintEnter}
          onHover={onHover}
        />
      ))}
    </>
  );
});

interface TalentTreeRendererProps {
  viewModel: TalentViewModel;
  panZoom: { x: number; y: number; scale: number };
  tooltip: TooltipState | null;
  searchMatches: Set<number>;
  isSearching: boolean;
  pathHighlight: {
    nodeIds: Set<number>;
    edgeIds: Set<number>;
    targetNodeId: number | null;
  };
  blockedNodeId: number | null;
  focusedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
  onNodeRightClick: (nodeId: number) => void;
  onNodeHoverChange: (nodeId: number | null) => void;
  onPaintStart: (nodeId: number) => void;
  onPaintEnter: (nodeId: number) => void;
  onTooltipChange: (state: TooltipState | null) => void;
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: () => void;
  onMouseUp: () => void;
  onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEnd: () => void;
  stageRef: RefObject<Konva.Stage | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  zenMode: boolean;
}

export function TalentTreeRenderer({
  viewModel,
  panZoom,
  tooltip,
  searchMatches,
  isSearching,
  pathHighlight,
  blockedNodeId,
  focusedNodeId,
  onNodeClick,
  onNodeRightClick,
  onNodeHoverChange,
  onPaintStart,
  onPaintEnter,
  onTooltipChange,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  stageRef,
  containerRef,
  width,
  height,
  zenMode,
}: TalentTreeRendererProps) {
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-background/50 rounded-lg border overflow-hidden cursor-grab select-none",
        zenMode ? "flex-1 min-h-0" : "w-full",
      )}
      style={zenMode ? { width: "100%" } : { height }}
    >
      <KonvaStage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <KonvaLayer>
          <KonvaGroup
            x={panZoom.x}
            y={panZoom.y}
            scaleX={panZoom.scale}
            scaleY={panZoom.scale}
          >
            <EdgesLayer
              edges={viewModel.edges}
              pathEdgeIds={pathHighlight.edgeIds}
            />
            <NodesLayer
              nodes={viewModel.nodes}
              searchMatches={searchMatches}
              isSearching={isSearching}
              pathMissingNodeIds={pathHighlight.nodeIds}
              pathTargetNodeId={pathHighlight.targetNodeId}
              blockedNodeId={blockedNodeId}
              focusedNodeId={focusedNodeId}
              onNodeClick={onNodeClick}
              onNodeRightClick={onNodeRightClick}
              onNodeHoverChange={onNodeHoverChange}
              onPaintStart={onPaintStart}
              onPaintEnter={onPaintEnter}
              onHover={onTooltipChange}
            />
          </KonvaGroup>
        </KonvaLayer>
      </KonvaStage>
      <TalentTooltip tooltip={tooltip} containerWidth={width} />
    </div>
  );
}
