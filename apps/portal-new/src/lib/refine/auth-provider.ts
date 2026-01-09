import type { AuthProvider } from "@refinedev/core";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "discord" | "github" | "google" | "twitch";

export function createAuthProvider(): AuthProvider {
  const supabase = createClient();

  return {
    check: async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return { authenticated: true };
      }

      return { authenticated: false, redirectTo: "/" };
    },

    getIdentity: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("handle, avatarUrl")
        .eq("id", user.id)
        .single();

      return {
        avatarUrl: profile?.avatarUrl,
        email: user.email,
        handle: profile?.handle,
        id: user.id,
      };
    },

    login: async ({
      provider,
      redirectTo,
    }: {
      provider: OAuthProvider;
      redirectTo?: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        options: { redirectTo: buildCallbackUrl(redirectTo) },
        provider,
      });

      if (error) {
        return { error, success: false };
      }

      if (data.url) {
        window.location.href = data.url;
      }

      return { success: true };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error, success: false };
      }

      return { redirectTo: "/", success: true };
    },

    onError: async (error) => {
      if (error.status === 401 || error.status === 403) {
        return { logout: true };
      }

      return { error };
    },
  };
}

function buildCallbackUrl(redirectTo?: string): string {
  const url = new URL("/auth/callback", env.APP_URL);

  if (redirectTo) {
    url.searchParams.set("next", redirectTo);
  }

  return url.toString();
}
