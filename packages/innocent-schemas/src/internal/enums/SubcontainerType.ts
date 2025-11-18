import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum SubcontainerType {
  Bag = 0,
  Equipped = 1,
  Bankgeneric = 2,
  Bankbag = 3,
  Mail = 4,
  Auction = 5,
  Keyring = 6,
  GuildBank0 = 7,
  GuildBank1 = 8,
  GuildBank2 = 9,
  GuildBank3 = 10,
  GuildBank4 = 11,
  GuildBank5 = 12,
  GuildOverflow = 13,
  Equipablespells = 14,
  CurrencytokenOboslete = 15,
  GuildBank6 = 16,
  GuildBank7 = 17,
  GuildBank8 = 18,
  GuildBank9 = 19,
  GuildBank10 = 20,
  GuildBank11 = 21,
  Reagentbank = 22,
  Childequipmentstorage = 23,
  Quarantine = 24,
  CreatedImmediately = 25,
  BuybackSlots = 26,
  CachedReward = 27,
  EquippedBags = 28,
  EquippedProfession1 = 29,
  EquippedProfession2 = 30,
  EquippedCooking = 31,
  EquippedFishing = 32,
  EquippedReagentbag = 33,
  CraftingOrder = 34,
  CraftingOrderReagents = 35,
  AccountBankTabs = 36,
  CurrencyTransfer = 37,
  CharacterBankTabs = 38,
  HousingDecorConversion = 39,
}

export const SubcontainerTypeSchema = Schema.Enums(SubcontainerType);
