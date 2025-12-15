"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import type Konva from "konva";
import { useThrottledCallback } from "@react-hookz/web";
import type { Talent } from "@wowlab/core/Schemas";
import {
  KonvaStage,
  KonvaLayer,
  KonvaGroup,
  preloadIcons,
} from "@/components/konva";
import { cn } from "@/lib/utils";
import { useResizeObserver, useExport } from "@/hooks/canvas";
import { useZenMode } from "@/hooks/use-zen-mode";
import {
  computeVisibleNodes,
  filterByHeroTree,
  searchTalentNodes,
  deriveSelectedHeroId,
} from "./talent-utils";
import { useTalentLayout } from "@/hooks/use-talent-layout";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";
import { TalentTooltip } from "./talent-tooltip";
import { TalentControls } from "./talent-controls";
import type { TooltipState } from "./types";
import { MIN_SCALE, MAX_SCALE } from "./constants";

interface TalentTreeProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  width?: number;
  height?: number;
}

function hasSelections(
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections,
): tree is Talent.TalentTreeWithSelections {
  return "selections" in tree;
}

const EdgesLayer = memo(function EdgesLayer({
  edges,
}: {
  edges: ReturnType<typeof useTalentLayout>["edges"];
}) {
  return (
    <>
      {edges.map((edge) => (
        <TalentEdge key={edge.id} edge={edge} />
      ))}
    </>
  );
});

const NodesLayer = memo(function NodesLayer({
  nodes,
  searchMatches,
  isSearching,
  onHover,
}: {
  nodes: ReturnType<typeof useTalentLayout>["nodes"];
  searchMatches: Set<number>;
  isSearching: boolean;
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
          onHover={onHover}
        />
      ))}
    </>
  );
});

export function TalentTree({
  tree,
  width: propWidth,
  height: propHeight,
}: TalentTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const selections = hasSelections(tree) ? tree.selections : undefined;

  const [panZoom, setPanZoom] = useState({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const throttledSetTooltip = useThrottledCallback(
    setTooltip,
    [setTooltip],
    16,
  );

  const { isZen: zenMode, toggleZen: toggleZenMode } = useZenMode();

  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);
  const width = propWidth || containerWidth || 500;
  const height = propHeight || containerHeight || 600;

  const contentHeight = height;
  const { exportPNG, exportPDF } = useExport({ stageRef, contentHeight });

  const visibleNodes = useMemo(
    () => computeVisibleNodes(tree.nodes, tree.edges),
    [tree.nodes, tree.edges],
  );

  const initialHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, selections),
    [tree.subTrees, visibleNodes, selections],
  );

  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    initialHeroId,
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSelectedHeroId(initialHeroId);
    setSearchQuery("");
    setPanZoom({ x: 0, y: 0, scale: 1 });
  }, [initialHeroId]);

  useEffect(() => {
    const iconNames = visibleNodes.flatMap((node) =>
      node.entries.map((e) => e.iconFileName).filter(Boolean),
    );
    preloadIcons([...new Set(iconNames)], "medium");
  }, [visibleNodes]);

  const displayNodes = useMemo(
    () => filterByHeroTree(visibleNodes, selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  const searchMatches = useMemo(
    () => searchTalentNodes(visibleNodes, searchQuery),
    [visibleNodes, searchQuery],
  );
  const isSearching = searchQuery.trim().length > 0;

  const layout = useTalentLayout({
    nodes: displayNodes,
    edges: tree.edges,
    selections,
    width,
    height,
  });

  const isPanned = panZoom.x !== 0 || panZoom.y !== 0 || panZoom.scale !== 1;

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) {
      return;
    }

    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    setPanZoom((prev) => {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(
          MIN_SCALE,
          direction > 0 ? prev.scale * scaleBy : prev.scale / scaleBy,
        ),
      );
      const scaleRatio = newScale / prev.scale;
      return {
        x: pointer.x - (pointer.x - prev.x) * scaleRatio,
        y: pointer.y - (pointer.y - prev.y) * scaleRatio,
        scale: newScale,
      };
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const target = e.target;
      if (target !== stage && target.listening()) {
        return;
      }
      isDragging.current = true;
      lastPos.current = stage.getPointerPosition();
    },
    [],
  );

  const handleMouseMove = useCallback(() => {
    if (!isDragging.current) {
      return;
    }
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const pos = stage.getPointerPosition();
    if (!pos || !lastPos.current) {
      return;
    }

    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    lastPos.current = pos;
    setPanZoom((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastPos.current = null;
  }, []);

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length !== 1) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const target = e.target;
      if (target !== stage && target.listening()) {
        return;
      }
      isDragging.current = true;
      lastPos.current = stage.getPointerPosition();
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (!isDragging.current || e.evt.touches.length !== 1) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const pos = stage.getPointerPosition();
      if (!pos || !lastPos.current) {
        return;
      }

      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      lastPos.current = pos;
      setPanZoom((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastPos.current = null;
  }, []);

  const resetPanZoom = useCallback(() => {
    setPanZoom({ x: 0, y: 0, scale: 1 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setPanZoom((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPanZoom((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale / 1.2),
    }));
  }, []);

  const handleTooltip = useCallback(
    (state: TooltipState | null) => {
      throttledSetTooltip(state);
    },
    [throttledSetTooltip],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        zenMode &&
          "fixed inset-0 z-50 bg-background p-4 overflow-auto animate-in fade-in duration-200",
      )}
    >
      <TalentControls
        tree={tree}
        searchQuery={searchQuery}
        scale={panZoom.scale}
        displayNodeCount={displayNodes.length}
        isPanned={isPanned}
        zenMode={zenMode}
        onSearchChange={setSearchQuery}
        onResetView={resetPanZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleZen={toggleZenMode}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
      />

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
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <KonvaLayer>
            <KonvaGroup
              x={panZoom.x}
              y={panZoom.y}
              scaleX={panZoom.scale}
              scaleY={panZoom.scale}
            >
              <EdgesLayer edges={layout.edges} />
              <NodesLayer
                nodes={layout.nodes}
                searchMatches={searchMatches}
                isSearching={isSearching}
                onHover={handleTooltip}
              />
            </KonvaGroup>
          </KonvaLayer>
        </KonvaStage>
        <TalentTooltip tooltip={tooltip} containerWidth={width} />
      </div>
    </div>
  );
}
