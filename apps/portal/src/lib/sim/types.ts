import type { SimcProfile, SimcTalents } from "@wowlab/parsers";

export const EQUIPMENT_SLOTS = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "wrist",
  "hands",
  "waist",
  "legs",
  "feet",
  "finger1",
  "finger2",
  "trinket1",
  "trinket2",
  "mainHand",
  "offHand",
] as const;

export type CharacterParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "success"; data: ParsedSimcData; profile: SimcProfile }
  | { status: "error"; error: string };

export type CharacterProfession = Readonly<{
  name: string;
  rank: number;
}>;

export type CharacterSummary = Readonly<{
  class: string;
  level: number;
  name: string;
  race: string;
  realm: string;
  region: string;
  spec?: string;
}>;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

export interface ParsedSimcData {
  character: CharacterSummary;
  gear: Record<EquipmentSlot, number | null>;
  professions: CharacterProfession[];
  talents: SimcTalents;
}

export interface RecentCharacterSummary {
  data: ParsedSimcData;
  profile: SimcProfile;
  simc: string;
}
