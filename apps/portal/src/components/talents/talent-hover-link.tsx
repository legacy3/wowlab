"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
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
import {
  buildTalentViewModel,
  deriveSelectedHeroId,
  type TalentViewModel,
} from "@wowlab/services/Talents";
import { TalentTreePreviewRenderer } from "./talent-tree-preview-renderer";

interface TalentHoverLinkProps {
  encodedTalents: string;
  className?: string;
}

type TalentTreeWithSelections = NonNullable<
  ReturnType<typeof useTalentTreeWithSelections>["data"]
>;

const TREE_WIDTH = 420;
const TREE_HEIGHT = 300;

function getPointCount(nodes: readonly TalentViewModel["nodes"]) {
  return nodes.reduce((sum, node) => {
    return (
      sum +
      (node.selection?.selected ? (node.selection.ranksPurchased ?? 0) : 0)
    );
  }, 0);
}

function filterPreviewViewModel(
  viewModel: TalentViewModel,
  predicate: (node: TalentViewModel["nodes"][number]) => boolean,
): TalentViewModel {
  const allowed = viewModel.nodes.filter(predicate);
  const allowedIds = new Set(allowed.map((node) => node.id));
  return {
    ...viewModel,
    nodes: allowed,
    edges: viewModel.edges.filter(
      (edge) =>
        allowedIds.has(edge.fromNodeId) && allowedIds.has(edge.toNodeId),
    ),
  };
}

function TalentPreviewContent({ tree }: { tree: TalentTreeWithSelections }) {
  const selectedHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, tree.nodes, tree.selections),
    [tree.subTrees, tree.nodes, tree.selections],
  );

  const mainViewModel = useMemo(
    () =>
      buildTalentViewModel(tree, tree.selections, {
        width: TREE_WIDTH,
        height: TREE_HEIGHT,
        selectedHeroId: null,
      }),
    [tree],
  );

  const heroViewModel = useMemo(
    () =>
      buildTalentViewModel(tree, tree.selections, {
        width: TREE_WIDTH,
        height: TREE_HEIGHT,
        selectedHeroId,
      }),
    [tree, selectedHeroId],
  );

  const heroOnlyViewModel = useMemo(
    () => filterPreviewViewModel(heroViewModel, (node) => node.isHero),
    [heroViewModel],
  );

  const selectedHeroTree = tree.subTrees.find((st) => st.id === selectedHeroId);
  const mainPoints = getPointCount(mainViewModel.nodes);
  const heroPoints = getPointCount(heroOnlyViewModel.nodes);
  const hasHero = heroOnlyViewModel.nodes.length > 0;

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
          <TalentTreePreviewRenderer viewModel={mainViewModel} />
        </TabsContent>

        {hasHero && (
          <TabsContent value="hero" className="mt-2">
            <TalentTreePreviewRenderer viewModel={heroOnlyViewModel} />
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
