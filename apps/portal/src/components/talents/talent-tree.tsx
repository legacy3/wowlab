"use client";

import { useMemo } from "react";
import type { Talent } from "@wowlab/core/Schemas";
import { TalentNode } from "./talent-node";
import { TalentEdge } from "./talent-edge";

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

  const { scale, offsetX, offsetY } = useMemo(() => {
    if (tree.nodes.length === 0) {
      return { scale: SCALE_FACTOR, offsetX: 0, offsetY: 0 };
    }

    const minX = Math.min(...tree.nodes.map((n) => n.posX));
    const maxX = Math.max(...tree.nodes.map((n) => n.posX));
    const minY = Math.min(...tree.nodes.map((n) => n.posY));
    const maxY = Math.max(...tree.nodes.map((n) => n.posY));

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
  }, [tree.nodes, width, height]);

  const nodeMap = useMemo(
    () => new Map(tree.nodes.map((n) => [n.id, n])),
    [tree.nodes],
  );

  return (
    <div
      className="relative bg-background/50 rounded-lg border"
      style={{ width, height }}
    >
      {/* Header */}
      <div className="absolute top-2 left-2 text-xs text-muted-foreground">
        {tree.className} - {tree.specName}
      </div>

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
      {tree.nodes.map((node) => {
        const selection = selections?.get(node.id);
        const x = node.posX * scale + offsetX;
        const y = node.posY * scale + offsetY;

        return (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <TalentNode node={node} selection={selection} />
          </div>
        );
      })}

      {/* Hero tree indicators */}
      {tree.subTrees.length > 0 && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          {tree.subTrees.map((subTree) => (
            <div
              key={subTree.id}
              className="text-[10px] px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded"
              title={subTree.description}
            >
              {subTree.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
