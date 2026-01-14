"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface ItemData {
  id: number;
  name: string;
  description: string;
  iconName: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  itemLevel: number;
  requiredLevel: number;
  binding: "BoP" | "BoE" | "BoU";
  classification: {
    classId: number;
    className: string;
    subclassId: number;
    subclassName: string;
    inventoryType: number;
    inventoryTypeName: string;
    expansionId: number;
    expansionName: string;
  };
  armor: number;
  primaryStats: { name: string; value: number; type: string }[];
  secondaryStats: {
    name: string;
    rating: number;
    budgetPercent: number;
    percentAtLevel: number;
    diminishedPercent: number;
  }[];
  totalSecondaryBudget: number;
  sockets: { type: string; gem: string | null }[];
  socketBonus: string | null;
  bonusIds: number[];
  bonusBreakdown: {
    id: number;
    type: string;
    typeId: number;
    value: string;
    description: string;
  }[];
  upgradePath: {
    season: string;
    track: string;
    trackRange: string;
    currentLevel: number;
    maxLevel: number;
    levels: {
      level: number;
      itemLevel: number;
      crestType: string;
      crestCost: number;
      flightstoneCost: number;
      source: string;
      current?: boolean;
    }[];
    nextTracks: { name: string; range: string; requirement: string }[];
  };
  effects: string[];
  setInfo: unknown | null;
  relatedSets: { name: string; pieces: string[] }[];
  armorCalculation: {
    baseArmor: number;
    armorType: string;
    formula: string;
    physicalDR: number;
  };
  specUsability: {
    primaryStatUsers: {
      className: string;
      specs: { name: string; usable: boolean }[];
    }[];
    statPriorityMatch: { spec: string; rating: number; note: string }[];
  };
  dropSources: {
    source: string;
    difficulty: string;
    baseItemLevel: number;
    dropChance: string;
  }[];
  flags: { index: number; value: number; description: string | null }[];
  craftingInfo: unknown | null;
  similarCraftedItems: {
    name: string;
    itemLevelRange: string;
    profession: string;
    recipe: string;
    materials: string[];
  }[];
  recommendedGems: { name: string; stats: string }[];
  rawData: {
    item: Record<string, unknown>;
    itemSparse: Record<string, unknown>;
    itemBonus: Record<string, unknown>[];
  };
  simcString: string;
}

export const MOCK_ITEM_CLOTH_VEST: ItemData = {
  id: 211980,
  name: "Algari Competitor's Cloth Vest",
  description: "Forged in the fires of competition.",
  iconName: "inv_chest_cloth_raidmage_s_01",
  quality: 4,
  itemLevel: 593,
  requiredLevel: 80,
  binding: "BoP",
  classification: {
    classId: 4,
    className: "Armor",
    subclassId: 1,
    subclassName: "Cloth",
    inventoryType: 5,
    inventoryTypeName: "Chest",
    expansionId: 10,
    expansionName: "The War Within",
  },
  armor: 3847,
  primaryStats: [
    { name: "Intellect", value: 2156, type: "primary" },
    { name: "Stamina", value: 3234, type: "primary" },
  ],
  secondaryStats: [
    {
      name: "Critical Strike",
      rating: 847,
      budgetPercent: 57,
      percentAtLevel: 2.14,
      diminishedPercent: 2.08,
    },
    {
      name: "Mastery",
      rating: 635,
      budgetPercent: 43,
      percentAtLevel: 1.6,
      diminishedPercent: 1.57,
    },
  ],
  totalSecondaryBudget: 1482,
  sockets: [{ type: "Prismatic", gem: null }],
  socketBonus: null,
  bonusIds: [1472, 10256, 10377, 10396, 10873, 11316],
  bonusBreakdown: [
    {
      id: 1472,
      type: "Item Level",
      typeId: 1,
      value: "+13",
      description: "Heroic track base",
    },
    {
      id: 10256,
      type: "Stat Allocation",
      typeId: 2,
      value: "[847, 635]",
      description: "Crit/Mastery",
    },
    {
      id: 10377,
      type: "Socket",
      typeId: 6,
      value: "1 Prismatic",
      description: "Prismatic Socket",
    },
    {
      id: 10396,
      type: "Tertiary",
      typeId: 23,
      value: "-",
      description: "Speed/Leech/Avoid",
    },
    {
      id: 10873,
      type: "Scaling Curve",
      typeId: 11,
      value: "Curve #2157",
      description: "TWW Season 1",
    },
    {
      id: 11316,
      type: "Upgrade Track",
      typeId: 40,
      value: "Champion 4/8",
      description: "Upgrade level",
    },
  ],
  upgradePath: {
    season: "The War Within Season 1",
    track: "Champion",
    trackRange: "580-593",
    currentLevel: 4,
    maxLevel: 8,
    levels: [
      {
        level: 1,
        itemLevel: 580,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M0, Normal Raid",
      },
      {
        level: 2,
        itemLevel: 584,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 3,
        itemLevel: 587,
        crestType: "Weathered",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 4,
        itemLevel: 593,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
        current: true,
      },
      {
        level: 5,
        itemLevel: 597,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M2-5, Heroic Raid",
      },
      {
        level: 6,
        itemLevel: 600,
        crestType: "Carved",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
      {
        level: 7,
        itemLevel: 603,
        crestType: "Runed",
        crestCost: 15,
        flightstoneCost: 120,
        source: "M6-9, Mythic Raid",
      },
      {
        level: 8,
        itemLevel: 606,
        crestType: "Runed",
        crestCost: 15,
        flightstoneCost: 120,
        source: "",
      },
    ],
    nextTracks: [
      {
        name: "Hero Track",
        range: "610-626",
        requirement: "Requires upgrading to Champion 8/8 first",
      },
      {
        name: "Myth Track",
        range: "623-639",
        requirement: "Requires Myth track item as base",
      },
    ],
  },
  effects: [],
  setInfo: null,
  relatedSets: [
    {
      name: 'Mage Tier Set: "Sparks of Living Flame"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
    {
      name: 'Warlock Tier Set: "Grimoire of the Nerubian"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
    {
      name: 'Priest Tier Set: "Faith\'s Vesture"',
      pieces: ["Helm", "Shoulder", "Chest", "Hands", "Legs"],
    },
  ],
  armorCalculation: {
    baseArmor: 3847,
    armorType: "Cloth",
    formula: "ItemArmorQuality[iLvl=593].Cloth * QualityMod[Epic] = 3,847",
    physicalDR: 23.4,
  },
  specUsability: {
    primaryStatUsers: [
      {
        className: "Mage",
        specs: [
          { name: "Arcane", usable: true },
          { name: "Fire", usable: true },
          { name: "Frost", usable: true },
        ],
      },
      {
        className: "Warlock",
        specs: [
          { name: "Affliction", usable: true },
          { name: "Demonology", usable: true },
          { name: "Destruction", usable: true },
        ],
      },
      {
        className: "Priest",
        specs: [
          { name: "Discipline", usable: true },
          { name: "Holy", usable: true },
          { name: "Shadow", usable: true },
        ],
      },
    ],
    statPriorityMatch: [
      { spec: "Fire Mage", rating: 4, note: "Crit/Mastery is excellent" },
      { spec: "Frost Mage", rating: 3, note: "Prefers Haste/Crit" },
      { spec: "Shadow Priest", rating: 3, note: "Prefers Haste/Mastery" },
    ],
  },
  dropSources: [
    {
      source: "Nerub-ar Palace",
      difficulty: "Normal",
      baseItemLevel: 571,
      dropChance: "~15%",
    },
    {
      source: "Nerub-ar Palace",
      difficulty: "Heroic",
      baseItemLevel: 584,
      dropChance: "~15%",
    },
    {
      source: "Nerub-ar Palace",
      difficulty: "Mythic",
      baseItemLevel: 597,
      dropChance: "~15%",
    },
    {
      source: "M+ Dungeon End",
      difficulty: "+2",
      baseItemLevel: 584,
      dropChance: "100% (Great Vault)",
    },
    {
      source: "M+ Dungeon End",
      difficulty: "+10",
      baseItemLevel: 597,
      dropChance: "100% (Great Vault)",
    },
    {
      source: "Delves",
      difficulty: "Tier 8",
      baseItemLevel: 584,
      dropChance: "~20%",
    },
    {
      source: "PvP Conquest",
      difficulty: "-",
      baseItemLevel: 580,
      dropChance: "Purchasable",
    },
  ],
  flags: [
    { index: 0, value: 0x00000000, description: null },
    { index: 1, value: 0x00002000, description: "ITEM_FLAG_BIND_TO_ACCOUNT" },
    { index: 2, value: 0x00800000, description: "ITEM_FLAG2_NO_DURABILITY" },
    { index: 3, value: 0x00000000, description: null },
    { index: 4, value: 0x00000000, description: null },
  ],
  craftingInfo: null,
  similarCraftedItems: [
    {
      name: "Weavercloth Vestments",
      itemLevelRange: "580-636",
      profession: "Tailoring",
      recipe: "Pattern: Weavercloth Vestments",
      materials: ["25x Weavercloth", "5x Mystic Null Stone"],
    },
  ],
  recommendedGems: [
    { name: "Inscribed Sapphire", stats: "+72 Crit / +54 Int" },
    { name: "Deadly Sapphire", stats: "+72 Crit / +54 Crit" },
    { name: "Masterful Sapphire", stats: "+72 Mastery / +54 Mastery" },
  ],
  rawData: {
    item: { ID: 211980, ClassID: 4, SubclassID: 1 },
    itemSparse: {
      ID: 211980,
      Name_lang: "Algari Competitor's Cloth Vest",
      ItemLevel: 593,
    },
    itemBonus: [
      { ID: 1472, Type: 1, Value_0: 13 },
      { ID: 10256, Type: 2, Value_0: 847, Value_1: 635 },
    ],
  },
  simcString:
    "chest=algari_competitors_cloth_vest,id=211980,bonus_id=1472/10256/10377/10396/10873/11316,ilevel=593,gem_id=213467",
};

const ItemContext = createContext<ItemData | null>(null);

export function ItemProvider({
  item,
  children,
}: {
  item: ItemData;
  children: ReactNode;
}) {
  return <ItemContext.Provider value={item}>{children}</ItemContext.Provider>;
}

export function useItemData(): ItemData {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItemData must be used within an ItemProvider");
  }

  return context;
}

// TODO Get this from dbc data
export function getQualityName(quality: number): string {
  const names: Record<number, string> = {
    0: "Poor",
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Epic",
    5: "Legendary",
    6: "Artifact",
    7: "Heirloom",
  };

  return names[quality] ?? "Unknown";
}
