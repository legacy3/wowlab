"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { createPortalDbcLayer } from "@/lib/services";
import { ExtractorService, transformSpell } from "@wowlab/services/Data";
import type { Spell } from "@wowlab/core/Schemas";

/**
 * Hook to fetch transformed spell data by ID.
 * Raw DBC data is cached in IndexedDB via RefineDbcService.
 * Transformation is fast (~1ms) since all lookups hit cache.
 */
export function useSpell(spellId: number | null | undefined) {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  return useQuery({
    queryKey: ["spell", "transformed", spellId],
    queryFn: async (): Promise<Spell.SpellDataFlat> => {
      if (spellId == null) {
        throw new Error("Spell ID is required");
      }

      const dbcLayer = createPortalDbcLayer(queryClient, dataProvider);
      const extractorWithDeps = Layer.provide(dbcLayer)(
        ExtractorService.Default,
      );
      const appLayer = Layer.mergeAll(dbcLayer, extractorWithDeps);

      return Effect.runPromise(
        transformSpell(spellId).pipe(Effect.provide(appLayer)),
      );
    },
    enabled: spellId != null,
  });
}
