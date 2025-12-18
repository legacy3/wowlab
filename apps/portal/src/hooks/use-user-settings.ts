"use client";

import { useOne, useUpdate, useGetIdentity } from "@refinedev/core";
import type { Database } from "@/lib/supabase/database.types";

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

export type UserSettingsUpdate = Omit<
  Database["public"]["Tables"]["user_settings"]["Update"],
  "id" | "createdAt" | "updatedAt"
>;

interface UserIdentity {
  id: string;
}

export function useUserSettings() {
  const { data: identity } = useGetIdentity<UserIdentity>();

  const {
    result: settings,
    query: { isLoading, isError, refetch },
  } = useOne<UserSettings>({
    resource: "user_settings",
    id: identity?.id ?? "",
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  const { mutate, mutation } = useUpdate<UserSettings>();
  const isUpdating = mutation.isPending;

  const updateSettings = (values: UserSettingsUpdate) => {
    if (!identity?.id) {
      return;
    }

    mutate({
      resource: "user_settings",
      id: identity.id,
      values,
    });
  };

  return {
    settings,
    isLoading,
    isError,
    isUpdating,
    updateSettings,
    refetch,
  };
}
