"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import * as Effect from "effect/Effect";

import { createPortalDbcLayer } from "@/lib/services";

export function usePortalDbcEntity<T>(
  type: string,
  id: number | null | undefined,
  transformFn: (id: number) => Effect.Effect<T, unknown, unknown>,
) {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  return useQuery({
    queryKey: [type, "transformed", id],
    queryFn: async (): Promise<T> => {
      if (id == null) {
        throw new Error(`${type} ID is required`);
      }

      const layer = createPortalDbcLayer(queryClient, dataProvider);

      return Effect.runPromise(
        transformFn(id).pipe(Effect.provide(layer)) as Effect.Effect<T>,
      );
    },
    enabled: id != null,
  });
}
