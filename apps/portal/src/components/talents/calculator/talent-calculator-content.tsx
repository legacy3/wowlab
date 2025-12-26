"use client";

import { Suspense, useEffect, useState } from "react";
import { useTimeoutEffect } from "@react-hookz/web";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskLoader } from "@/components/ui/flask-loader";
import { TalentCalculatorSkeleton } from "./talent-calculator-skeleton";
import { TalentStartScreen } from "./talent-start-screen";
import { TalentStateMessage } from "./talent-state-message";
import { TalentStringBar } from "./talent-string-bar";
import { TalentsImportTour } from "@/components/tours";
import { useTalentCalculatorController } from "./controller";

function TalentTreeLoading() {
  return (
    <div className="relative h-[700px] w-full rounded-lg border bg-background/50 overflow-hidden">
      {/* Skeleton background */}
      <Skeleton className="absolute inset-0 rounded-lg" />

      {/* Spinner overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <FlaskLoader size="md" />
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
  const {
    talents,
    decoded,
    effectiveSpecId,
    tree,
    isLoading,
    error,
    initialSelections,
    initialSelectionsKey,
    onSpecSelect,
    onTalentStringChange,
    onSelectionsChange,
  } = useTalentCalculatorController();
  const [showDecodeError, setShowDecodeError] = useState(false);

  const shouldShowDecodeError = Boolean(talents && !decoded);
  const [, resetDecodeTimer] = useTimeoutEffect(
    () => {
      setShowDecodeError(shouldShowDecodeError);
    },
    shouldShowDecodeError ? 500 : 0,
  );

  useEffect(() => {
    resetDecodeTimer();
  }, [decoded, resetDecodeTimer, talents]);

  let content: ReactNode;

  if (!talents) {
    content = (
      <TalentStartScreen
        talents={talents}
        onTalentStringChange={onTalentStringChange}
        onSpecSelect={onSpecSelect}
      />
    );
  } else if (talents && !decoded && showDecodeError) {
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
        onSelectionsChange={onSelectionsChange}
        height={Math.max(700, window.innerHeight - 256)}
      />
    );
  } else {
    content = <TalentTreeLoading />;
  }

  const showTalentInput = talents || decoded;
  const isStartScreen = !talents;

  return (
    <div className="flex w-full flex-col gap-4">
      {showTalentInput && (
        <TalentStringBar
          talents={talents}
          specId={effectiveSpecId}
          onTalentStringChange={onTalentStringChange}
        />
      )}
      {content}
      <TalentsImportTour isStartScreen={isStartScreen} />
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
