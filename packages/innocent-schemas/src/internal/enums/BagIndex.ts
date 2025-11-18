import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum BagIndex {
  Accountbanktab = -3,
  Characterbanktab = -2,
  Keyring = -1,
  Backpack = 0,
  Bag_1 = 1,
  Bag_2 = 2,
  Bag_3 = 3,
  Bag_4 = 4,
  ReagentBag = 5,
  CharacterBankTab_1 = 6,
  CharacterBankTab_2 = 7,
  CharacterBankTab_3 = 8,
  CharacterBankTab_4 = 9,
  CharacterBankTab_5 = 10,
  CharacterBankTab_6 = 11,
  AccountBankTab_1 = 12,
  AccountBankTab_2 = 13,
  AccountBankTab_3 = 14,
  AccountBankTab_4 = 15,
  AccountBankTab_5 = 16,
}

export const BagIndexSchema = Schema.Enums(BagIndex);
