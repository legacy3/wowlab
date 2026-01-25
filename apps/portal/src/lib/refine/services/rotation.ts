"use client";

import { useCreate, useUpdate } from "@refinedev/core";
import { useCallback } from "react";

import type { RotationsRow } from "@/lib/engine";

import { href, routes, useLocalizedRouter } from "@/lib/routing";

import { useEditor } from "../../state/editor";
import { useResource } from "../hooks/use-resource";
import { rotations } from "../resources";
import { useUser } from "./user";

export function useLoadRotation(id: string | null) {
  const load = useEditor((s) => s.load);

  const {
    data: rotation,
    error,
    isError,
    isLoading,
  } = useResource<RotationsRow>({
    ...rotations,
    id: id ?? "",
    queryOptions: { enabled: !!id },
  });

  return {
    error: error as Error | null,
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
  const router = useLocalizedRouter();
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

  const createMutation = useCreate<RotationsRow>();
  const isCreating = createMutation.mutation.isPending;
  const updateMutation = useUpdate<RotationsRow>();
  const isUpdating = updateMutation.mutation.isPending;

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
        resource: "rotations",
        values: {
          description: description || null,
          is_public: isPublic,
          name: name || "Untitled Rotation",
          script,
          slug: rotationSlug,
          spec_id: specId ?? 0,
          user_id: user.id,
        },
      });

      if (result?.data?.id) {
        markClean();
        router.push(href(routes.rotations.editor.edit, { id: result.data.id }));
      }

      return result?.data;
    } else {
      const result = await updateMutation.mutateAsync({
        id: rotationId as string,
        resource: "rotations",
        values: {
          description: description || null,
          is_public: isPublic,
          name,
          script,
          slug: rotationSlug,
          spec_id: specId ?? 0,
        },
      });

      if (result?.data) {
        markClean();
      }
      return result?.data;
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
