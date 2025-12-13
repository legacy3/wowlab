"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import {
  Stage,
  Layer,
  Circle,
  Line,
  Group,
  Image as KonvaImage,
  Text,
} from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as StageType } from "konva/lib/Stage";
import type { Layer as LayerType } from "konva/lib/Layer";
import type { Talent } from "@wowlab/core/Schemas";
import {
  Search,
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import { cn } from "@/lib/utils";
import {
  computeVisibleNodes,
  filterByHeroTree,
  searchTalentNodes,
  deriveSelectedHeroId,
} from "@/components/talents/talent-utils";
import { env } from "@/lib/env";

interface TalentKonvaTreeProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  className?: string;
}

function hasSelections(
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections,
): tree is Talent.TalentTreeWithSelections {
  return "selections" in tree;
}

const POSITION_SCALE = 0.05;
const NODE_RADIUS = 18;

// Shared image cache to prevent redundant loading across nodes
const imageCache = new Map<string, HTMLImageElement>();

// Hook to load an image with caching
function useKonvaImage(url: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(() =>
    imageCache.get(url),
  );

  useEffect(() => {
    if (!url) return;

    // Check cache first
    const cached = imageCache.get(url);
    if (cached) {
      setImage(cached);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      imageCache.set(url, img);
      setImage(img);
    };
  }, [url]);

  return image;
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Node data interface for memoization
interface NodeRenderData {
  node: Talent.TalentNode;
  x: number;
  y: number;
  isSelected: boolean;
  isHero: boolean;
  isSearchMatch: boolean;
  isSearching: boolean;
  ranksPurchased: number;
}

// Individual node component - MEMOIZED
const TalentKonvaNode = memo(
  function TalentKonvaNode({
    node,
    x,
    y,
    isSelected,
    isHero,
    isSearchMatch,
    isSearching,
    ranksPurchased,
    onHover,
  }: NodeRenderData & {
    onHover: (node: Talent.TalentNode | null, x: number, y: number) => void;
  }) {
    const entry = node.entries[0];
    const iconUrl = entry
      ? `${env.SUPABASE_URL}/functions/v1/icons/small/${entry.iconFileName}.jpg`
      : "";
    const image = useKonvaImage(iconUrl);
    const [hovered, setHovered] = useState(false);

    const opacity = isSearching && !isSearchMatch ? 0.3 : 1;
    const scale = hovered ? 1.15 : 1;

    const handleMouseEnter = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        setHovered(true);
        const stage = e.target.getStage();
        if (stage) {
          const pos = stage.getPointerPosition();
          if (pos) onHover(node, pos.x, pos.y);
        }
      },
      [node, onHover],
    );

    const handleMouseLeave = useCallback(() => {
      setHovered(false);
      onHover(null, 0, 0);
    }, [onHover]);

    return (
      <Group
        x={x}
        y={y}
        scaleX={scale}
        scaleY={scale}
        opacity={opacity}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Selection ring */}
        {isSelected && (
          <Circle
            radius={NODE_RADIUS + 4}
            stroke="#facc15"
            strokeWidth={2}
            opacity={0.6}
          />
        )}

        {/* Search highlight ring */}
        {isSearching && isSearchMatch && (
          <Circle radius={NODE_RADIUS + 6} stroke="#3b82f6" strokeWidth={2} />
        )}

        {/* Main circle */}
        <Circle
          radius={NODE_RADIUS}
          fill={isSelected ? "#1a1a2e" : "#1f2937"}
          stroke={
            isSelected
              ? isHero
                ? "#ea580c"
                : "#facc15"
              : isHero
                ? "#9a3412"
                : "#374151"
          }
          strokeWidth={isSelected ? 3 : 2}
        />

        {/* Icon */}
        {image && (
          <KonvaImage
            image={image}
            x={-12}
            y={-12}
            width={24}
            height={24}
            cornerRadius={isHero ? 4 : 12}
            opacity={isSelected ? 1 : 0.5}
          />
        )}

        {/* Rank badge */}
        {node.maxRanks > 1 && (
          <>
            <Circle
              x={NODE_RADIUS - 4}
              y={NODE_RADIUS - 4}
              radius={8}
              fill="#1f2937"
              stroke="#374151"
              strokeWidth={1}
            />
            <Text
              x={NODE_RADIUS - 10}
              y={NODE_RADIUS - 10}
              width={12}
              height={12}
              text={
                isSelected
                  ? ranksPurchased.toString()
                  : node.maxRanks.toString()
              }
              fontSize={10}
              fontStyle="bold"
              fill={isSelected ? "#22c55e" : "#9ca3af"}
              align="center"
              verticalAlign="middle"
            />
          </>
        )}
      </Group>
    );
  },
  // Custom comparison for memo - only re-render if relevant props changed
  (prevProps, nextProps) => {
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.x === nextProps.x &&
      prevProps.y === nextProps.y &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHero === nextProps.isHero &&
      prevProps.isSearchMatch === nextProps.isSearchMatch &&
      prevProps.isSearching === nextProps.isSearching &&
      prevProps.ranksPurchased === nextProps.ranksPurchased &&
      prevProps.onHover === nextProps.onHover
    );
  },
);

// Edge data interface
interface EdgeRenderData {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive: boolean;
  isUnlocked: boolean;
}

// Separate edges layer component for caching
const EdgesLayer = memo(function EdgesLayer({
  edges,
  layerRef,
}: {
  edges: EdgeRenderData[];
  layerRef: React.RefObject<LayerType | null>;
}) {
  // Enable layer caching for better performance
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.cache();
    }
  }, [edges, layerRef]);

  return (
    <Layer ref={layerRef} listening={false}>
      {edges.map((edge) => (
        <Line
          key={edge.id}
          points={[edge.fromX, edge.fromY, edge.toX, edge.toY]}
          stroke={
            edge.isActive ? "#facc15" : edge.isUnlocked ? "#22c55e" : "#4b5563"
          }
          strokeWidth={edge.isActive ? 2.5 : edge.isUnlocked ? 2 : 1.5}
          opacity={edge.isActive ? 1 : edge.isUnlocked ? 0.8 : 0.4}
          listening={false}
        />
      ))}
    </Layer>
  );
});

// Isolated tooltip component to prevent parent re-renders
const KonvaTooltip = memo(function KonvaTooltip({
  tooltip,
}: {
  tooltip: { node: Talent.TalentNode; x: number; y: number } | null;
}) {
  if (!tooltip) return null;

  return (
    <div
      className="absolute bg-gray-900/95 border border-gray-700 rounded-lg p-3 text-xs max-w-xs pointer-events-none z-50"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <div className="flex items-center gap-2 mb-2">
        <GameIcon
          iconName={
            tooltip.node.entries[0]?.iconFileName || "inv_misc_questionmark"
          }
          size="small"
          alt={tooltip.node.entries[0]?.name || "?"}
          className="rounded"
        />
        <div>
          <div
            className={cn(
              "font-medium",
              tooltip.node.subTreeId > 0
                ? "text-orange-400"
                : "text-yellow-400",
            )}
          >
            {tooltip.node.entries[0]?.name || "Unknown"}
          </div>
          <div className="text-gray-500">
            {tooltip.node.subTreeId > 0 ? "Hero Talent" : "Talent"}
            {tooltip.node.maxRanks > 1 && ` · ${tooltip.node.maxRanks} Ranks`}
          </div>
        </div>
      </div>
      <p className="text-gray-300 leading-relaxed">
        {tooltip.node.entries[0]?.description || "No description"}
      </p>
    </div>
  );
});

export function TalentKonvaTree({ tree, className }: TalentKonvaTreeProps) {
  const stageRef = useRef<StageType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const edgesLayerRef = useRef<LayerType>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Track if we should fit view (only on structure change, not selection)
  const shouldFitViewRef = useRef(true);
  const prevStructureKeyRef = useRef<string | null>(null);

  const selections = hasSelections(tree) ? tree.selections : undefined;

  // Compute visible nodes
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
  const debouncedSearchQuery = useDebounce(searchQuery, 150);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{
    node: Talent.TalentNode;
    x: number;
    y: number;
  } | null>(null);

  // Structure key for detecting when to fit view
  const structureKey = useMemo(
    () => `${tree.specId}-${selectedHeroId}`,
    [tree.specId, selectedHeroId],
  );

  // Reset state only on tree change
  const prevTreeSpecId = useRef(tree.specId);
  useEffect(() => {
    if (prevTreeSpecId.current !== tree.specId) {
      setSelectedHeroId(initialHeroId);
      setSearchQuery("");
      prevTreeSpecId.current = tree.specId;
      shouldFitViewRef.current = true;
    }
  }, [tree.specId, initialHeroId]);

  // Mark for fit view on hero change
  useEffect(() => {
    if (prevStructureKeyRef.current !== structureKey) {
      shouldFitViewRef.current = true;
      prevStructureKeyRef.current = structureKey;
    }
  }, [structureKey]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isFullscreen]);

  const displayNodes = useMemo(
    () => filterByHeroTree(visibleNodes, selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  const searchMatches = useMemo(
    () => searchTalentNodes(visibleNodes, debouncedSearchQuery),
    [visibleNodes, debouncedSearchQuery],
  );
  const isSearching = debouncedSearchQuery.trim().length > 0;

  // Prepare node data - memoized
  const nodeData = useMemo(() => {
    return displayNodes.map((node) => ({
      node,
      x: node.posX * POSITION_SCALE,
      y: node.posY * POSITION_SCALE,
      isSelected: selections?.get(node.id)?.selected ?? false,
      ranksPurchased: selections?.get(node.id)?.ranksPurchased ?? 0,
      isHero: node.subTreeId > 0,
      isSearchMatch: searchMatches.has(node.id),
      isSearching,
    }));
  }, [displayNodes, selections, searchMatches, isSearching]);

  const nodeMap = useMemo(
    () => new Map(displayNodes.map((n) => [n.id, n])),
    [displayNodes],
  );

  // Prepare edge data - memoized with flat structure for EdgesLayer
  const edgeData: EdgeRenderData[] = useMemo(() => {
    return tree.edges
      .filter((e) => nodeMap.has(e.fromNodeId) && nodeMap.has(e.toNodeId))
      .map((edge) => {
        const from = nodeMap.get(edge.fromNodeId)!;
        const to = nodeMap.get(edge.toNodeId)!;
        const fromSelected = selections?.get(from.id)?.selected ?? false;
        const toSelected = selections?.get(to.id)?.selected ?? false;
        return {
          id: edge.id,
          fromX: from.posX * POSITION_SCALE,
          fromY: from.posY * POSITION_SCALE,
          toX: to.posX * POSITION_SCALE,
          toY: to.posY * POSITION_SCALE,
          isActive: fromSelected && toSelected,
          isUnlocked: fromSelected && !toSelected,
        };
      });
  }, [tree.edges, nodeMap, selections]);

  // Fit view calculation helper
  const calculateFitView = useCallback(() => {
    if (nodeData.length === 0) return null;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const node of nodeData) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }

    const padding = 40;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const scale = Math.min(
      dimensions.width / contentWidth,
      dimensions.height / contentHeight,
      1.5,
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      scale,
      x: dimensions.width / 2 - centerX * scale,
      y: dimensions.height / 2 - centerY * scale,
    };
  }, [nodeData, dimensions]);

  // Fit view on structure change only
  useEffect(() => {
    if (!shouldFitViewRef.current) return;

    const viewConfig = calculateFitView();
    if (viewConfig) {
      setStageScale(viewConfig.scale);
      setStagePos({ x: viewConfig.x, y: viewConfig.y });
      shouldFitViewRef.current = false;
    }
  }, [calculateFitView, structureKey]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.1;
      const newScale =
        e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.3, Math.min(3, newScale));

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      setStageScale(clampedScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [stageScale, stagePos],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    // Update position during drag for smooth experience
    setStagePos({ x: e.target.x(), y: e.target.y() });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTooltip = useCallback(
    (node: Talent.TalentNode | null, x: number, y: number) => {
      if (node) {
        setTooltip({ node, x: x + 20, y });
      } else {
        setTooltip(null);
      }
    },
    [],
  );

  const resetView = useCallback(() => {
    const viewConfig = calculateFitView();
    if (viewConfig) {
      setStageScale(viewConfig.scale);
      setStagePos({ x: viewConfig.x, y: viewConfig.y });
    }
  }, [calculateFitView]);

  // Stable search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  // Stable hero select handler
  const handleHeroSelect = useCallback((heroId: number | null) => {
    setSelectedHeroId(heroId);
  }, []);

  // Stable fullscreen handler
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isFullscreen && "fixed inset-0 z-50 bg-background p-4",
        className,
      )}
    >
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">
          {tree.className} — {tree.specName}
        </span>

        {/* Hero selector */}
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
                onClick={() => handleHeroSelect(subTree.id)}
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
              onClick={() => handleHeroSelect(null)}
            >
              Hide Hero
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search talents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-7 w-40 text-xs pl-7"
          />
        </div>

        {/* Reset view */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={resetView}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Fullscreen toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleFullscreenToggle}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>

        {/* Konva link */}
        <a
          href="https://konvajs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          konvajs.org
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={cn(
          "relative rounded-lg border overflow-hidden bg-background/50",
          isFullscreen ? "flex-1" : "h-[600px]",
        )}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* Edges layer - separate for caching */}
          <EdgesLayer edges={edgeData} layerRef={edgesLayerRef} />

          {/* Nodes layer */}
          <Layer>
            {nodeData.map((data) => (
              <TalentKonvaNode
                key={data.node.id}
                {...data}
                onHover={handleTooltip}
              />
            ))}
          </Layer>
        </Stage>

        {/* Tooltip (React overlay) - isolated component */}
        <KonvaTooltip tooltip={tooltip} />

        {/* Info panel */}
        <div className="absolute top-2 right-2 bg-background/90 border rounded-lg p-3 text-xs space-y-1 max-w-48">
          <div className="font-medium mb-2 flex items-center justify-between">
            <span>Konva Features</span>
            <a
              href="https://konvajs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="text-muted-foreground">
            <div>• Canvas rendering</div>
            <div>• Stage dragging</div>
            <div>• Wheel zoom</div>
            <div>• Layer caching</div>
            <div>• Memoized nodes</div>
          </div>
          <a
            href="https://konvajs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 pt-2 border-t mt-2"
          >
            konvajs.org
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 right-2 bg-background/90 border rounded px-2 py-1 text-xs text-muted-foreground">
          {Math.round(stageScale * 100)}%
        </div>
      </div>
    </div>
  );
}
