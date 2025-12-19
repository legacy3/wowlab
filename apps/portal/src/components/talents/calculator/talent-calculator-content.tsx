"use client";

import { Suspense, useMemo, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { useQueryState, parseAsString } from "nuqs";
import dynamic from "next/dynamic";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentTree } from "@/hooks/use-talent-tree";
import type { Talent } from "@wowlab/core/Schemas";
import { TalentCalculatorSkeleton } from "./talent-calculator-skeleton";
import { TalentStartScreen } from "./talent-start-screen";
import { TalentStateMessage } from "./talent-state-message";
import { TalentStringBar } from "./talent-string-bar";
import {
  createHeaderOnlyTalentString,
  deriveInitialSelectionsFromDecoded,
  encodeSelectionsToTalentString,
} from "./talent-encoding";

function TalentTreeLoading() {
  return (
    <div className="relative h-[700px] w-full rounded-lg border bg-background/50 overflow-hidden">
      {/* Skeleton background */}
      <Skeleton className="absolute inset-0 rounded-lg" />

      {/* Spinner overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span className="text-sm">Loading talent tree ...</span>
        </div>
      </div>
    </div>
  );
}

const TalentTree = dynamic(
  () =>
    import("@/components/talents/talent-tree").then((mod) => mod.TalentTree),
  { ssr: false, loading: TalentTreeLoading },
);

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
    return deriveInitialSelectionsFromDecoded(tree, decoded);
  }, [decoded, tree]);

  const handleSpecSelect = useCallback(
    (specId: number) => {
      treeDrivenTalentsRef.current = null;
      setTalents(createHeaderOnlyTalentString(specId));
    },
    [setTalents],
  );

  const handleTalentStringChange = useCallback(
    (next: string | null) => {
      treeDrivenTalentsRef.current = null;
      setTalents(next);
    },
    [setTalents],
  );

  let content: ReactNode;

  if (!talents) {
    content = (
      <TalentStartScreen
        talents={talents}
        onTalentStringChange={handleTalentStringChange}
        onSpecSelect={handleSpecSelect}
      />
    );
  } else if (talents && !decoded) {
    content = (
      <TalentStateMessage title="Unable to decode the provided talent string" />
    );
  } else if (isLoading) {
    content = <TalentTreeLoading />;
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
          const next = encodeSelectionsToTalentString({
            tree,
            decoded,
            selections,
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
    content = <TalentTreeLoading />;
  }

  const showTalentInput = talents || decoded;

  return (
    <div className="flex w-full flex-col gap-4">
      {showTalentInput && (
        <TalentStringBar
          talents={talents}
          specId={effectiveSpecId}
          onTalentStringChange={handleTalentStringChange}
        />
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
