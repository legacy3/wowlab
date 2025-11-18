import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum CraftingOrderResult {
  Ok = 0,
  Aborted = 1,
  AlreadyClaimed = 2,
  AlreadyCrafted = 3,
  CannotBeOrdered = 4,
  CannotCancel = 5,
  CannotClaim = 6,
  CannotClaimOwnOrder = 7,
  CannotCraft = 8,
  CannotCreate = 9,
  CannotFulfill = 10,
  CannotRecraft = 11,
  CannotReject = 12,
  CannotRelease = 13,
  CrafterIsIgnored = 14,
  DatabaseError = 15,
  Expired = 16,
  Locked = 17,
  InvalidDuration = 18,
  InvalidMinQuality = 19,
  InvalidNotes = 20,
  InvalidReagent = 21,
  InvalidRealm = 22,
  InvalidRecipe = 23,
  InvalidRecraftItem = 24,
  InvalidSort = 25,
  InvalidTarget = 26,
  InvalidType = 27,
  MaxOrdersReached = 28,
  MissingCraftingTable = 29,
  MissingItem = 30,
  MissingNpc = 31,
  MissingOrder = 32,
  MissingRecraftItem = 33,
  NoAccountItems = 34,
  NotClaimed = 35,
  NotCrafted = 36,
  NotInGuild = 37,
  NotYetImplemented = 38,
  OutOfPublicOrderCapacity = 39,
  ServerIsNotAvailable = 40,
  ThrottleViolation = 41,
  TargetCannotCraft = 42,
  TargetLocked = 43,
  Timeout = 44,
  TooManyItems = 45,
  WrongVersion = 46,
}

export const CraftingOrderResultSchema = Schema.Enums(CraftingOrderResult);
