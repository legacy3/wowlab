"use client";

import { redirect } from "next/navigation";
import { useGetIdentity, useIsAuthenticated, useList } from "@refinedev/core";
import { AccountTabs } from "@/components/account/account-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import type { UserIdentity, Rotation } from "@/lib/supabase/types";

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-48 mt-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<UserIdentity>();

  const {
    result: rotationsResult,
    query: { isLoading: rotationsLoading },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [{ field: "userId", operator: "eq", value: identity?.id }],
    sorters: [{ field: "updatedAt", order: "desc" }],
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  if (authLoading || identityLoading || rotationsLoading) {
    return <AccountSkeleton />;
  }

  if (!auth?.authenticated || !identity) {
    redirect("/auth/sign-in");
  }

  const rotations = rotationsResult?.data ?? [];

  return <AccountTabs user={identity} rotations={rotations} />;
}
