import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BagFlag {
  DontFindStack = 1,
  AlreadyOwner = 2,
  AlreadyBound = 4,
  Swap = 8,
  BagIsEmpty = 16,
  LookInInventory = 32,
  IgnoreBoundItemCheck = 64,
  StackOnly = 128,
  RecurseQuivers = 256,
  IgnoreBankcheck = 512,
  AllowBagsInNonBagSlots = 1024,
  PreferQuivers = 2048,
  SwapBags = 4096,
  IgnoreExisting = 8192,
  AllowPartialStack = 16384,
  LookInCharacterBankOnly = 32768,
  AllowBuyback = 65536,
  IgnorePetBankcheck = 131072,
  PreferPriorityBags = 262144,
  PreferNeutralPriorityBags = 524288,
  AsymmetricSwap = 1048576,
  PreferReagentBags = 2097152,
  IgnoreSoulbound = 4194304,
  IgnoreReagentBags = 8388608,
  LookInAccountBankOnly = 16777216,
  HasRefund = 33554432,
  SkipValidCountCheck = 67108864,
  AllowSoulboundItemInAccountBank = 134217728,
}

export const BagFlagSchema = Schema.Enums(BagFlag);
