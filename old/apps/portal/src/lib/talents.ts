import type { TalentViewModel } from "@wowlab/services/Talents";
import { env } from "@/lib/env";

export interface KeyTalent {
  id: number;
  name: string;
  iconFileName: string;
  spellId: number;
}

// TODO Move this into a transformer in the library and make it less shitty
export function getHeroAtlasUrl(className: string, heroName: string): string {
  const classSlug = className.toLowerCase().replace(/\s+/g, "");
  const heroSlug = heroName.toLowerCase().replace(/\s+/g, "");

  return `${env.SUPABASE_URL}/functions/v1/talent-atlas/talents-heroclass-${classSlug}-${heroSlug}.webp`;
}

export function getPointCount(nodes: TalentViewModel["nodes"]): number {
  return nodes.reduce((sum, node) => {
    if (!node.selection?.selected) {
      return sum;
    }

    return sum + (node.selection.ranksPurchased ?? 1);
  }, 0);
}

// TODO Find a better way to get actual key talents
export function getKeyTalents(
  nodes: TalentViewModel["nodes"],
  limit: number,
): KeyTalent[] {
  return nodes
    .filter((node) => node.selection?.selected)
    .map((node) => {
      const choiceIndex = node.selection?.choiceIndex ?? 0;
      const entry = node.node.entries[choiceIndex] ?? node.node.entries[0];

      return {
        id: node.id,
        name: entry?.name ?? "Unknown",
        iconFileName: entry?.iconFileName ?? "",
        spellId: entry?.spellId ?? 0,
        isChoice: node.node.type === 2,
        ranks: node.selection?.ranksPurchased ?? 1,
      };
    })
    .sort((a, b) => {
      if (a.isChoice !== b.isChoice) {
        return a.isChoice ? -1 : 1;
      }

      return b.ranks - a.ranks;
    })
    .slice(0, limit);
}
