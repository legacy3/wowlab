"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { decodeTalentLoadout } from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SpecLabel } from "@/components/ui/spec-label";
import { CopyButton } from "@/components/ui/copy-button";
import { GameIcon } from "@/components/game/game-icon";
import { useTalentTreeWithSelections } from "@/hooks/use-talent-tree";
import {
  buildTalentViewModel,
  deriveSelectedHeroId,
  type TalentViewModel,
} from "@wowlab/services/Talents";
import {
  getHeroAtlasUrl,
  getPointCount,
  getKeyTalents,
  type KeyTalent,
} from "@/lib/talents";
import { TalentTreePreviewRenderer } from "./talent-tree-preview-renderer";

interface TalentHoverLinkProps {
  encodedTalents: string;
  className?: string;
}

type TalentTreeWithSelections = NonNullable<
  ReturnType<typeof useTalentTreeWithSelections>["data"]
>;

const TREE_WIDTH = 140;
const TREE_HEIGHT = 180;

function TreePreviewColumn({
  viewModel,
  label,
  points,
}: {
  viewModel: TalentViewModel;
  label: string;
  points: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <TalentTreePreviewRenderer viewModel={viewModel} />
      <span className="text-[10px] text-muted-foreground">
        {label}: {points}
      </span>
    </div>
  );
}

function HeroTreePreview({
  viewModel,
  points,
  atlasUrl,
  heroName,
}: {
  viewModel: TalentViewModel;
  points: number;
  atlasUrl: string;
  heroName: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded overflow-hidden"
        style={{ width: TREE_WIDTH, height: TREE_HEIGHT }}
      >
        <Image
          src={atlasUrl}
          alt={heroName}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0">
          <TalentTreePreviewRenderer viewModel={viewModel} transparentBg />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">Hero: {points}</span>
    </div>
  );
}

function KeyTalentsSection({ talents }: { talents: KeyTalent[] }) {
  if (talents.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 items-center">
      <span className="text-[10px] text-muted-foreground font-medium">
        Key Talents
      </span>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {talents.map((talent) => (
          <Link
            key={talent.id}
            href={`/lab/inspector/spell/${talent.spellId}`}
            target="_blank"
            title={talent.name}
          >
            <GameIcon
              iconName={talent.iconFileName}
              size="medium"
              className="rounded border border-border/50 hover:border-primary/50 transition-colors"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function TalentPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-2">
        <Skeleton className="h-[180px] w-[140px] rounded" />
        <Skeleton className="h-[180px] w-[140px] rounded" />
        <Skeleton className="h-[180px] w-[140px] rounded" />
      </div>
      <div className="flex gap-1.5 justify-center">
        <Skeleton className="h-9 w-9 rounded" />
        <Skeleton className="h-9 w-9 rounded" />
        <Skeleton className="h-9 w-9 rounded" />
      </div>
    </div>
  );
}

function TalentPreviewContent({
  tree,
  encodedTalents,
  calculatorUrl,
}: {
  tree: TalentTreeWithSelections;
  encodedTalents: string;
  calculatorUrl: string;
}) {
  const selectedHeroId = useMemo(
    () => deriveSelectedHeroId(tree.subTrees, tree.nodes, tree.selections),
    [tree.subTrees, tree.nodes, tree.selections],
  );

  const classViewModel = useMemo(
    () =>
      buildTalentViewModel(
        {
          ...tree,
          nodes: tree.nodes.filter(
            (n) => n.subTreeId === 0 && n.treeIndex === 1,
          ),
        },
        tree.selections,
        { width: TREE_WIDTH, height: TREE_HEIGHT, selectedHeroId: null },
      ),
    [tree],
  );

  const specViewModel = useMemo(
    () =>
      buildTalentViewModel(
        {
          ...tree,
          nodes: tree.nodes.filter(
            (n) => n.subTreeId === 0 && n.treeIndex === 2,
          ),
        },
        tree.selections,
        { width: TREE_WIDTH, height: TREE_HEIGHT, selectedHeroId: null },
      ),
    [tree],
  );

  const heroViewModel = useMemo(
    () =>
      buildTalentViewModel(
        { ...tree, nodes: tree.nodes.filter((n) => n.subTreeId > 0) },
        tree.selections,
        { width: TREE_WIDTH, height: TREE_HEIGHT, selectedHeroId },
      ),
    [tree, selectedHeroId],
  );

  const classPoints = getPointCount(classViewModel.nodes);
  const specPoints = getPointCount(specViewModel.nodes);
  const heroPoints = getPointCount(heroViewModel.nodes);
  const hasHero = heroViewModel.nodes.length > 0;

  const keyTalents = useMemo(() => {
    const specTalents = getKeyTalents(specViewModel.nodes, 4);
    const heroTalents = getKeyTalents(heroViewModel.nodes, 2);

    return [...specTalents, ...heroTalents].slice(0, 5);
  }, [specViewModel.nodes, heroViewModel.nodes]);

  const selectedHeroTree = tree.subTrees.find((st) => st.id === selectedHeroId);
  const heroAtlasUrl = selectedHeroTree
    ? getHeroAtlasUrl(tree.className, selectedHeroTree.name)
    : "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between pb-1 border-b border-border/30">
        <SpecLabel specId={tree.specId} size="sm" showChevron showIcon />
        <div className="flex items-center gap-1">
          <CopyButton
            value={encodedTalents}
            label="talent string"
            title="Copy talent string"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            asChild
          >
            <Link href={calculatorUrl} title="Open in calculator">
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <TreePreviewColumn
          viewModel={classViewModel}
          label="Class"
          points={classPoints}
        />
        {hasHero && selectedHeroTree && (
          <HeroTreePreview
            viewModel={heroViewModel}
            points={heroPoints}
            atlasUrl={heroAtlasUrl}
            heroName={selectedHeroTree.name}
          />
        )}
        <TreePreviewColumn
          viewModel={specViewModel}
          label="Spec"
          points={specPoints}
        />
      </div>

      <KeyTalentsSection talents={keyTalents} />
    </div>
  );
}

export function TalentHoverLink({
  encodedTalents,
  className,
}: TalentHoverLinkProps) {
  const decoded = useMemo(() => {
    const result = Effect.runSync(
      Effect.either(decodeTalentLoadout(encodedTalents)),
    );

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

      <HoverCardContent className="w-auto p-3" side="top" align="center">
        {isLoading || !tree ? (
          <TalentPreviewSkeleton />
        ) : (
          <TalentPreviewContent
            tree={tree}
            encodedTalents={encodedTalents}
            calculatorUrl={calculatorUrl}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
