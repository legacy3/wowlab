"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type Konva from "konva";
import { useThrottledCallback } from "@react-hookz/web";
import { preloadIcons } from "@/components/konva";
import { cn } from "@/lib/utils";
import { useResizeObserver, useExport } from "@/hooks/canvas";
import { useZenMode } from "@/hooks/use-zen-mode";
import { useTalentViewModel } from "@/hooks/use-talent-view-model";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { useTalentKeyboard } from "@/hooks/use-talent-keyboard";
import {
  visibleAnnotationsAtom,
  annotationLayersAtom,
  activeAnnotationLayerIdAtom,
  activeAnnotationToolAtom,
  activeAnnotationColorAtom,
  selectedAnnotationIdAtom,
  editingTextIdAtom,
  nextAnnotationNumberAtom,
  canUndoAtom,
  canRedoAtom,
  undoAnnotationAtom,
  redoAnnotationAtom,
  clearAnnotationsAtom,
  addAnnotationAtom,
  updateAnnotationAtom,
  deleteAnnotationAtom,
  selectAnnotationAtom,
  startEditingTextAtom,
  stopEditingTextAtom,
  saveToHistoryAtom,
  resetAnnotationsAtom,
} from "@/atoms";
import { searchTalentNodes } from "./talent-utils";
import { TalentControls } from "./talent-controls";
import { TalentTreeRenderer } from "./talent-tree-renderer";
import type { TooltipState } from "./types";
import { MIN_SCALE, MAX_SCALE, NODE_SIZE, CHOICE_NODE_SIZE } from "./constants";
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
  const [pinnedTooltip, setPinnedTooltip] = useState<TooltipState | null>(null);
  const throttledSetTooltip = useThrottledCallback(
    setTooltip,
    [setTooltip],
    16,
  );

  const { isZen: zenMode, toggleZen: toggleZenMode } = useZenMode();

  // Annotation state from Jotai atoms
  const annotations = useAtomValue(visibleAnnotationsAtom);
  const layers = useAtomValue(annotationLayersAtom);
  const activeLayerId = useAtomValue(activeAnnotationLayerIdAtom);
  const [annotationTool, setAnnotationTool] = useAtom(activeAnnotationToolAtom);
  const [annotationColor, setAnnotationColor] = useAtom(
    activeAnnotationColorAtom,
  );
  const selectedAnnotationId = useAtomValue(selectedAnnotationIdAtom);
  const editingTextId = useAtomValue(editingTextIdAtom);
  const nextNumber = useAtomValue(nextAnnotationNumberAtom);
  const canUndo = useAtomValue(canUndoAtom);
  const canRedo = useAtomValue(canRedoAtom);
  const undo = useSetAtom(undoAnnotationAtom);
  const redo = useSetAtom(redoAnnotationAtom);
  const clearAnnotations = useSetAtom(clearAnnotationsAtom);
  const addAnnotation = useSetAtom(addAnnotationAtom);
  const updateAnnotation = useSetAtom(updateAnnotationAtom);
  const deleteAnnotation = useSetAtom(deleteAnnotationAtom);
  const selectAnnotation = useSetAtom(selectAnnotationAtom);
  const startEditingText = useSetAtom(startEditingTextAtom);
  const stopEditingText = useSetAtom(stopEditingTextAtom);
  const saveAnnotationHistory = useSetAtom(saveToHistoryAtom);
  const resetAnnotations = useSetAtom(resetAnnotationsAtom);

  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);
  const width = propWidth || containerWidth || 500;
  const height = propHeight || containerHeight || 600;

  const contentHeight = height;
  const { exportPNG, exportPDF } = useExport({
    stageRef,
    contentHeight,
    filenamePrefix: "talents",
  });

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
  const [blockedNodeId, setBlockedNodeId] = useState<number | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [hereArrow, setHereArrow] = useState<{ x: number; y: number } | null>(
    null,
  );
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panOverride, setPanOverride] = useState(false);

  const paint = useRef<{ active: boolean; lastNodeId: number | null }>({
    active: false,
    lastNodeId: null,
  });
  const hoverChainLastNodeId = useRef<number | null>(null);
  const annotationDraw = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    tempId: string | null;
  }>({ active: false, startX: 0, startY: 0, tempId: null });

  useEffect(() => {
    if (initialSelectionsKey == null) {
      return;
    }
    setSelections(initialSelections);
    setSelectedHeroId(initialHeroId);
    setSearchQuery("");
    setPanZoom({ x: 0, y: 0, scale: 1 });
    hoverChainLastNodeId.current = null;
    setPinnedTooltip(null);
    resetAnnotations();
  }, [
    initialHeroId,
    initialSelections,
    initialSelectionsKey,
    resetAnnotations,
  ]);

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
  const nodePosById = useMemo(
    () => new Map(viewModel?.nodes.map((node) => [node.id, node]) ?? []),
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

  const exportBounds = useMemo(() => {
    if (!viewModel) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const nodePos of viewModel.nodes) {
      const isChoiceNode =
        nodePos.node.type === 2 && nodePos.node.entries.length > 1;
      const size = isChoiceNode ? CHOICE_NODE_SIZE : NODE_SIZE;
      const half = size / 2;
      minX = Math.min(minX, nodePos.x - half);
      minY = Math.min(minY, nodePos.y - half);
      maxX = Math.max(maxX, nodePos.x + half);
      maxY = Math.max(maxY, nodePos.y + half);
    }

    for (const annotation of annotations) {
      switch (annotation.type) {
        case "arrow": {
          const xs = [annotation.x1, annotation.x2];
          const ys = [annotation.y1, annotation.y2];
          if (annotation.cx !== undefined) xs.push(annotation.cx);
          if (annotation.cy !== undefined) ys.push(annotation.cy);
          minX = Math.min(minX, ...xs);
          minY = Math.min(minY, ...ys);
          maxX = Math.max(maxX, ...xs);
          maxY = Math.max(maxY, ...ys);
          break;
        }
        case "circle": {
          minX = Math.min(minX, annotation.x - annotation.radius);
          minY = Math.min(minY, annotation.y - annotation.radius);
          maxX = Math.max(maxX, annotation.x + annotation.radius);
          maxY = Math.max(maxY, annotation.y + annotation.radius);
          break;
        }
        case "number": {
          const badge = 14;
          minX = Math.min(minX, annotation.x - badge);
          minY = Math.min(minY, annotation.y - badge);
          maxX = Math.max(maxX, annotation.x + badge);
          maxY = Math.max(maxY, annotation.y + badge);
          break;
        }
        case "text": {
          const fontSize = annotation.fontSize ?? 16;
          const textHeight = Math.max(fontSize, annotation.height ?? fontSize);
          minX = Math.min(minX, annotation.x - 6);
          minY = Math.min(minY, annotation.y - 6);
          maxX = Math.max(maxX, annotation.x + annotation.width + 6);
          maxY = Math.max(maxY, annotation.y + textHeight + 6);
          break;
        }
      }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return null;
    }

    const padding = 60;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [annotations, viewModel]);

  const fitPanZoomToBounds = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }) => {
      const padding = 20;
      const scale = Math.min(
        MAX_SCALE,
        Math.max(
          MIN_SCALE,
          Math.min(
            (width - padding * 2) / bounds.width,
            (height - padding * 2) / bounds.height,
          ),
        ),
      );

      return {
        scale,
        x: -bounds.x * scale + (width - bounds.width * scale) / 2,
        y: -bounds.y * scale + (height - bounds.height * scale) / 2,
      };
    },
    [height, width],
  );

  const exportWithFit = useCallback(
    async (exportFn: () => void) => {
      if (!exportBounds) {
        exportFn();
        return;
      }

      const previous = panZoom;
      setPanZoom(fitPanZoomToBounds(exportBounds));

      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      exportFn();
      setPanZoom(previous);
    },
    [exportBounds, fitPanZoomToBounds, panZoom],
  );

  const handleExportPNG = useCallback(() => {
    void exportWithFit(exportPNG);
  }, [exportPNG, exportWithFit]);

  const handleExportPDF = useCallback(() => {
    void exportWithFit(exportPDF);
  }, [exportPDF, exportWithFit]);

  const showBlockedFeedback = useCallback((nodeId: number) => {
    setBlockedNodeId(nodeId);
    setTimeout(() => setBlockedNodeId(null), 400);
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
      const node = nodeById.get(nodeId);
      if (!node) {
        return;
      }

      const current = selectionsRef.current.get(nodeId);
      const isSelected = !!current;
      const isChoiceNode = node.type === 2 && node.entries.length > 1;

      // Check if selecting would exceed point limits
      if (!isSelected) {
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
          showBlockedFeedback(nodeId);
          return;
        }
      }

      // Check if incrementing rank would exceed point limits
      if (isSelected && !isChoiceNode && node.maxRanks > 1) {
        const currentRanks = current?.ranksPurchased ?? 0;
        if (currentRanks < node.maxRanks) {
          if (
            wouldExceedPointLimit(node, 1, pointsSpentRef.current, pointLimits)
          ) {
            showBlockedFeedback(nodeId);
            return;
          }
        }
      }

      setSelections((prev) => {
        const next = new Map(prev);
        const prevCurrent = next.get(nodeId);
        const prevIsSelected = !!prevCurrent;

        if (!prevIsSelected) {
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
          const choiceIndex = prevCurrent?.choiceIndex ?? 0;
          if (choiceIndex === 0) {
            next.set(nodeId, { ...prevCurrent, choiceIndex: 1 });
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
          const currentRanks = prevCurrent?.ranksPurchased ?? 0;
          if (currentRanks < node.maxRanks) {
            next.set(nodeId, {
              ...prevCurrent,
              ranksPurchased: currentRanks + 1,
            });
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
      showBlockedFeedback,
    ],
  );

  const decrementNode = useCallback(
    (nodeId: number) => {
      const node = nodeById.get(nodeId);
      if (!node) {
        return;
      }

      const current = selectionsRef.current.get(nodeId);
      if (!current) {
        return;
      }

      setSelections((prev) => {
        const next = new Map(prev);
        const prevCurrent = next.get(nodeId);

        if (!prevCurrent) {
          return prev;
        }

        const isChoiceNode = node.type === 2 && node.entries.length > 1;

        // For multi-rank nodes, decrement rank
        if (!isChoiceNode && node.maxRanks > 1) {
          const currentRanks = prevCurrent.ranksPurchased ?? 0;

          if (currentRanks > 1) {
            next.set(nodeId, {
              ...prevCurrent,
              ranksPurchased: currentRanks - 1,
            });

            return next;
          }
        }

        // Deselect node and dependents
        next.delete(nodeId);

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
    [edgeIndex.childrenByNodeId, nodeById],
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setPanOverride(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setPanOverride(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - panZoom.x) / panZoom.scale,
        y: (screenY - panZoom.y) / panZoom.scale,
      };
    },
    [panZoom],
  );

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
      const pointer = stage.getPointerPosition();

      if (panOverride && pointer) {
        isDragging.current = true;
        lastPos.current = pointer;
        return;
      }

      // Handle annotation tools
      if (annotationTool && annotationTool !== "select" && pointer) {
        const activeLayer = layers.find((layer) => layer.id === activeLayerId);
        if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
          return;
        }

        const canvasPos = screenToCanvas(pointer.x, pointer.y);

        if (annotationTool === "arrow" || annotationTool === "circle") {
          annotationDraw.current = {
            active: true,
            startX: canvasPos.x,
            startY: canvasPos.y,
            tempId: null,
          };
        } else if (annotationTool === "text") {
          // Add text annotation at click position and start editing
          const id = addAnnotation({
            type: "text",
            x: canvasPos.x,
            y: canvasPos.y,
            width: 100,
            content: "Text",
          });
          // Start editing immediately so user can type
          if (id) {
            startEditingText(id);
          }
        } else if (annotationTool === "number") {
          addAnnotation({
            type: "number",
            x: canvasPos.x,
            y: canvasPos.y,
            value: nextNumber,
          });
        }

        return;
      }

      if (target !== stage && target.listening()) {
        return;
      }
      if (target === stage && pinnedTooltip) {
        setPinnedTooltip(null);
      }
      isDragging.current = true;
      lastPos.current = pointer;
    },
    [
      addAnnotation,
      annotationTool,
      nextNumber,
      screenToCanvas,
      activeLayerId,
      layers,
      panOverride,
      pinnedTooltip,
    ],
  );

  const handleMouseMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    const pos = stage.getPointerPosition();
    if (!pos) {
      return;
    }

    const canvasPos = screenToCanvas(pos.x, pos.y);
    lastMousePos.current = canvasPos;

    if (annotationDraw.current.active && annotationTool) {
      const { startX, startY, tempId } = annotationDraw.current;

      if (annotationTool === "arrow") {
        if (tempId) {
          updateAnnotation({
            id: tempId,
            updates: { x2: canvasPos.x, y2: canvasPos.y },
            saveHistory: false,
          });
        } else {
          const id = addAnnotation({
            type: "arrow",
            x1: startX,
            y1: startY,
            x2: canvasPos.x,
            y2: canvasPos.y,
            autoSelect: false, // Don't switch to select yet - wait for mouse up
            saveHistory: false,
          });

          if (id) {
            annotationDraw.current.tempId = id;
          }
        }
      } else if (annotationTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(canvasPos.x - startX, 2) + Math.pow(canvasPos.y - startY, 2),
        );

        if (tempId) {
          updateAnnotation({
            id: tempId,
            updates: { radius },
            saveHistory: false,
          });
        } else {
          const id = addAnnotation({
            type: "circle",
            x: startX,
            y: startY,
            radius,
            autoSelect: false, // Don't switch to select yet - wait for mouse up
            saveHistory: false,
          });

          if (id) {
            annotationDraw.current.tempId = id;
          }
        }
      }

      return;
    }

    if (!isDragging.current || !lastPos.current) {
      return;
    }

    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    lastPos.current = pos;
    setPanZoom((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, [addAnnotation, annotationTool, screenToCanvas, updateAnnotation]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastPos.current = null;

    // If we were drawing an annotation, switch to select tool now
    if (annotationDraw.current.active && annotationDraw.current.tempId) {
      saveAnnotationHistory();
      setAnnotationTool("select");
    }

    annotationDraw.current = {
      active: false,
      startX: 0,
      startY: 0,
      tempId: null,
    };

    stopPaint();
  }, [saveAnnotationHistory, setAnnotationTool, stopPaint]);

  const handlePinchZoom = useCallback(
    (newScale: number, centerX: number, centerY: number) => {
      setPanZoom((prev) => {
        const scaleRatio = newScale / prev.scale;
        return {
          x: centerX - (centerX - prev.x) * scaleRatio,
          y: centerY - (centerY - prev.y) * scaleRatio,
          scale: newScale,
        };
      });
    },
    [],
  );

  const pinchZoom = usePinchZoom(panZoom.scale, {
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    onZoom: handlePinchZoom,
  });

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        pinchZoom.onTouchStart(e.evt);
        isDragging.current = false;

        return;
      }
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
    [pinchZoom],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length === 2) {
        pinchZoom.onTouchMove(e.evt);
        return;
      }
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
    [pinchZoom],
  );

  const handleTouchEnd = useCallback(() => {
    pinchZoom.onTouchEnd();

    isDragging.current = false;
    lastPos.current = null;

    stopPaint();
  }, [pinchZoom, stopPaint]);

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
      if (pinnedTooltip) {
        return;
      }
      throttledSetTooltip(state);
    },
    [pinnedTooltip, throttledSetTooltip],
  );

  const handleNodeHoverChange = useCallback((nodeId: number | null) => {
    setHoveredNodeId(nodeId);

    if (nodeId != null && selectionsRef.current.has(nodeId)) {
      hoverChainLastNodeId.current = nodeId;
    }
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: number, event?: Konva.KonvaEventObject<MouseEvent>): void => {
      toggleNode(nodeId);

      if (!event?.evt.shiftKey) {
        return;
      }

      const nodePos = nodePosById.get(nodeId);
      if (!nodePos) {
        return;
      }

      setPinnedTooltip({
        x: nodePos.x * panZoom.scale + panZoom.x,
        y: nodePos.y * panZoom.scale + panZoom.y,
        node: nodePos.node,
        selection: selectionsRef.current.get(nodeId),
      });
    },
    [nodePosById, panZoom, toggleNode],
  );

  const handleKeyboardFocusChange = useCallback(
    (nodeId: number | null) => {
      const wasNotFocused = focusedNodeId === null;
      setFocusedNodeId(nodeId);

      if (wasNotFocused && nodeId !== null) {
        setHereArrow({ ...lastMousePos.current });
        setTimeout(() => setHereArrow(null), 2000);
      }
    },
    [focusedNodeId],
  );

  useTalentKeyboard({
    nodes: viewModel?.nodes ?? [],
    focusedNodeId,
    enabled: !zenMode || focusedNodeId !== null,
    onFocusChange: handleKeyboardFocusChange,
    onSelect: toggleNode,
    onDeselect: decrementNode,
  });

  // Keyboard shortcuts for annotations: Delete, Undo (Cmd+Z), Redo (Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape" && pinnedTooltip) {
        setPinnedTooltip(null);
        return;
      }

      // Undo/Redo work even when not focused on annotation
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (isInput) return;
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Delete requires selected annotation
      if (!selectedAnnotationId || isInput) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteAnnotation(selectedAnnotationId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteAnnotation, pinnedTooltip, redo, selectedAnnotationId, undo]);

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
        annotationTool={annotationTool}
        annotationColor={annotationColor}
        hasAnnotations={annotations.length > 0}
        canUndo={canUndo}
        canRedo={canRedo}
        onSearchChange={setSearchQuery}
        onResetView={resetPanZoom}
        onResetSelections={resetSelections}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleZen={toggleZenMode}
        onExportPNGViewport={exportPNG}
        onExportPDFViewport={exportPDF}
        onExportPNGFull={handleExportPNG}
        onExportPDFFull={handleExportPDF}
        onAnnotationToolChange={setAnnotationTool}
        onAnnotationColorChange={setAnnotationColor}
        onAnnotationsClear={clearAnnotations}
        onAnnotationsUndo={undo}
        onAnnotationsRedo={redo}
      />

      <TalentTreeRenderer
        viewModel={viewModel}
        panZoom={panZoom}
        tooltip={pinnedTooltip ?? tooltip}
        tooltipPinned={Boolean(pinnedTooltip)}
        onTooltipClose={() => setPinnedTooltip(null)}
        searchMatches={searchMatches}
        isSearching={isSearching}
        pathHighlight={pathHighlight}
        blockedNodeId={blockedNodeId}
        focusedNodeId={focusedNodeId}
        hereArrow={hereArrow}
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        editingTextId={editingTextId}
        annotationTool={annotationTool}
        onNodeClick={handleNodeClick}
        onNodeRightClick={decrementNode}
        onNodeHoverChange={handleNodeHoverChange}
        onPaintStart={startPaint}
        onPaintEnter={paintEnter}
        onTooltipChange={handleTooltip}
        onAnnotationSelect={selectAnnotation}
        onAnnotationChange={updateAnnotation}
        onStartEditText={startEditingText}
        onStopEditText={stopEditingText}
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
