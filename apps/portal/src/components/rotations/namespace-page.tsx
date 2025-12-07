"use client";

import { useList, useGetIdentity } from "@refinedev/core";
import Link from "next/link";
import { ProfileHeader } from "@/components/rotations/profile-header";
import { RotationsList } from "@/components/rotations/rotations-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode } from "lucide-react";
import type { Rotation, Profile, UserIdentity } from "@/lib/supabase/types";

interface NamespacePageProps {
  namespace: string;
}

function NamespacePageSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>

      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NamespacePage({ namespace }: NamespacePageProps) {
  const { data: identity } = useGetIdentity<UserIdentity>();

  const {
    result: profileResult,
    query: { isLoading: profileLoading },
  } = useList<Profile>({
    resource: "user_profiles",
    filters: [{ field: "handle", operator: "eq", value: namespace }],
    pagination: { pageSize: 1 },
  });

  const user = profileResult?.data?.[0];

  const {
    result: rotationsResult,
    query: { isLoading: rotationsLoading },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: namespace },
      { field: "deletedAt", operator: "null", value: true },
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    queryOptions: {
      enabled: !!namespace,
    },
  });

  const rotations = rotationsResult?.data ?? [];
  const isOwnProfile = identity?.handle === namespace;

  if (profileLoading || rotationsLoading) {
    return <NamespacePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {user && (
        <ProfileHeader user={user} rotationCount={rotations?.length ?? 0} />
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            Rotations {rotations?.length ? `(${rotations.length})` : ""}
          </h2>
        </div>

        {rotations && rotations.length > 0 ? (
          <RotationsList rotations={rotations} groupByClass={false} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileCode className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold mb-2">No rotations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                {isOwnProfile
                  ? "Create your first rotation to get started"
                  : `No rotations found for @${namespace}`}
              </p>
              {isOwnProfile && (
                <Link
                  href="/rotations/editor"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create Rotation
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
