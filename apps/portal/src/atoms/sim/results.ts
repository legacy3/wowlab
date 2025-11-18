import { atom } from "jotai";
import type {
  AlternativeItem,
  EquipmentSlot,
  EquipmentSlotItem,
} from "@/components/equipment";

export type CharacterInfo = {
  name: string;
  server: string;
  region: string;
  level: number;
  spec: string;
  race: string;
  class: string;
};

export type Profession = {
  name: string;
  rank: number;
};

export type ItemCombo = {
  rank: number;
  dps: number;
  gain: number;
  gainPercent: number;
  items: string[];
};

export const characterAtom = atom<CharacterInfo>({
  name: "Shadowmend",
  server: "Faerlina",
  region: "US",
  level: 70,
  spec: "Shadow",
  race: "Undead",
  class: "Priest",
});

export const professionsAtom = atom<Profession[]>([
  { name: "Tailoring", rank: 375 },
  { name: "Enchanting", rank: 375 },
]);

export const gearAtom = atom<Record<EquipmentSlot, EquipmentSlotItem | null>>({
  back: { id: 18541, ilvl: 81, isUpgrade: false, name: "Puissant Cape" },
  chest: {
    id: 16923,
    ilvl: 92,
    isUpgrade: false,
    name: "Robes of Transcendence",
  },
  feet: {
    id: 19382,
    ilvl: 88,
    isUpgrade: false,
    name: "Pure Elementium Band",
  },
  finger1: {
    id: 18821,
    ilvl: 89,
    isUpgrade: false,
    name: "Quick Strike Ring",
  },
  finger2: {
    id: 19403,
    ilvl: 88,
    isUpgrade: false,
    name: "Band of Forced Concentration",
  },
  hands: {
    id: 16920,
    ilvl: 92,
    isUpgrade: false,
    name: "Handguards of Transcendence",
  },
  head: {
    id: 16921,
    ilvl: 92,
    isUpgrade: false,
    name: "Halo of Transcendence",
  },
  legs: {
    id: 16922,
    ilvl: 92,
    isUpgrade: false,
    name: "Leggings of Transcendence",
  },
  mainHand: {
    id: 18842,
    ilvl: 89,
    isUpgrade: true,
    name: "Staff of Dominance",
  },
  neck: {
    id: 18814,
    ilvl: 89,
    isUpgrade: false,
    name: "Choker of the Fire Lord",
  },
  offHand: null,
  shoulder: {
    id: 16924,
    ilvl: 92,
    isUpgrade: false,
    name: "Pauldrons of Transcendence",
  },
  trinket1: {
    id: 19379,
    ilvl: 88,
    isUpgrade: false,
    name: "Neltharion's Tear",
  },
  trinket2: {
    id: 18820,
    ilvl: 89,
    isUpgrade: true,
    name: "Talisman of Ephemeral Power",
  },
  waist: { id: 19385, ilvl: 88, isUpgrade: false, name: "Empowered Leggings" },
  wrist: {
    id: 19394,
    ilvl: 88,
    isUpgrade: false,
    name: "Drake Talon Pauldrons",
  },
});

export const slotAlternativesAtom = atom<
  Partial<Record<EquipmentSlot, AlternativeItem[]>>
>({
  mainHand: [
    {
      id: 18608,
      ilvl: 81,
      name: "Benediction",
      dpsChange: -157,
      dpsChangePercent: -8.5,
    },
    {
      id: 19360,
      ilvl: 88,
      name: "Lok'amir il Romathis",
      dpsChange: -43,
      dpsChangePercent: -2.3,
    },
  ],
  trinket2: [
    {
      id: 12930,
      ilvl: 71,
      name: "Briarwood Reed",
      dpsChange: -74,
      dpsChangePercent: -4.0,
    },
    {
      id: 19950,
      ilvl: 77,
      name: "Zandalarian Hero Charm",
      dpsChange: -112,
      dpsChangePercent: -6.1,
    },
  ],
  head: [
    {
      id: 16813,
      ilvl: 76,
      name: "Circlet of Prophecy",
      dpsChange: -55,
      dpsChangePercent: -3.0,
    },
    {
      id: 12752,
      ilvl: 63,
      name: "Cap of the Scarlet Savant",
      dpsChange: -123,
      dpsChangePercent: -6.7,
    },
  ],
});

export const itemCombosAtom = atom<ItemCombo[]>([
  {
    rank: 1,
    dps: 2104,
    gain: 257,
    gainPercent: 13.9,
    items: ["Staff of Dominance", "Talisman of Ephemeral Power"],
  },
  {
    rank: 2,
    dps: 2087,
    gain: 240,
    gainPercent: 13.0,
    items: ["Staff of Dominance", "Neltharion's Tear"],
  },
  {
    rank: 3,
    dps: 2053,
    gain: 206,
    gainPercent: 11.2,
    items: [
      "Benediction",
      "Talisman of Ephemeral Power",
      "Band of Unending Life",
    ],
  },
]);
