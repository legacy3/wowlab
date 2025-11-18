import { atom } from "jotai";
import { atomFamily, atomWithRefresh } from "jotai/utils";
import { supabaseClientAtom } from "./client";
import { currentUserAtom } from "./auth";
import type { Profile } from "@/lib/supabase/types";

export const currentProfileAtom = atomWithRefresh(async (get) => {
  const user = await get(currentUserAtom);
  if (!user) {
    return null;
  }

  const supabase = get(supabaseClientAtom);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
});

export const profileByIdAtomFamily = atomFamily((userId: string) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  }),
);

export const canChangeHandleAtom = atom(async (get) => {
  const profile = await get(currentProfileAtom);
  if (!profile) {
    return false;
  }

  // Can change if handle starts with "user-" (default generated handle)
  return profile.handle.startsWith("user-");
});

export const profileSettingsAtom = atom(
  async (get) => {
    const profile = await get(currentProfileAtom);
    return profile;
  },

  async (get, set, updates: Partial<Profile>) => {
    const user = await get(currentUserAtom);
    if (!user) {
      throw new Error("No authenticated user");
    }

    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }

    return data;
  },
);

export const checkReservedHandleAtom = atom(
  null,
  async (get, set, handle: string): Promise<boolean> => {
    const supabase = get(supabaseClientAtom);
    const { data } = await supabase
      .from("reserved_handles")
      .select("handle")
      .eq("handle", handle)
      .maybeSingle();

    return !!data;
  },
);

export const checkHandleAvailabilityAtom = atom(
  null,
  async (get, set, handle: string): Promise<boolean> => {
    const supabase = get(supabaseClientAtom);
    const { data } = await supabase
      .from("profiles")
      .select("handle")
      .eq("handle", handle)
      .maybeSingle();

    return !!data;
  },
);
