"use client";

import {
  useGetIdentity,
  useInvalidate,
  useLogin,
  useLogout,
} from "@refinedev/core";
import { useCallback, useEffect } from "react";

import { routes } from "@/lib/routing";
import { createClient } from "@/lib/supabase";

export type OAuthProvider = "discord" | "github" | "google" | "twitch";

export interface User {
  avatar: string | null;
  email: string | null;
  handle: string | null;
  id: string;
  identities: string[];
  initials: string;
}

export interface UserState {
  data: User | null;
  deleteAccount: () => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  linkIdentity: (provider: OAuthProvider) => Promise<void>;
  login: (provider: OAuthProvider, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useUser(): UserState {
  const supabase = createClient();
  const invalidate = useInvalidate();

  const { data, error, isLoading } = useGetIdentity<User>();

  const { mutateAsync: refineLogin } = useLogin<{
    provider: OAuthProvider;
    redirectTo?: string;
  }>();
  const { mutateAsync: refineLogout } = useLogout();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      invalidate({ invalidates: ["all"] });
    });

    return () => subscription.unsubscribe();
  }, [supabase, invalidate]);

  const login = useCallback(
    async (provider: OAuthProvider, redirectTo?: string): Promise<void> => {
      await refineLogin({ provider, redirectTo });
    },
    [refineLogin],
  );

  const linkIdentity = useCallback(
    async (provider: OAuthProvider) => {
      const { error } = await supabase.auth.linkIdentity({
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${routes.account.settings.path}`,
        },
        provider,
      });

      if (error) {
        throw error;
      }
    },
    [supabase],
  );

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      throw error;
    }

    await refineLogout();
  }, [supabase, refineLogout]);

  const logout = useCallback(async () => {
    await refineLogout();
  }, [refineLogout]);

  return {
    data: data ?? null,
    deleteAccount,
    error: error instanceof Error ? error : null,
    isLoading,
    linkIdentity,
    login,
    logout,
  };
}
