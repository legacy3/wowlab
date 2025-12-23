"use client";

import { useMemo } from "react";
import {
  buildTalentViewModel,
  type TalentSelection,
  type TalentViewModel,
} from "@wowlab/services/Talents";

type TalentTree = Parameters<typeof buildTalentViewModel>[0];

export function useTalentViewModel(
  tree: TalentTree | null,
  selections: Map<number, TalentSelection>,
  options: { width: number; height: number; selectedHeroId?: number | null },
): TalentViewModel | null {
  return useMemo(() => {
    if (!tree) {
      return null;
    }

    return buildTalentViewModel(tree, selections, options);
  }, [tree, selections, options.width, options.height, options.selectedHeroId]);
}
