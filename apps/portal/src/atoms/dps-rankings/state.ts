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

export const selectedTierAtom = atom<string>("sunwell");
export const selectedFightLengthAtom = atom<string>("patchwerk");
export const selectedTimeWindowAtom = atom<string>("7d");

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

// TODO Remove all these
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
