"use client";

import { useCreate, useUpdate, useDelete } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type {
  Rotation,
  RotationInsert,
  RotationUpdate,
} from "@/lib/supabase/types";

interface CompileResult {
  success: boolean;
  version: number;
  error?: string;
  details?: string;
}

async function compileRotation(rotation: Rotation): Promise<CompileResult> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<CompileResult>(
    "compile-rotation",
    {
      body: {
        id: rotation.id,
        name: rotation.name,
        script: rotation.script,
        currentVersion: rotation.currentVersion,
      },
    },
  );
  if (error) {
    throw new Error(error.message);
  }
  if (!data?.success) {
    throw new Error(data?.error ?? "Compilation failed");
  }
  return data;
}

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
      // Compile and show result
      try {
        await compileRotation(result.data);
        toast.success("Rotation created and compiled");
      } catch (compileError) {
        toast.error(`Rotation saved but compilation failed: ${compileError}`);
      }
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
      // Compile and show result
      try {
        await compileRotation(result.data);
        toast.success("Rotation saved and compiled");
      } catch (compileError) {
        toast.error(`Rotation saved but compilation failed: ${compileError}`);
      }
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
