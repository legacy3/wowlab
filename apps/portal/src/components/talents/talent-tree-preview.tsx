"use client";

import { useMemo } from "react";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Maximize2, X } from "lucide-react";
import { useWindowSize } from "@react-hookz/web";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentTreeWithSelections } from "@/hooks/use-talent-tree";
import { useZenMode } from "@/hooks/use-zen-mode";
import { TalentTree } from "./talent-tree";

interface TalentTreePreviewProps {
  encodedTalents: string;
  className?: string;
}

// Fixed dimensions for card view
const CARD_WIDTH = 600;
const CARD_HEIGHT = 700;

function TalentTreePreviewSkeleton() {
  return <Skeleton className="h-[600px] w-full" />;
}

export function TalentTreePreview({
  encodedTalents,
  className,
}: TalentTreePreviewProps) {
  const { isZen, enterZen, exitZen } = useZenMode();

  // Only track window size in zen mode to avoid unnecessary re-renders
  const windowSize = useWindowSize();

  const decoded = useMemo((): DecodedTalentLoadout | null => {
    const effect = decodeTalentLoadout(encodedTalents);
    const result = Effect.runSync(Effect.either(effect));
    return result._tag === "Right" ? result.right : null;
  }, [encodedTalents]);

  const {
    data: treeWithSelections,
    isLoading,
    error,
  } = useTalentTreeWithSelections(decoded?.specId ?? null, decoded);

  // Compute dimensions - only use windowSize when in zen mode
  const width = isZen
    ? Math.max(400, Math.min(windowSize.width - 80, 1200))
    : CARD_WIDTH;
  const height = isZen
    ? Math.max(300, Math.min(windowSize.height - 120, 900))
    : CARD_HEIGHT;

  // Error/loading states
  if (!decoded) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Unable to decode talent string
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Talents</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentTreePreviewSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error || !treeWithSelections) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Failed to load talent tree
          </div>
        </CardContent>
      </Card>
    );
  }

  // Zen mode: fullscreen overlay
  if (isZen) {
    return (
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
        <TalentTree tree={treeWithSelections} width={width} height={height} />
      </div>
    );
  }

  // Normal mode: card view
  return (
    <Card className={className}>
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
        <TalentTree tree={treeWithSelections} width={width} height={height} />
      </CardContent>
    </Card>
  );
}
