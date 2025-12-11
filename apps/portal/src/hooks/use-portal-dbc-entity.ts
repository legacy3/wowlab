"use client";

import { useQuery } from "@tanstack/react-query";
import type * as Effect from "effect/Effect";

import type { PortalDbcLayerContext } from "@/lib/services";
import { usePortalDbcBatch } from "@/providers/portal-batch-provider";

export function usePortalDbcEntity<T>(
  type: string,
  id: number | null | undefined,
  transformFn: (id: number) => Effect.Effect<T, unknown, PortalDbcLayerContext>,
) {
  const loadEntity = usePortalDbcBatch(type, transformFn);

  return useQuery({
    queryKey: [type, "transformed", id],
    queryFn: async (): Promise<T> => {
      if (id == null) {
        throw new Error(`${type} ID is required`);
      }

      return loadEntity(id);
    },
    enabled: id != null,
  });
}
