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
  buildTalentEdgeIndex,
  collectTalentDependentIds,
  collectTalentPrerequisiteIds,
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
  initialSelections?: Map<number, Talent.DecodedTalentSelection>;
  initialSelectionsKey?: string | number | null;
  onSelectionsChange?: (
    selections: Map<number, Talent.DecodedTalentSelection>,
  ) => void;
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
  pathEdgeIds,
}: {
  edges: ReturnType<typeof useTalentLayout>["edges"];
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
  onNodeClick,
  onNodeHoverChange,
  onPaintStart,
  onPaintEnter,
  onHover,
}: {
  nodes: ReturnType<typeof useTalentLayout>["nodes"];
  searchMatches: Set<number>;
  isSearching: boolean;
  pathMissingNodeIds: Set<number>;
  pathTargetNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
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
          onNodeClick={onNodeClick}
          onNodeHoverChange={onNodeHoverChange}
          onPaintStart={onPaintStart}
          onPaintEnter={onPaintEnter}
          onHover={onHover}
        />
      ))}
    </>
  );
});

export function TalentTree({
  tree,
  initialSelections: initialSelectionsProp,
  initialSelectionsKey,
  onSelectionsChange,
  width: propWidth,
  height: propHeight,
}: TalentTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const propSelections = hasSelections(tree) ? tree.selections : undefined;
  const initialSelections = useMemo(() => {
    const source = initialSelectionsProp ?? propSelections;
    if (!source) {
      return new Map<number, Talent.DecodedTalentSelection>();
    }

    const next = new Map<number, Talent.DecodedTalentSelection>();
    for (const [nodeId, sel] of source) {
      if (sel.selected) {
        next.set(nodeId, sel);
      }
    }
    return next;
  }, [initialSelectionsProp, propSelections]);

  const [selections, setSelections] =
    useState<Map<number, Talent.DecodedTalentSelection>>(initialSelections);
  const selectionsRef = useRef(selections);

  useEffect(() => {
    selectionsRef.current = selections;
    onSelectionsChange?.(selections);
  }, [onSelectionsChange, selections]);

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

  const edgeIndex = useMemo(
    () => buildTalentEdgeIndex(tree.edges),
    [tree.edges],
  );
  const nodeById = useMemo(
    () => new Map(visibleNodes.map((n) => [n.id, n])),
    [visibleNodes],
  );

  const initialHeroId = useMemo(() => {
    return deriveSelectedHeroId(tree.subTrees, visibleNodes, initialSelections);
  }, [tree.subTrees, visibleNodes, initialSelections]);

  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    initialHeroId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const paint = useRef<{ active: boolean; lastNodeId: number | null }>({
    active: false,
    lastNodeId: null,
  });
  const hoverChainLastNodeId = useRef<number | null>(null);

  useEffect(() => {
    if (initialSelectionsKey == null) {
      return;
    }
    setSelections(initialSelections);
    setSelectedHeroId(initialHeroId);
    setSearchQuery("");
    setPanZoom({ x: 0, y: 0, scale: 1 });
    hoverChainLastNodeId.current = null;
  }, [initialHeroId, initialSelections, initialSelectionsKey]);

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
  const displayNodeIds = useMemo(
    () => new Set(displayNodes.map((n) => n.id)),
    [displayNodes],
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
  const selectedNodeCount = selections.size;

  const resetSelections = useCallback(() => {
    paint.current.active = false;
    paint.current.lastNodeId = null;
    hoverChainLastNodeId.current = null;
    setSelections(new Map());
  }, []);

  const makeDefaultSelection = useCallback(
    (nodeId: number): Talent.DecodedTalentSelection | null => {
      const node = nodeById.get(nodeId);
      if (!node) {
        return null;
      }

      const isChoiceNode = node.type === 2 && node.entries.length > 1;
      return {
        nodeId,
        selected: true,
        ranksPurchased: Math.min(1, node.maxRanks),
        choiceIndex: isChoiceNode ? 0 : undefined,
      };
    },
    [nodeById],
  );

  const ensureSelectedWithPrereqs = useCallback(
    (nodeId: number, next: Map<number, Talent.DecodedTalentSelection>) => {
      const required = collectTalentPrerequisiteIds(
        nodeId,
        edgeIndex.parentsByNodeId,
      );

      for (const requiredId of required) {
        if (next.has(requiredId)) {
          continue;
        }

        const sel = makeDefaultSelection(requiredId);
        if (sel) {
          next.set(requiredId, sel);
        }
      }
    },
    [edgeIndex.parentsByNodeId, makeDefaultSelection],
  );

  const toggleNode = useCallback(
    (nodeId: number) => {
      setSelections((prev) => {
        const node = nodeById.get(nodeId);
        if (!node) {
          return prev;
        }

        const next = new Map(prev);
        const current = next.get(nodeId);
        const isSelected = !!current;
        const isChoiceNode = node.type === 2 && node.entries.length > 1;

        if (!isSelected) {
          ensureSelectedWithPrereqs(nodeId, next);
          const sel = makeDefaultSelection(nodeId);
          if (sel) {
            next.set(nodeId, sel);
          }

          if (node.subTreeId > 0) {
            setSelectedHeroId(node.subTreeId);
          }

          hoverChainLastNodeId.current = nodeId;
          return next;
        }

        if (isChoiceNode) {
          const choiceIndex = current?.choiceIndex ?? 0;
          if (choiceIndex === 0) {
            next.set(nodeId, { ...current, choiceIndex: 1 });
            hoverChainLastNodeId.current = nodeId;
            return next;
          }

          const dependents = collectTalentDependentIds(
            nodeId,
            edgeIndex.childrenByNodeId,
          );
          for (const dependentId of dependents) {
            next.delete(dependentId);
          }
          hoverChainLastNodeId.current = null;
          return next;
        }

        if (node.maxRanks > 1) {
          const currentRanks = current?.ranksPurchased ?? 0;
          if (currentRanks < node.maxRanks) {
            next.set(nodeId, { ...current, ranksPurchased: currentRanks + 1 });
            hoverChainLastNodeId.current = nodeId;
            return next;
          }

          const dependents = collectTalentDependentIds(
            nodeId,
            edgeIndex.childrenByNodeId,
          );
          for (const dependentId of dependents) {
            next.delete(dependentId);
          }
          hoverChainLastNodeId.current = null;
          return next;
        }

        const dependents = collectTalentDependentIds(
          nodeId,
          edgeIndex.childrenByNodeId,
        );
        for (const dependentId of dependents) {
          next.delete(dependentId);
        }
        hoverChainLastNodeId.current = null;
        return next;
      });
    },
    [
      edgeIndex.childrenByNodeId,
      ensureSelectedWithPrereqs,
      makeDefaultSelection,
      nodeById,
    ],
  );

  const startPaint = useCallback((nodeId: number) => {
    paint.current.active = true;
    paint.current.lastNodeId = nodeId;
  }, []);

  const stopPaint = useCallback(() => {
    paint.current.active = false;
    paint.current.lastNodeId = null;
  }, []);

  useEffect(() => {
    const handleUp = () => stopPaint();
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("touchcancel", handleUp);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("touchcancel", handleUp);
    };
  }, [stopPaint]);

  const paintEnter = useCallback(
    (nodeId: number) => {
      const lastNodeId = paint.current.active
        ? paint.current.lastNodeId
        : hoverChainLastNodeId.current;
      if (lastNodeId == null || lastNodeId === nodeId) {
        return;
      }

      const neighbors = edgeIndex.neighborsByNodeId.get(lastNodeId);
      if (!neighbors?.has(nodeId)) {
        return;
      }

      if (selectionsRef.current.has(nodeId)) {
        if (paint.current.active) {
          paint.current.lastNodeId = nodeId;
        }
        hoverChainLastNodeId.current = nodeId;
        return;
      }

      setSelections((prev) => {
        const next = new Map(prev);
        ensureSelectedWithPrereqs(nodeId, next);

        const sel = makeDefaultSelection(nodeId);
        if (sel) {
          next.set(nodeId, sel);
        }

        return next;
      });

      if (paint.current.active) {
        paint.current.lastNodeId = nodeId;
      }
      hoverChainLastNodeId.current = nodeId;
    },
    [
      edgeIndex.neighborsByNodeId,
      ensureSelectedWithPrereqs,
      makeDefaultSelection,
    ],
  );

  const { pathMissingNodeIds, pathEdgeIds, pathTargetNodeId } = useMemo(() => {
    if (!hoveredNodeId) {
      return {
        pathMissingNodeIds: new Set<number>(),
        pathEdgeIds: new Set<number>(),
        pathTargetNodeId: null as number | null,
      };
    }

    if (selections.has(hoveredNodeId)) {
      return {
        pathMissingNodeIds: new Set<number>(),
        pathEdgeIds: new Set<number>(),
        pathTargetNodeId: null as number | null,
      };
    }

    const prereqs = collectTalentPrerequisiteIds(
      hoveredNodeId,
      edgeIndex.parentsByNodeId,
    );

    const missing = new Set<number>();
    for (const id of prereqs) {
      if (!displayNodeIds.has(id)) {
        continue;
      }
      if (id !== hoveredNodeId && !selections.has(id)) {
        missing.add(id);
      }
    }

    const edgeIds = new Set<number>();
    for (const childId of prereqs) {
      if (!displayNodeIds.has(childId)) {
        continue;
      }
      const parents = edgeIndex.parentsByNodeId.get(childId);
      if (!parents) {
        continue;
      }
      for (const parentId of parents) {
        if (!displayNodeIds.has(parentId) || !prereqs.has(parentId)) {
          continue;
        }
        const edgeId = edgeIndex.edgeIdByPair.get(`${parentId}-${childId}`);
        if (edgeId != null) {
          edgeIds.add(edgeId);
        }
      }
    }

    return {
      pathMissingNodeIds: missing,
      pathEdgeIds: edgeIds,
      pathTargetNodeId: hoveredNodeId,
    };
  }, [displayNodeIds, edgeIndex, hoveredNodeId, selections]);

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
    stopPaint();
  }, [stopPaint]);

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
    stopPaint();
  }, [stopPaint]);

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

  const handleNodeHoverChange = useCallback((nodeId: number | null) => {
    setHoveredNodeId(nodeId);
    if (nodeId != null && selectionsRef.current.has(nodeId)) {
      hoverChainLastNodeId.current = nodeId;
    }
  }, []);

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
        selectedNodeCount={selectedNodeCount}
        isPanned={isPanned}
        zenMode={zenMode}
        onSearchChange={setSearchQuery}
        onResetView={resetPanZoom}
        onResetSelections={resetSelections}
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
              <EdgesLayer edges={layout.edges} pathEdgeIds={pathEdgeIds} />
              <NodesLayer
                nodes={layout.nodes}
                searchMatches={searchMatches}
                isSearching={isSearching}
                pathMissingNodeIds={pathMissingNodeIds}
                pathTargetNodeId={pathTargetNodeId}
                onNodeClick={toggleNode}
                onNodeHoverChange={handleNodeHoverChange}
                onPaintStart={startPaint}
                onPaintEnter={paintEnter}
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
