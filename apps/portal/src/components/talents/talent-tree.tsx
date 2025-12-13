"use client";

import { useEffect, useMemo, useState } from "react";
import type { Talent } from "@wowlab/core/Schemas";
import { RotateCcw } from "lucide-react";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import { cn } from "@/lib/utils";
import {
  computeVisibleNodes,
  filterByHeroTree,
  computeTalentLayout,
  searchTalentNodes,
  deriveSelectedHeroId,
} from "./talent-utils";
import { usePanZoom } from "@/hooks/use-pan-zoom";

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

export function TalentTree({
  tree,
  width = 500,
  height = 600,
}: TalentTreeProps) {
  const selections = hasSelections(tree) ? tree.selections : undefined;

  // Pan/zoom state
  const {
    state: panZoom,
    handlers: panZoomHandlers,
    reset: resetPanZoom,
  } = usePanZoom({
    minScale: 0.5,
    maxScale: 3,
  });

  // Compute visible nodes (stable across hero toggles)
  const visibleNodes = useMemo(
    () => computeVisibleNodes(tree.nodes, tree.edges),
    [tree.nodes, tree.edges],
  );

  // Derive initial hero selection from selections data
  const initialHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, selections),
    [tree.subTrees, visibleNodes, selections],
  );

  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    initialHeroId,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Reset hero selection, search, and pan/zoom when tree changes
  useEffect(() => {
    setSelectedHeroId(initialHeroId);
    setSearchQuery("");
    resetPanZoom();
  }, [initialHeroId, resetPanZoom]);

  // Filter by hero selection for display
  const displayNodes = useMemo(
    () => filterByHeroTree(visibleNodes, selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  // Use VISIBLE nodes for stable layout (not display nodes)
  const { scale, offsetX, offsetY } = useMemo(
    () => computeTalentLayout(visibleNodes, width, height),
    [visibleNodes, width, height],
  );

  // Search ALL visible nodes so hero talents are always searchable
  const searchMatches = useMemo(
    () => searchTalentNodes(visibleNodes, searchQuery),
    [visibleNodes, searchQuery],
  );
  const isSearching = searchQuery.trim().length > 0;

  // Node lookup map for edges
  const nodeMap = useMemo(
    () => new Map(displayNodes.map((n) => [n.id, n])),
    [displayNodes],
  );

  const isPanned = panZoom.x !== 0 || panZoom.y !== 0 || panZoom.scale !== 1;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-2">
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
                  variant={
                    selectedHeroId === subTree.id ? "default" : "outline"
                  }
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

          {/* Search */}
          <Input
            placeholder="Search talents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 w-36 text-xs"
          />

          {/* Reset pan/zoom */}
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

          {/* Stats */}
          <span className="text-xs text-muted-foreground ml-auto">
            {displayNodes.length} talents
            {panZoom.scale !== 1 && ` · ${Math.round(panZoom.scale * 100)}%`}
          </span>
        </div>

        {/* Tree container */}
        <div
          className="relative bg-background/50 rounded-lg border overflow-hidden cursor-grab select-none"
          style={{ width, height }}
          {...panZoomHandlers}
        >
          {/* Transform wrapper for pan/zoom */}
          <div
            style={{
              transform: `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`,
              transformOrigin: "0 0",
              width,
              height,
              position: "relative",
            }}
          >
            {/* Edges (SVG layer) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width, height }}
            >
              {tree.edges.map((edge) => {
                const fromNode = nodeMap.get(edge.fromNodeId);
                const toNode = nodeMap.get(edge.toNodeId);
                if (!fromNode || !toNode) return null;

                const fromSelection = selections?.get(edge.fromNodeId);
                const toSelection = selections?.get(edge.toNodeId);

                return (
                  <TalentEdge
                    key={edge.id}
                    fromNode={fromNode}
                    toNode={toNode}
                    fromSelected={fromSelection?.selected}
                    toSelected={toSelection?.selected}
                    scale={scale}
                    offsetX={offsetX}
                    offsetY={offsetY}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {displayNodes.map((node) => {
              const selection = selections?.get(node.id);
              const x = node.posX * scale + offsetX;
              const y = node.posY * scale + offsetY;
              const isMatch = searchMatches.has(node.id);

              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute",
                    isSearching && !isMatch && "opacity-30",
                    isSearching && isMatch && "ring-2 ring-blue-500 rounded-lg",
                  )}
                  style={{
                    left: x,
                    top: y,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <TalentNode
                    node={node}
                    selection={selection}
                    isHero={node.subTreeId > 0}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
