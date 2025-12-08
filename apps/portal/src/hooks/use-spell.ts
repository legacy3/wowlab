"use client";

import { transformSpell } from "@wowlab/services/Data";
import type { Spell } from "@wowlab/core/Schemas";

import { usePortalDbcEntity } from "./use-portal-dbc-entity";

export function useSpell(spellId: number | null | undefined) {
  return usePortalDbcEntity<Spell.SpellDataFlat>(
    "spell",
    spellId,
    transformSpell,
  );
}
