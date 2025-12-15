"use client";

import { Suspense, useMemo, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { useQueryState, parseAsString } from "nuqs";
import dynamic from "next/dynamic";
import {
  decodeTalentLoadout,
  encodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { SpecPicker } from "@/components/ui/spec-picker";
import { useTalentTree } from "@/hooks/use-talent-tree";
import { applyDecodedTalents } from "@wowlab/services/Data";
import type { Talent } from "@wowlab/core/Schemas";

function TalentCalculatorSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
      <Skeleton className="h-[700px] w-full" />
    </div>
  );
}

const TalentTree = dynamic(
  () =>
    import("@/components/talents/talent-tree").then((mod) => mod.TalentTree),
  { ssr: false, loading: () => <Skeleton className="h-[700px] w-full" /> },
);

function TalentStateMessage({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-16rem)] min-h-[700px] w-full items-center justify-center text-center text-muted-foreground">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs">{description}</p> : null}
      </div>
    </div>
  );
}

function TalentCalculatorInner() {
  const [talents, setTalents] = useQueryState(
    "talents",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      history: "push",
      throttleMs: 300,
    }),
  );

  const decoded = useMemo((): DecodedTalentLoadout | null => {
    if (!talents) {
      return null;
    }

    const effect = decodeTalentLoadout(talents);
    const result = Effect.runSync(Effect.either(effect));

    if (result._tag === "Right") {
      return result.right;
    }

    return null;
  }, [talents]);
  const effectiveSpecId = decoded?.specId ?? null;

  const { data: tree, isLoading, error } = useTalentTree(effectiveSpecId);

  const treeDrivenTalentsRef = useRef<string | null>(null);
  const initialSelectionsKey = useMemo(() => {
    if (!talents) {
      return null;
    }
    return talents === treeDrivenTalentsRef.current ? null : talents;
  }, [talents]);

  const initialSelections = useMemo(() => {
    if (!tree || !decoded) {
      return new Map<number, Talent.DecodedTalentSelection>();
    }
    return applyDecodedTalents(tree, decoded).selections;
  }, [decoded, tree]);

  const handleSpecSelect = useCallback(
    (specId: number) => {
      treeDrivenTalentsRef.current = null;
      const zeroHash = new Uint8Array(16);
      const next = encodeTalentLoadout({
        version: 1,
        specId,
        treeHash: zeroHash,
        nodes: [],
      });
      setTalents(next);
    },
    [setTalents],
  );

  let content: ReactNode;

  if (!talents) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Import Talent String</h3>
            <p className="text-sm text-muted-foreground">
              Paste a talent loadout string to view and edit
            </p>
          </div>
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="Paste a talent string..."
              value={talents}
              onChange={(e) => {
                treeDrivenTalentsRef.current = null;
                setTalents(e.target.value.trim() || null);
              }}
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="flex-1 border-t" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="flex-1 border-t" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Start from Scratch</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class and specialization
            </p>
          </div>
          <SpecPicker onSpecSelect={handleSpecSelect} />
        </div>
      </div>
    );
  } else if (talents && !decoded) {
    content = (
      <TalentStateMessage title="Unable to decode the provided talent string" />
    );
  } else if (isLoading) {
    content = (
      <Skeleton className="h-[calc(100vh-16rem)] min-h-[700px] w-full" />
    );
  } else if (error) {
    content = <TalentStateMessage title="Failed to load the talent tree" />;
  } else if (tree) {
    content = (
      <TalentTree
        tree={tree}
        initialSelections={initialSelections}
        initialSelectionsKey={initialSelectionsKey}
        onSelectionsChange={(selections) => {
          if (!decoded) {
            return;
          }

          const orderedNodes = [...tree.nodes].sort((a, b) => a.id - b.id);

          let lastIndex = -1;
          for (let i = 0; i < orderedNodes.length; i++) {
            if (selections.has(orderedNodes[i]!.id)) {
              lastIndex = i;
            }
          }

          const nodes =
            lastIndex >= 0
              ? orderedNodes.slice(0, lastIndex + 1).map((node) => {
                  const sel = selections.get(node.id);
                  const selected = !!sel?.selected;
                  const ranksPurchased = sel?.ranksPurchased ?? 0;
                  const isChoiceNode = node.type === 2 && node.entries.length > 1;
                  return {
                    selected,
                    purchased: selected && ranksPurchased > 0,
                    partiallyRanked: selected && node.maxRanks > 1 && ranksPurchased < node.maxRanks,
                    ranksPurchased,
                    choiceNode: selected && isChoiceNode,
                    choiceIndex: sel?.choiceIndex,
                  };
                })
              : [];

          const next = encodeTalentLoadout({
            version: decoded.version,
            specId: decoded.specId,
            treeHash: decoded.treeHash,
            nodes,
          });

          if (next !== talents) {
            treeDrivenTalentsRef.current = next;
            setTalents(next);
          }
        }}
        height={Math.max(700, window.innerHeight - 256)}
      />
    );
  } else {
    content = (
      <Skeleton className="h-[calc(100vh-16rem)] min-h-[700px] w-full" />
    );
  }

  const showTalentInput = talents || decoded;

  return (
    <div className="flex w-full flex-col gap-4">
      {showTalentInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste a talent string..."
            value={talents}
            onChange={(e) => {
              treeDrivenTalentsRef.current = null;
              setTalents(e.target.value.trim() || null);
            }}
            className="flex-1 font-mono text-sm"
          />
          {talents && <CopyButton value={talents} />}
        </div>
      )}
      {content}
    </div>
  );
}

export function TalentCalculatorContent() {
  return (
    <Suspense fallback={<TalentCalculatorSkeleton />}>
      <TalentCalculatorInner />
    </Suspense>
  );
}
