import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TooltipDataType {
  Item = 0,
  Spell = 1,
  Unit = 2,
  Corpse = 3,
  Object = 4,
  Currency = 5,
  BattlePet = 6,
  UnitAura = 7,
  AzeriteEssence = 8,
  CompanionPet = 9,
  Mount = 10,
  PetAction = 11,
  Achievement = 12,
  EnhancedConduit = 13,
  EquipmentSet = 14,
  InstanceLock = 15,
  PvPBrawl = 16,
  RecipeRankInfo = 17,
  Totem = 18,
  Toy = 19,
  CorruptionCleanser = 20,
  MinimapMouseover = 21,
  Flyout = 22,
  Quest = 23,
  QuestPartyProgress = 24,
  Macro = 25,
  Debug = 26,
}

export const TooltipDataTypeSchema = Schema.Enums(TooltipDataType);
