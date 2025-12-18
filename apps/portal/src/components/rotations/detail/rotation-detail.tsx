"use client";

import { Suspense } from "react";
import { useOne, useList, useGetIdentity } from "@refinedev/core";
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { UrlTabs } from "@/components/ui/url-tabs";
import type { Rotation, Profile, UserIdentity } from "@/lib/supabase/types";

import { RotationHeader, RotationHeaderSkeleton } from "./rotation-header";
import { SourceTab } from "./tabs/source-tab";
import { VisualizeTab } from "./tabs/visualize-tab";
import { MetaTab } from "./tabs/meta-tab";

interface RotationDetailProps {
  rotationId: string;
}

function RotationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <RotationHeaderSkeleton />
      <TabsSkeleton tabCount={4} className="w-full max-w-md" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function RotationDetailInner({ rotationId }: RotationDetailProps) {
  const { data: identity } = useGetIdentity<UserIdentity>();

  const {
    result: rotation,
    query: { isLoading: rotationLoading, isError: rotationError },
  } = useOne<Rotation>({
    resource: "rotations",
    id: rotationId,
  });

  const {
    result: author,
    query: { isLoading: profileLoading },
  } = useOne<Profile>({
    resource: "user_profiles",
    id: rotation?.userId ?? "",
    queryOptions: {
      enabled: !!rotation?.userId,
    },
  });

  const { result: parent } = useOne<Rotation>({
    resource: "rotations",
    id: rotation?.forkedFromId ?? "",
    queryOptions: {
      enabled: !!rotation?.forkedFromId,
    },
  });

  const { result: forksResult } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "forkedFromId", operator: "eq", value: rotation?.id },
      { field: "isPublic", operator: "eq", value: true },
    ],
    sorters: [{ field: "createdAt", order: "desc" }],
    queryOptions: {
      enabled: !!rotation?.id,
    },
  });

  const forks = forksResult?.data ?? [];
  const isOwner = identity?.id === rotation?.userId;

  if (rotationLoading || profileLoading) {
    return <RotationDetailSkeleton />;
  }

  if (rotationError || !rotation) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Rotation not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RotationHeader
        rotation={rotation}
        author={author ?? undefined}
        isOwner={isOwner}
      />

      <UrlTabs
        defaultTab="source"
        tabs={[
          {
            value: "source",
            label: "Source",
            content: <SourceTab rotation={rotation} />,
          },
          {
            value: "visualize",
            label: "Visualize",
            content: <VisualizeTab rotation={rotation} />,
          },
          {
            value: "meta",
            label: "Meta",
            content: (
              <MetaTab
                rotation={rotation}
                parent={parent ?? undefined}
                forks={forks}
              />
            ),
          },
        ]}
        listClassName="w-full max-w-sm"
      />
    </div>
  );
}

export function RotationDetail({ rotationId }: RotationDetailProps) {
  return (
    <Suspense fallback={<RotationDetailSkeleton />}>
      <RotationDetailInner rotationId={rotationId} />
    </Suspense>
  );
}
