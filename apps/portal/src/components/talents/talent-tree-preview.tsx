"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Maximize2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentTree } from "@/hooks/use-talent-tree";
import { useZenMode } from "@/hooks/use-zen-mode";
import { applyDecodedTalents } from "@wowlab/services/Data";
import { TalentTree } from "./talent-tree";

function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 900 });

  // TODO I think we have a hook for that
  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

interface TalentTreePreviewProps {
  encodedTalents: string;
  className?: string;
}

function TalentTreePreviewInner({
  encodedTalents,
  isZen,
}: TalentTreePreviewProps & { isZen?: boolean }) {
  const windowSize = useWindowSize();

  const decoded = useMemo((): DecodedTalentLoadout | null => {
    const effect = decodeTalentLoadout(encodedTalents);
    const result = Effect.runSync(Effect.either(effect));

    return result._tag === "Right" ? result.right : null;
  }, [encodedTalents]);

  const {
    data: tree,
    isLoading,
    error,
  } = useTalentTree(decoded?.specId ?? null);

  if (!decoded) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to decode talent string
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (error || !tree) {
    return (
      <div className="text-sm text-muted-foreground">
        Failed to load talent tree
      </div>
    );
  }

  const treeWithSelections = applyDecodedTalents(tree, decoded);

  // Use larger dimensions in zen mode
  const width = isZen ? Math.min(windowSize.width - 80, 1200) : 600;
  const height = isZen ? Math.min(windowSize.height - 120, 900) : 700;

  return <TalentTree tree={treeWithSelections} width={width} height={height} />;
}

function TalentTreePreviewSkeleton() {
  return <Skeleton className="h-[600px] w-full" />;
}

export function TalentTreePreview(props: TalentTreePreviewProps) {
  const { isZen, enterZen, exitZen } = useZenMode();

  return (
    <>
      <Card className={props.className}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Talents</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={enterZen}
            title="Enter zen mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<TalentTreePreviewSkeleton />}>
            <TalentTreePreviewInner {...props} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Zen mode overlay */}
      {isZen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8"
            onClick={exitZen}
            title="Exit zen mode (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
          <Suspense fallback={<TalentTreePreviewSkeleton />}>
            <TalentTreePreviewInner {...props} isZen />
          </Suspense>
        </div>
      )}
    </>
  );
}
