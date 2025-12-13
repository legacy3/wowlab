"use client";

import { useMemo, useState } from "react";
import type { Talent } from "@wowlab/core/Schemas";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIcon } from "@/components/game";
import { cn } from "@/lib/utils";

interface TalentTreeProps {
  tree: Talent.TalentTree | Talent.TalentTreeWithSelections;
  width?: number;
  height?: number;
}

// Scale factor to convert game coordinates (0-9000) to pixels
const SCALE_FACTOR = 0.05;
const NODE_OFFSET = 20; // Offset to center nodes

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
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(
    tree.subTrees[0]?.id ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const visibleNodes = useMemo(() => {
    const allNodeMap = new Map(tree.nodes.map((n) => [n.id, n]));

    // Build edge map: fromNodeId -> [toNodeIds]
    const edgesFrom = new Map<number, number[]>();
    for (const edge of tree.edges) {
      if (!edgesFrom.has(edge.fromNodeId)) {
        edgesFrom.set(edge.fromNodeId, []);
      }

      edgesFrom.get(edge.fromNodeId)!.push(edge.toNodeId);
    }

    // Start with nodes that have orderIndex >= 0 or are hero nodes
    const includedIds = new Set<number>();
    const queue: number[] = [];

    for (const n of tree.nodes) {
      if (n.orderIndex >= 0 || n.subTreeId > 0) {
        includedIds.add(n.id);
        queue.push(n.id);
      }
    }

    // BFS to include connected nodes (non-hero only)
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const targets = edgesFrom.get(nodeId) || [];

      for (const targetId of targets) {
        if (!includedIds.has(targetId)) {
          const targetNode = allNodeMap.get(targetId);

          if (targetNode && targetNode.subTreeId === 0) {
            includedIds.add(targetId);
            queue.push(targetId);
          }
        }
      }
    }

    return tree.nodes.filter((n) => includedIds.has(n.id));
  }, [tree.nodes, tree.edges]);

  // Filter by selected hero tree
  const displayNodes = useMemo(() => {
    return visibleNodes.filter((n) => {
      // Show all non-hero nodes
      if (n.subTreeId === 0) {
        return true;
      }

      // Show hero nodes only if their subtree is selected
      return selectedHeroId !== null && n.subTreeId === selectedHeroId;
    });
  }, [visibleNodes, selectedHeroId]);

  // Search filtering
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return new Set<number>();
    }

    const query = searchQuery.toLowerCase();

    return new Set(
      displayNodes
        .filter((n) =>
          n.entries.some((e) => e.name.toLowerCase().includes(query)),
        )
        .map((n) => n.id),
    );
  }, [displayNodes, searchQuery]);

  const { scale, offsetX, offsetY } = useMemo(() => {
    if (displayNodes.length === 0) {
      return { scale: SCALE_FACTOR, offsetX: 0, offsetY: 0 };
    }

    const minX = Math.min(...displayNodes.map((n) => n.posX));
    const maxX = Math.max(...displayNodes.map((n) => n.posX));
    const minY = Math.min(...displayNodes.map((n) => n.posY));
    const maxY = Math.max(...displayNodes.map((n) => n.posY));

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const scaleX = (width - NODE_OFFSET * 2) / rangeX;
    const scaleY = (height - NODE_OFFSET * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);

    return {
      scale,
      offsetX: NODE_OFFSET - minX * scale,
      offsetY: NODE_OFFSET - minY * scale,
    };
  }, [displayNodes, width, height]);

  const nodeMap = useMemo(
    () => new Map(displayNodes.map((n) => [n.id, n])),
    [displayNodes],
  );

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

          {/* Stats */}
          <span className="text-xs text-muted-foreground ml-auto">
            {displayNodes.length} talents
          </span>
        </div>

        {/* Tree container */}
        <div
          className="relative bg-background/50 rounded-lg border overflow-hidden"
          style={{ width, height }}
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
                  edge={edge}
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
            const isSearching = searchQuery.trim().length > 0;
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
    </TooltipProvider>
  );
}
