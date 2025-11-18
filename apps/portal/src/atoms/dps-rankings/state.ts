import { atom } from "jotai";

export type TrendDirection = "up" | "down" | "flat";

export type WowClass =
  | "Death Knight"
  | "Druid"
  | "Hunter"
  | "Mage"
  | "Paladin"
  | "Priest"
  | "Rogue"
  | "Shaman"
  | "Warlock"
  | "Warrior";

export interface SpecRanking {
  readonly rank: number;
  readonly spec: string;
  readonly wowClass: WowClass;
  readonly dps: number;
  readonly changePercent: number;
  readonly direction: TrendDirection;
  readonly sampleSize: number;
}

export interface WantedItem {
  readonly rank: number;
  readonly id: number;
  readonly name: string;
  readonly slot: string;
  readonly itemLevel: number;
  readonly classes: readonly WowClass[];
  readonly dpsGain: number;
  readonly source: string;
  readonly quality: number;
}

export interface CharacterSim {
  readonly id: number;
  readonly character: string;
  readonly spec: string;
  readonly wowClass: WowClass;
  readonly dps: number;
  readonly percentile: number;
  readonly realm: string;
  readonly region: string;
  readonly gearscore: number;
  readonly runDate: string;
  readonly reportUrl: string;
}

// Filter atoms
export const selectedTierAtom = atom<string>("sunwell");
export const selectedFightLengthAtom = atom<string>("patchwerk");
export const selectedTimeWindowAtom = atom<string>("7d");

// Mock data atoms - these would eventually become async atoms fetching real data
export const specRankingsAtom = atom<readonly SpecRanking[]>([
  {
    rank: 1,
    spec: "Shadow",
    wowClass: "Priest",
    dps: 3217,
    changePercent: 2.8,
    direction: "up",
    sampleSize: 842,
  },
  {
    rank: 2,
    spec: "Fire",
    wowClass: "Mage",
    dps: 3184,
    changePercent: -0.7,
    direction: "down",
    sampleSize: 911,
  },
  {
    rank: 3,
    spec: "Affliction",
    wowClass: "Warlock",
    dps: 3142,
    changePercent: 1.1,
    direction: "up",
    sampleSize: 760,
  },
  {
    rank: 4,
    spec: "Balance",
    wowClass: "Druid",
    dps: 3074,
    changePercent: 0.6,
    direction: "up",
    sampleSize: 688,
  },
  {
    rank: 5,
    spec: "Elemental",
    wowClass: "Shaman",
    dps: 2999,
    changePercent: 0.0,
    direction: "flat",
    sampleSize: 572,
  },
  {
    rank: 6,
    spec: "Arcane",
    wowClass: "Mage",
    dps: 2968,
    changePercent: -1.4,
    direction: "down",
    sampleSize: 534,
  },
  {
    rank: 7,
    spec: "Destruction",
    wowClass: "Warlock",
    dps: 2942,
    changePercent: 1.9,
    direction: "up",
    sampleSize: 611,
  },
  {
    rank: 8,
    spec: "Frost",
    wowClass: "Mage",
    dps: 2886,
    changePercent: 0.4,
    direction: "up",
    sampleSize: 458,
  },
  {
    rank: 9,
    spec: "Demonology",
    wowClass: "Warlock",
    dps: 2834,
    changePercent: -2.1,
    direction: "down",
    sampleSize: 312,
  },
  {
    rank: 10,
    spec: "Enhancement",
    wowClass: "Shaman",
    dps: 2773,
    changePercent: 0.8,
    direction: "up",
    sampleSize: 401,
  },
]);

export const mostWantedItemsAtom = atom<readonly WantedItem[]>([
  {
    rank: 1,
    id: 50363,
    name: "Deathbringer's Will",
    slot: "Trinket",
    itemLevel: 277,
    classes: ["Warrior", "Paladin", "Rogue", "Hunter"],
    dpsGain: 187,
    source: "Deathbringer Saurfang • ICC 25H",
    quality: 5, // Legendary
  },
  {
    rank: 2,
    id: 54588,
    name: "Charred Twilight Scale",
    slot: "Trinket",
    itemLevel: 284,
    classes: ["Mage", "Priest", "Warlock", "Shaman", "Druid"],
    dpsGain: 166,
    source: "Halion • Ruby Sanctum 25H",
    quality: 4, // Epic
  },
  {
    rank: 3,
    id: 50365,
    name: "Phylactery of the Nameless Lich",
    slot: "Trinket",
    itemLevel: 277,
    classes: ["Mage", "Priest", "Warlock", "Shaman", "Druid"],
    dpsGain: 152,
    source: "Professor Putricide • ICC 25H",
    quality: 4, // Epic
  },
  {
    rank: 4,
    id: 50070,
    name: "Oathbinder, Charge of the Ranger-General",
    slot: "Polearm",
    itemLevel: 284,
    classes: ["Hunter", "Druid"],
    dpsGain: 143,
    source: "The Lich King • ICC 25H",
    quality: 5, // Legendary
  },
  {
    rank: 5,
    id: 51231,
    name: "Sanctified Bloodmage Robe",
    slot: "Chest",
    itemLevel: 277,
    classes: ["Mage"],
    dpsGain: 121,
    source: "Emblem of Frost • Upgrade",
    quality: 4, // Epic
  },
  {
    rank: 6,
    id: 51479,
    name: "Wrathful Gladiator's Compendium",
    slot: "Off Hand",
    itemLevel: 277,
    classes: ["Priest", "Warlock", "Mage"],
    dpsGain: 118,
    source: "PvP • Wrathful Season",
    quality: 4, // Epic
  },
  {
    rank: 7,
    id: 50034,
    name: "Fal'inrush, Defender of Quel'thalas",
    slot: "Ranged",
    itemLevel: 284,
    classes: ["Hunter"],
    dpsGain: 114,
    source: "The Lich King • ICC 25H",
    quality: 5, // Legendary
  },
  {
    rank: 8,
    id: 45518,
    name: "Penumbra Pendant",
    slot: "Neck",
    itemLevel: 258,
    classes: ["Mage", "Warlock", "Priest"],
    dpsGain: 108,
    source: "Algalon • Ulduar 25H",
    quality: 4, // Epic
  },
  {
    rank: 9,
    id: 47610,
    name: "Gul'dan's Ritualist Pendant",
    slot: "Neck",
    itemLevel: 277,
    classes: ["Warlock", "Priest"],
    dpsGain: 104,
    source: "Gul'dan • Vault of Archavon",
    quality: 4, // Epic
  },
  {
    rank: 10,
    id: 50068,
    name: "Royal Scepter of Terenas II",
    slot: "Main Hand",
    itemLevel: 284,
    classes: ["Priest", "Mage"],
    dpsGain: 101,
    source: "The Lich King • ICC 25H",
    quality: 5, // Legendary
  },
]);

export const topSimCharactersAtom = atom<readonly CharacterSim[]>([
  {
    id: 1,
    character: "Zephyria",
    spec: "Shadow",
    wowClass: "Priest",
    dps: 3324,
    percentile: 99,
    realm: "Faerlina",
    region: "NA",
    gearscore: 6440,
    runDate: "2024-01-16",
    reportUrl: "#",
  },
  {
    id: 2,
    character: "Pyrelight",
    spec: "Fire",
    wowClass: "Mage",
    dps: 3296,
    percentile: 98,
    realm: "Gehennas",
    region: "EU",
    gearscore: 6412,
    runDate: "2024-01-15",
    reportUrl: "#",
  },
  {
    id: 3,
    character: "Hexweaver",
    spec: "Affliction",
    wowClass: "Warlock",
    dps: 3271,
    percentile: 98,
    realm: "Benediction",
    region: "NA",
    gearscore: 6395,
    runDate: "2024-01-14",
    reportUrl: "#",
  },
  {
    id: 4,
    character: "Starforge",
    spec: "Balance",
    wowClass: "Druid",
    dps: 3182,
    percentile: 97,
    realm: "Pagle",
    region: "NA",
    gearscore: 6336,
    runDate: "2024-01-13",
    reportUrl: "#",
  },
  {
    id: 5,
    character: "Stormfury",
    spec: "Elemental",
    wowClass: "Shaman",
    dps: 3114,
    percentile: 95,
    realm: "Mograine",
    region: "EU",
    gearscore: 6289,
    runDate: "2024-01-12",
    reportUrl: "#",
  },
  {
    id: 6,
    character: "Voidslide",
    spec: "Arcane",
    wowClass: "Mage",
    dps: 3059,
    percentile: 94,
    realm: "Grobbulus",
    region: "NA",
    gearscore: 6248,
    runDate: "2024-01-11",
    reportUrl: "#",
  },
  {
    id: 7,
    character: "Lightbender",
    spec: "Retribution",
    wowClass: "Paladin",
    dps: 3026,
    percentile: 94,
    realm: "Golemagg",
    region: "EU",
    gearscore: 6204,
    runDate: "2024-01-10",
    reportUrl: "#",
  },
  {
    id: 8,
    character: "Thunderhoof",
    spec: "Enhancement",
    wowClass: "Shaman",
    dps: 2988,
    percentile: 93,
    realm: "Whitemane",
    region: "NA",
    gearscore: 6188,
    runDate: "2024-01-09",
    reportUrl: "#",
  },
  {
    id: 9,
    character: "Moonwisp",
    spec: "Balance",
    wowClass: "Druid",
    dps: 2951,
    percentile: 92,
    realm: "Firemaw",
    region: "EU",
    gearscore: 6157,
    runDate: "2024-01-08",
    reportUrl: "#",
  },
  {
    id: 10,
    character: "Grimshot",
    spec: "Marksmanship",
    wowClass: "Hunter",
    dps: 2926,
    percentile: 91,
    realm: "Herod",
    region: "NA",
    gearscore: 6124,
    runDate: "2024-01-07",
    reportUrl: "#",
  },
]);

export const CLASS_COLORS: Record<WowClass, string> = {
  "Death Knight": "#C41E3A",
  Druid: "#FF7D0A",
  Hunter: "#ABD473",
  Mage: "#69CCF0",
  Paladin: "#F58CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF569",
  Shaman: "#0070DE",
  Warlock: "#9482C9",
  Warrior: "#C79C6E",
};

export const RAID_TIERS = [
  { label: "Sunwell Plateau (T6)", value: "sunwell" },
  { label: "Black Temple (T6)", value: "bt" },
  { label: "Serpentshrine Cavern (T5)", value: "ssc" },
] as const;

export const FIGHT_LENGTHS = [
  { label: "5 min Patchwerk", value: "patchwerk" },
  { label: "3 min Burn", value: "burn" },
  { label: "7 min Marathon", value: "marathon" },
] as const;

export const TIME_WINDOWS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
] as const;
