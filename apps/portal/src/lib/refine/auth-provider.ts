import type { AuthProvider } from "@refinedev/core";

import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "discord" | "github" | "google" | "twitch";

export const authProvider: AuthProvider = {
  check: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return { authenticated: true };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/auth/sign-in",
    };
  },

  getIdentity: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

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
      avatar: profile?.avatar_url ?? null,
      email: user.email ?? null,
      handle,
      id: user.id,
      identities,
      initials: handle ? handle.slice(0, 2).toUpperCase() : "?",
      name: handle ?? user.email ?? "User",
    };
  },

  getPermissions: async () => null,

  login: async ({ provider, redirectTo }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
      },
      provider,
    });

    if (error) {
      return { error, success: false };
    }

    return { success: true };
  },

  logout: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error, success: false };
    }

    return { redirectTo: "/", success: true };
  },

  onError: async (error) => {
    return { error };
  },

  register: async () => {
    throw new Error("Not implemented - use OAuth");
  },
};
