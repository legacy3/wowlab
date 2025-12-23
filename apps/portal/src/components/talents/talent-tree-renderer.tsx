"use client";

import { memo, useCallback, type RefObject } from "react";
import type Konva from "konva";
import {
  KonvaStage,
  KonvaLayer,
  KonvaGroup,
  KonvaLine,
  AnnotationLayerRenderer,
  type Annotation,
} from "@/components/konva";
import { cn } from "@/lib/utils";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";
import { TalentTooltip } from "./talent-tooltip";
import { TalentLegend } from "./talent-legend";
import type { TooltipState } from "./types";
import type { TalentViewModel } from "@wowlab/services/Talents";
import type { AnnotationTool } from "@/atoms";
import {
  GRID_COLOR,
  COLOR_HERE_ARROW,
  COLOR_HERE_ARROW_GLOW,
} from "./constants";

const GRID_SIZE = 50;
const BackgroundGrid = memo(function BackgroundGrid({
  width,
  height,
  panZoom,
}: {
  width: number;
  height: number;
  panZoom: { x: number; y: number; scale: number };
}) {
  const { x: panX, y: panY, scale } = panZoom;

  const left = -panX / scale - GRID_SIZE;
  const top = -panY / scale - GRID_SIZE;
  const right = left + width / scale + GRID_SIZE * 3;
  const bottom = top + height / scale + GRID_SIZE * 3;

  const gridLeft = Math.floor(left / GRID_SIZE) * GRID_SIZE;
  const gridTop = Math.floor(top / GRID_SIZE) * GRID_SIZE;

  const verticalLines = Array.from(
    { length: Math.ceil((right - gridLeft) / GRID_SIZE) + 1 },
    (_, i) => {
      const x = gridLeft + i * GRID_SIZE;

      return (
        <KonvaLine
          key={`v${x}`}
          points={[x, gridTop, x, bottom]}
          stroke={GRID_COLOR}
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    },
  );

  const horizontalLines = Array.from(
    { length: Math.ceil((bottom - gridTop) / GRID_SIZE) + 1 },
    (_, i) => {
      const y = gridTop + i * GRID_SIZE;

      return (
        <KonvaLine
          key={`h${y}`}
          points={[gridLeft, y, right, y]}
          stroke={GRID_COLOR}
          strokeWidth={1 / scale}
          listening={false}
        />
      );
    },
  );

  return (
    <>
      {verticalLines}
      {horizontalLines}
    </>
  );
});

const HereArrow = memo(function HereArrow({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLen = 20;

  return (
    <KonvaGroup listening={false}>
      {/* Glow/outline layer */}
      <KonvaLine
        points={[fromX, fromY, toX, toY]}
        stroke={COLOR_HERE_ARROW_GLOW}
        strokeWidth={12}
        lineCap="round"
        opacity={0.3}
      />
      {/* Main arrow line */}
      <KonvaLine
        points={[fromX, fromY, toX, toY]}
        stroke={COLOR_HERE_ARROW}
        strokeWidth={6}
        lineCap="round"
      />
      {/* Arrowhead glow */}
      <KonvaLine
        points={[
          toX - headLen * Math.cos(angle - Math.PI / 5),
          toY - headLen * Math.sin(angle - Math.PI / 5),
          toX,
          toY,
          toX - headLen * Math.cos(angle + Math.PI / 5),
          toY - headLen * Math.sin(angle + Math.PI / 5),
        ]}
        stroke={COLOR_HERE_ARROW_GLOW}
        strokeWidth={12}
        lineCap="round"
        lineJoin="round"
        opacity={0.3}
      />
      {/* Arrowhead */}
      <KonvaLine
        points={[
          toX - headLen * Math.cos(angle - Math.PI / 5),
          toY - headLen * Math.sin(angle - Math.PI / 5),
          toX,
          toY,
          toX - headLen * Math.cos(angle + Math.PI / 5),
          toY - headLen * Math.sin(angle + Math.PI / 5),
        ]}
        stroke={COLOR_HERE_ARROW}
        strokeWidth={6}
        lineCap="round"
        lineJoin="round"
      />
    </KonvaGroup>
  );
});

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
  onNodeClick: (
    nodeId: number,
    event?: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
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
  tooltipPinned: boolean;
  onTooltipClose: () => void;
  searchMatches: Set<number>;
  isSearching: boolean;
  pathHighlight: {
    nodeIds: Set<number>;
    edgeIds: Set<number>;
    targetNodeId: number | null;
  };
  blockedNodeId: number | null;
  focusedNodeId: number | null;
  hereArrow: { x: number; y: number } | null;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  editingTextId: string | null;
  annotationTool: AnnotationTool;
  onNodeClick: (
    nodeId: number,
    event?: Konva.KonvaEventObject<MouseEvent>,
  ) => void;
  onNodeRightClick: (nodeId: number) => void;
  onNodeHoverChange: (nodeId: number | null) => void;
  onPaintStart: (nodeId: number) => void;
  onPaintEnter: (nodeId: number) => void;
  onTooltipChange: (state: TooltipState | null) => void;
  onAnnotationSelect: (id: string | null) => void;
  onAnnotationChange: (args: {
    id: string;
    updates: Partial<Annotation>;
    saveHistory?: boolean;
  }) => void;
  onStartEditText: (id: string) => void;
  onStopEditText: () => void;
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
  tooltipPinned,
  onTooltipClose,
  searchMatches,
  isSearching,
  pathHighlight,
  blockedNodeId,
  focusedNodeId,
  hereArrow,
  annotations,
  selectedAnnotationId,
  editingTextId,
  annotationTool,
  onNodeClick,
  onNodeRightClick,
  onNodeHoverChange,
  onPaintStart,
  onPaintEnter,
  onTooltipChange,
  onAnnotationSelect,
  onAnnotationChange,
  onStartEditText,
  onStopEditText,
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
  // Wrapper for annotation onChange that adapts to the component's expected signature
  const handleAnnotationChange = useCallback(
    (
      id: string,
      updates: Partial<Annotation>,
      options?: { saveHistory?: boolean },
    ) => {
      onAnnotationChange({ id, updates, saveHistory: options?.saveHistory });
    },
    [onAnnotationChange],
  );
  const cursorClass =
    annotationTool && annotationTool !== "select"
      ? annotationTool === "text"
        ? "cursor-text"
        : "cursor-crosshair"
      : "cursor-grab";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-lg border overflow-hidden select-none bg-background/50",
        cursorClass,
        zenMode ? "flex-1 min-h-0" : "w-full",
      )}
      style={zenMode ? { width: "100%" } : { height }}
    >
      <TalentLegend />
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
            <BackgroundGrid width={width} height={height} panZoom={panZoom} />
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
            <AnnotationLayerRenderer
              annotations={annotations}
              selectedId={selectedAnnotationId}
              editingTextId={editingTextId}
              onSelect={onAnnotationSelect}
              onChange={handleAnnotationChange}
              onStartEditText={onStartEditText}
              onStopEditText={onStopEditText}
            />
            {hereArrow &&
              focusedNodeId !== null &&
              (() => {
                const focusedNode = viewModel.nodes.find(
                  (n) => n.id === focusedNodeId,
                );

                if (!focusedNode) {
                  return null;
                }

                return (
                  <HereArrow
                    fromX={hereArrow.x}
                    fromY={hereArrow.y}
                    toX={focusedNode.x}
                    toY={focusedNode.y}
                  />
                );
              })()}
          </KonvaGroup>
        </KonvaLayer>
      </KonvaStage>
      <TalentTooltip
        tooltip={tooltip}
        containerWidth={width}
        containerHeight={height}
        pinned={tooltipPinned}
        onClose={onTooltipClose}
      />
    </div>
  );
}
