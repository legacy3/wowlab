import type {
  SimcProfile,
  SimcSlot,
  SimcTalents,
  WowClass,
} from "@wowlab/parsers";
import { capitalCase } from "change-case";
import type {
  CharacterProfession,
  CharacterSummary,
  EquipmentSlot,
} from "@/components/equipment";

export interface ParsedSimcData {
  character: CharacterSummary;
  gear: Record<EquipmentSlot, number | null>;
  professions: CharacterProfession[];
  talents: SimcTalents;
}

const SLOT_MAP: Record<SimcSlot, EquipmentSlot> = {
  head: "head",
  neck: "neck",
  shoulder: "shoulder",
  back: "back",
  chest: "chest",
  wrist: "wrist",
  hands: "hands",
  waist: "waist",
  legs: "legs",
  feet: "feet",
  finger1: "finger1",
  finger2: "finger2",
  trinket1: "trinket1",
  trinket2: "trinket2",
  main_hand: "mainHand",
  off_hand: "offHand",
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
    region: character.region?.toUpperCase() ?? "Unknown",
    server: character.server ?? "Unknown",
    spec: character.spec ? capitalCase(character.spec) : undefined,
  };

  const professions: CharacterProfession[] = character.professions.map((p) => ({
    name: p.name,
    rank: p.rank,
  }));

  const gear: Record<EquipmentSlot, number | null> = {
    head: null,
    neck: null,
    shoulder: null,
    back: null,
    chest: null,
    wrist: null,
    hands: null,
    waist: null,
    legs: null,
    feet: null,
    finger1: null,
    finger2: null,
    trinket1: null,
    trinket2: null,
    mainHand: null,
    offHand: null,
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
