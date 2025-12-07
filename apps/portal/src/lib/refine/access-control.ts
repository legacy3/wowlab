import type { AccessControlProvider } from "@refinedev/core";
import { createClient } from "@/lib/supabase/client";

export function createAccessControlProvider(): AccessControlProvider {
  const supabase = createClient();

  return {
    can: async ({ resource, action, params }) => {
      // Read actions are always allowed (RLS handles visibility)
      if (action === "list" || action === "show") {
        return { can: true };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { can: false, reason: "Not authenticated" };
      }

      // Owner check for rotation mutations
      if (resource === "rotations" && params?.id) {
        const { data } = await supabase
          .from("rotations")
          .select("userId") // camelCase!
          .eq("id", String(params.id))
          .single();

        if (data?.userId !== user.id) {
          return { can: false, reason: "Not owner" };
        }
      }

      // Owner check for user_settings mutations
      if (resource === "user_settings" && params?.id) {
        if (params.id !== user.id) {
          return { can: false, reason: "Not owner" };
        }
      }

      return { can: true };
    },
  };
}
