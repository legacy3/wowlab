"use client";

import { useCreate, useOne, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { RotationsRow } from "@/components/editor/types";

import { routes } from "@/lib/routes";

import { useEditor } from "./editor";

export function useLoadRotation(id: string | null) {
  const load = useEditor((s) => s.load);

  const {
    query: { error, isError, isLoading },
    result: rotation,
  } = useOne<RotationsRow>({
    id: id ?? "",
    queryOptions: {
      enabled: !!id,
    },
    resource: "rotations",
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
    rotation,
  };
}

export function useSaveRotation() {
  const router = useRouter();

  const rotationId = useEditor((s) => s.rotationId);
  const name = useEditor((s) => s.name);
  const slug = useEditor((s) => s.slug);
  const description = useEditor((s) => s.description);
  const isPublic = useEditor((s) => s.isPublic);
  const specId = useEditor((s) => s.specId);
  const serialize = useEditor((s) => s.serialize);
  const markClean = useEditor((s) => s.markClean);

  const isNew = !rotationId;

  const { mutateAsync: createRotation, mutation: createMutation } =
    useCreate<RotationsRow>();

  const { mutateAsync: updateRotation, mutation: updateMutation } =
    useUpdate<RotationsRow>();

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  const save = useCallback(async () => {
    // Prevent concurrent saves
    if (isCreating || isUpdating) {
      return;
    }

    const script = JSON.stringify(serialize());

    const rotationSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (isNew) {
      const result = await createRotation({
        resource: "rotations",
        values: {
          currentVersion: 1,
          description: description || null,
          forkedFromId: null,
          isPublic,
          name: name || "Untitled Rotation",
          script,
          slug: rotationSlug,
          specId: specId ?? 0,
        },
      });

      // Only mark clean after successful save
      if (result?.data?.id) {
        markClean();
        router.push(routes.rotations.editor.edit(result.data.id));
      }

      return result;
    } else {
      const result = await updateRotation({
        id: rotationId as string,
        resource: "rotations",
        values: {
          description: description || null,
          isPublic,
          name,
          script,
          slug: rotationSlug,
          specId: specId ?? 0,
        },
      });

      // Only mark clean after successful update
      if (result?.data) {
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
    createRotation,
    updateRotation,
    router,
  ]);

  return {
    isLoading: isCreating || isUpdating,
    isNew,
    save,
  };
}
