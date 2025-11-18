import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import { supabaseClientAtom } from "./client";

export const sessionAtom = atomWithRefresh(async (get) => {
  const supabase = get(supabaseClientAtom);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
});

export const currentUserAtom = atom(async (get) => {
  const session = await get(sessionAtom);

  return session?.user ?? null;
});
