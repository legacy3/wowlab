"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Talent } from "@wowlab/core/Schemas";
import { Search, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  TalentFlowNode,
  type TalentFlowNode as TalentFlowNodeType,
} from "./talent-flow-node";
import {
  TalentFlowEdge,
  type TalentFlowEdge as TalentFlowEdgeType,
} from "./talent-flow-edge";
import {
  computeVisibleNodes,
  filterByHeroTree,
  searchTalentNodes,
  deriveSelectedHeroId,
} from "@/components/talents/talent-utils";

interface TalentFlowTreeProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  className?: string;
}

function hasSelections(
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections,
): tree is Talent.TalentTreeWithSelections {
  return "selections" in tree;
}

// Define node and edge types OUTSIDE component - CRITICAL for performance
// This prevents React Flow from remounting all nodes/edges on every render
const nodeTypes: NodeTypes = {
  talent: TalentFlowNode,
};

const edgeTypes: EdgeTypes = {
  talent: TalentFlowEdge,
};

// Scale factor for positioning (the raw positions are large numbers)
const POSITION_SCALE = 0.05;

// Fit view options defined outside to avoid recreation
const fitViewOptions = { padding: 0.2, maxZoom: 1.5 };

// Inner component that uses useReactFlow hook
function TalentFlowTreeInner({ tree, className }: TalentFlowTreeProps) {
  const selections = hasSelections(tree) ? tree.selections : undefined;
  const { fitView } = useReactFlow();

  // Track if we need to fit view (on initial mount or structure change)
  const shouldFitView = useRef(true);
  const prevStructureKey = useRef<string | null>(null);

  // Compute visible nodes - memoized
  const visibleNodes = useMemo(
    () => computeVisibleNodes(tree.nodes, tree.edges),
    [tree.nodes, tree.edges],
  );

  // Hero tree selection
  const initialHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, selections),
    [tree.subTrees, visibleNodes, selections],
  );

  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    initialHeroId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate a stable key for structure changes (tree or hero selection)
  const structureKey = useMemo(() => {
    return `${tree.specId}-${selectedHeroId}`;
  }, [tree.specId, selectedHeroId]);

  // Reset on tree change (not hero change)
  const prevTreeSpecId = useRef(tree.specId);
  useEffect(() => {
    if (prevTreeSpecId.current !== tree.specId) {
      setSelectedHeroId(initialHeroId);
      setSearchQuery("");
      prevTreeSpecId.current = tree.specId;
      shouldFitView.current = true;
    }
  }, [tree.specId, initialHeroId]);

  // Filter by hero selection - memoized
  const displayNodes = useMemo(
    () => filterByHeroTree(visibleNodes, selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  // Search matches - memoized with stable Set reference
  const searchMatches = useMemo(
    () => searchTalentNodes(visibleNodes, searchQuery),
    [visibleNodes, searchQuery],
  );

  const isSearching = searchQuery.trim().length > 0;

  // Create a stable map of node IDs for edge filtering
  const displayNodeIds = useMemo(
    () => new Set(displayNodes.map((n) => n.id)),
    [displayNodes],
  );

  // Build initial nodes - only structural data, no selection/search state
  // This only changes when the tree structure or hero selection changes
  const structuralNodes: TalentFlowNodeType[] = useMemo(() => {
    return displayNodes.map((node) => ({
      id: node.id.toString(),
      type: "talent" as const,
      position: {
        x: node.posX * POSITION_SCALE,
        y: node.posY * POSITION_SCALE,
      },
      data: {
        talent: node,
        isSelected: false,
        ranksPurchased: 0,
        isHero: node.subTreeId > 0,
        isSearchMatch: false,
        isSearching: false,
      },
    }));
  }, [displayNodes]);

  // Build initial edges - only structural data
  const structuralEdges: TalentFlowEdgeType[] = useMemo(() => {
    return tree.edges
      .filter(
        (edge) =>
          displayNodeIds.has(edge.fromNodeId) &&
          displayNodeIds.has(edge.toNodeId),
      )
      .map((edge) => ({
        id: edge.id.toString(),
        source: edge.fromNodeId.toString(),
        target: edge.toNodeId.toString(),
        type: "talent" as const,
        data: {
          fromSelected: false,
          toSelected: false,
        },
      }));
  }, [tree.edges, displayNodeIds]);

  const [nodes, setNodes, onNodesChange] =
    useNodesState<TalentFlowNodeType>(structuralNodes);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<TalentFlowEdgeType>(structuralEdges);

  // Reset nodes/edges ONLY when structure changes (hero selection or tree change)
  useEffect(() => {
    if (prevStructureKey.current !== structureKey) {
      setNodes(structuralNodes);
      setEdges(structuralEdges);
      prevStructureKey.current = structureKey;
      shouldFitView.current = true;
    }
  }, [structureKey, structuralNodes, structuralEdges, setNodes, setEdges]);

  // TARGETED update: Update node data in-place when selection/search changes
  // This uses the updater pattern to only modify nodes that actually changed
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const nodeId = parseInt(node.id, 10);
        const selection = selections?.get(nodeId);
        const newIsSelected = selection?.selected ?? false;
        const newRanksPurchased = selection?.ranksPurchased ?? 0;
        const newIsSearchMatch = searchMatches.has(nodeId);

        // Skip update if nothing changed - this is the key optimization
        if (
          node.data.isSelected === newIsSelected &&
          node.data.ranksPurchased === newRanksPurchased &&
          node.data.isSearchMatch === newIsSearchMatch &&
          node.data.isSearching === isSearching
        ) {
          return node; // Return same reference, React Flow will skip re-render
        }

        // Only create new object if data actually changed
        return {
          ...node,
          data: {
            ...node.data,
            isSelected: newIsSelected,
            ranksPurchased: newRanksPurchased,
            isSearchMatch: newIsSearchMatch,
            isSearching,
          },
        };
      }),
    );
  }, [selections, searchMatches, isSearching, setNodes]);

  // TARGETED update: Update edge data in-place when selection changes
  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const fromId = parseInt(edge.source, 10);
        const toId = parseInt(edge.target, 10);
        const fromSelection = selections?.get(fromId);
        const toSelection = selections?.get(toId);
        const newFromSelected = fromSelection?.selected ?? false;
        const newToSelected = toSelection?.selected ?? false;

        // Skip update if nothing changed
        if (
          edge.data?.fromSelected === newFromSelected &&
          edge.data?.toSelected === newToSelected
        ) {
          return edge; // Return same reference
        }

        return {
          ...edge,
          data: {
            ...edge.data,
            fromSelected: newFromSelected,
            toSelected: newToSelected,
          },
        };
      }),
    );
  }, [selections, setEdges]);

  // Fit view after structure changes
  useEffect(() => {
    if (shouldFitView.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView(fitViewOptions);
        shouldFitView.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView, structureKey]);

  // Minimap node color - stable callback with empty deps (data accessed via parameter)
  const minimapNodeColor = useCallback((node: TalentFlowNodeType) => {
    const data = node.data;
    if (data.isSelected) return "#22c55e"; // green
    if (data.isHero) return "#ea580c"; // orange
    return "#6b7280"; // gray
  }, []);

  // Stable handler for hero selection
  const handleHeroSelect = useCallback((heroId: number | null) => {
    setSelectedHeroId(heroId);
  }, []);

  // Stable handler for search
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  // Stable handler for fullscreen toggle
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

        {/* Fullscreen toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>

        {/* Stats */}
        <span className="text-xs text-muted-foreground ml-auto">
          {displayNodes.length} talents · React Flow
        </span>
      </div>

      {/* React Flow container */}
      <div
        className={cn(
          "rounded-lg border overflow-hidden bg-background/50",
          isFullscreen ? "flex-1" : "h-[600px]",
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={0.3}
          maxZoom={3}
          defaultEdgeOptions={{ type: "talent" }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--muted-foreground) / 0.15)"
          />
          <Controls
            showZoom
            showFitView
            showInteractive={false}
            position="bottom-right"
          />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="hsl(var(--background) / 0.8)"
            className="!bg-background/80 !border-border"
            position="bottom-left"
            pannable
            zoomable
          />

          {/* Info panel */}
          <Panel position="top-right" className="!m-2">
            <div className="bg-background/90 border rounded-lg p-3 text-xs space-y-1 max-w-48">
              <div className="font-medium mb-2 flex items-center justify-between">
                <span>React Flow Features</span>
                <a
                  href="https://reactflow.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="text-muted-foreground">
                <div>• Scroll to zoom</div>
                <div>• Drag to pan</div>
                <div>• Minimap navigation</div>
                <div>• Smooth step edges</div>
                <div>• Memoized nodes</div>
              </div>
              <a
                href="https://reactflow.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 pt-2 border-t mt-2"
              >
                reactflow.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrapper with TooltipProvider and ReactFlowProvider
export function TalentFlowTree(props: TalentFlowTreeProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <ReactFlowProvider>
        <TalentFlowTreeInner {...props} />
      </ReactFlowProvider>
    </TooltipProvider>
  );
}
