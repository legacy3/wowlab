"use client";

import {
  transformTalentTree,
  applyDecodedTalents,
} from "@wowlab/services/Data";
import type { Talent } from "@wowlab/core/Schemas";

import { usePortalDbcEntity } from "./use-portal-dbc-entity";

export function useTalentTree(specId: number | null | undefined) {
  return usePortalDbcEntity<Talent.TalentTree>(
    "talent-tree",
    specId,
    transformTalentTree,
  );
}

export function useTalentTreeWithSelections(
  specId: number | null | undefined,
  decoded: Parameters<typeof applyDecodedTalents>[1] | null | undefined,
) {
  const { data: tree, ...rest } = useTalentTree(specId);

  const treeWithSelections =
    tree && decoded ? applyDecodedTalents(tree, decoded) : undefined;

  return {
    ...rest,
    data: treeWithSelections,
    tree,
  };
}
