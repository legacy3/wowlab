"use client";

import { useGetIdentity, useLogin, useLogout } from "@refinedev/core";
import { useMemo } from "react";

import type { OAuthProvider } from "@/lib/refine";
import type { UserIdentity } from "@/lib/supabase";

import type { StateResult } from "./types";

export interface User extends UserIdentity {
  initials: string;
}

export interface UserState extends StateResult<User> {
  login: (provider: OAuthProvider, redirectTo?: string) => void;
  logout: () => void;
}

export function useUser(): UserState {
  const { data, error, isLoading } = useGetIdentity<UserIdentity>();
  const { mutate: loginMutation } = useLogin<{
    provider: OAuthProvider;
    redirectTo?: string;
  }>();
  const { mutate: logoutMutation } = useLogout();

  const user = useMemo(() => {
    if (!data) {
      return null;
    }

    return {
      ...data,
      initials: data.handle ? data.handle.slice(0, 2).toUpperCase() : "?",
    };
  }, [data]);

  return {
    data: user,
    error: error instanceof Error ? error : null,
    isLoading,

    login: (provider, redirectTo) => loginMutation({ provider, redirectTo }),
    logout: () => logoutMutation(),
    set: () => {
      throw new Error("User state is read-only");
    },
  };
}
