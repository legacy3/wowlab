import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum StableResult {
  MaxSlots = 0,
  InsufficientFunds = 1,
  NotStableMaster = 2,
  InvalidSlot = 3,
  NoPet = 4,
  AlreadyStabled = 5,
  AlreadySummoned = 6,
  NotFound = 7,
  StableSuccess = 8,
  UnstableSuccess = 9,
  ReviveSuccess = 10,
  CantControlExotic = 11,
  InternalError = 12,
  CheckForLuaHack = 13,
  BuySlotSuccess = 14,
  FavoriteToggle = 15,
  PetRenamed = 16,
}

export const StableResultSchema = Schema.Enums(StableResult);
