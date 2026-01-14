import { atom } from "jotai";

export type SourceTile = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly type: "raid" | "dungeon" | "vendor" | "seasonal" | "pvp";
  readonly bosses: number;
  readonly lootCount: number;
  readonly tier: "current" | "previous";
};

export type SourceGroup = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly tier: "current" | "previous";
  readonly sources: readonly SourceTile[];
};

const SOURCE_GROUPS: readonly SourceGroup[] = [
  {
    id: "season3-raids",
    label: "Season 3 Raids & Mega-Dungeons",
    description: "Current raid tier and endgame dungeon rewards.",
    tier: "current",
    sources: [
      {
        id: "khaz-algar",
        label: "Khaz Algar",
        description: "Season 3 Raid",
        type: "raid",
        bosses: 8,
        lootCount: 64,
        tier: "current",
      },
      {
        id: "manaforge-omega",
        label: "Manaforge Omega",
        description: "Mega-Dungeon",
        type: "dungeon",
        bosses: 6,
        lootCount: 42,
        tier: "current",
      },
      {
        id: "tazavesh",
        label: "Tazavesh",
        description: "Seasonal Vault",
        type: "dungeon",
        bosses: 8,
        lootCount: 56,
        tier: "current",
      },
    ],
  },
  {
    id: "dungeon-rotation",
    label: "Dungeon Rotation",
    description: "Mythic+, heroic, and story dungeon loot tables.",
    tier: "current",
    sources: [
      {
        id: "mythic-plus",
        label: "Mythic+ Dungeons",
        description: "Seasonal Keystone Rotation",
        type: "dungeon",
        bosses: 28,
        lootCount: 96,
        tier: "current",
      },
      {
        id: "normal-dungeons",
        label: "Normal Dungeons",
        description: "Base loot tables",
        type: "dungeon",
        bosses: 24,
        lootCount: 88,
        tier: "current",
      },
      {
        id: "bountiful-delves",
        label: "Bountiful Delves",
        description: "Open World Reward Track",
        type: "seasonal",
        bosses: 12,
        lootCount: 38,
        tier: "current",
      },
    ],
  },
  {
    id: "vendors",
    label: "Catalyst & Vendors",
    description: "Crafting, catalyst, and vendor upgrade paths.",
    tier: "current",
    sources: [
      {
        id: "catalyst-season3",
        label: "Catalyst • Season 3",
        description: "Convert tier tokens",
        type: "vendor",
        bosses: 0,
        lootCount: 18,
        tier: "current",
      },
      {
        id: "profession-epic",
        label: "Professions • Epic",
        description: "Crafted Best-in-Slot",
        type: "vendor",
        bosses: 0,
        lootCount: 27,
        tier: "current",
      },
    ],
  },
  {
    id: "pvp",
    label: "PvP Reward Tracks",
    description: "Honor and conquest gear vendors.",
    tier: "current",
    sources: [
      {
        id: "pvp-season3-conquest",
        label: "PvP Season 3 • Conquest",
        description: "Conquest Vendor",
        type: "pvp",
        bosses: 0,
        lootCount: 40,
        tier: "current",
      },
    ],
  },
  {
    id: "legacy",
    label: "Legacy & Previous Tiers",
    description: "Older seasonal content and mega-dungeons.",
    tier: "previous",
    sources: [
      {
        id: "nightfall",
        label: "Nightfall",
        description: "Previous Mega-Dungeon",
        type: "dungeon",
        bosses: 8,
        lootCount: 44,
        tier: "previous",
      },
      {
        id: "puzzling-cartel",
        label: "Puzzling Cartel Chips S3",
        description: "Previous Seasonal Vendors",
        type: "vendor",
        bosses: 0,
        lootCount: 22,
        tier: "previous",
      },
    ],
  },
];

const ALL_SOURCE_TILES: readonly SourceTile[] = SOURCE_GROUPS.flatMap(
  (group) => group.sources,
);

// Atoms
export const sourceGroupsAtom = atom<readonly SourceGroup[]>(SOURCE_GROUPS);

export const allSourceTilesAtom = atom<readonly SourceTile[]>(ALL_SOURCE_TILES);

export const selectedSourcesAtom = atom<Set<string>>(
  new Set(["khaz-algar", "mythic-plus", "catalyst-season3"]),
);

export const showPreviousTiersAtom = atom<boolean>(false);
