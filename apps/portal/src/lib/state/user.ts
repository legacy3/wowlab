"use client";

import type { OAuthResponse } from "@supabase/supabase-js";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";

import { routes } from "@/lib/routing";
import { createClient } from "@/lib/supabase";

export type OAuthProvider = "discord" | "github" | "google" | "twitch";

export interface User {
  avatar_url: string | null;
  email: string | null;
  handle: string | null;
  id: string;
  identities: string[];
  initials: string;
}

export interface UserState {
  data: User | null;
  error: Error | null;
  isLoading: boolean;
  linkIdentity: (provider: OAuthProvider) => Promise<void>;
  login: (
    provider: OAuthProvider,
    redirectTo?: string,
  ) => Promise<OAuthResponse>;
  logout: () => Promise<void>;
}

export function useUser(): UserState {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery({
    queryFn: async (): Promise<User | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const [{ data: profile }, { data: identityData }] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("handle, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase.auth.getUserIdentities(),
      ]);

      const handle = profile?.handle ?? null;
      const identities = identityData?.identities.map((i) => i.provider) ?? [];

      return {
        avatar_url: profile?.avatar_url ?? null,
        email: user.email ?? null,
        handle,
        id: user.id,
        identities,
        initials: handle ? handle.slice(0, 2).toUpperCase() : "?",
      };
    },
    queryKey: ["auth", "user"],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    });
    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const login = useCallback(
    (provider: OAuthProvider, redirectTo?: string): Promise<OAuthResponse> => {
      return supabase.auth.signInWithOAuth({
        options: {
          redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
        },
        provider,
      });
    },
    [supabase],
  );

  const linkIdentity = useCallback(
    async (provider: OAuthProvider) => {
      const { error } = await supabase.auth.linkIdentity({
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${routes.account.settings.path}`,
        },
        provider,
      });
      if (error) throw error;
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [supabase, queryClient]);

  return {
    data: data ?? null,
    error: error instanceof Error ? error : null,
    isLoading,
    linkIdentity,
    login,
    logout,
  };
}
