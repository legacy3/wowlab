import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BnetAccountFlag {
  None = 0,
  BattlePetTrainer = 1,
  RafVeteranNotified = 2,
  TwitterLinked = 4,
  TwitterHasTempSecret = 8,
  Employee = 16,
  EmployeeFlagIsManual = 32,
  AccountQuestBitFixUp = 64,
  AchievementsToBi = 128,
  InvalidTransmogsFixUp = 256,
  InvalidTransmogsFixUp2 = 512,
  GdprErased = 1024,
  DarkRealmLightCopy = 2048,
  QuestLogFlagsFixUp = 4096,
  WasSecured = 8192,
  LockedForExport = 16384,
  CanBuyAhGameTimeTokens = 32768,
  PetAchievementFixUp = 65536,
  IsLegacy = 131072,
  CataLegendaryMountChecked = 262144,
  CataLegendaryMountObtained = 524288,
}

export const BnetAccountFlagSchema = Schema.Enums(BnetAccountFlag);
