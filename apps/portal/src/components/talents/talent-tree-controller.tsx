"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { useThrottledCallback } from "@react-hookz/web";
import { preloadIcons } from "@/components/konva";
import { cn } from "@/lib/utils";
import { useResizeObserver, useExport } from "@/hooks/canvas";
import { useZenMode } from "@/hooks/use-zen-mode";
import { useTalentViewModel } from "@/hooks/use-talent-view-model";
import { searchTalentNodes } from "./talent-utils";
import { TalentControls } from "./talent-controls";
import { TalentTreeRenderer } from "./talent-tree-renderer";
import type { TooltipState } from "./types";
import { MIN_SCALE, MAX_SCALE } from "./constants";
import {
  buildTalentEdgeIndex,
  calculatePointsSpent,
  collectTalentDependentIds,
  collectTalentPrerequisiteIds,
  computeVisibleNodes,
  deriveSelectedHeroId,
  getTalentPointLimits,
  wouldExceedPointLimit,
  wouldExceedPointLimitWithPrereqs,
  type TalentSelection,
} from "@wowlab/services/Talents";

type TalentTree = NonNullable<Parameters<typeof useTalentViewModel>[0]>;
type TalentTreeWithSelections = TalentTree & {
  selections: Map<number, TalentSelection>;
};

interface TalentTreeProps {
  tree: TalentTree | TalentTreeWithSelections;
  initialSelections?: Map<number, TalentSelection>;
  initialSelectionsKey?: string | number | null;
  onSelectionsChange?: (selections: Map<number, TalentSelection>) => void;
  width?: number;
  height?: number;
}

function hasSelections(
  tree: TalentTree | TalentTreeWithSelections,
): tree is TalentTreeWithSelections {
  return "selections" in tree;
}

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
      return new Map<number, TalentSelection>();
    }

    const next = new Map<number, TalentSelection>();
    for (const [nodeId, selection] of source) {
      if (selection.selected) {
        next.set(nodeId, selection);
      }
    }
    return next;
  }, [initialSelectionsProp, propSelections]);

  const [selections, setSelections] =
    useState<Map<number, TalentSelection>>(initialSelections);
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
    () => new Map(visibleNodes.map((node) => [node.id, node])),
    [visibleNodes],
  );

  const initialHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, initialSelections),
    [tree.subTrees, visibleNodes, initialSelections],
  );

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
      node.entries.map((entry) => entry.iconFileName).filter(Boolean),
    );
    preloadIcons([...new Set(iconNames)], "medium");
  }, [visibleNodes]);

  const viewModel = useTalentViewModel(tree, selections, {
    width,
    height,
    selectedHeroId,
  });

  const displayNodeIds = useMemo(
    () => new Set(viewModel?.nodes.map((node) => node.id) ?? []),
    [viewModel?.nodes],
  );

  const searchMatches = useMemo(
    () => searchTalentNodes(viewModel?.nodes ?? [], searchQuery),
    [viewModel?.nodes, searchQuery],
  );
  const isSearching = searchQuery.trim().length > 0;

  const isPanned = panZoom.x !== 0 || panZoom.y !== 0 || panZoom.scale !== 1;
  const selectedNodeCount = selections.size;

  const pointsSpent =
    viewModel?.pointsSpent ?? calculatePointsSpent(visibleNodes, selections);
  const pointsSpentRef = useRef(pointsSpent);
  useEffect(() => {
    pointsSpentRef.current = pointsSpent;
  }, [pointsSpent]);

  const pointLimits = viewModel?.pointLimits ?? getTalentPointLimits(tree);

  const resetSelections = useCallback(() => {
    paint.current.active = false;
    paint.current.lastNodeId = null;
    hoverChainLastNodeId.current = null;
    setSelections(new Map());
  }, []);

  const makeDefaultSelection = useCallback(
    (nodeId: number): TalentSelection | null => {
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
    (nodeId: number, next: Map<number, TalentSelection>) => {
      const required = collectTalentPrerequisiteIds(
        nodeId,
        edgeIndex.parentsByNodeId,
      );

      for (const requiredId of required) {
        if (next.has(requiredId)) {
          continue;
        }

        const selection = makeDefaultSelection(requiredId);
        if (selection) {
          next.set(requiredId, selection);
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
          const currentSpent = pointsSpentRef.current;
          if (
            wouldExceedPointLimitWithPrereqs(
              nodeId,
              nodeById,
              prev,
              edgeIndex.parentsByNodeId,
              currentSpent,
              pointLimits,
            )
          ) {
            return prev;
          }

          ensureSelectedWithPrereqs(nodeId, next);
          const selection = makeDefaultSelection(nodeId);
          if (selection) {
            next.set(nodeId, selection);
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
            const currentSpent = pointsSpentRef.current;
            if (wouldExceedPointLimit(node, 1, currentSpent, pointLimits)) {
              return prev;
            }
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
      edgeIndex.parentsByNodeId,
      ensureSelectedWithPrereqs,
      makeDefaultSelection,
      nodeById,
      pointLimits,
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

      if (
        wouldExceedPointLimitWithPrereqs(
          nodeId,
          nodeById,
          selectionsRef.current,
          edgeIndex.parentsByNodeId,
          pointsSpentRef.current,
          pointLimits,
        )
      ) {
        return;
      }

      setSelections((prev) => {
        const next = new Map(prev);
        ensureSelectedWithPrereqs(nodeId, next);

        const selection = makeDefaultSelection(nodeId);
        if (selection) {
          next.set(nodeId, selection);
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
      edgeIndex.parentsByNodeId,
      ensureSelectedWithPrereqs,
      makeDefaultSelection,
      nodeById,
      pointLimits,
    ],
  );

  const pathHighlight = useMemo(() => {
    if (!hoveredNodeId) {
      return {
        nodeIds: new Set<number>(),
        edgeIds: new Set<number>(),
        targetNodeId: null as number | null,
      };
    }

    if (selections.has(hoveredNodeId)) {
      return {
        nodeIds: new Set<number>(),
        edgeIds: new Set<number>(),
        targetNodeId: null as number | null,
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
      nodeIds: missing,
      edgeIds,
      targetNodeId: hoveredNodeId,
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

  if (!viewModel) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        zenMode &&
          "fixed inset-0 z-50 bg-background p-4 overflow-auto animate-in fade-in duration-200",
      )}
    >
      <TalentControls
        specId={tree.specId}
        pointLimits={pointLimits}
        searchQuery={searchQuery}
        scale={panZoom.scale}
        displayNodeCount={viewModel.nodes.length}
        selectedNodeCount={selectedNodeCount}
        pointsSpent={pointsSpent}
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

      <TalentTreeRenderer
        viewModel={viewModel}
        panZoom={panZoom}
        tooltip={tooltip}
        searchMatches={searchMatches}
        isSearching={isSearching}
        pathHighlight={pathHighlight}
        onNodeClick={toggleNode}
        onNodeHoverChange={handleNodeHoverChange}
        onPaintStart={startPaint}
        onPaintEnter={paintEnter}
        onTooltipChange={handleTooltip}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        stageRef={stageRef}
        containerRef={containerRef}
        width={width}
        height={height}
        zenMode={zenMode}
      />
    </div>
  );
}
