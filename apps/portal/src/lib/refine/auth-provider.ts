import type { AuthProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-config";

export type OAuthProvider = "discord" | "github" | "google" | "twitch";

export function createAuthProvider(): AuthProvider {
  const supabase = createClient();

  return {
    login: async ({ provider }: { provider: OAuthProvider }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getAuthCallbackUrl() },
      });

      if (error) {
        return { success: false, error };
      }

      // OAuth redirects, so we return the URL
      if (data.url) {
        window.location.href = data.url;
      }

      return { success: true };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error };
      }

      return { success: true, redirectTo: "/" };
    },

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
        id: user.id,
        email: user.email,
        handle: profile?.handle,
        avatarUrl: profile?.avatarUrl,
      };
    },

    onError: async (error) => {
      if (error.status === 401 || error.status === 403) {
        return { logout: true };
      }

      return { error };
    },
  };
}
