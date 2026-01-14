"use client";

import { useQuery } from "@tanstack/react-query";

import {
  renderSpellDescription,
  type SpellDescriptionKind,
} from "@/lib/spell-description/render-spell-description";
import { usePortalDbcBatch } from "@/providers/portal-batch-provider";

export function useSpellDescription(
  spellId: number | null | undefined,
  kind: SpellDescriptionKind = "description",
) {
  const load = usePortalDbcBatch(`spellDescription:${kind}`, (id) =>
    renderSpellDescription(id, kind),
  );

  return useQuery({
    queryKey: ["spellDescription", kind, spellId],
    queryFn: async () => {
      if (spellId == null) {
        throw new Error("Spell ID is required");
      }

      return load(spellId);
    },
    enabled: spellId != null,
  });
}
