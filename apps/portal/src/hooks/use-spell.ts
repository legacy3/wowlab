"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDataProvider } from "@refinedev/core";
import * as Effect from "effect/Effect";

import { createPortalDbcLayer } from "@/lib/services";
import { transformSpell } from "@wowlab/services/Data";
import type { Spell } from "@wowlab/core/Schemas";

export function useSpell(spellId: number | null | undefined) {
  const queryClient = useQueryClient();
  const dataProvider = useDataProvider()();

  return useQuery({
    queryKey: ["spell", "transformed", spellId],
    queryFn: async (): Promise<Spell.SpellDataFlat> => {
      if (spellId == null) {
        throw new Error("Spell ID is required");
      }
      const layer = createPortalDbcLayer(queryClient, dataProvider);
      return Effect.runPromise(
        transformSpell(spellId).pipe(Effect.provide(layer)),
      );
    },
    enabled: spellId != null,
  });
}
