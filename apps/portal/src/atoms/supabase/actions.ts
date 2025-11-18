import { atom } from "jotai";
import { supabaseClientAtom } from "./client";
import { sessionAtom } from "./auth";

export const signInWithOAuthAtom = atom(
  null,
  async (
    get,
    set,
    {
      provider,
      redirectTo,
    }: {
      provider: "discord" | "github";
      redirectTo: string;
    },
  ) => {
    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    return { data, error };
  },
);

export const signOutAtom = atom(null, async (get, set) => {
  const supabase = get(supabaseClientAtom);
  const { error } = await supabase.auth.signOut();

  if (!error) {
    set(sessionAtom);
  }

  return { error };
});
