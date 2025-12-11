"use client";

import { Suspense, useMemo } from "react";
import {
  decodeTalentLoadout,
  type DecodedTalentLoadout,
} from "@wowlab/parsers";
import * as Effect from "effect/Effect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentTree } from "@/hooks/use-talent-tree";
import { applyDecodedTalents } from "@wowlab/services/Data";
import { TalentTree } from "./talent-tree";

interface TalentTreePreviewProps {
  encodedTalents: string;
  className?: string;
}

function TalentTreePreviewInner({ encodedTalents }: TalentTreePreviewProps) {
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
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error || !tree) {
    return (
      <div className="text-sm text-muted-foreground">
        Failed to load talent tree
      </div>
    );
  }

  const treeWithSelections = applyDecodedTalents(tree, decoded);

  return <TalentTree tree={treeWithSelections} width={400} height={500} />;
}

function TalentTreePreviewSkeleton() {
  return <Skeleton className="h-[400px] w-full" />;
}

export function TalentTreePreview(props: TalentTreePreviewProps) {
  return (
    <Card className={props.className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Talents</CardTitle>
      </CardHeader>

      <CardContent>
        <Suspense fallback={<TalentTreePreviewSkeleton />}>
          <TalentTreePreviewInner {...props} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
