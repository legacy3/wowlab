"use client";

import { Suspense, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import dynamic from "next/dynamic";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { SpecPicker } from "@/components/ui/spec-picker";
import { useTalentTreeWithSelections } from "@/hooks/use-talent-tree";

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
    <div className="flex h-[700px] w-full items-center justify-center text-center text-muted-foreground">
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

  const [manualSpecId, setManualSpecId] = useQueryState(
    "spec",
    parseAsInteger.withOptions({
      shallow: true,
      history: "push",
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
  const effectiveSpecId = decoded?.specId ?? manualSpecId ?? null;

  const {
    data: treeWithSelections,
    isLoading,
    error,
  } = useTalentTreeWithSelections(effectiveSpecId, decoded);

  const handleSpecSelect = useCallback(
    (specId: number) => {
      setManualSpecId(specId);
    },
    [setManualSpecId],
  );

  let content: ReactNode;

  if (!talents && !manualSpecId) {
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
              onChange={(e) => setTalents(e.target.value.trim() || null)}
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
  } else if (!decoded && !manualSpecId) {
    content = (
      <TalentStateMessage
        title="Paste a talent string to get started"
        description="You can also share builds with the ?talents= query parameter."
      />
    );
  } else if (talents && !decoded) {
    content = (
      <TalentStateMessage title="Unable to decode the provided talent string" />
    );
  } else if (isLoading) {
    content = <Skeleton className="h-[700px] w-full" />;
  } else if (error) {
    content = <TalentStateMessage title="Failed to load the talent tree" />;
  } else if (treeWithSelections) {
    content = <TalentTree tree={treeWithSelections} height={700} />;
  } else {
    content = <Skeleton className="h-[700px] w-full" />;
  }

  const showTalentInput = talents || manualSpecId || decoded;

  return (
    <div className="flex w-full flex-col gap-4">
      {showTalentInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste a talent string..."
            value={talents}
            onChange={(e) => setTalents(e.target.value.trim() || null)}
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
