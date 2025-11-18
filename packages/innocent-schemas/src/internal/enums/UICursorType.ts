import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum UICursorType {
  Default = 0,
  Item = 1,
  Money = 2,
  Spell = 3,
  PetAction = 4,
  Merchant = 5,
  ActionBar = 6,
  Macro = 7,
  AmmoObsolete = 8,
  Pet = 9,
  GuildBank = 10,
  GuildBankMoney = 11,
  EquipmentSet = 12,
  Currency = 13,
  Flyout = 14,
  VoidItem = 15,
  BattlePet = 16,
  Mount = 17,
  Toy = 18,
  ConduitCollectionItem = 19,
  PerksProgramVendorItem = 20,
}

export const UICursorTypeSchema = Schema.Enums(UICursorType);
