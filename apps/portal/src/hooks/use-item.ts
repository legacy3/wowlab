"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import * as Effect from "effect/Effect";

import { createPortalDbcLayer } from "@/lib/services";
import { transformItem } from "@wowlab/services/Data";
import type { Item } from "@wowlab/core/Schemas";

export function useItem(itemId: number | null | undefined) {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  return useQuery({
    queryKey: ["item", "transformed", itemId],
    queryFn: async (): Promise<Item.ItemDataFlat> => {
      if (itemId == null) {
        throw new Error("Item ID is required");
      }
      const layer = createPortalDbcLayer(queryClient, dataProvider);

      return Effect.runPromise(
        transformItem(itemId).pipe(Effect.provide(layer)),
      );
    },
    enabled: itemId != null,
  });
}
