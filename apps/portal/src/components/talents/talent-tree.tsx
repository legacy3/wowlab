"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import type Konva from "konva";
import { useThrottledCallback } from "@react-hookz/web";
import type { Talent } from "@wowlab/core/Schemas";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import {
  KonvaStage,
  KonvaLayer,
  KonvaGroup,
  preloadIcons,
} from "@/components/konva";
import { cn } from "@/lib/utils";
import { useResizeObserver } from "@/hooks/canvas";
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

  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);
  const width = propWidth || containerWidth || 500;
  const height = propHeight || containerHeight || 600;

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

  const handleTooltip = useCallback(
    (state: TooltipState | null) => {
      throttledSetTooltip(state);
    },
    [throttledSetTooltip],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">
          {tree.className} — {tree.specName}
        </span>

        {tree.subTrees.length > 0 && (
          <div className="flex gap-1">
            {tree.subTrees.map((subTree) => (
              <Button
                key={subTree.id}
                variant={selectedHeroId === subTree.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2 gap-1.5",
                  selectedHeroId === subTree.id &&
                    "bg-orange-600 hover:bg-orange-700",
                )}
                onClick={() => setSelectedHeroId(subTree.id)}
              >
                <GameIcon
                  iconName={subTree.iconFileName}
                  size="small"
                  alt={subTree.name}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs">{subTree.name}</span>
              </Button>
            ))}
            <Button
              variant={selectedHeroId === null ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedHeroId(null)}
            >
              Hide Hero
            </Button>
          </div>
        )}

        <Input
          placeholder="Search talents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 w-36 text-xs"
        />

        {isPanned && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={resetPanZoom}
            title="Reset view"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {displayNodes.length} talents
          {panZoom.scale !== 1 && ` · ${Math.round(panZoom.scale * 100)}%`}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative bg-background/50 rounded-lg border overflow-hidden cursor-grab select-none"
        style={{ width: propWidth ?? "100%", height }}
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
