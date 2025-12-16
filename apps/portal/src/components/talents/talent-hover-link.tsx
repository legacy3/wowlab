"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import { Schemas } from "@wowlab/core";
import * as Effect from "effect/Effect";
import { Sparkles } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { GameIcon } from "@/components/game/game-icon";
import { useTalentTreeWithSelections } from "@/hooks/use-talent-tree";
import { useTalentLayout } from "@/hooks/use-talent-layout";
import {
  computeVisibleNodes,
  filterByHeroTree,
  deriveSelectedHeroId,
} from "./talent-utils";
import type { TalentTreeLayout } from "./types";

type TalentTreeWithSelections = Schemas.Talent.TalentTreeWithSelections;
type TalentNode = Schemas.Talent.TalentNode;

interface TalentHoverLinkProps {
  encodedTalents: string;
  className?: string;
}

const TREE_WIDTH = 420;
const TREE_HEIGHT = 300;

function TreeSkeletonSvg({ layout }: { layout: TalentTreeLayout }) {
  return (
    <svg
      viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`}
      className="w-full h-auto rounded-lg"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
      }}
    >
      {/* Unselected edges - dark purple */}
      {layout.edges
        .filter((edge) => !(edge.fromSelected && edge.toSelected))
        .map((edge) => (
          <line
            key={edge.id}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke="#6366f1"
            strokeWidth={1}
            opacity={0.2}
          />
        ))}

      {/* Active edges - bright gold */}
      {layout.edges
        .filter((edge) => edge.fromSelected && edge.toSelected)
        .map((edge) => (
          <line
            key={`active-${edge.id}`}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke="#fbbf24"
            strokeWidth={4}
            strokeLinecap="round"
          />
        ))}

      {/* Unselected nodes - dim purple */}
      {layout.nodes
        .filter(
          (n) => !(n.selection?.selected && n.selection.ranksPurchased > 0),
        )
        .map((nodePos) => (
          <circle
            key={nodePos.id}
            cx={nodePos.x}
            cy={nodePos.y}
            r={3}
            fill="#6366f1"
            opacity={0.3}
          />
        ))}

      {/* Selected nodes - bright gold, FAT */}
      {layout.nodes
        .filter((n) => n.selection?.selected && n.selection.ranksPurchased > 0)
        .map((nodePos) => {
          const isChoice = nodePos.node.type === 2;
          return (
            <circle
              key={`selected-${nodePos.id}`}
              cx={nodePos.x}
              cy={nodePos.y}
              r={isChoice ? 10 : 7}
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          );
        })}
    </svg>
  );
}

function TreeSkeletonView({
  nodes,
  edges,
  selections,
}: {
  nodes: readonly TalentNode[];
  edges: readonly Schemas.Talent.TalentEdge[];
  selections: Map<number, Schemas.Talent.DecodedTalentSelection>;
}) {
  const layout = useTalentLayout({
    nodes,
    edges,
    selections,
    width: TREE_WIDTH,
    height: TREE_HEIGHT,
  });

  if (nodes.length === 0) {
    return null;
  }

  return <TreeSkeletonSvg layout={layout} />;
}

function getPointCount(
  nodes: readonly TalentNode[],
  selections: Map<number, Schemas.Talent.DecodedTalentSelection>,
) {
  return nodes.reduce((sum, node) => {
    const sel = selections.get(node.id);
    return sum + (sel?.selected ? sel.ranksPurchased : 0);
  }, 0);
}

function TalentPreviewContent({ tree }: { tree: TalentTreeWithSelections }) {
  const visibleNodes = useMemo(
    () => computeVisibleNodes(tree.nodes, tree.edges),
    [tree.nodes, tree.edges],
  );

  const selectedHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, visibleNodes, tree.selections),
    [tree.subTrees, visibleNodes, tree.selections],
  );

  const mainNodes = useMemo(
    () => filterByHeroTree(visibleNodes, null), // null = hide hero, show only main
    [visibleNodes],
  );

  const heroNodes = useMemo(
    () => visibleNodes.filter((n) => n.subTreeId === selectedHeroId),
    [visibleNodes, selectedHeroId],
  );

  const selectedHeroTree = tree.subTrees.find((st) => st.id === selectedHeroId);
  const mainPoints = getPointCount(mainNodes, tree.selections);
  const heroPoints = getPointCount(heroNodes, tree.selections);
  const hasHero = selectedHeroId !== null && heroNodes.length > 0;

  return (
    <div className="space-y-2">
      {/* Hero tree name header */}
      {selectedHeroTree && (
        <div className="flex items-center gap-1.5 pb-1 border-b border-border/50">
          <GameIcon
            iconName={selectedHeroTree.iconFileName}
            size="small"
            className="rounded"
          />
          <span className="text-xs font-medium">{selectedHeroTree.name}</span>
        </div>
      )}

      {/* Tabbed tree views */}
      <Tabs defaultValue="main">
        <TabsList className="w-full">
          <TabsTrigger value="main" className="flex-1 text-xs">
            Talents ({mainPoints})
          </TabsTrigger>
          {hasHero && (
            <TabsTrigger value="hero" className="flex-1 text-xs">
              Hero ({heroPoints})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="main" className="mt-2">
          <TreeSkeletonView
            nodes={mainNodes}
            edges={tree.edges}
            selections={tree.selections}
          />
        </TabsContent>

        {hasHero && (
          <TabsContent value="hero" className="mt-2">
            <TreeSkeletonView
              nodes={heroNodes}
              edges={tree.edges}
              selections={tree.selections}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function TalentPreviewSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <Skeleton className="rounded-lg w-full h-[300px]" />
    </div>
  );
}

export function TalentHoverLink({
  encodedTalents,
  className,
}: TalentHoverLinkProps) {
  const decoded = useMemo((): DecodedTalentLoadout | null => {
    const effect = decodeTalentLoadout(encodedTalents);
    const result = Effect.runSync(Effect.either(effect));

    if (result._tag === "Right") {
      return result.right;
    }

    return null;
  }, [encodedTalents]);

  const { data: tree, isLoading } = useTalentTreeWithSelections(
    decoded?.specId ?? null,
    decoded,
  );

  const calculatorUrl = `/talents?talents=${encodeURIComponent(encodedTalents)}`;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link
          href={calculatorUrl}
          className={
            className ??
            "inline-flex items-center gap-1 text-[10px] h-5 px-2 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          }
        >
          <Sparkles className="h-3 w-3" />
          Talents
        </Link>
      </HoverCardTrigger>

      <HoverCardContent className="w-[450px] p-2" side="top" align="center">
        {isLoading || !tree ? (
          <TalentPreviewSkeleton />
        ) : (
          <TalentPreviewContent tree={tree} />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
