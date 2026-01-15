"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { RotationsRow } from "@/lib/engine";

import { href, routes } from "@/lib/routing";
import { createClient } from "@/lib/supabase";

import { useEditor } from "./editor";
import { useUser } from "./user";

export function useLoadRotation(id: string | null) {
  const supabase = createClient();
  const load = useEditor((s) => s.load);

  const {
    data: rotation,
    error,
    isError,
    isLoading,
  } = useQuery({
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rotations")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as RotationsRow;
    },
    queryKey: ["rotations", id],
  });

  return {
    error,
    isError,
    isLoading,
    loadIntoEditor: useCallback(() => {
      if (rotation) {
        load(rotation);
      }
    }, [rotation, load]),
    rotation: rotation ?? null,
  };
}

export function useSaveRotation() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user } = useUser();

  const rotationId = useEditor((s) => s.rotationId);
  const name = useEditor((s) => s.name);
  const slug = useEditor((s) => s.slug);
  const description = useEditor((s) => s.description);
  const isPublic = useEditor((s) => s.isPublic);
  const specId = useEditor((s) => s.specId);
  const serialize = useEditor((s) => s.serialize);
  const markClean = useEditor((s) => s.markClean);

  const isNew = !rotationId;

  const createMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      slug: string;
      script: string;
      spec_id: number;
      is_public: boolean;
      description: string | null;
      user_id: string;
    }) => {
      const { data, error } = await supabase
        .from("rotations")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data as RotationsRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...values
    }: {
      id: string;
      name: string;
      slug: string;
      script: string;
      spec_id: number;
      is_public: boolean;
      description: string | null;
    }) => {
      const { data, error } = await supabase
        .from("rotations")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as RotationsRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
      queryClient.setQueryData(["rotations", data.id], data);
    },
  });

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  const save = useCallback(async () => {
    if (isCreating || isUpdating) {
      return;
    }

    if (!user?.id) {
      throw new Error("Must be logged in to save");
    }

    const script = JSON.stringify(serialize());

    const rotationSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (isNew) {
      const result = await createMutation.mutateAsync({
        description: description || null,
        is_public: isPublic,
        name: name || "Untitled Rotation",
        script,
        slug: rotationSlug,
        spec_id: specId ?? 0,
        user_id: user.id,
      });

      if (result?.id) {
        markClean();
        router.push(href(routes.rotations.editor.edit, { id: result.id }));
      }

      return result;
    } else {
      const result = await updateMutation.mutateAsync({
        description: description || null,
        id: rotationId as string,
        is_public: isPublic,
        name,
        script,
        slug: rotationSlug,
        spec_id: specId ?? 0,
      });

      if (result) {
        markClean();
      }
      return result;
    }
  }, [
    isNew,
    isCreating,
    isUpdating,
    rotationId,
    name,
    slug,
    description,
    specId,
    isPublic,
    serialize,
    markClean,
    createMutation,
    updateMutation,
    router,
    user,
  ]);

  return {
    isLoading: isCreating || isUpdating,
    isNew,
    save,
  };
}
