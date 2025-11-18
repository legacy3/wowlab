import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum PowerType {
  Mana = 0,
  Rage = 1,
  Focus = 2,
  Energy = 3,
  ComboPoints = 4,
  Runes = 5,
  RunicPower = 6,
  SoulShards = 7,
  LunarPower = 8,
  HolyPower = 9,
  Alternate = 10,
  Maelstrom = 11,
  Chi = 12,
  Insanity = 13,
  BurningEmbers = 14,
  DemonicFury = 15,
  ArcaneCharges = 16,
  Fury = 17,
  Pain = 18,
  Essence = 19,
  RuneBlood = 20,
  RuneFrost = 21,
  RuneUnholy = 22,
  AlternateQuest = 23,
  AlternateEncounter = 24,
  AlternateMount = 25,
  Balance = 26,
  Happiness = 27,
  ShadowOrbs = 28,
  RuneChromatic = 29,
}

export const PowerTypeSchema = Schema.Enums(PowerType);
