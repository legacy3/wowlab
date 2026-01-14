import type { CharacterSummary, EquipmentSlot } from "@/components/equipment";
import type { PresetCharacterId } from "@/atoms/lab";

export const SIM_TYPES = [
  "single-target",
  "aoe",
  "mythic-plus",
  "healer",
] as const;

export type SimType = (typeof SIM_TYPES)[number];

export const SIM_TYPE_LABELS: Record<SimType, string> = {
  "single-target": "Single Target",
  aoe: "AoE",
  "mythic-plus": "Mythic+",
  healer: "Healer",
};

export interface PresetCharacter {
  id: PresetCharacterId;
  character: CharacterSummary;
  gear: Record<EquipmentSlot, number | null>;
  stats: {
    primaryStat: number;
    stamina: number;
    criticalStrike: number;
    haste: number;
    mastery: number;
    versatility: number;
  };
  /** Ranking by sim type - lower is better */
  rankings: Partial<Record<SimType, number>>;
}

export const PRESET_CHARACTERS: PresetCharacter[] = [
  {
    id: "enhancement-shaman",
    character: {
      name: "Doe",
      class: "Shaman",
      spec: "Enhancement",
      level: 80,
      race: "Orc",
      region: "US",
      realm: "Illidan",
    },
    gear: {
      head: 212015,
      neck: 225577,
      shoulder: 212017,
      back: 225591,
      chest: 212010,
      wrist: 225580,
      hands: 212013,
      waist: 225583,
      legs: 212016,
      feet: 225575,
      finger1: 225576,
      finger2: 225587,
      trinket1: 225588,
      trinket2: 225589,
      mainHand: 225582,
      offHand: 225582,
    },
    stats: {
      primaryStat: 42500,
      stamina: 115000,
      criticalStrike: 22,
      haste: 28,
      mastery: 45,
      versatility: 8,
    },
    rankings: { "single-target": 1, aoe: 3, "mythic-plus": 2 },
  },
  {
    id: "elemental-shaman",
    character: {
      name: "Bolt",
      class: "Shaman",
      spec: "Elemental",
      level: 80,
      race: "Draenei",
      region: "EU",
      realm: "Kazzak",
    },
    gear: {
      head: 212015,
      neck: 225577,
      shoulder: 212017,
      back: 225591,
      chest: 212010,
      wrist: 225580,
      hands: 212013,
      waist: 225583,
      legs: 212016,
      feet: 225575,
      finger1: 225576,
      finger2: 225587,
      trinket1: 225588,
      trinket2: 225589,
      mainHand: 225582,
      offHand: null,
    },
    stats: {
      primaryStat: 40200,
      stamina: 110000,
      criticalStrike: 35,
      haste: 25,
      mastery: 32,
      versatility: 10,
    },
    rankings: { "single-target": 2, aoe: 1, "mythic-plus": 1 },
  },
  {
    id: "fury-warrior",
    character: {
      name: "Rage",
      class: "Warrior",
      spec: "Fury",
      level: 80,
      race: "Tauren",
      region: "US",
      realm: "Tichondrius",
    },
    gear: {
      head: 217218,
      neck: 225577,
      shoulder: 217220,
      back: 225591,
      chest: 217216,
      wrist: 225580,
      hands: 217219,
      waist: 225583,
      legs: 217221,
      feet: 225575,
      finger1: 225576,
      finger2: 225587,
      trinket1: 225588,
      trinket2: 225589,
      mainHand: 225582,
      offHand: 225582,
    },
    stats: {
      primaryStat: 45000,
      stamina: 125000,
      criticalStrike: 30,
      haste: 35,
      mastery: 20,
      versatility: 12,
    },
    rankings: { "single-target": 1, aoe: 2, "mythic-plus": 3 },
  },
  {
    id: "beast-mastery-hunter",
    character: {
      name: "Scout",
      class: "Hunter",
      spec: "Beast Mastery",
      level: 80,
      race: "Troll",
      region: "EU",
      realm: "Ravencrest",
    },
    gear: {
      head: 217183,
      neck: 225577,
      shoulder: 217185,
      back: 225591,
      chest: 217180,
      wrist: 225580,
      hands: 217182,
      waist: 225583,
      legs: 217184,
      feet: 225575,
      finger1: 225576,
      finger2: 225587,
      trinket1: 225588,
      trinket2: 225589,
      mainHand: 225582,
      offHand: null,
    },
    stats: {
      primaryStat: 41000,
      stamina: 112000,
      criticalStrike: 28,
      haste: 32,
      mastery: 25,
      versatility: 15,
    },
    rankings: { "single-target": 1, aoe: 1, "mythic-plus": 2 },
  },
  {
    id: "fire-mage",
    character: {
      name: "Pyro",
      class: "Mage",
      spec: "Fire",
      level: 80,
      race: "Human",
      region: "US",
      realm: "Stormrage",
    },
    gear: {
      head: 217197,
      neck: 225577,
      shoulder: 217199,
      back: 225591,
      chest: 217194,
      wrist: 225580,
      hands: 217196,
      waist: 225583,
      legs: 217198,
      feet: 225575,
      finger1: 225576,
      finger2: 225587,
      trinket1: 225588,
      trinket2: 225589,
      mainHand: 225582,
      offHand: null,
    },
    stats: {
      primaryStat: 38500,
      stamina: 108000,
      criticalStrike: 45,
      haste: 22,
      mastery: 25,
      versatility: 8,
    },
    rankings: { "single-target": 1, aoe: 3, "mythic-plus": 4 },
  },
];

export const PRESET_MAP = Object.fromEntries(
  PRESET_CHARACTERS.map((p) => [p.id, p]),
) as Record<PresetCharacterId, PresetCharacter>;
