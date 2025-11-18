import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CurrencyFlagsB {
  CurrencyBUseTotalEarnedForEarned = 1,
  CurrencyBShowQuestXPGainInTooltip = 2,
  CurrencyBNoNotificationMailOnOfflineProgress = 4,
  CurrencyBBattlenetVirtualCurrency = 8,
  FutureCurrencyFlag = 16,
  CurrencyBDontDisplayIfZero = 32,
  CurrencyBScaleMaxQuantityBySeasonWeeks = 64,
  CurrencyBScaleMaxQuantityByWeeksSinceStart = 128,
  CurrencyBForceMaxQuantityOnConversion = 256,
  CurrencyBUnearnableBeforeMaxQuantityStart = 512,
}

export const CurrencyFlagsBSchema = Schema.Enums(CurrencyFlagsB);
