"use client";

import { useItem } from "@/hooks/use-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item } from "@wowlab/core/Schemas";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemProvider, type ItemData } from "./item-context";
import { ItemDetailContent } from "./item-detail-content";

// Mapping from ItemDataFlat.binding (number) to ItemData.binding (string)
function mapBinding(binding: number): "BoP" | "BoE" | "BoU" {
  switch (binding) {
    case 1:
      return "BoP";
    case 2:
      return "BoE";
    case 3:
      return "BoU";
    default:
      return "BoE";
  }
}

// Map socket type numbers to names
function mapSocketType(type: number): string {
  const socketTypes: Record<number, string> = {
    0: "None",
    1: "Meta",
    2: "Red",
    3: "Yellow",
    4: "Blue",
    5: "Hydraulic",
    6: "Cogwheel",
    7: "Prismatic",
    8: "Relic Iron",
    9: "Relic Blood",
    10: "Relic Shadow",
    11: "Relic Fel",
    12: "Relic Arcane",
    13: "Relic Frost",
    14: "Relic Fire",
    15: "Relic Water",
    16: "Relic Life",
    17: "Relic Storm",
    18: "Relic Holy",
    19: "Punchcard Red",
    20: "Punchcard Yellow",
    21: "Punchcard Blue",
    22: "Domination",
    23: "Cypher",
    24: "Tinker",
    25: "Primordial",
  };
  return socketTypes[type] ?? `Socket (${type})`;
}

// Primary stat types
const PRIMARY_STAT_TYPES = new Set([3, 4, 5, 7, 71, 72, 73, 74]); // Agility, Strength, Intellect, Stamina

// Map stat type to name
function mapStatName(type: number): string {
  const statNames: Record<number, string> = {
    3: "Agility",
    4: "Strength",
    5: "Intellect",
    7: "Stamina",
    32: "Critical Strike",
    36: "Haste",
    40: "Versatility",
    49: "Mastery",
    71: "Agility or Strength or Intellect",
    72: "Agility or Strength",
    73: "Agility or Intellect",
    74: "Strength or Intellect",
  };
  return statNames[type] ?? `Stat ${type}`;
}

// Adapter: Convert ItemDataFlat to ItemData
function adaptItemDataFlat(flat: Item.ItemDataFlat): ItemData {
  // Split stats into primary and secondary
  const primaryStats = flat.stats
    .filter((s) => PRIMARY_STAT_TYPES.has(s.type))
    .map((s) => ({
      name: mapStatName(s.type),
      value: s.value,
      type: "primary",
    }));

  const secondaryStats = flat.stats
    .filter((s) => !PRIMARY_STAT_TYPES.has(s.type))
    .map((s) => ({
      name: mapStatName(s.type),
      rating: s.value,
      budgetPercent: 0, // Would need calculation
      percentAtLevel: 0, // Would need calculation
      diminishedPercent: 0, // Would need calculation
    }));

  // Map sockets
  const sockets = flat.sockets.map((type) => ({
    type: mapSocketType(type),
    gem: null,
  }));

  // Map drop sources
  const dropSources = flat.dropSources.map((source) => ({
    source: source.instanceName,
    difficulty: source.encounterName, // Boss name
    baseItemLevel: flat.itemLevel,
    dropChance:
      source.difficultyMask > 0 ? `Diff: ${source.difficultyMask}` : "Unknown",
  }));

  // Map flags
  const flags = flat.flags.map((value, index) => ({
    index,
    value,
    description:
      value !== 0 ? `Flag value: 0x${value.toString(16).toUpperCase()}` : null,
  }));

  return {
    id: flat.id,
    name: flat.name,
    description: flat.description,
    iconName: flat.fileName,
    quality: flat.quality as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
    itemLevel: flat.itemLevel,
    requiredLevel: flat.requiredLevel,
    binding: mapBinding(flat.binding),
    classification: flat.classification ?? {
      classId: flat.classId,
      className: "Unknown",
      subclassId: flat.subclassId,
      subclassName: "Unknown",
      inventoryType: flat.inventoryType,
      inventoryTypeName: "Unknown",
      expansionId: flat.expansionId,
      expansionName: "Unknown",
    },
    armor: 0, // Would need calculation from DBC tables
    primaryStats,
    secondaryStats,
    totalSecondaryBudget: secondaryStats.reduce((sum, s) => sum + s.rating, 0),
    sockets,
    socketBonus:
      flat.socketBonusEnchantId > 0
        ? `Enchant #${flat.socketBonusEnchantId}`
        : null,
    bonusIds: [], // Not yet populated from DBC
    bonusBreakdown: [],
    upgradePath: {
      season: "",
      track: "",
      trackRange: "",
      currentLevel: 0,
      maxLevel: 0,
      levels: [],
      nextTracks: [],
    },
    effects: flat.effects.map((e) => `Spell #${e.spellId}`),
    setInfo: flat.setInfo
      ? {
          name: flat.setInfo.setName,
          items: flat.setInfo.itemIds.map((id) => `Item #${id}`),
          bonuses: flat.setInfo.bonuses.map(
            (b) => `${b.threshold} pieces: Spell #${b.spellId}`,
          ),
        }
      : null,
    relatedSets: [],
    armorCalculation: {
      baseArmor: 0,
      armorType: flat.classification?.subclassName ?? "Unknown",
      formula: "",
      physicalDR: 0,
    },
    specUsability: {
      primaryStatUsers: [],
      statPriorityMatch: [],
    },
    dropSources,
    flags,
    craftingInfo:
      flat.modifiedCraftingReagentItemId > 0
        ? { reagentItemId: flat.modifiedCraftingReagentItemId }
        : null,
    similarCraftedItems: [],
    recommendedGems: [],
    rawData: {
      item: { ID: flat.id, ClassID: flat.classId, SubclassID: flat.subclassId },
      itemSparse: {
        ID: flat.id,
        Name_lang: flat.name,
        ItemLevel: flat.itemLevel,
      },
      itemBonus: [],
    },
    simcString: `id=${flat.id},ilevel=${flat.itemLevel}`,
  };
}

interface ItemDetailPageProps {
  itemId: string;
}

export function ItemDetailPage({ itemId }: ItemDetailPageProps) {
  const { data: itemData, isLoading, error } = useItem(Number(itemId));

  if (isLoading) {
    return <ItemDetailSkeleton />;
  }

  if (error || !itemData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lab/inspector/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inspector
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {error
              ? `Error loading item: ${error.message}`
              : `Item ${itemId} not found`}
          </p>
        </div>
      </div>
    );
  }

  const item = adaptItemDataFlat(itemData);

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lab/inspector/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspector
          </Link>
        </Button>
      </div>

      {/* Dashboard Content */}
      <ItemProvider item={item}>
        <ItemDetailContent />
      </ItemProvider>
    </div>
  );
}

export function ItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Navigation Skeleton */}
      <Skeleton className="h-9 w-40" />

      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* header */}
        <Skeleton className="h-32 md:col-span-2" />
        {/* classification / stat-breakdown */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* bonus-ids / upgrade-path */}
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64 md:col-span-2" />
        {/* sockets / set-bonuses */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* item-effects */}
        <Skeleton className="h-64 md:col-span-2" />
        {/* armor-calculation / spec-usability */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* drop-sources */}
        <Skeleton className="h-64 md:col-span-2" />
        {/* item-flags / crafting */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* raw-data / simulation */}
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
