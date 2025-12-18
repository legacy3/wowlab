"use client";

import { useCreate, useUpdate, useDelete } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Rotation,
  RotationInsert,
  RotationUpdate,
} from "@/lib/supabase/types";

export function useRotationMutations() {
  const router = useRouter();

  const { mutateAsync: createMutation, mutation: createMutationState } =
    useCreate<Rotation>();
  const { mutateAsync: updateMutation, mutation: updateMutationState } =
    useUpdate<Rotation>();
  const { mutateAsync: deleteMutation, mutation: deleteMutationState } =
    useDelete<Rotation>();

  const createRotation = async (values: RotationInsert) => {
    try {
      const result = await createMutation({
        resource: "rotations",
        values,
      });
      toast.success("Rotation created");
      router.push(`/rotations/editor/${result.data.id}`);
      return result;
    } catch (error) {
      toast.error("Failed to create rotation");
      throw error;
    }
  };

  const updateRotation = async (id: string, values: RotationUpdate) => {
    try {
      const result = await updateMutation({
        resource: "rotations",
        id,
        values,
      });
      toast.success("Rotation saved");
      return result;
    } catch (error) {
      toast.error("Failed to save rotation");
      throw error;
    }
  };

  const deleteRotation = async (id: string) => {
    try {
      await deleteMutation({
        resource: "rotations",
        id,
      });
      toast.success("Rotation deleted");
      router.push("/rotations");
    } catch (error) {
      toast.error("Failed to delete rotation");
      throw error;
    }
  };

  const isCreating = createMutationState.isPending;
  const isUpdating = updateMutationState.isPending;
  const isDeleting = deleteMutationState.isPending;
  const isMutating = isCreating || isUpdating || isDeleting;

  return {
    createRotation,
    updateRotation,
    deleteRotation,
    isCreating,
    isUpdating,
    isDeleting,
    isMutating,
  };
}
