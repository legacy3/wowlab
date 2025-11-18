import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum TooltipDataLineType {
  None = 0,
  Blank = 1,
  UnitName = 2,
  GemSocket = 3,
  AzeriteEssenceSlot = 4,
  AzeriteEssencePower = 5,
  LearnableSpell = 6,
  UnitThreat = 7,
  QuestObjective = 8,
  AzeriteItemPowerDescription = 9,
  RuneforgeLegendaryPowerDescription = 10,
  SellPrice = 11,
  ProfessionCraftingQuality = 12,
  SpellName = 13,
  CurrencyTotal = 14,
  ItemEnchantmentPermanent = 15,
  UnitOwner = 16,
  QuestTitle = 17,
  QuestPlayer = 18,
  NestedBlock = 19,
  ItemBinding = 20,
  RestrictedRaceClass = 21,
  RestrictedFaction = 22,
  RestrictedSkill = 23,
  RestrictedPvPMedal = 24,
  RestrictedReputation = 25,
  RestrictedSpellKnown = 26,
  RestrictedLevel = 27,
  EquipSlot = 28,
  ItemName = 29,
  Separator = 30,
  ToyName = 31,
  ToyText = 32,
  ToyEffect = 33,
  ToyDuration = 34,
  RestrictedArena = 35,
  RestrictedBg = 36,
  ToyFlavorText = 37,
  ToyDescription = 38,
  ToySource = 39,
  GemSocketEnchantment = 40,
  ItemLevel = 41,
  ItemUpgradeLevel = 42,
}

export const TooltipDataLineTypeSchema = Schema.Enums(TooltipDataLineType);
