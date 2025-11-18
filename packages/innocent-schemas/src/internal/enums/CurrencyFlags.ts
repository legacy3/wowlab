import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CurrencyFlags {
  CurrencyTradable = 1,
  CurrencyAppearsInLootWindow = 2,
  CurrencyComputedWeeklyMaximum = 4,
  Currency_100_Scaler = 8,
  CurrencyNoLowLevelDrop = 16,
  CurrencyIgnoreMaxQtyOnLoad = 32,
  CurrencyLogOnWorldChange = 64,
  CurrencyTrackQuantity = 128,
  CurrencyResetTrackedQuantity = 256,
  CurrencyUpdateVersionIgnoreMax = 512,
  CurrencySuppressChatMessageOnVersionChange = 1024,
  CurrencySingleDropInLoot = 2048,
  CurrencyHasWeeklyCatchup = 4096,
  CurrencyDoNotCompressChat = 8192,
  CurrencyDoNotLogAcquisitionToBi = 16384,
  CurrencyNoRaidDrop = 32768,
  CurrencyNotPersistent = 65536,
  CurrencyDeprecated = 131072,
  CurrencyDynamicMaximum = 262144,
  CurrencySuppressChatMessages = 524288,
  CurrencyDoNotToast = 1048576,
  CurrencyDestroyExtraOnLoot = 2097152,
  CurrencyDontShowTotalInTooltip = 4194304,
  CurrencyDontCoalesceInLootWindow = 8388608,
  CurrencyAccountWide = 16777216,
  CurrencyAllowOverflowMailer = 33554432,
  CurrencyHideAsReward = 67108864,
  CurrencyHasWarmodeBonus = 134217728,
  CurrencyIsAllianceOnly = 268435456,
  CurrencyIsHordeOnly = 536870912,
  CurrencyLimitWarmodeBonusOncePerTooltip = 1073741824,
  CurrencyUsesLedgerBalance = 2147483648,
}

export const CurrencyFlagsSchema = Schema.Enums(CurrencyFlags);
