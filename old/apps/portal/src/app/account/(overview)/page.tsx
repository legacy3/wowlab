"use client";

import { useGetIdentity, useList } from "@refinedev/core";
import { AccountOverview, AccountOverviewSkeleton } from "@/components/account";
import type { UserIdentity, Rotation } from "@/lib/supabase/types";

export default function AccountPage() {
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

  if (identityLoading || rotationsLoading || !identity) {
    return <AccountOverviewSkeleton />;
  }

  const rotations = rotationsResult?.data ?? [];

  return <AccountOverview user={identity} rotations={rotations} />;
}
