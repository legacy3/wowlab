import type { SupabaseClient } from "@supabase/supabase-js";
import { json } from "./response.ts";

type AuthResult = { error: Response } | { user: { id: string } };

export async function validateUser(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthResult> {
  const header = req.headers.get("Authorization");
  if (!header) {
    return { error: json({ error: "Unauthorized" }, 401) };
  }
  const token = header.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: json({ error: "Invalid token" }, 401) };
  }
  return { user: { id: data.user.id } };
}
