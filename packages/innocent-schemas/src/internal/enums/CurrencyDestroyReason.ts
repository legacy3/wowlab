import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CurrencyDestroyReason {
  Cheat = 0,
  Spell = 1,
  VersionUpdate = 2,
  QuestTurnin = 3,
  Vendor = 4,
  Trade = 5,
  Capped = 6,
  Garrison = 7,
  DroppedToCorpse = 8,
  BonusRoll = 9,
  FactionConversion = 10,
  FulfillCraftingOrder = 11,
  Script = 12,
  ConcentrationCast = 13,
  AccountTransfer = 14,
  HonorLoss = 15,
}

export const CurrencyDestroyReasonSchema = Schema.Enums(CurrencyDestroyReason);
