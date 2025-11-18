import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum AccountData {
  Config = 0,
  Config2 = 1,
  Bindings = 2,
  Bindings2 = 3,
  Macros = 4,
  Macros2 = 5,
  UILayout = 6,
  ChatSettings = 7,
  TtsSettings = 8,
  TtsSettings2 = 9,
  FlaggedIDs = 10,
  FlaggedIDs2 = 11,
  ClickBindings = 12,
  UIEditModeAccount = 13,
  UIEditModeChar = 14,
  FrontendChatSettings = 15,
  CharacterListOrder = 16,
  CooldownManager = 17,
  CooldownManager2 = 18,
  Shop2PendingOrders = 19,
}

export const AccountDataSchema = Schema.Enums(AccountData);
