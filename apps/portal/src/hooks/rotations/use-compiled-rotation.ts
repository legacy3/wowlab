"use client";

import { useQuery } from "@tanstack/react-query";
import { useRotation } from "./use-rotation";
import { env } from "@/lib/env";
import type { RotationDefinition } from "@/lib/simulation/types";

/**
 * Construct the compiled rotation URL from rotation id and version.
 */
function getCompiledUrl(id: string, version: number): string {
  return `${env.SUPABASE_URL}/storage/v1/object/public/compiled-rotations/rotations/${id}/v${version}.js`;
}

/**
 * Load a compiled rotation module from storage.
 * Uses blob URL workaround since Next.js doesn't support dynamic imports from external URLs.
 */
async function loadCompiledModule(url: string): Promise<RotationDefinition> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch compiled rotation: ${response.status}`);
  }
  const code = await response.text();
  const blob = new Blob([code], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const loadedModule = await import(/* @vite-ignore */ blobUrl);
    return loadedModule.default as RotationDefinition;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function useCompiledRotation(rotationId: string | undefined) {
  const { rotation, isLoading: isLoadingMeta } = useRotation(rotationId);

  const compiledUrl =
    rotation?.id && rotation?.currentVersion
      ? getCompiledUrl(rotation.id, rotation.currentVersion)
      : null;

  const {
    data: compiled,
    isLoading: isLoadingModule,
    error,
  } = useQuery({
    queryKey: ["compiled-rotation", compiledUrl],
    queryFn: async () => {
      if (!compiledUrl) return null;
      return loadCompiledModule(compiledUrl);
    },
    enabled: !!compiledUrl,
    staleTime: Infinity, // Compiled modules are immutable (versioned URLs)
  });

  return {
    rotation: compiled,
    metadata: rotation,
    isLoading: isLoadingMeta || isLoadingModule,
    error,
  };
}
