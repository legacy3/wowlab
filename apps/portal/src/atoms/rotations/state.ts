import { atom } from "jotai";
import { atomFamily, atomWithRefresh } from "jotai/utils";
import { supabaseClientAtom } from "../supabase/client";
import { currentUserAtom } from "../supabase/auth";
import type {
  Profile,
  Rotation,
  RotationInsert,
  SimResult,
} from "@/lib/supabase/types";

// Load rotation by namespace/slug
export const rotationAtomFamily = atomFamily((slug: string) =>
  atom(async (get) => {
    const [namespace, rotationSlug] = slug.split("/");
    const supabase = get(supabaseClientAtom);

    const { data, error } = await supabase
      .from("rotations")
      .select("*")
      .eq("namespace", namespace)
      .eq("slug", rotationSlug)
      .single();

    if (error) {
      throw error;
    }
    return data as Rotation;
  }),
);

// Load profile by handle
export const profileByHandleAtomFamily = atomFamily((handle: string) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .single();

    if (error) {
      throw error;
    }
    return data as Profile;
  }),
);

// Rotations by namespace (supports both user handles and special namespaces like @meta)
export const rotationsByNamespaceAtomFamily = atomFamily((namespace: string) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);

    // Get rotations - RLS handles visibility
    const { data, error } = await supabase
      .from("rotations")
      .select("*")
      .eq("namespace", namespace)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as Rotation[];
  }),
);

// Current user's rotations
export const myRotationsAtom = atomWithRefresh(async (get) => {
  const user = await get(currentUserAtom);
  if (!user) {
    return [];
  }

  const supabase = get(supabaseClientAtom);
  const { data } = await supabase
    .from("rotations")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (data ?? []) as Rotation[];
});

// Save/create rotation
export const saveRotationAtom = atom(
  null,
  async (get, set, rotation: Omit<RotationInsert, "user_id" | "namespace">) => {
    const user = await get(currentUserAtom);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const supabase = get(supabaseClientAtom);

    // Get user handle for namespace (handle is always set during onboarding)
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single();

    if (!profile) {
      throw new Error(
        "Profile not found - handle must be set during onboarding",
      );
    }

    const namespace = profile.handle;

    const { data, error } = await supabase
      .from("rotations")
      .insert({
        ...rotation,
        user_id: user.id,
        namespace,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh user rotations
    set(myRotationsAtom);

    return data as Rotation;
  },
);

// Update rotation
export const updateRotationAtom = atom(
  null,
  async (
    get,
    set,
    { id, updates }: { id: string; updates: Partial<Rotation> },
  ) => {
    const supabase = get(supabaseClientAtom);

    const { data, error } = await supabase
      .from("rotations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Refresh user rotations
    set(myRotationsAtom);

    return data as Rotation;
  },
);

// Delete rotation (soft delete)
export const deleteRotationAtom = atom(null, async (get, set, id: string) => {
  const supabase = get(supabaseClientAtom);

  const { error } = await supabase
    .from("rotations")
    .update({ deletedAt: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }

  // Refresh user rotations
  set(myRotationsAtom);
});

// Browse public rotations
export const browseRotationsAtom = atomWithRefresh(async (get) => {
  const supabase = get(supabaseClientAtom);

  const { data } = await supabase
    .from("rotations")
    .select("*")
    .eq("status", "approved")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (data ?? []) as Rotation[];
});

// Search rotations by class/spec
export const searchRotationsAtomFamily = atomFamily(
  (params: { class?: string; spec?: string }) =>
    atom(async (get) => {
      const supabase = get(supabaseClientAtom);

      let query = supabase
        .from("rotations")
        .select("*")
        .eq("status", "approved")
        .eq("visibility", "public")
        .is("deleted_at", null);

      if (params.class) {
        query = query.eq("class", params.class);
      }

      if (params.spec) {
        query = query.eq("spec", params.spec);
      }

      const { data } = await query
        .order("updated_at", { ascending: false })
        .limit(50);

      return (data ?? []) as Rotation[];
    }),
);

// Sim results for a rotation
export const rotationSimResultsAtomFamily = atomFamily((rotationId: string) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);

    const { data, error } = await supabase
      .from("rotation_sim_results")
      .select("*")
      .eq("rotation_id", rotationId)
      .order("mean_dps", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as SimResult[];
  }),
);

// Parent rotation (if rotation is a fork)
export const parentRotationAtomFamily = atomFamily((parentId: string | null) =>
  atom(async (get) => {
    if (!parentId) {
      return null;
    }

    const supabase = get(supabaseClientAtom);
    const { data, error } = await supabase
      .from("rotations")
      .select("*")
      .eq("id", parentId)
      .single();

    if (error) {
      return null;
    }
    return data as Rotation;
  }),
);

// Fork rotations (children of this rotation)
export const forkRotationsAtomFamily = atomFamily((rotationId: string) =>
  atom(async (get) => {
    const supabase = get(supabaseClientAtom);

    const { data, error } = await supabase
      .from("rotations")
      .select("*")
      .eq("parent_id", rotationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return (data ?? []) as Rotation[];
  }),
);
