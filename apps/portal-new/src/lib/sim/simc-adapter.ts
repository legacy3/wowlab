import type { SimcProfile, SimcSlot, WowClass } from "@wowlab/parsers";

import { capitalCase } from "change-case";

import type { CharacterSummary, EquipmentSlot, ParsedSimcData } from "./types";

const SLOT_MAP: Record<SimcSlot, EquipmentSlot> = {
  back: "back",
  chest: "chest",
  feet: "feet",
  finger1: "finger1",
  finger2: "finger2",
  hands: "hands",
  head: "head",
  legs: "legs",
  main_hand: "mainHand",
  neck: "neck",
  off_hand: "offHand",
  shoulder: "shoulder",
  trinket1: "trinket1",
  trinket2: "trinket2",
  waist: "waist",
  wrist: "wrist",
};

const CLASS_NAMES: Record<WowClass, string> = {
  death_knight: "Death Knight",
  demon_hunter: "Demon Hunter",
  druid: "Druid",
  evoker: "Evoker",
  hunter: "Hunter",
  mage: "Mage",
  monk: "Monk",
  paladin: "Paladin",
  priest: "Priest",
  rogue: "Rogue",
  shaman: "Shaman",
  warlock: "Warlock",
  warrior: "Warrior",
};

export function simcProfileToPortalData(profile: SimcProfile): ParsedSimcData {
  const { character, equipment } = profile;

  const characterSummary: CharacterSummary = {
    class: CLASS_NAMES[character.wowClass],
    level: character.level,
    name: character.name,
    race: capitalCase(character.race),
    realm: character.server ?? "Unknown",
    region: character.region?.toUpperCase() ?? "Unknown",
    spec: character.spec ? capitalCase(character.spec) : undefined,
  };

  const professions = character.professions.map((p) => ({
    name: p.name,
    rank: p.rank,
  }));

  const gear: Record<EquipmentSlot, number | null> = {
    back: null,
    chest: null,
    feet: null,
    finger1: null,
    finger2: null,
    hands: null,
    head: null,
    legs: null,
    mainHand: null,
    neck: null,
    offHand: null,
    shoulder: null,
    trinket1: null,
    trinket2: null,
    waist: null,
    wrist: null,
  };

  for (const item of equipment) {
    const portalSlot = SLOT_MAP[item.slot];
    if (portalSlot) {
      gear[portalSlot] = item.id;
    }
  }

  return {
    character: characterSummary,
    gear,
    professions,
    talents: profile.talents,
  };
}
